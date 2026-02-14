/**
 * Server-side admin order operations API route.
 *
 * Handles admin order management including status transitions,
 * stock restoration on cancellation, and audit logging.
 *
 * Authentication: Validates admin session via Firebase Admin SDK.
 * ADM-002: Implements proper state machine for order status transitions.
 * ADM-003: Restores stock atomically on order cancellation.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getAdminDb, FieldValue } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { logAdminActionServer } from '@/lib/audit-log-server';
import { requireAdmin } from '@/lib/admin-auth';
import { ORDER_STATUSES, SIZES } from '@/lib/constants';
import type { Order, OrderItem } from '@/lib/types';

/**
 * Valid order status transitions (state machine).
 * ADM-002: Only these transitions are allowed.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

/**
 * Zod schema for PATCH request body.
 */
const PatchOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  status: z.enum(ORDER_STATUSES),
});

type PatchOrderRequest = z.infer<typeof PatchOrderSchema>;

/**
 * Verify Firebase Admin JWT from __session cookie.
 * Extra safety check beyond middleware validation.
 */

/**
 * Helper: Get order from Firestore.
 */
async function getOrder(orderId: string): Promise<Order | null> {
  const db = getAdminDb();
  const orderSnap = await db.collection('orders').doc(orderId).get();
  return orderSnap.exists ? (orderSnap.data() as Order) : null;
}

/**
 * Helper: Restore stock for order items on cancellation.
 * Uses a Firestore transaction to atomically update stock and log the changes.
 * ADM-003: Stock restoration logic.
 */
async function restoreStockOnCancel(
  orderId: string,
  items: OrderItem[]
): Promise<{ success: boolean; error?: string }> {
  const db = getAdminDb();

  try {
    await db.runTransaction(async (transaction) => {
      // Phase 1: Read all products mentioned in the order
      const productReads: {
        item: OrderItem;
        data: FirebaseFirestore.DocumentData;
        ref: FirebaseFirestore.DocumentReference;
      }[] = [];

      for (const item of items) {
        // Handle both productId and product_id field names
        const productId = item.productId || item.product_id;
        if (!productId) {
          throw new Error('Order item missing product ID');
        }

        const ref = db.collection('products').doc(productId);
        const snap = await transaction.get(ref);

        if (!snap.exists) {
          throw new Error(`Product ${productId} not found`);
        }

        productReads.push({
          item,
          data: snap.data()!,
          ref,
        });
      }

      // Phase 2: Restore stock and write inventory logs
      const now = new Date().toISOString();

      for (const { item, data, ref } of productReads) {
        const productId = item.productId || item.product_id!;
        const size = item.size || 'M'; // Default to M if not specified
        const color = item.color;
        const quantity = item.quantity;

        if (color && data.colors && Array.isArray(data.colors)) {
          // Color variant: update the specific color's stock
          const colors = [
            ...(data.colors as {
              name: string;
              stock: Record<string, number>;
            }[]),
          ];
          const colorIdx = colors.findIndex((c) => c.name === color);

          if (colorIdx !== -1) {
            colors[colorIdx] = {
              ...colors[colorIdx],
              stock: {
                ...colors[colorIdx].stock,
                [size]: (colors[colorIdx].stock[size] ?? 0) + quantity,
              },
            };
          }

          // Recalculate total stock across all colors
          const totalStock: Record<string, number> = { XS: 0, S: 0, M: 0, L: 0, XL: 0 };
          for (const c of colors) {
            for (const s of SIZES) {
              totalStock[s] += c.stock[s] ?? 0;
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
              [size]: (currentStock[size] ?? 0) + quantity,
            },
            updated_at: now,
          });
        }

        // Write inventory log inside transaction for audit trail
        const logRef = db.collection('inventory_logs').doc();
        transaction.set(logRef, {
          product_id: productId,
          size,
          color: color || null,
          change: quantity, // Positive because we're restoring
          reason: `Order ${orderId} cancelled - stock restored`,
          user_email: 'system',
          created_at: now,
          timestamp: FieldValue.serverTimestamp(),
        });
      }
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stock restoration failed';
    logger.error('Stock restoration transaction failed', { orderId }, error);
    return { success: false, error: message };
  }
}

/**
 * Helper: Update order status.
 * Handles the state machine validation and stock restoration on cancel.
 */
async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  adminEmail?: string
): Promise<{
  success: boolean;
  error?: string;
  order?: Order;
}> {
  const db = getAdminDb();

  try {
    // Get the order
    const order = await getOrder(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const currentStatus = order.status;

    // Validate state machine transition
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      return {
        success: false,
        error: `Invalid transition from '${currentStatus}' to '${newStatus}'. ` +
               `Allowed transitions: ${allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'none'}`,
      };
    }

    // If transitioning to cancelled, restore stock
    if (newStatus === 'cancelled') {
      const restoreResult = await restoreStockOnCancel(orderId, order.items);
      if (!restoreResult.success) {
        return {
          success: false,
          error: `Stock restoration failed: ${restoreResult.error}`,
        };
      }
    }

    // Update the order
    const now = new Date().toISOString();
    await db.collection('orders').doc(orderId).update({
      status: newStatus,
      updated_at: now,
    });

    // Log the admin action (fire and forget)
    logAdminActionServer(
      'order_status_updated_server',
      {
        orderId,
        from_status: currentStatus,
        to_status: newStatus,
        customer_email: order.customer_email,
      },
      adminEmail
    ).catch(() => {}); // Fire and forget

    // Return the updated order
    const updatedOrder = await getOrder(orderId);
    return { success: true, order: updatedOrder || undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Status update failed';
    logger.error('Order status update failed', { orderId, newStatus }, error);
    return { success: false, error: message };
  }
}

/**
 * PATCH /api/admin/orders
 * Update an order's status with state machine validation and stock restoration.
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const [admin, authError] = await requireAdmin(request);
    if (authError) return authError;

    // Parse and validate request body
    const body = await request.json();
    const validation = PatchOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { orderId, status } = validation.data;

    // Get admin email from verified admin object
    const adminEmail = admin.email;

    // Update the order
    const result = await updateOrderStatus(orderId, status, adminEmail);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to '${status}'`,
      order: result.order,
    });
  } catch (error) {
    logger.error('PATCH /api/admin/orders failed', {}, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle unsupported methods.
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

/**
 * DELETE /api/admin/orders
 * Soft-delete (archive) one or more orders.
 * Body: { orderIds: string[] }
 */
export async function DELETE(request: NextRequest) {
  try {
    const [admin, authError] = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const schema = z.object({
      orderIds: z.array(z.string().min(1)).min(1).max(100),
    });

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { orderIds } = validation.data;
    const db = getAdminDb();
    const now = new Date().toISOString();
    const adminEmail = admin.email;

    // Batch soft-delete using Firestore batch writes (max 500 per batch)
    const batch = db.batch();
    for (const orderId of orderIds) {
      const ref = db.collection('orders').doc(orderId);
      batch.update(ref, {
        is_deleted: true,
        deleted_at: now,
        updated_at: now,
      });
    }
    await batch.commit();

    logAdminActionServer('critical_admin_action', {
      action: 'bulk_soft_delete_orders',
      count: orderIds.length,
      adminEmail,
    }, adminEmail).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `${orderIds.length} order(s) archived`,
    });
  } catch (error) {
    logger.error('DELETE /api/admin/orders failed', {}, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
