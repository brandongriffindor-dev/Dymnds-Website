import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { withProtection } from '@/lib/with-protection';

vi.mock('@/lib/csrf', () => ({
  validateCSRF: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
  RATE_LIMITS: {
    api: { max: 100, windowMs: 60000 },
    checkout: { max: 50, windowMs: 60000 },
    contact: { max: 10, windowMs: 3600000 },
    waitlist: { max: 10, windowMs: 3600000 },
    ordersCreate: { max: 5, windowMs: 60000 },
    ordersValidate: { max: 20, windowMs: 60000 },
    products: { max: 100, windowMs: 60000 },
  },
  getClientIP: vi.fn((request: Request) => {
    return request.headers.get('x-forwarded-for') || '127.0.0.1';
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

import { validateCSRF } from '@/lib/csrf';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

describe('withProtection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls handler when CSRF valid and rate limit allowed', async () => {
    const mockHandler = vi.fn(async () => NextResponse.json({ success: true }));
    (validateCSRF as any).mockResolvedValue({ valid: true });
    (rateLimit as any).mockResolvedValue({
      allowed: true,
      remaining: 99,
      limit: 100,
    });

    const handler = withProtection(
      { rateLimitKey: 'api' as any },
      mockHandler
    );
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
    });

    const response = await handler(request);
    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalled();
  });

  it('returns 403 when CSRF validation fails', async () => {
    (validateCSRF as any).mockResolvedValue({
      valid: false,
      error: 'CSRF token mismatch',
    });
    (rateLimit as any).mockResolvedValue({
      allowed: true,
      remaining: 99,
      limit: 100,
    });

    const mockHandler = vi.fn();
    const handler = withProtection(
      { rateLimitKey: 'api' as any },
      mockHandler
    );
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
    });

    const response = await handler(request);
    expect(response.status).toBe(403);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('returns 429 when rate limit exceeded', async () => {
    (validateCSRF as any).mockResolvedValue({ valid: true });
    (rateLimit as any).mockResolvedValue({
      allowed: false,
      remaining: 0,
      limit: 100,
      resetAt: Date.now() + 60000,
    });

    const mockHandler = vi.fn();
    const handler = withProtection(
      { rateLimitKey: 'api' as any },
      mockHandler
    );
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
    });

    const response = await handler(request);
    expect(response.status).toBe(429);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('returns 429 with correct Retry-After header', async () => {
    const resetTime = Math.ceil((Date.now() + 60000) / 1000);
    (validateCSRF as any).mockResolvedValue({ valid: true });
    (rateLimit as any).mockResolvedValue({
      allowed: false,
      remaining: 0,
      limit: 100,
      resetAt: resetTime * 1000,
    });

    const mockHandler = vi.fn();
    const handler = withProtection(
      { rateLimitKey: 'api' as any },
      mockHandler
    );
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
    });

    const response = await handler(request);
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBeTruthy();
  });

  it('returns 429 with X-RateLimit-Limit and X-RateLimit-Remaining headers', async () => {
    (validateCSRF as any).mockResolvedValue({ valid: true });
    (rateLimit as any).mockResolvedValue({
      allowed: false,
      remaining: 0,
      limit: 100,
      resetAt: Date.now() + 60000,
    });

    const mockHandler = vi.fn();
    const handler = withProtection(
      { rateLimitKey: 'api' as any },
      mockHandler
    );
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
    });

    const response = await handler(request);
    expect(response.status).toBe(429);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('skips CSRF when skipCSRF is true', async () => {
    (rateLimit as any).mockResolvedValue({
      allowed: true,
      remaining: 99,
      limit: 100,
    });

    const mockHandler = vi.fn(async () => NextResponse.json({ success: true }));
    const handler = withProtection(
      { rateLimitKey: 'api' as any, skipCSRF: true },
      mockHandler
    );
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
    });

    const response = await handler(request);
    expect(response.status).toBe(200);
    expect(validateCSRF).not.toHaveBeenCalled();
    expect(mockHandler).toHaveBeenCalled();
  });

  it('passes ip and rateLimit context to handler', async () => {
    (validateCSRF as any).mockResolvedValue({ valid: true });
    (rateLimit as any).mockResolvedValue({
      allowed: true,
      remaining: 99,
      limit: 100,
    });

    const mockHandler = vi.fn(async (request: any, context: any) => {
      expect(context.ip).toBeTruthy();
      expect(context.rateLimit).toBeTruthy();
      expect(context.rateLimit.remaining).toBe(99);
      expect(context.rateLimit.limit).toBe(100);
      return NextResponse.json({ success: true });
    });

    const handler = withProtection(
      { rateLimitKey: 'api' as any },
      mockHandler
    );
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '192.168.1.1',
      },
    });

    const response = await handler(request);
    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalled();
  });

  it('returns 500 when handler throws', async () => {
    (validateCSRF as any).mockResolvedValue({ valid: true });
    (rateLimit as any).mockResolvedValue({
      allowed: true,
      remaining: 99,
      limit: 100,
    });

    const mockHandler = vi.fn(async () => {
      throw new Error('Handler error');
    });

    const handler = withProtection(
      { rateLimitKey: 'api' as any },
      mockHandler
    );
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
    });

    const response = await handler(request);
    expect(response.status).toBe(500);
    expect(logger.error).toHaveBeenCalled();
  });

  it('uses correct rate limit config from RATE_LIMITS based on rateLimitKey', async () => {
    (validateCSRF as any).mockResolvedValue({ valid: true });
    (rateLimit as any).mockResolvedValue({
      allowed: true,
      remaining: 99,
      limit: 100,
    });

    const mockHandler = vi.fn(async () => NextResponse.json({ success: true }));
    const handler = withProtection(
      { rateLimitKey: 'checkout' as any },
      mockHandler
    );
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
    });

    const response = await handler(request);
    expect(rateLimit).toHaveBeenCalled();
    const callArgs = (rateLimit as any).mock.calls[0];
    expect(callArgs[0]).toContain('checkout'); // Should contain the key 'checkout:ip'
    expect(callArgs[1]).toEqual({ max: 50, windowMs: 60000 }); // RATE_LIMITS['checkout']
  });
});
