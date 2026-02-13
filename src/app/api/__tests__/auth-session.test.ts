import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock modules
vi.mock('@/lib/csrf', () => ({
  validateCSRF: vi.fn(() => Promise.resolve({ valid: true })),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => Promise.resolve({ allowed: true, limit: 10, remaining: 9, resetAt: Date.now() + 60000 })),
  getClientIP: vi.fn(() => '192.168.1.1'),
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
      })),
    })),
  })),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: vi.fn(() =>
      Promise.resolve({ uid: 'admin-uid', email: 'admin@test.com' })
    ),
  })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: vi.fn(),
    set: vi.fn(),
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { POST, DELETE } from '../../api/auth/session/route';

describe('auth/session route', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset all mock implementations to defaults after each test
    // (clearAllMocks only clears call history, NOT mockReturnValue overrides)
    const { validateCSRF } = await import('@/lib/csrf');
    const { rateLimit } = await import('@/lib/rate-limit');
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const { getAuth } = await import('firebase-admin/auth');
    const { cookies } = await import('next/headers');

    vi.mocked(validateCSRF).mockResolvedValue({ valid: true });
    vi.mocked(rateLimit).mockResolvedValue({ allowed: true, limit: 10, remaining: 9, resetAt: Date.now() + 60000 });
    vi.mocked(getAuth).mockReturnValue({
      verifyIdToken: vi.fn(() =>
        Promise.resolve({ uid: 'admin-uid', email: 'admin@test.com' })
      ),
    } as any);
    vi.mocked(getAdminDb).mockReturnValue({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
        })),
      })),
    } as any);
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(),
      set: vi.fn(),
    } as any);
  });

  describe('POST handler', () => {
    it('returns 200 with { success: true } for valid admin token', async () => {
      const request = new Request('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'valid-token' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
    });

    it('returns 403 when CSRF fails', async () => {
      const { validateCSRF } = await import('@/lib/csrf');
      vi.mocked(validateCSRF).mockResolvedValueOnce({ valid: false });

      const request = new Request('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'valid-token' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it('returns 429 when rate limited', async () => {
      const { rateLimit } = await import('@/lib/rate-limit');
      vi.mocked(rateLimit).mockResolvedValueOnce({ allowed: false, limit: 10, remaining: 0, resetAt: Date.now() + 60000 });

      const request = new Request('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'valid-token' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(429);
    });

    it('returns 400 when idToken missing', async () => {
      const request = new Request('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('returns 400 when idToken is not a string', async () => {
      const request = new Request('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 12345 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('returns 401 when verifyIdToken throws', async () => {
      const { getAuth } = await import('firebase-admin/auth');
      vi.mocked(getAuth).mockReturnValueOnce({
        verifyIdToken: vi.fn(() => Promise.reject(new Error('Invalid token'))),
      } as any);

      const request = new Request('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'invalid-token' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('returns 403 when user is not admin', async () => {
      const { getAdminDb } = await import('@/lib/firebase-admin');
      vi.mocked(getAdminDb).mockReturnValue({
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            get: vi.fn(() => Promise.resolve({ exists: false })),
          })),
        })),
      } as any);

      const request = new Request('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'valid-token' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it('returns 500 when Firestore admin check throws', async () => {
      const { getAdminDb } = await import('@/lib/firebase-admin');
      vi.mocked(getAdminDb).mockReturnValue({
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            get: vi.fn(() => Promise.reject(new Error('Firestore error'))),
          })),
        })),
      } as any);

      const request = new Request('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'valid-token' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });

    it('sets httpOnly session cookie on success', async () => {
      const { cookies } = await import('next/headers');

      const mockSet = vi.fn();
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(),
        set: mockSet,
      } as any);

      const request = new Request('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'valid-token' }),
      });

      await POST(request);

      expect(mockSet).toHaveBeenCalledWith(
        '__session',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
        })
      );
    });
  });

  describe('DELETE handler', () => {
    it('returns 200 with { success: true }', async () => {
      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
    });

    it('clears session cookie with maxAge: 0', async () => {
      const { cookies } = await import('next/headers');

      const mockSet = vi.fn();
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(),
        set: mockSet,
      } as any);

      await DELETE();

      expect(mockSet).toHaveBeenCalledWith(
        '__session',
        '',
        expect.objectContaining({
          maxAge: 0,
        })
      );
    });
  });
});
