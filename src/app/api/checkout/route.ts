import { NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { logAdminActionServer } from '@/lib/audit-log-server';
import { validateCSRF } from '@/lib/csrf';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { sanitizeEmail } from '@/lib/sanitize';
import { STRIPE_API_VERSION } from '@/lib/constants';

// Lazy-initialized Stripe client — avoids crash at module load if key is missing
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. ' +
      'Set it in Vercel Dashboard > Settings > Environment Variables (Production only).'
    );
  }
  _stripe = new Stripe(key, { apiVersion: STRIPE_API_VERSION });
  return _stripe;
}

// Validation schemas
const CartItemSchema = z.object({
  productId: z.string().min(1),
  size: z.string().min(1),
  quantity: z.number().int().positive().max(10),
  color: z.string().optional(),
  declaredPrice: z.number().positive(),
});

const CheckoutRequestSchema = z.object({
  items: z.array(CartItemSchema).min(1).max(50),
  customerEmail: z.string().email().max(254).optional(),
  discountCode: z.string().max(50).optional(),
});

interface ValidatedItem {
  productId: string;
  size: string;
  quantity: number;
  color?: string;
  serverPrice: number;
  productName: string;
  stripePriceCents: number;
  image: string;
}

interface DiscountInfo {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  appliedAmountCents: number;
}

async function validateAndFetchProduct(
  db: FirebaseFirestore.Firestore,
  productId: string,
  size: string,
  quantity: number,
  declaredPrice: number,
  color?: string
): Promise<ValidatedItem> {
  const productRef = db.collection('products').doc(productId);
  const productDoc = await productRef.get();

  if (!productDoc.exists) {
    throw new Error(`Product ${productId} not found`);
  }

  const productData = productDoc.data()!;

  // Reject deleted or inactive products
  if (productData.is_deleted === true || productData.is_active === false) {
    throw new Error(`Product ${productId} is no longer available`);
  }

  // FIX CHECKOUT-001: Use correct field name 'price' (CAD)
  const actualPrice = productData.price || 0;

  // Verify price matches (allow small floating point differences)
  if (Math.abs(actualPrice - declaredPrice) > 0.01) {
    throw new Error(
      `Price mismatch for product ${productId}. Expected ${actualPrice}, got ${declaredPrice}`
    );
  }

  // FIX CHECKOUT-001: Use correct field name 'stock' (not 'inventory')
  // Support both color-variant and plain stock structures
  let available = 0;
  if (color && productData.colors && Array.isArray(productData.colors)) {
    const colorVariant = (productData.colors as { name: string; stock: Record<string, number> }[]).find(
      (c) => c.name === color
    );
    available = colorVariant?.stock?.[size] ?? 0;
  } else if (productData.stock && typeof productData.stock === 'object') {
    available = (productData.stock as Record<string, number>)[size] ?? 0;
  }

  if (available < quantity) {
    throw new Error(
      `Insufficient stock for ${productData.title || productId} in size ${size}. Available: ${available}, Requested: ${quantity}`
    );
  }

  return {
    productId,
    size,
    quantity,
    color,
    serverPrice: actualPrice,
    // FIX CHECKOUT-001: Use correct field name 'title' (not 'name')
    productName: productData.title || 'Product',
    stripePriceCents: Math.round(actualPrice * 100),
    // FIX CHECKOUT-001: Use correct field name 'images' array (not 'image')
    image: Array.isArray(productData.images) && productData.images.length > 0
      ? productData.images[0]
      : '',
  };
}

async function validateDiscount(
  db: FirebaseFirestore.Firestore,
  discountCode: string,
  subtotalCents: number
): Promise<DiscountInfo> {
  // FIX CHECKOUT-005: Look up by 'code' field query, not doc ID
  const discountsQuery = await db
    .collection('discounts')
    .where('code', '==', discountCode.toUpperCase())
    .where('is_deleted', '!=', true)
    .limit(1)
    .get();

  if (discountsQuery.empty) {
    throw new Error('Invalid discount code');
  }

  const discountDoc = discountsQuery.docs[0];
  const discountData = discountDoc.data();

  // Check if discount is active
  if (discountData.active === false) {
    throw new Error('This discount code is no longer active');
  }

  // Check expiration date
  if (discountData.expiresAt) {
    const expiryDate = new Date(discountData.expiresAt);
    if (expiryDate < new Date()) {
      throw new Error('This discount code has expired');
    }
  }

  // Check usage limits
  if (discountData.maxUses > 0 && (discountData.currentUses || 0) >= discountData.maxUses) {
    throw new Error('This discount code has reached its usage limit');
  }

  // Check minimum order (convert subtotal from cents to dollars for comparison)
  const subtotalDollars = subtotalCents / 100;
  if (discountData.minOrder && subtotalDollars < discountData.minOrder) {
    throw new Error(`Minimum order of $${discountData.minOrder} required for this code`);
  }

  // Calculate discount amount in cents
  let appliedAmountCents = 0;
  if (discountData.type === 'percentage') {
    const cappedPercent = Math.min(discountData.value, 100);
    appliedAmountCents = Math.round(subtotalCents * (cappedPercent / 100));
  } else if (discountData.type === 'fixed') {
    appliedAmountCents = Math.round(discountData.value * 100);
  }

  // Ensure discount doesn't exceed subtotal
  appliedAmountCents = Math.min(appliedAmountCents, subtotalCents);

  return {
    code: discountCode.toUpperCase(),
    type: discountData.type,
    value: discountData.value,
    appliedAmountCents,
  };
}

export async function POST(request: Request) {
  try {
    // FIX CHECKOUT-002: Add CSRF validation
    const csrf = await validateCSRF(request);
    if (!csrf.valid) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 403 });
    }

    // FIX CHECKOUT-002: Add rate limiting (10 checkout attempts per minute per IP)
    const ip = getClientIP(request);
    const rl = await rateLimit(`checkout:${ip}`, { limit: 10, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Fail fast if critical env vars are missing
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      logger.error('NEXT_PUBLIC_APP_URL is not set — Stripe redirect URLs will be broken', {});
      return NextResponse.json(
        { error: 'Checkout configuration error' },
        { status: 500 }
      );
    }

    let stripe: Stripe;
    try {
      stripe = getStripe();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Stripe not configured';
      logger.error('Stripe initialization failed', { error: errorMessage });
      return NextResponse.json(
        { error: 'Payment service unavailable' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = CheckoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const validatedBody = parsed.data;
    const db = getAdminDb();
    let validatedItems: ValidatedItem[];
    let subtotalCents = 0;

    // Validate all items sequentially (reads from same collection)
    try {
      validatedItems = [];
      for (const item of validatedBody.items) {
        const validated = await validateAndFetchProduct(
          db,
          item.productId,
          item.size,
          item.quantity,
          item.declaredPrice,
          item.color
        );
        validatedItems.push(validated);
      }
      subtotalCents = validatedItems.reduce(
        (sum, item) => sum + item.stripePriceCents * item.quantity,
        0
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Product validation error during checkout', { error: errorMessage, ip });
      return NextResponse.json(
        { error: 'One or more items in your cart are unavailable. Please refresh and try again.' },
        { status: 400 }
      );
    }

    // Validate discount if provided
    let discountInfo: DiscountInfo | null = null;
    if (validatedBody.discountCode) {
      try {
        discountInfo = await validateDiscount(db, validatedBody.discountCode, subtotalCents);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.warn('Discount validation error', { error: errorMessage, ip });
        return NextResponse.json(
          { error: errorMessage || 'Invalid or expired discount code. Please try again.' },
          { status: 400 }
        );
      }
    }

    // Prepare line items for Stripe
    // FIX CHECKOUT-003: Use 'cad' currency (products are priced in CAD)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = validatedItems.map((item) => ({
      price_data: {
        currency: 'cad',
        product_data: {
          name: item.productName,
          ...(item.image ? { images: [item.image] } : {}),
          metadata: {
            productId: item.productId,
            size: item.size,
            color: item.color || '',
          },
        },
        unit_amount: item.stripePriceCents,
      },
      quantity: item.quantity,
    }));

    // FIX CHECKOUT-004: If there's a discount, apply it as a negative line item
    // instead of using Stripe coupons (which require pre-created coupon objects).
    // This approach is Stripe-approved for custom discount logic.
    if (discountInfo && discountInfo.appliedAmountCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'cad',
          product_data: {
            name: `Discount (${discountInfo.code})`,
          },
          unit_amount: -discountInfo.appliedAmountCents,
        },
        quantity: 1,
      });
    }

    // Prepare metadata for webhook — store order details for atomic creation
    const orderMetadata = {
      items: validatedItems.map((item) => ({
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
        color: item.color || '',
        price: item.serverPrice,
      })),
      discountCode: discountInfo?.code || '',
      discountAmount: discountInfo ? discountInfo.appliedAmountCents / 100 : 0,
      discountType: discountInfo?.type || '',
      subtotal: subtotalCents / 100,
    };

    // Sanitize email if provided
    const sanitizedEmail = validatedBody.customerEmail
      ? sanitizeEmail(validatedBody.customerEmail)
      : undefined;

    // Create Stripe Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      line_items: lineItems,
      ...(sanitizedEmail && { customer_email: sanitizedEmail }),
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cart`,
      shipping_address_collection: {
        allowed_countries: ['CA', 'US'],
      },
      metadata: {
        orderData: JSON.stringify(orderMetadata),
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    logger.info('Checkout session created', {
      sessionId: session.id,
      email: sanitizedEmail,
      itemCount: validatedItems.length,
      subtotalCents,
      ip,
    });

    logAdminActionServer('checkout_session_created', {
      sessionId: session.id,
      customerEmail: sanitizedEmail,
      itemCount: validatedItems.length,
      subtotalCents,
    }).catch(() => {});

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Validation error', { issues: error.issues.map(i => i.message) });
      return NextResponse.json(
        { error: 'Invalid request payload', details: error.issues },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Checkout error', { error: errorMessage });
    return NextResponse.json(
      { error: 'Checkout failed' },
      { status: 500 }
    );
  }
}
