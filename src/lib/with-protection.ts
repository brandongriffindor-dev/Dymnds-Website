/**
 * Shared API route protection wrapper.
 * Combines CSRF validation + rate limiting into a single reusable utility.
 * Eliminates duplication across API routes.
 *
 * Usage:
 *   export const POST = withProtection({ rateLimitKey: 'contact' }, async (req, ctx) => {
 *     // Your handler logic here - CSRF and rate limit already verified
 *   });
 */

import { NextResponse } from 'next/server';
import { validateCSRF } from '@/lib/csrf';
import { rateLimit, RATE_LIMITS, getClientIP, type RateLimitResult } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

interface ProtectionConfig {
  /** Rate limiter key: 'contact' | 'waitlist' | 'ordersCreate' | 'ordersValidate' | 'products' */
  rateLimitKey: keyof typeof RATE_LIMITS;
  /** Skip CSRF validation (for GET routes) */
  skipCSRF?: boolean;
}

interface ProtectedContext {
  /** Client IP address */
  ip: string;
  /** Rate limit result */
  rateLimit: RateLimitResult;
}

type ProtectedHandler = (
  request: Request,
  context: ProtectedContext
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with CSRF validation and rate limiting.
 *
 * @param config - Protection configuration
 * @param handler - Your API route logic
 * @returns Wrapped handler ready to export as POST/GET/etc.
 *
 * @example
 * ```ts
 * export const POST = withProtection(
 *   { rateLimitKey: 'contact' },
 *   async (request, { ip, rateLimit }) => {
 *     // CSRF and rate limiting already validated
 *     const body = await request.json();
 *     // ... rest of handler logic
 *     return NextResponse.json({ success: true });
 *   }
 * );
 * ```
 */
export function withProtection(config: ProtectionConfig, handler: ProtectedHandler) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      // ── CSRF Validation ─────────────────────────────────────
      if (!config.skipCSRF) {
        const csrf = await validateCSRF(request);
        if (!csrf.valid) {
          return NextResponse.json(
            { error: 'Invalid request' },
            { status: 403 }
          );
        }
      }

      // ── Rate Limit ────────────────────────────────────────────
      const ip = getClientIP(request);
      const rateLimitConfig = RATE_LIMITS[config.rateLimitKey];
      const rl = await rateLimit(`${config.rateLimitKey}:${ip}`, rateLimitConfig);

      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
              'X-RateLimit-Limit': String(rl.limit),
              'X-RateLimit-Remaining': String(rl.remaining),
            },
          }
        );
      }

      // ── Call Handler ────────────────────────────────────────────
      return await handler(request, { ip, rateLimit: rl });
    } catch (error) {
      logger.error('API route error', { route: 'withProtection wrapper' }, error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
