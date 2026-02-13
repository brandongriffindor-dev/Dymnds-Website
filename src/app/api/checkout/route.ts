import { NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { logAdminActionServer } from '@/lib/audit-log-server';

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
  _stripe = new Stripe(key, { apiVersion: '2026-01-28.clover' });
  return _stripe;
}

// Validation schemas
const CartItemSchema = z.object({
  productId: z.string().min(1),
  size: z.string().min(1),
  quantity: z.number().int().positive(),
  color: z.string().optional(),
  declaredPrice: z.number().positive(),
});

const CheckoutRequestSchema = z.object({
  items: z.array(CartItemSchema).min(1),
  customerEmail: z.string().email().optional(),
  discountCode: z.string().optional(),
});

type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

interface ValidatedItem {
  productId: string;
  size: string;
  quantity: number;
  color?: string;
  declaredPrice: number;
  productName: string;
  stripePrice: number;
  image: string;
}

interface DiscountInfo {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  appliedAmount: number;
}

async function validateAndFetchProduct(
  db: any,
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

  const productData = productDoc.data();

  // Verify price hasn't changed significantly (allow small variance)
  const actualPrice = productData.price || 0;
  const priceDifference = Math.abs(actualPrice - declaredPrice);
  const percentageDiff = (priceDifference / actualPrice) * 100;

  if (percentageDiff > 5) {
    throw new Error(
      `Price mismatch for product ${productId}. Expected ${actualPrice}, got ${declaredPrice}`
    );
  }

  // Check stock availability
  const sizeInventory = productData.inventory?.[size];
  if (!sizeInventory || sizeInventory < quantity) {
    throw new Error(
      `Insufficient stock for ${productData.name} in size ${size}. Available: ${sizeInventory || 0}, Requested: ${quantity}`
    );
  }

  return {
    productId,
    size,
    quantity,
    color,
    declaredPrice: actualPrice,
    productName: productData.name,
    stripePrice: Math.round(actualPrice * 100), // Convert to cents
    image: productData.image || '',
  };
}

async function validateDiscount(
  db: any,
  discountCode: string,
  subtotal: number
): Promise<DiscountInfo> {
  const discountRef = db.collection('discounts').doc(discountCode);
  const discountDoc = await discountRef.get();

  if (!discountDoc.exists) {
    throw new Error(`Discount code ${discountCode} not found`);
  }

  const discountData = discountDoc.data();

  // Check if discount is active
  if (!discountData.active) {
    throw new Error(`Discount code ${discountCode} is not active`);
  }

  // Check expiration date
  if (discountData.expiryDate) {
    const expiryDate = discountData.expiryDate.toDate?.() || new Date(discountData.expiryDate);
    if (expiryDate < new Date()) {
      throw new Error(`Discount code ${discountCode} has expired`);
    }
  }

  // Check usage limits
  if (discountData.maxUses && discountData.timesUsed >= discountData.maxUses) {
    throw new Error(`Discount code ${discountCode} has reached maximum usage`);
  }

  // Calculate discount amount
  let appliedAmount = 0;
  if (discountData.type === 'percentage') {
    appliedAmount = Math.round((subtotal * discountData.value) / 100);
  } else if (discountData.type === 'fixed') {
    appliedAmount = Math.round(discountData.value * 100); // Convert to cents
  }

  // Ensure discount doesn't exceed subtotal
  appliedAmount = Math.min(appliedAmount, subtotal);

  return {
    code: discountCode,
    type: discountData.type,
    value: discountData.value,
    appliedAmount,
  };
}

export async function POST(request: Request) {
  try {
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
    const validatedBody = CheckoutRequestSchema.parse(body);

    const db = getAdminDb();
    let validatedItems: ValidatedItem[];
    let subtotal = 0;

    // Validate all items in parallel for faster checkout
    try {
      validatedItems = await Promise.all(
        validatedBody.items.map((item) =>
          validateAndFetchProduct(
            db,
            item.productId,
            item.size,
            item.quantity,
            item.declaredPrice,
            item.color
          )
        )
      );
      subtotal = validatedItems.reduce(
        (sum, item) => sum + item.stripePrice * item.quantity,
        0
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Product validation error during checkout', { error: errorMessage });
      return NextResponse.json(
        { error: 'One or more items in your cart are unavailable. Please refresh and try again.' },
        { status: 400 }
      );
    }

    // Validate discount if provided
    let discountInfo: DiscountInfo | null = null;
    if (validatedBody.discountCode) {
      try {
        discountInfo = await validateDiscount(db, validatedBody.discountCode, subtotal);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Discount validation error', { error: errorMessage });
        return NextResponse.json(
          { error: 'Invalid or expired discount code. Please try again.' },
          { status: 400 }
        );
      }
    }

    // Prepare line items for Stripe
    const lineItems = validatedItems.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.productName,
          image: item.image ? [item.image] : undefined,
          metadata: {
            productId: item.productId,
            size: item.size,
            color: item.color || '',
          },
        },
        unit_amount: item.stripePrice,
      },
      quantity: item.quantity,
    }));

    // Prepare metadata for webhook
    const orderMetadata = {
      items: validatedItems.map((item) => ({
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
        color: item.color || '',
        price: item.declaredPrice,
      })),
      discountCode: discountInfo?.code || '',
      discountAmount: discountInfo?.appliedAmount || 0,
      discountType: discountInfo?.type || '',
      subtotal,
    };

    // Create Stripe Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      line_items: lineItems,
      ...(validatedBody.customerEmail && { customer_email: validatedBody.customerEmail }),
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cart`,
      metadata: {
        orderData: JSON.stringify(orderMetadata),
      },
    };

    // Apply discount via Stripe if available
    // Note: In production, you'd want to create/manage Stripe coupons server-side
    // For now, we pass discount info in metadata for the webhook to handle
    if (discountInfo) {
      sessionParams.discounts = [
        {
          coupon: discountInfo.code,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    logger.info(`Checkout session created: ${session.id}`, {
      email: validatedBody.customerEmail,
      itemCount: validatedItems.length,
      subtotal,
    });

    // Log the order creation
    logAdminActionServer('order_created_server', {
      sessionId: session.id,
      customerEmail: validatedBody.customerEmail,
      itemCount: validatedItems.length,
      subtotal,
    }).catch(() => {}); // Fire and forget

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Validation error', { issues: error.issues.map(i => i.message) });
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
