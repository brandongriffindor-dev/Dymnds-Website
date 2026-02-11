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

    // TODO: Send confirmation email
    // Example:
    // await sendConfirmationEmail({
    //   email: session.customer_email,
    //   orderId,
    //   items: orderMetadata.items,
    //   total: session.amount_total,
    // });

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

    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Webhook processing error', { error: errorMessage });
    // Still return 200 to prevent Stripe from retrying
    // Log the error for manual investigation
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
