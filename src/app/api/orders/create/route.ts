import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit';
import { validateCSRF } from '@/lib/csrf';
import { logger } from '@/lib/logger';
import { generateRequestId } from '@/lib/request-id';
import { getAdminDb, FieldValue } from '@/lib/firebase-admin';
import { sanitizeString, sanitizeEmail } from '@/lib/sanitize';
import { logAdminActionServer } from '@/lib/audit-log-server';
import { SIZES } from '@/lib/constants';
import type { StockRecord } from '@/lib/types';

const OrderItemSchema = z.object({
  productId: z.string().min(1),
  size: z.string().min(1),
  color: z.string().optional(),
  quantity: z.number().int().min(1).max(10),
  declaredPrice: z.number().min(0).max(100000),
});

const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1).max(50),
  customerEmail: z.string().email().max(254),
  shippingAddress: z.object({
    name: z.string().min(1).max(200),
    line1: z.string().min(1).max(300),
    line2: z.string().max(300).optional(),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    postalCode: z.string().min(1).max(20),
    country: z.enum(['CA', 'US']),
  }),
  discountCode: z.string().max(50).optional(),
  idempotency_key: z.string().optional(),
});

interface ProductRead {
  productId: string;
  price: number;
  data: FirebaseFirestore.DocumentData;
  ref: FirebaseFirestore.DocumentReference;
}

export async function POST(request: Request) {
  try {
    // CSRF validation
    const csrf = await validateCSRF(request);
    if (!csrf.valid) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 403 });
    }

    // Rate limit: 5 orders per minute per IP
    const ip = getClientIP(request);
    const rl = await rateLimit(`orders-create:${ip}`, RATE_LIMITS.ordersCreate);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { items, customerEmail, shippingAddress, discountCode, idempotency_key } = parsed.data;

    // Idempotency check — prevent duplicate orders from double-submit
    if (idempotency_key) {
      const existingOrder = await getAdminDb()
        .collection('orders')
        .where('idempotency_key', '==', idempotency_key)
        .limit(1)
        .get();

      if (!existingOrder.empty) {
        const existing = existingOrder.docs[0];
        return NextResponse.json({
          success: true,
          orderId: existing.id,
          message: 'Order already processed',
          duplicate: true,
        });
      }
    }

    // SEC-007: Sanitize customer email and shipping address fields
    const sanitizedEmail = sanitizeEmail(customerEmail);
    const sanitizedAddress = {
      name: sanitizeString(shippingAddress.name),
      line1: sanitizeString(shippingAddress.line1),
      line2: shippingAddress.line2 ? sanitizeString(shippingAddress.line2) : undefined,
      city: sanitizeString(shippingAddress.city),
      state: sanitizeString(shippingAddress.state),
      postalCode: shippingAddress.postalCode, // Alphanumeric, Zod validated
      country: shippingAddress.country, // Enum validated by Zod
    };

    const db = getAdminDb();

    // FIX 2 (ORD-003): SERVER-SIDE PRICE VERIFICATION + is_deleted/is_active CHECK
    // Read all products to collect actual prices for use in atomic transaction
    let serverTotal = 0;
    const productPrices: Map<string, number> = new Map();

    for (const item of items) {
      const productSnap = await db.collection('products').doc(item.productId).get();

      if (!productSnap.exists) {
        logger.warn('Product not found during order creation', { productId: item.productId, ip });
        return NextResponse.json(
          { error: 'One or more items in your cart are no longer available. Please refresh and try again.', code: 'PRODUCT_NOT_FOUND' },
          { status: 400 }
        );
      }

      const productData = productSnap.data()!;

      // Reject deleted or inactive products
      if (productData.is_deleted === true || productData.is_active === false) {
        return NextResponse.json(
          { error: 'One or more products are no longer available. Please refresh your cart.', code: 'PRODUCT_UNAVAILABLE' },
          { status: 409 }
        );
      }

      const actualPrice = productData.price;
      productPrices.set(item.productId, actualPrice);

      // Verify price matches (allow small floating point differences)
      if (Math.abs(actualPrice - item.declaredPrice) > 0.01) {
        logger.warn('Price mismatch detected', {
          productId: item.productId,
          declared: item.declaredPrice,
          actual: actualPrice,
          ip,
        });
        return NextResponse.json(
          { error: 'Price has changed. Please refresh and try again.', code: 'PRICE_MISMATCH' },
          { status: 409 }
        );
      }

      serverTotal += actualPrice * item.quantity;
    }

    // Apply discount if provided — ATOMIC read + validate + increment via transaction
    type DiscountSuccess = { amount: number; error: null; discountDocRef?: FirebaseFirestore.DocumentReference };
    type DiscountError = { error: string; status: number };
    type DiscountResult = DiscountSuccess | DiscountError;

    let discountAmount = 0;
    let discountDocRef: FirebaseFirestore.DocumentReference | null = null;

    if (discountCode) {
      const discountResult: DiscountResult = await db.runTransaction(async (transaction) => {
        const discountsQuery = await db
          .collection('discounts')
          .where('code', '==', discountCode.toUpperCase())
          .limit(1)
          .get();

        if (discountsQuery.empty) {
          return { error: 'Invalid discount code', status: 400 };
        }

        const discountDoc = discountsQuery.docs[0];
        const docRef = discountDoc.ref;

        // Re-read inside transaction for atomic check
        const freshSnap = await transaction.get(docRef);
        if (!freshSnap.exists) {
          return { error: 'Invalid discount code', status: 400 };
        }
        const freshDiscount = freshSnap.data()!;

        // Check if discount is active
        if (freshDiscount.active === false) {
          return { error: 'This discount code is no longer active', status: 400 };
        }

        // Check expiry
        if (freshDiscount.expiresAt && new Date(freshDiscount.expiresAt) < new Date()) {
          return { error: 'This discount code has expired', status: 400 };
        }

        // Check max uses — atomic inside transaction prevents race condition
        if (freshDiscount.maxUses > 0 && (freshDiscount.currentUses || 0) >= freshDiscount.maxUses) {
          return { error: 'This discount code has reached its usage limit', status: 400 };
        }

        // Check minimum order
        if (freshDiscount.minOrder && serverTotal < freshDiscount.minOrder) {
          return { error: `Minimum order of $${freshDiscount.minOrder} required for this code`, status: 400 };
        }

        // FIX 3 (DISC-001): Check per-email discount usage tracking
        const discountUsesRef = docRef.collection('discount_uses');
        const existingUseSnap = await transaction.get(discountUsesRef.doc(sanitizedEmail));
        if (existingUseSnap.exists) {
          return { error: 'You have already used this discount code', status: 400 };
        }

        // Calculate discount with percentage cap at 100%
        let amount = 0;
        if (freshDiscount.type === 'percentage') {
          const cappedPercent = Math.min(freshDiscount.value, 100);
          amount = serverTotal * (cappedPercent / 100);
        } else if (freshDiscount.type === 'fixed') {
          amount = Math.min(freshDiscount.value, serverTotal);
        }

        // Increment usage counter atomically inside the transaction
        transaction.update(docRef, {
          currentUses: FieldValue.increment(1),
        });

        // Record the per-email usage in the same transaction
        const now = new Date().toISOString();
        transaction.set(discountUsesRef.doc(sanitizedEmail), {
          email: sanitizedEmail,
          used_at: now,
          timestamp: FieldValue.serverTimestamp(),
        });

        return { amount, error: null, discountDocRef: docRef };
      });

      if ('error' in discountResult && discountResult.error !== null) {
        return NextResponse.json(
          { error: discountResult.error },
          { status: discountResult.status }
        );
      }

      const successResult = discountResult as DiscountSuccess;
      discountAmount = successResult.amount;
      discountDocRef = successResult.discountDocRef || null;
    }

    // Ensure total is never negative
    const total = Math.max(0, serverTotal - discountAmount);

    // FIX 1 (ORD-002): ATOMIC order creation with stock decrement + inventory logs
    // All operations happen in a single transaction: read products, validate stock, decrement, create order, write logs
    let createdOrderId = '';

    try {
      await db.runTransaction(async (transaction) => {
        // Phase 1: Read all products and validate stock
        const productReads: ProductRead[] = [];

        for (const item of items) {
          const ref = db.collection('products').doc(item.productId);
          const snap = await transaction.get(ref);

          if (!snap.exists) {
            throw new Error(`Product ${item.productId} not found`);
          }

          const data = snap.data()!;

          // Check if product is deleted or inactive (redundant check but safe inside transaction)
          if (data.is_deleted === true || data.is_active === false) {
            throw new Error(`Product ${item.productId} is no longer available`);
          }

          const actualPrice = productPrices.get(item.productId) || data.price;

          productReads.push({ productId: item.productId, price: actualPrice, data, ref });
        }

        // Phase 2: Validate all stock availability
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const { data } = productReads[i];
          let available = 0;

          if (item.color && data.colors && Array.isArray(data.colors)) {
            const colorVariant = (data.colors as { name: string; stock: Record<string, number> }[]).find(
              (c) => c.name === item.color
            );
            available = colorVariant?.stock?.[item.size] ?? 0;
          } else if (data.stock && typeof data.stock === 'object') {
            available = (data.stock as Record<string, number>)[item.size] ?? 0;
          }

          if (available < item.quantity) {
            throw new Error(
              `Insufficient stock for product ${item.productId} size ${item.size}: ` +
              `need ${item.quantity}, have ${available}`
            );
          }
        }

        // Phase 3: Decrement stock for all products (within same transaction)
        const now = new Date().toISOString();
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const { data, ref } = productReads[i];

          if (item.color && data.colors && Array.isArray(data.colors)) {
            // Color variant: update the specific color's stock
            const colors = [...(data.colors as { name: string; stock: Record<string, number> }[])];
            const colorIdx = colors.findIndex((c) => c.name === item.color);

            if (colorIdx !== -1) {
              colors[colorIdx] = {
                ...colors[colorIdx],
                stock: {
                  ...colors[colorIdx].stock,
                  [item.size]: (colors[colorIdx].stock[item.size] ?? 0) - item.quantity,
                },
              };
            }

            // Recalculate total stock across all colors
            const totalStock: StockRecord = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
            for (const color of colors) {
              for (const size of SIZES) {
                totalStock[size] += color.stock[size] ?? 0;
              }
            }

            transaction.update(ref, {
              colors,
              stock: totalStock,
              updated_at: now,
            });
          } else {
            // Non-color product
            const currentStock = (data.stock as Record<string, number>) || {};
            transaction.update(ref, {
              stock: {
                ...currentStock,
                [item.size]: (currentStock[item.size] ?? 0) - item.quantity,
              },
              updated_at: now,
            });
          }

          // Write inventory log inside transaction — guarantees audit trail
          const logRef = db.collection('inventory_logs').doc();
          const tempOrderId = `temp-${Date.now()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 9)}`;
          transaction.set(logRef, {
            product_id: item.productId,
            size: item.size,
            color: item.color || null,
            change: -item.quantity,
            reason: `Order ${tempOrderId}`,
            user_email: 'system',
            created_at: now,
            timestamp: FieldValue.serverTimestamp(),
          });
        }

        // Phase 4: Create order document (with server-verified prices)
        const order = {
          items: items.map((item) => ({
            productId: item.productId,
            size: item.size,
            color: item.color || null,
            quantity: item.quantity,
            price: productPrices.get(item.productId) || item.declaredPrice,
          })),
          customer_email: sanitizedEmail,
          customer_name: sanitizedAddress.name,
          shipping_address: sanitizedAddress,
          subtotal: serverTotal,
          discount: discountAmount,
          total,
          donation: total * 0.10,
          status: 'pending',
          payment_status: 'pending',
          created_at: now,
          updated_at: now,
          ...(idempotency_key && { idempotency_key: idempotency_key }),
        };

        const orderRef = db.collection('orders').doc();
        transaction.set(orderRef, order);
        createdOrderId = orderRef.id;
      });
    } catch (transactionError) {
      // Transaction failed — need to rollback discount if it was used
      if (discountDocRef) {
        try {
          await db.runTransaction(async (rollbackTransaction) => {
            // FIX 4 (DISC-003): Transactional rollback of discount
            const freshSnap = await rollbackTransaction.get(discountDocRef);
            if (freshSnap.exists) {
              const currentUses = freshSnap.data()!.currentUses || 0;
              if (currentUses > 0) {
                rollbackTransaction.update(discountDocRef, {
                  currentUses: FieldValue.increment(-1),
                });
              }
            }

            // Also delete the per-email usage record in the same transaction
            const discountUsesRef = discountDocRef.collection('discount_uses');
            rollbackTransaction.delete(discountUsesRef.doc(sanitizedEmail));
          });
        } catch (rollbackErr) {
          logger.error('Failed to rollback discount usage', { discountCode }, rollbackErr);
        }
      }

      const errorMessage = transactionError instanceof Error ? transactionError.message : 'Stock unavailable';
      logger.error('Order creation transaction failed', { error: errorMessage, ip }, transactionError);
      return NextResponse.json(
        { error: 'One or more items are unavailable or out of stock. Please refresh your cart and try again.', code: 'STOCK_INSUFFICIENT' },
        { status: 409 }
      );
    }

    logger.info('Order created', { orderId: createdOrderId, total, ip });

    // SEC-009: Server-side audit log (tamper-resistant via Admin SDK)
    logAdminActionServer('order_created_server', {
      orderId: createdOrderId,
      itemCount: items.length,
      total,
      ip,
    }).catch(() => {}); // Fire and forget — don't block response

    return NextResponse.json(
      { success: true, orderId: createdOrderId, total },
      { status: 201 }
    );
  } catch (error) {
    const requestId = generateRequestId();
    logger.error('Order creation error', { route: '/api/orders/create', requestId }, error);
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    );
  }
}
