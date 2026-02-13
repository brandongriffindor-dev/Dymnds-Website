import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock modules
vi.mock('@/lib/csrf', () => ({
  validateCSRF: vi.fn(() => Promise.resolve({ valid: true })),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => Promise.resolve({ allowed: true, remaining: 9, limit: 10, resetAt: Date.now() + 60000 })),
  getClientIP: vi.fn(() => '192.168.1.1'),
  RATE_LIMITS: {
    ordersValidate: { limit: 10, windowSeconds: 60 },
  },
}));

vi.mock('@/lib/stock', () => ({
  validateStock: vi.fn(() => Promise.resolve({ valid: true, errors: [] })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { POST } from '../../api/orders/validate/route';

describe('orders/validate route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST handler', () => {
    it('returns 200 with valid:true when all stock is available', async () => {
      const { validateCSRF } = await import('@/lib/csrf');
      const { rateLimit } = await import('@/lib/rate-limit');
      const { validateStock } = await import('@/lib/stock');

      vi.mocked(validateCSRF).mockResolvedValue({ valid: true });
      vi.mocked(rateLimit).mockResolvedValue({ allowed: true, remaining: 9, limit: 10, resetAt: Date.now() + 60000 });
      vi.mocked(validateStock).mockResolvedValue({ valid: true, errors: [] });

      const request = new Request('http://localhost:3000/api/orders/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { productId: 'prod-1', size: 'M', quantity: 2 },
            { productId: 'prod-2', size: 'L', color: 'red', quantity: 1 },
          ],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        valid: true,
        errors: [],
      });
    });

    it('returns 200 with valid:false and sanitized errors when stock unavailable', async () => {
      const { validateCSRF } = await import('@/lib/csrf');
      const { rateLimit } = await import('@/lib/rate-limit');
      const { validateStock } = await import('@/lib/stock');

      vi.mocked(validateCSRF).mockResolvedValue({ valid: true });
      vi.mocked(rateLimit).mockResolvedValue({ allowed: true, remaining: 9, limit: 10, resetAt: Date.now() + 60000 });
      vi.mocked(validateStock).mockResolvedValue({
        valid: false,
        errors: [
          {
            productId: 'prod-1',
            size: 'M',
            available: false,
            stockCount: 5,
            message: 'Only 5 left in stock',
          } as any,
        ],
      });

      const request = new Request('http://localhost:3000/api/orders/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: 'prod-1', size: 'M', quantity: 10 }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
      expect(data.errors).toHaveLength(1);
      expect(data.errors[0]).toEqual({
        productId: 'prod-1',
        size: 'M',
        available: false,
      });
    });

    it('errors do NOT contain exact stock numbers', async () => {
      const { validateCSRF } = await import('@/lib/csrf');
      const { rateLimit } = await import('@/lib/rate-limit');
      const { validateStock } = await import('@/lib/stock');

      vi.mocked(validateCSRF).mockResolvedValue({ valid: true });
      vi.mocked(rateLimit).mockResolvedValue({ allowed: true, remaining: 9, limit: 10, resetAt: Date.now() + 60000 });
      vi.mocked(validateStock).mockResolvedValue({
        valid: false,
        errors: [
          {
            productId: 'prod-1',
            size: 'M',
            color: 'blue',
            available: false,
            stockCount: 5,
            message: 'Only 5 left in stock',
          } as any,
        ],
      });

      const request = new Request('http://localhost:3000/api/orders/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: 'prod-1', size: 'M', color: 'blue', quantity: 10 }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      const error = data.errors[0];
      expect(error).not.toHaveProperty('stockCount');
      expect(error).not.toHaveProperty('message');
      // Verify serialized error doesn't leak stock numbers
      expect(JSON.stringify(error)).not.toMatch(/Only \d+ left/);
    });

    it('returns 403 when CSRF fails', async () => {
      const { validateCSRF } = await import('@/lib/csrf');

      vi.mocked(validateCSRF).mockResolvedValue({ valid: false });

      const request = new Request('http://localhost:3000/api/orders/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: 'prod-1', size: 'M', quantity: 1 }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('returns 429 when rate limited', async () => {
      const { validateCSRF } = await import('@/lib/csrf');
      const { rateLimit } = await import('@/lib/rate-limit');

      vi.mocked(validateCSRF).mockResolvedValue({ valid: true });
      vi.mocked(rateLimit).mockResolvedValue({ allowed: false, remaining: 0, limit: 10, resetAt: Date.now() + 60000 });

      const request = new Request('http://localhost:3000/api/orders/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: 'prod-1', size: 'M', quantity: 1 }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(429);
    });

    it('returns 400 when items array is empty', async () => {
      const { validateCSRF } = await import('@/lib/csrf');
      const { rateLimit } = await import('@/lib/rate-limit');

      vi.mocked(validateCSRF).mockResolvedValue({ valid: true });
      vi.mocked(rateLimit).mockResolvedValue({ allowed: true, remaining: 9, limit: 10, resetAt: Date.now() + 60000 });

      const request = new Request('http://localhost:3000/api/orders/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('returns 400 when productId is missing', async () => {
      const { validateCSRF } = await import('@/lib/csrf');
      const { rateLimit } = await import('@/lib/rate-limit');

      vi.mocked(validateCSRF).mockResolvedValue({ valid: true });
      vi.mocked(rateLimit).mockResolvedValue({ allowed: true, remaining: 9, limit: 10, resetAt: Date.now() + 60000 });

      const request = new Request('http://localhost:3000/api/orders/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { size: 'M', quantity: 1 },
          ],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('returns 400 when quantity is 0', async () => {
      const { validateCSRF } = await import('@/lib/csrf');
      const { rateLimit } = await import('@/lib/rate-limit');

      vi.mocked(validateCSRF).mockResolvedValue({ valid: true });
      vi.mocked(rateLimit).mockResolvedValue({ allowed: true, remaining: 9, limit: 10, resetAt: Date.now() + 60000 });

      const request = new Request('http://localhost:3000/api/orders/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { productId: 'prod-1', size: 'M', quantity: 0 },
          ],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
