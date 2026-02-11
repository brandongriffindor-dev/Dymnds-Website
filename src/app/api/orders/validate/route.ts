import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateStock } from '@/lib/stock';
import { rateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit';
import { validateCSRF } from '@/lib/csrf';
import { logger } from '@/lib/logger';

/**
 * POST /api/orders/validate
 * Server-side stock validation before order creation.
 * Call this before showing the payment screen to verify all items are still available.
 *
 * Now uses Admin SDK internally via stock.ts — bypasses Firestore rules.
 */

const ValidateRequestSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      size: z.string().min(1),
      color: z.string().optional(),
      quantity: z.number().int().min(1).max(99),
    })
  ).min(1).max(50),
});

export async function POST(request: Request) {
  try {
    // ── CSRF Validation ────────────────────────────────────────
    const csrf = await validateCSRF(request);
    if (!csrf.valid) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 403 });
    }

    // ── Rate Limit ────────────────────────────────────────────
    const ip = getClientIP(request);
    const rl = await rateLimit(`orders-validate:${ip}`, RATE_LIMITS.ordersValidate);

    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // ── Parse & Validate Request ────────────────────────────
    const body = await request.json();
    const parsed = ValidateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // ── Check Stock (uses Admin SDK internally) ─────────────
    const result = await validateStock(parsed.data.items);

    // Sanitize errors — don't expose exact stock quantities to public
    const sanitizedErrors = result.errors.map(err => ({
      productId: err.productId,
      size: err.size,
      ...(err.color && { color: err.color }),
      available: false,
    }));

    return NextResponse.json({
      success: true,
      valid: result.valid,
      errors: sanitizedErrors,
    });
  } catch (error) {
    logger.error('Orders validate API error', { route: '/api/orders/validate' }, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
