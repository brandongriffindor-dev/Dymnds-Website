import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { logAdminActionServer } from '@/lib/audit-log-server';
import { DISCOUNT_TYPES } from '@/lib/constants';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * DISC-002: Server-side discount management with Zod validation.
 * Handles POST (create), PATCH (toggle), DELETE (soft delete) operations.
 * Route-level authentication validates admin credentials via requireAdmin().
 */

// ─── Zod Schemas ────────────────────────────────────────────────────

const CreateDiscountSchema = z.object({
  code: z
    .string()
    .min(1, 'Code cannot be empty')
    .max(50, 'Code must be 50 characters or less')
    .transform((val) => val.toUpperCase()),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0, 'Value must be non-negative'),
  minOrder: z.number().min(0, 'Min order must be non-negative').default(0),
  maxUses: z.number().int().min(0, 'Max uses must be non-negative').default(0),
  expiresAt: z.string().refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date > new Date();
    },
    'Expiration date must be in the future and valid ISO format'
  ),
}).refine(
  (data) => {
    if (data.type === 'percentage') {
      return data.value <= 100;
    }
    if (data.type === 'fixed') {
      return data.value <= 100000;
    }
    return true;
  },
  {
    message:
      'Percentage discounts max 100%, fixed discounts max $100,000',
    path: ['value'],
  }
);

const ToggleActiveSchema = z.object({
  discountId: z.string().min(1, 'Discount ID is required'),
  active: z.boolean(),
});

const DeleteDiscountSchema = z.object({
  discountId: z.string().min(1, 'Discount ID is required'),
});

// ─── Type Definitions ────────────────────────────────────────────────

interface Discount {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder: number;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  deleted_at?: string;
}

// ─── Helper: Check for Duplicate Code ────────────────────────────────

async function isDuplicateCode(code: string): Promise<boolean> {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection('discounts')
      .where('code', '==', code.toUpperCase())
      .where('is_deleted', '!=', true)
      .get();
    return snapshot.size > 0;
  } catch (error) {
    logger.error('Error checking duplicate code', { code }, error);
    throw error;
  }
}

// ─── POST: Create Discount ──────────────────────────────────────────

async function handlePost(request: NextRequest) {
  const [admin, authError] = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    // Validate with Zod (DISC-002)
    const validatedData = CreateDiscountSchema.parse(body);

    // Check for duplicate code (case-insensitive)
    const isDuplicate = await isDuplicateCode(validatedData.code);
    if (isDuplicate) {
      return NextResponse.json(
        { error: `Discount code ${validatedData.code} already exists` },
        { status: 409 }
      );
    }

    // Create discount in Firestore
    const db = getAdminDb();
    const now = new Date().toISOString();

    const discountData: Discount = {
      code: validatedData.code,
      type: validatedData.type,
      value: validatedData.value,
      minOrder: validatedData.minOrder,
      maxUses: validatedData.maxUses,
      currentUses: 0,
      expiresAt: validatedData.expiresAt,
      active: true,
      created_at: now,
      updated_at: now,
    };

    const docRef = await db.collection('discounts').add(discountData);

    // Log admin action (fire and forget)
    logAdminActionServer('critical_admin_action', {
      action: 'discount_created',
      discountId: docRef.id,
      code: validatedData.code,
      type: validatedData.type,
      value: validatedData.value,
    }, admin.email);

    logger.info('Discount created', {
      discountId: docRef.id,
      code: validatedData.code,
      type: validatedData.type,
    });

    return NextResponse.json(
      {
        success: true,
        discountId: docRef.id,
        discount: discountData,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error creating discount', {}, error);
    return NextResponse.json(
      { error: 'Failed to create discount' },
      { status: 500 }
    );
  }
}

// ─── PATCH: Toggle Active Status ────────────────────────────────────

async function handlePatch(request: NextRequest) {
  const [admin, authError] = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    // Validate with Zod
    const validatedData = ToggleActiveSchema.parse(body);

    const db = getAdminDb();
    const discountRef = db.collection('discounts').doc(validatedData.discountId);

    // Check if discount exists
    const discountSnap = await discountRef.get();
    if (!discountSnap.exists) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    // Update discount
    await discountRef.update({
      active: validatedData.active,
      updated_at: now,
    });

    // Log admin action (fire and forget)
    const discountData = discountSnap.data() as Discount;
    logAdminActionServer('critical_admin_action', {
      action: 'discount_updated',
      discountId: validatedData.discountId,
      code: discountData.code,
      previousActive: discountData.active,
      newActive: validatedData.active,
    }, admin.email);

    logger.info('Discount updated', {
      discountId: validatedData.discountId,
      active: validatedData.active,
    });

    return NextResponse.json(
      {
        success: true,
        discountId: validatedData.discountId,
        active: validatedData.active,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error updating discount', {}, error);
    return NextResponse.json(
      { error: 'Failed to update discount' },
      { status: 500 }
    );
  }
}

// ─── DELETE: Soft Delete (DISC-004) ──────────────────────────────────

async function handleDelete(request: NextRequest) {
  const [admin, authError] = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    // Validate with Zod
    const validatedData = DeleteDiscountSchema.parse(body);

    const db = getAdminDb();
    const discountRef = db.collection('discounts').doc(validatedData.discountId);

    // Check if discount exists
    const discountSnap = await discountRef.get();
    if (!discountSnap.exists) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const discountData = discountSnap.data() as Discount;

    // Soft delete: mark as deleted instead of hard delete (DISC-004)
    await discountRef.update({
      is_deleted: true,
      deleted_at: now,
      active: false,
      updated_at: now,
    });

    // Log admin action (fire and forget)
    logAdminActionServer('critical_admin_action', {
      action: 'discount_deleted',
      discountId: validatedData.discountId,
      code: discountData.code,
      softDelete: true,
    }, admin.email);

    logger.info('Discount deleted (soft)', {
      discountId: validatedData.discountId,
      code: discountData.code,
    });

    return NextResponse.json(
      {
        success: true,
        discountId: validatedData.discountId,
        message: 'Discount soft deleted',
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error deleting discount', {}, error);
    return NextResponse.json(
      { error: 'Failed to delete discount' },
      { status: 500 }
    );
  }
}

// ─── Route Handler ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  return handlePost(request);
}

export async function PATCH(request: NextRequest) {
  return handlePatch(request);
}

export async function DELETE(request: NextRequest) {
  return handleDelete(request);
}
