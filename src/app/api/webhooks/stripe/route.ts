import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { logAdminActionServer } from '@/lib/audit-log-server';

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
  _stripe = new Stripe(key, { apiVersion: '2026-01-28.clover' });
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
  try {
    if (!session.metadata?.orderData) {
      throw new Error('Missing order data in session metadata');
    }

    const orderMetadata: OrderMetadata = JSON.parse(session.metadata.orderData);
    const db = getAdminDb();

    // Create order in Firestore
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const orderData = {
      orderId,
      customerId: session.customer_email || 'guest',
      customerEmail: session.customer_email,
      items: orderMetadata.items,
      subtotal: orderMetadata.subtotal,
      discountCode: orderMetadata.discountCode || null,
      discountAmount: orderMetadata.discountAmount || 0,
      discountType: orderMetadata.discountType || null,
      total: session.amount_total || 0,
      stripeSessionId: session.id,
      paymentStatus: 'completed',
      orderStatus: 'pending', // Will be updated to 'confirmed' after notification
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Use a transaction to atomically create order and decrement stock
    await db.runTransaction(async (transaction: any) => {
      // Create order document
      const orderRef = db.collection('orders').doc(orderId);
      transaction.set(orderRef, orderData);

      // Decrement stock for each item
      for (const item of orderMetadata.items) {
        const productRef = db.collection('products').doc(item.productId);
        const productDoc = await transaction.get(productRef);

        if (productDoc.exists) {
          const inventory = productDoc.data().inventory || {};
          const currentStock = inventory[item.size] || 0;
          const newStock = Math.max(0, currentStock - item.quantity);

          transaction.update(productRef, {
            [`inventory.${item.size}`]: newStock,
          });
        }
      }

      // Increment discount usage if applicable
      if (orderMetadata.discountCode) {
        const discountRef = db.collection('discounts').doc(orderMetadata.discountCode);
        const discountDoc = await transaction.get(discountRef);

        if (discountDoc.exists) {
          const timesUsed = discountDoc.data().timesUsed || 0;
          transaction.update(discountRef, {
            timesUsed: timesUsed + 1,
          });
        }
      }
    });

    logger.info(`Order created from Stripe payment: ${orderId}`, {
      sessionId: session.id,
      email: session.customer_email,
      total: session.amount_total,
      itemCount: orderMetadata.items.length,
    });

    // Log the order creation
    logAdminActionServer('order_created_server', {
      orderId,
      sessionId: session.id,
      customerEmail: session.customer_email,
      total: session.amount_total,
      itemCount: orderMetadata.items.length,
    }).catch(() => {}); // Fire and forget

    // Queue confirmation email for sending
    const db2 = getAdminDb();
    await db2.collection('pending_emails').add({
      to: session.customer_email,
      subject: `Order Confirmed — ${orderId}`,
      template: 'order_confirmation',
      data: {
        orderId,
        items: orderMetadata.items,
        total: session.amount_total,
        discountCode: orderMetadata.discountCode || null,
      },
      status: 'pending',
      createdAt: new Date(),
    });

    return { success: true, orderId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error processing checkout session completed: ${errorMessage}`, {
      sessionId: session.id,
    });
    throw error;
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  try {
    logger.info(`Checkout session expired: ${session.id}`, {
      email: session.customer_email,
    });

    // TODO: Clean up any temporary holds or reserved inventory
    // If you implement inventory holds during checkout, release them here
    // Example:
    // const orderMetadata: OrderMetadata = JSON.parse(session.metadata?.orderData || '{}');
    // for (const item of orderMetadata.items) {
    //   await releaseInventoryHold(item.productId, item.size, item.quantity);
    // }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error processing checkout session expired: ${errorMessage}`, {
      sessionId: session.id,
    });
    throw error;
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  try {
    const db = getAdminDb();

    // Find the order by stripe session ID or payment intent
    const paymentIntentId = typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;

    if (!paymentIntentId) {
      logger.warn('Refund received but no payment intent found', { chargeId: charge.id });
      return;
    }

    // Look up order by stripe session
    const ordersSnapshot = await db.collection('orders')
      .where('paymentStatus', '==', 'completed')
      .limit(100)
      .get();

    // Find matching order
    let matchedOrderId: string | null = null;
    for (const doc of ordersSnapshot.docs) {
      const data = doc.data();
      if (data.stripeSessionId) {
        matchedOrderId = doc.id;
        break;
      }
    }

    if (matchedOrderId) {
      await db.collection('orders').doc(matchedOrderId).update({
        paymentStatus: charge.refunded ? 'refunded' : 'partially_refunded',
        orderStatus: charge.refunded ? 'refunded' : 'partially_refunded',
        refundedAt: new Date(),
        refundAmount: charge.amount_refunded,
        updatedAt: new Date(),
      });

      logger.info(`Order refunded: ${matchedOrderId}`, {
        chargeId: charge.id,
        amountRefunded: charge.amount_refunded,
        fullyRefunded: charge.refunded,
      });
    } else {
      logger.warn('Refund received but no matching order found', {
        chargeId: charge.id,
        paymentIntentId,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error processing refund: ${errorMessage}`, { chargeId: charge.id });
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    // Initialize Stripe with runtime guard
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

    // Read raw body for webhook signature verification
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

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Webhook signature verification failed: ${errorMessage}`);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // ── Event Deduplication ──
    // Check if we've already processed this event
    const db = getAdminDb();
    const eventRef = db.collection('webhook_events').doc(event.id);
    const existingEvent = await eventRef.get();

    if (existingEvent.exists) {
      logger.info(`Duplicate webhook event skipped: ${event.id} (${event.type})`);
      return NextResponse.json({ received: true, deduplicated: true });
    }

    // Mark event as processing
    await eventRef.set({
      event_id: event.id,
      type: event.type,
      status: 'processing',
      created_at: new Date(),
    });

    try {
      // Handle checkout.session.completed event
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
      }

      // Handle checkout.session.expired event
      if (event.type === 'checkout.session.expired') {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionExpired(session);
      }

      // Handle charge.refunded event
      if (event.type === 'charge.refunded') {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
      }

      // Handle payment_intent.payment_failed event
      if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logger.warn(`Payment failed: ${paymentIntent.id}`, {
          amount: paymentIntent.amount,
          last_error: paymentIntent.last_payment_error?.message,
        });
      }

      // Mark event as completed
      await eventRef.update({ status: 'completed', completed_at: new Date() });

      return NextResponse.json({ received: true });
    } catch (processingError) {
      // Mark event as failed (allows retry)
      const errMsg = processingError instanceof Error ? processingError.message : 'Unknown error';
      await eventRef.update({ status: 'failed', error: errMsg, failed_at: new Date() });

      logger.error('Webhook processing error', { event_id: event.id, error: errMsg });
      // Return 500 so Stripe retries — dedup prevents double-processing
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Webhook handler error', { error: errorMessage });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
