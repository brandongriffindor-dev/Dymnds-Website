import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminDb, FieldValue } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { logAdminActionServer } from '@/lib/audit-log-server';
import { SIZES, STRIPE_API_VERSION } from '@/lib/constants';
import type { StockRecord } from '@/lib/types';

export const runtime = 'nodejs';

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

interface OrderItem {
  productId: string;
  size: string;
  quantity: number;
  color: string;
  price: number;
}

interface OrderMetadata {
  items: OrderItem[];
  discountCode: string;
  discountAmount: number;
  discountType: string;
  subtotal: number;
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (!session.metadata?.orderData) {
    throw new Error('Missing order data in session metadata');
  }

  const orderMetadata: OrderMetadata = JSON.parse(session.metadata.orderData);
  const db = getAdminDb();
  const now = new Date().toISOString();

  // Stripe amounts are in cents — convert back to dollars for storage
  const totalDollars = (session.amount_total || 0) / 100;
  const subtotalDollars = orderMetadata.subtotal;
  const discountDollars = orderMetadata.discountAmount || 0;

  // FIX WEBHOOK-002 + DUAL-PATH: Use SAME field names as /api/orders/create route
  // This ensures the admin panel can display orders from both paths consistently.
  let createdOrderId = '';

  await db.runTransaction(async (transaction) => {
    // Phase 1: Read all products and validate stock
    const productReads: {
      item: OrderItem;
      data: FirebaseFirestore.DocumentData;
      ref: FirebaseFirestore.DocumentReference;
    }[] = [];

    for (const item of orderMetadata.items) {
      const ref = db.collection('products').doc(item.productId);
      const snap = await transaction.get(ref);

      if (!snap.exists) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const data = snap.data()!;
      productReads.push({ item, data, ref });
    }

    // Phase 2: Validate stock and decrement
    for (const { item, data, ref } of productReads) {
      // FIX WEBHOOK-001: Use correct field name 'stock' (not 'inventory')
      // Support both color-variant and plain stock structures
      if (item.color && data.colors && Array.isArray(data.colors)) {
        const colors = [...(data.colors as { name: string; stock: Record<string, number> }[])];
        const colorIdx = colors.findIndex((c) => c.name === item.color);

        if (colorIdx !== -1) {
          const available = colors[colorIdx].stock[item.size] ?? 0;
          if (available < item.quantity) {
            throw new Error(
              `Insufficient stock for product ${item.productId} size ${item.size} color ${item.color}`
            );
          }

          colors[colorIdx] = {
            ...colors[colorIdx],
            stock: {
              ...colors[colorIdx].stock,
              [item.size]: available - item.quantity,
            },
          };
        }

        // Recalculate total stock across all colors
        const totalStock: StockRecord = { XS: 0, S: 0, M: 0, L: 0, XL: 0 };
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
        const available = currentStock[item.size] ?? 0;

        if (available < item.quantity) {
          throw new Error(
            `Insufficient stock for product ${item.productId} size ${item.size}`
          );
        }

        transaction.update(ref, {
          stock: {
            ...currentStock,
            [item.size]: available - item.quantity,
          },
          updated_at: now,
        });
      }

      // Write inventory log inside transaction
      const logRef = db.collection('inventory_logs').doc();
      transaction.set(logRef, {
        product_id: item.productId,
        size: item.size,
        color: item.color || null,
        change: -item.quantity,
        reason: `Stripe checkout ${session.id}`,
        user_email: 'system',
        created_at: now,
        timestamp: FieldValue.serverTimestamp(),
      });
    }

    // Increment discount usage if applicable
    if (orderMetadata.discountCode) {
      const discountsQuery = await db
        .collection('discounts')
        .where('code', '==', orderMetadata.discountCode.toUpperCase())
        .limit(1)
        .get();

      if (!discountsQuery.empty) {
        const discountRef = discountsQuery.docs[0].ref;
        const freshSnap = await transaction.get(discountRef);
        if (freshSnap.exists) {
          transaction.update(discountRef, {
            currentUses: FieldValue.increment(1),
          });
        }
      }
    }

    // Phase 3: Create order document — SAME schema as /api/orders/create
    const orderRef = db.collection('orders').doc();
    createdOrderId = orderRef.id;

    transaction.set(orderRef, {
      items: orderMetadata.items.map((item) => ({
        productId: item.productId,
        size: item.size,
        color: item.color || null,
        quantity: item.quantity,
        price: item.price,
      })),
      customer_email: session.customer_email || '',
      customer_name: session.customer_details?.name || '',
      shipping_address: session.collected_information?.shipping_details?.address
        ? {
            name: session.collected_information.shipping_details.name || session.customer_details?.name || '',
            line1: session.collected_information.shipping_details.address.line1 || '',
            line2: session.collected_information.shipping_details.address.line2 || undefined,
            city: session.collected_information.shipping_details.address.city || '',
            state: session.collected_information.shipping_details.address.state || '',
            postalCode: session.collected_information.shipping_details.address.postal_code || '',
            country: session.collected_information.shipping_details.address.country || '',
          }
        : {},
      subtotal: subtotalDollars,
      discount: discountDollars,
      total_amount: totalDollars,
      donation: totalDollars * 0.10,
      status: 'pending',
      payment_status: 'paid',
      stripe_session_id: session.id,
      stripe_payment_intent: typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null,
      created_at: now,
      updated_at: now,
    });
  });

  logger.info('Order created from Stripe payment', {
    orderId: createdOrderId,
    sessionId: session.id,
    email: session.customer_email,
    total: totalDollars,
    itemCount: orderMetadata.items.length,
  });

  logAdminActionServer('order_created_server', {
    orderId: createdOrderId,
    sessionId: session.id,
    customerEmail: session.customer_email,
    total: totalDollars,
    itemCount: orderMetadata.items.length,
    source: 'stripe_webhook',
  }).catch(() => {});

  // Queue confirmation email
  await db.collection('pending_emails').add({
    to: session.customer_email,
    subject: `Order Confirmed — ${createdOrderId}`,
    template: 'order_confirmation',
    data: {
      orderId: createdOrderId,
      items: orderMetadata.items,
      total: totalDollars,
      discountCode: orderMetadata.discountCode || null,
    },
    status: 'pending',
    created_at: now,
  });

  return { success: true, orderId: createdOrderId };
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  logger.info('Checkout session expired', {
    sessionId: session.id,
    email: session.customer_email,
  });
  return { success: true };
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const db = getAdminDb();

  // FIX WEBHOOK-003: Match order by stripe_payment_intent field
  const paymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id;

  if (!paymentIntentId) {
    logger.warn('Refund received but no payment intent found', { chargeId: charge.id });
    return;
  }

  // Query by the correct field name (stripe_payment_intent)
  const ordersSnapshot = await db.collection('orders')
    .where('stripe_payment_intent', '==', paymentIntentId)
    .limit(1)
    .get();

  if (ordersSnapshot.empty) {
    logger.warn('Refund received but no matching order found', {
      chargeId: charge.id,
      paymentIntentId,
    });
    return;
  }

  const orderDoc = ordersSnapshot.docs[0];
  const now = new Date().toISOString();

  await orderDoc.ref.update({
    payment_status: charge.refunded ? 'refunded' : 'paid',
    status: charge.refunded ? 'cancelled' : orderDoc.data().status,
    refunded_at: now,
    refund_amount: charge.amount_refunded / 100,
    updated_at: now,
  });

  logger.info('Order refunded', {
    orderId: orderDoc.id,
    chargeId: charge.id,
    amountRefunded: charge.amount_refunded / 100,
    fullyRefunded: charge.refunded,
  });
}

export async function POST(request: Request) {
  try {
    let stripe: Stripe;
    try {
      stripe = getStripe();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Stripe not configured';
      logger.error('Stripe initialization failed in webhook', { error: errorMessage });
      return NextResponse.json(
        { error: 'Payment service unavailable' },
        { status: 503 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      logger.error('Missing Stripe signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logger.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Webhook signature verification failed', { error: errorMessage });
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Event deduplication — use transaction to prevent race condition
    const db = getAdminDb();
    const eventRef = db.collection('webhook_events').doc(event.id);

    // FIX WEBHOOK-004: Use transaction for dedup check to prevent race condition
    const isDuplicate = await db.runTransaction(async (transaction) => {
      const existingEvent = await transaction.get(eventRef);
      if (existingEvent.exists) {
        return true;
      }
      transaction.set(eventRef, {
        event_id: event.id,
        type: event.type,
        status: 'processing',
        created_at: new Date().toISOString(),
      });
      return false;
    });

    if (isDuplicate) {
      logger.info('Duplicate webhook event skipped', { eventId: event.id, type: event.type });
      return NextResponse.json({ received: true, deduplicated: true });
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
      } else if (event.type === 'checkout.session.expired') {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionExpired(session);
      } else if (event.type === 'charge.refunded') {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
      } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logger.warn('Payment failed', {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          lastError: paymentIntent.last_payment_error?.message,
        });
      }

      await eventRef.update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      return NextResponse.json({ received: true });
    } catch (processingError) {
      const errMsg = processingError instanceof Error ? processingError.message : 'Unknown error';
      await eventRef.update({
        status: 'failed',
        error: errMsg,
        failed_at: new Date().toISOString(),
      });

      logger.error('Webhook processing error', { event_id: event.id, error: errMsg });
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Webhook handler error', { error: errorMessage });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
