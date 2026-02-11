import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb, FieldValue } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { logAdminActionServer } from '@/lib/audit-log-server';
import { SIZES, CATEGORIES, PRODUCT_TYPES, DEFAULT_STOCK } from '@/lib/constants';
import type { Product, ProductColor, StockRecord } from '@/lib/types';

/**
 * PROD-001: Zod schema for create product with full validation
 */
const createProductSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(200, 'Slug must be max 200 characters')
    .transform((s) => s.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, ''))
    .refine((s) => s.length > 0, 'Slug must contain valid characters'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be max 200 characters'),
  subtitle: z
    .string()
    .max(300, 'Subtitle must be max 300 characters')
    .optional()
    .default(''),
  price: z
    .number()
    .min(0, 'Price must be >= 0'),
  category: z
    .enum([...CATEGORIES] as [string, ...string[]])
    .default(CATEGORIES[0]),
  productType: z
    .enum([...PRODUCT_TYPES] as [string, ...string[]])
    .optional(),
  stock: z
    .record(
      z.string(),
      z.number().min(0, 'Stock must be >= 0').int('Stock must be an integer')
    )
    .optional()
    .default(() => ({ ...DEFAULT_STOCK })),
  images: z
    .array(z.string().url())
    .default([]),
  colors: z
    .array(
      z.object({
        name: z.string().min(1, 'Color name is required'),
        hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Hex color must be #RRGGBB'),
        images: z.array(z.string().url()).default([]),
        stock: z
          .record(
            z.string(),
            z.number().min(0, 'Color stock must be >= 0').int('Stock must be an integer')
          )
          .optional()
          .default(() => ({ ...DEFAULT_STOCK })),
      })
    )
    .optional(),
  description: z
    .string()
    .optional(),
  features: z
    .array(z.string())
    .optional(),
  // Allow other fields to pass through
  displayOrder: z.number().optional().default(1),
  featured: z.boolean().optional().default(false),
  newArrival: z.boolean().optional().default(false),
  bestSeller: z.boolean().optional().default(false),
  modelSize: z.string().optional(),
  modelHeight: z.string().optional(),
  deliveryInfo: z.string().optional(),
  returnsInfo: z.string().optional(),
  matchingSetSlug: z.string().optional(),
  sizeGuide: z.any().optional(),
});

type CreateProductInput = z.infer<typeof createProductSchema>;

/**
 * Zod schema for update product (partial)
 */
const updateProductSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
}).merge(createProductSchema.partial());

type UpdateProductInput = z.infer<typeof updateProductSchema>;

/**
 * POST /api/admin/products
 * PROD-001: Create product with server-side validation
 * PROD-002: Check slug uniqueness before creating
 */
export async function POST(request: Request) {
  try {
    const [admin, authError] = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();

    // Validate input
    const validationResult = createProductSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const db = getAdminDb();

    // PROD-002: Check slug uniqueness
    const existingQuery = await db
      .collection('products')
      .where('slug', '==', data.slug)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      return NextResponse.json(
        { error: `Product with slug "${data.slug}" already exists` },
        { status: 409 }
      );
    }

    // Prepare product data
    const now = new Date().toISOString();
    let totalStock: StockRecord = { ...DEFAULT_STOCK };

    // If colors are provided, calculate total stock across all colors
    if (data.colors && data.colors.length > 0) {
      const colors: ProductColor[] = data.colors.map((c) => ({
        name: c.name,
        hex: c.hex,
        images: c.images.length > 0 ? c.images : data.images,
        stock: { ...DEFAULT_STOCK, ...c.stock } as StockRecord,
      }));

      // Calculate total
      for (const color of colors) {
        for (const size of SIZES) {
          totalStock[size] += color.stock[size] || 0;
        }
      }

      const productData: Omit<Product, 'id'> = {
        slug: data.slug,
        title: data.title,
        subtitle: data.subtitle || '',
        price: data.price,
        stock: totalStock,
        images: data.images,
        colors,
        category: data.category,
        productType: data.productType,
        displayOrder: data.displayOrder || 1,
        featured: data.featured || false,
        newArrival: data.newArrival || false,
        bestSeller: data.bestSeller || false,
        description: data.description,
        features: data.features || [],
        modelSize: data.modelSize,
        modelHeight: data.modelHeight,
        deliveryInfo: data.deliveryInfo,
        returnsInfo: data.returnsInfo,
        matchingSetSlug: data.matchingSetSlug,
        sizeGuide: data.sizeGuide,
        is_active: true,
        created_at: now,
        updated_at: now,
      };

      const docRef = await db.collection('products').add(productData);

      logger.info('Product created', {
        productId: docRef.id,
        slug: data.slug,
        title: data.title,
      });

      await logAdminActionServer('product_created', {
        email: admin.email,
        productId: docRef.id,
        title: data.title,
        slug: data.slug,
        price: data.price,
        category: data.category,
      });

      return NextResponse.json(
        {
          success: true,
          productId: docRef.id,
        },
        { status: 201 }
      );
    } else {
      // Non-color product
      totalStock = { ...DEFAULT_STOCK, ...data.stock } as StockRecord;

      const productData: Omit<Product, 'id'> = {
        slug: data.slug,
        title: data.title,
        subtitle: data.subtitle || '',
        price: data.price,
        stock: totalStock,
        images: data.images,
        category: data.category,
        productType: data.productType,
        displayOrder: data.displayOrder || 1,
        featured: data.featured || false,
        newArrival: data.newArrival || false,
        bestSeller: data.bestSeller || false,
        description: data.description,
        features: data.features || [],
        modelSize: data.modelSize,
        modelHeight: data.modelHeight,
        deliveryInfo: data.deliveryInfo,
        returnsInfo: data.returnsInfo,
        matchingSetSlug: data.matchingSetSlug,
        sizeGuide: data.sizeGuide,
        is_active: true,
        created_at: now,
        updated_at: now,
      };

      const docRef = await db.collection('products').add(productData);

      logger.info('Product created', {
        productId: docRef.id,
        slug: data.slug,
        title: data.title,
      });

      await logAdminActionServer('product_created', {
        email: admin.email,
        productId: docRef.id,
        title: data.title,
        slug: data.slug,
        price: data.price,
        category: data.category,
      });

      return NextResponse.json(
        {
          success: true,
          productId: docRef.id,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    logger.error('POST /api/admin/products failed', {}, error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/products
 * Update product with partial validation
 */
export async function PATCH(request: Request) {
  try {
    const [admin, authError] = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();

    // Validate input (partial schema)
    const validationResult = updateProductSchema.partial().safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { productId, ...updates } = validationResult.data;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Check product exists
    const docRef = db.collection('products').doc(productId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // If slug is being updated, check uniqueness
    if (updates.slug && updates.slug !== docSnap.data()?.slug) {
      const existingQuery = await db
        .collection('products')
        .where('slug', '==', updates.slug)
        .limit(1)
        .get();

      if (!existingQuery.empty) {
        return NextResponse.json(
          { error: `Product with slug "${updates.slug}" already exists` },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      ...updates,
      updated_at: now,
    };

    await docRef.update(updateData);

    logger.info('Product updated', {
      productId,
    });

    await logAdminActionServer('product_updated', {
      email: admin.email,
      productId,
      fields: Object.keys(updates),
    });

    return NextResponse.json(
      { success: true, productId },
      { status: 200 }
    );
  } catch (error) {
    logger.error('PATCH /api/admin/products failed', {}, error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products
 * Soft delete: set is_deleted=true, is_active=false
 */
export async function DELETE(request: Request) {
  try {
    const [admin, authError] = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const docRef = db.collection('products').doc(productId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    await docRef.update({
      is_deleted: true,
      deleted_at: now,
      is_active: false,
      updated_at: now,
    });

    logger.info('Product soft deleted', {
      productId,
    });

    await logAdminActionServer('product_deleted', {
      email: admin.email,
      productId,
      soft: true,
    });

    return NextResponse.json(
      { success: true, productId },
      { status: 200 }
    );
  } catch (error) {
    logger.error('DELETE /api/admin/products failed', {}, error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
