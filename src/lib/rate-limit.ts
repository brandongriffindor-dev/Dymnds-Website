/**
 * Rate limiter with Upstash Redis support and in-memory fallback.
 *
 * If UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are configured,
 * uses Upstash Redis for distributed rate limiting.
 * Otherwise falls back to in-memory sliding window counter per IP address.
 *
 * NOTE: The function is now async due to Redis support.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

// ============================================================================
// In-Memory Fallback Implementation
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds to prevent memory leaks
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of inMemoryStore) {
    if (now > entry.resetAt) {
      inMemoryStore.delete(key);
    }
  }
}

// ============================================================================
// Upstash Redis Setup
// ============================================================================

let redisClient: Redis | null = null;
let contactLimiter: Ratelimit | null = null;
let waitlistLimiter: Ratelimit | null = null;
let productsLimiter: Ratelimit | null = null;
let ordersValidateLimiter: Ratelimit | null = null;
let ordersCreateLimiter: Ratelimit | null = null;

function initializeUpstash() {
  if (redisClient) return; // Already initialized

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // SEC-011: In-memory rate limiting resets on serverless cold starts.
    // In production this is effectively non-functional — escalate to error.
    if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
      logger.error('SECURITY: Upstash Redis not configured in production. Rate limiting is per-instance only and effectively non-functional. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.', {});
    } else {
      logger.warn('Upstash Redis not configured, falling back to in-memory rate limiting');
    }
    return; // Fall back to in-memory
  }

  try {
    redisClient = new Redis({ url, token });

    // Initialize rate limiters with Upstash configurations
    contactLimiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      prefix: 'rl:contact',
    });

    waitlistLimiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(3, '10 m'),
      prefix: 'rl:waitlist',
    });

    productsLimiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      prefix: 'rl:products',
    });

    ordersValidateLimiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      prefix: 'rl:orders-validate',
    });

    ordersCreateLimiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      prefix: 'rl:orders-create',
    });
  } catch (error) {
    logger.error('Failed to initialize Upstash Redis', {}, error);
    // Fall back to in-memory
    redisClient = null;
    contactLimiter = null;
    waitlistLimiter = null;
    productsLimiter = null;
    ordersValidateLimiter = null;
    ordersCreateLimiter = null;
  }
}

// ============================================================================
// Types and Interfaces
// ============================================================================

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

// ============================================================================
// Main Rate Limit Function
// ============================================================================

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Initialize Upstash if needed
  if (redisClient === null) {
    initializeUpstash();
  }

  // Determine which Upstash limiter to use based on identifier prefix
  const prefix = identifier.split(':')[0];
  let limiter: Ratelimit | null = null;

  if (prefix === 'contact') {
    limiter = contactLimiter;
  } else if (prefix === 'waitlist') {
    limiter = waitlistLimiter;
  } else if (prefix === 'products') {
    limiter = productsLimiter;
  } else if (prefix === 'orders-validate') {
    limiter = ordersValidateLimiter;
  } else if (prefix === 'orders-create') {
    limiter = ordersCreateLimiter;
  }

  // Use Upstash if available and limiter found
  if (limiter) {
    try {
      const result = await limiter.limit(identifier);

      // Map Upstash response to RateLimitResult
      // Upstash returns reset in milliseconds
      const resetAtMs = typeof result.reset === 'number' ? result.reset : Date.now();

      return {
        allowed: result.success,
        limit: result.limit,
        remaining: result.remaining,
        resetAt: resetAtMs,
      };
    } catch (error) {
      logger.error('Upstash rate limit check failed, falling back to in-memory', { identifier }, error);
      // Fall through to in-memory fallback
    }
  }

  // =========================================================================
  // In-Memory Fallback
  // =========================================================================

  cleanup();

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const entry = inMemoryStore.get(identifier);

  // No existing entry or window expired — start fresh
  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    };
    inMemoryStore.set(identifier, newEntry);
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Within window — increment
  entry.count += 1;
  const allowed = entry.count <= config.limit;

  return {
    allowed,
    limit: config.limit,
    remaining: Math.max(0, config.limit - entry.count),
    resetAt: entry.resetAt,
  };
}

// ============================================================================
// Pre-configured Rate Limiters
// ============================================================================

/**
 * Pre-configured rate limiters for different endpoints
 */
export const RATE_LIMITS = {
  // Contact form: 5 submissions per 15 minutes per IP
  contact: { limit: 5, windowSeconds: 900 },
  // Waitlist signup: 3 signups per 10 minutes per IP
  waitlist: { limit: 3, windowSeconds: 600 },
  // Product reads: 60 requests per minute per IP
  products: { limit: 60, windowSeconds: 60 },
  // Orders validation: 10 requests per minute per IP (stricter than products)
  ordersValidate: { limit: 10, windowSeconds: 60 },
  // Orders creation: 5 requests per minute per IP
  ordersCreate: { limit: 5, windowSeconds: 60 },
} as const;

// ============================================================================
// Utilities
// ============================================================================

/**
 * Extract client IP from Next.js request headers.
 * Works on Vercel (x-forwarded-for) and locally.
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can be comma-separated; take the first (real client)
    return forwarded.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}
