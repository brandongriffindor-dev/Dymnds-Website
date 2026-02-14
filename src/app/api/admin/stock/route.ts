import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb, FieldValue } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { logAdminActionServer } from '@/lib/audit-log-server';
import { SIZES } from '@/lib/constants';
import type { ProductColor, StockRecord } from '@/lib/types';

/**
 * STK-001: Zod schema for stock update
 */
const updateStockSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  size: z
    .enum([...SIZES] as [string, ...string[]]),
  newStock: z
    .number()
    .min(0, 'Stock must be >= 0')
    .int('Stock must be an integer'),
  reason: z.string().optional().default('Manual adjustment'),
  colorName: z.string().optional(),
});

type UpdateStockInput = z.infer<typeof updateStockSchema>;

/**
 * PATCH /api/admin/stock
 * STK-001: Transactional stock update with inventory logging
 *
 * Updates product stock within a Firestore transaction to ensure atomicity.
 * If colorName is provided, updates the specific color variant's stock.
 * Otherwise, updates the main product stock.
 *
 * Guarantees:
 * - Read product state
 * - Validate size and newStock >= 0
 * - Update product stock (or color variant stock)
 * - Recalculate total stock across colors (if applicable)
 * - Write inventory_log entry atomically
 */
export async function PATCH(request: Request) {
  try {
    const [admin, authError] = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();

    // Validate input
    const validationResult = updateStockSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { productId, size, newStock, reason, colorName } = validationResult.data;
    const db = getAdminDb();

    // Run transaction
    try {
      await db.runTransaction(async (transaction) => {
        // Phase 1: Read product
        const productRef = db.collection('products').doc(productId);
        const productSnap = await transaction.get(productRef);

        if (!productSnap.exists) {
          throw new Error(`Product ${productId} not found`);
        }

        const productData = productSnap.data()!;
        const now = new Date().toISOString();
        let oldStock = 0;

        // Phase 2: Handle color variant or main product
        if (colorName) {
          // Update color variant stock
          const colors = productData.colors as ProductColor[] | undefined;
          if (!colors || colors.length === 0) {
            throw new Error(`Product ${productId} has no color variants`);
          }

          const colorIndex = colors.findIndex((c) => c.name === colorName);
          if (colorIndex === -1) {
            throw new Error(`Color "${colorName}" not found in product`);
          }

          oldStock = colors[colorIndex].stock?.[size as keyof StockRecord] || 0;

          // Update the color's stock for this size
          const updatedColors = [...colors];
          updatedColors[colorIndex] = {
            ...updatedColors[colorIndex],
            stock: {
              ...updatedColors[colorIndex].stock,
              [size]: newStock,
            },
          };

          // Phase 3: Recalculate total stock across all colors
          const totalStock: StockRecord = { XS: 0, S: 0, M: 0, L: 0, XL: 0 };
          for (const color of updatedColors) {
            for (const sizeKey of SIZES) {
              totalStock[sizeKey as keyof StockRecord] += color.stock?.[sizeKey] || 0;
            }
          }

          // Phase 4: Write updates atomically
          transaction.update(productRef, {
            colors: updatedColors,
            stock: totalStock,
            updated_at: now,
          });

          // Write inventory log within transaction
          const logRef = db.collection('inventory_logs').doc();
          transaction.set(logRef, {
            product_id: productId,
            product_name: productData.title || '',
            color: colorName,
            size,
            old_stock: oldStock,
            new_stock: newStock,
            change: newStock - oldStock,
            reason: reason || 'Manual adjustment',
            user_email: admin.email,
            created_at: now,
            timestamp: FieldValue.serverTimestamp(),
          });
        } else {
          // Update main product stock
          const currentStock = (productData.stock as Record<string, number>) || {};
          oldStock = currentStock[size] || 0;

          // Phase 3 & 4: Write update atomically
          transaction.update(productRef, {
            stock: {
              ...currentStock,
              [size]: newStock,
            },
            updated_at: now,
          });

          // Write inventory log within transaction
          const logRef = db.collection('inventory_logs').doc();
          transaction.set(logRef, {
            product_id: productId,
            product_name: productData.title || '',
            size,
            old_stock: oldStock,
            new_stock: newStock,
            change: newStock - oldStock,
            reason: reason || 'Manual adjustment',
            user_email: admin.email,
            created_at: now,
            timestamp: FieldValue.serverTimestamp(),
          });
        }
      });

      logger.info('Stock updated successfully', {
        productId,
        size,
        newStock,
        colorName,
      });

      await logAdminActionServer('stock_updated', {
        productId,
        size,
        newStock,
        colorName,
        reason,
        userEmail: admin.email,
      });

      return NextResponse.json(
        {
          success: true,
          productId,
          size,
          newStock,
        },
        { status: 200 }
      );
    } catch (transactionError) {
      const errorMessage =
        transactionError instanceof Error ? transactionError.message : 'Transaction failed';

      logger.error('Stock transaction failed', { productId, size }, transactionError);

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('PATCH /api/admin/stock failed', {}, error);
    return NextResponse.json(
      { error: 'Failed to update stock' },
      { status: 500 }
    );
  }
}
