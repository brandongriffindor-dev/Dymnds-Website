import { getAdminDb, FieldValue } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { SIZES } from '@/lib/constants';
import type { StockRecord } from '@/lib/types';

/**
 * Transaction-based stock operations using Firebase Admin SDK.
 * Bypasses Firestore Security Rules (server-trusted context).
 *
 * DAT-101: Two users buying the last item simultaneously will not both succeed.
 * The transaction reads current stock, verifies availability, then decrements atomically.
 */

export interface StockItem {
  productId: string;
  size: string;
  color?: string;
  quantity: number;
}

export interface StockValidationResult {
  valid: boolean;
  errors: { productId: string; size: string; color?: string; message: string }[];
}

/**
 * Server-side stock validation WITHOUT decrement.
 * Reads current stock from Firestore and checks availability for each item.
 * Use this before showing checkout confirmation.
 */
export async function validateStock(items: StockItem[]): Promise<StockValidationResult> {
  const db = getAdminDb();
  const errors: StockValidationResult['errors'] = [];

  for (const item of items) {
    const productRef = db.collection('products').doc(item.productId);
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      errors.push({
        productId: item.productId,
        size: item.size,
        color: item.color,
        message: 'Product not found',
      });
      continue;
    }

    const data = productSnap.data()!;

    // Check if product is deleted or inactive
    if (data.is_deleted === true || data.is_active === false) {
      errors.push({
        productId: item.productId,
        size: item.size,
        color: item.color,
        message: 'Product is no longer available',
      });
      continue;
    }

    // Get available stock for the specific size/color
    let available = 0;

    if (item.color && data.colors && Array.isArray(data.colors)) {
      const colorVariant = data.colors.find(
        (c: { name: string }) => c.name === item.color
      );
      if (colorVariant?.stock) {
        available = colorVariant.stock[item.size] ?? 0;
      }
    } else if (data.stock) {
      available = data.stock[item.size] ?? 0;
    }

    if (available < item.quantity) {
      errors.push({
        productId: item.productId,
        size: item.size,
        color: item.color,
        message: available === 0
          ? `${item.size} is out of stock`
          : `Only ${available} left in ${item.size} (requested ${item.quantity})`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Atomically decrement stock for multiple items within a Firestore transaction.
 * Returns true if ALL items were successfully decremented, false if any failed.
 *
 * This MUST be called during order creation to prevent overselling.
 * If any item fails validation inside the transaction, the entire transaction rolls back.
 */
export async function decrementStockTransaction(
  items: StockItem[],
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  const db = getAdminDb();

  try {
    await db.runTransaction(async (transaction) => {
      // Phase 1: Read all products
      const productReads: {
        item: StockItem;
        data: FirebaseFirestore.DocumentData;
        ref: FirebaseFirestore.DocumentReference;
      }[] = [];

      for (const item of items) {
        const ref = db.collection('products').doc(item.productId);
        const snap = await transaction.get(ref);

        if (!snap.exists) {
          throw new Error(`Product ${item.productId} not found`);
        }

        const data = snap.data()!;

        // Check if product is deleted or inactive
        if (data.is_deleted === true || data.is_active === false) {
          throw new Error(`Product ${item.productId} is no longer available`);
        }

        productReads.push({ item, data, ref });
      }

      // Phase 2: Validate all stock
      for (const { item, data } of productReads) {
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

      // Phase 3: Write all decrements + inventory logs (within same transaction)
      const now = new Date().toISOString();
      for (const { item, data, ref } of productReads) {
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
        transaction.set(logRef, {
          product_id: item.productId,
          size: item.size,
          color: item.color || null,
          change: -item.quantity,
          reason: `Order ${orderId}`,
          user_email: 'system',
          created_at: now,
          timestamp: FieldValue.serverTimestamp(),
        });
      }
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stock decrement failed';
    logger.error('Stock transaction failed', { orderId }, error);
    return { success: false, error: message };
  }
}
