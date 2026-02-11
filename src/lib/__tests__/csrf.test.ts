import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateCSRF } from '@/lib/csrf';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';

describe('validateCSRF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns valid:true when header matches cookie', async () => {
    const token = 'test-token-123';
    const mockCookies = {
      get: vi.fn((name: string) =>
        name === 'csrf_token' ? { value: token } : undefined
      ),
    };
    (cookies as any).mockReturnValue(mockCookies);

    const request = new Request('http://localhost', {
      method: 'POST',
      headers: {
        'x-csrf-token': token,
      },
    });

    const result = await validateCSRF(request);
    expect(result).toEqual({ valid: true });
  });

  it("returns error 'Missing CSRF cookie' when no csrf_token cookie", async () => {
    const mockCookies = {
      get: vi.fn(() => undefined),
    };
    (cookies as any).mockReturnValue(mockCookies);

    const request = new Request('http://localhost', {
      method: 'POST',
      headers: {
        'x-csrf-token': 'some-token',
      },
    });

    const result = await validateCSRF(request);
    expect(result).toEqual({ valid: false, error: 'Missing CSRF cookie' });
  });

  it("returns error 'Missing CSRF token header' when no x-csrf-token header", async () => {
    const mockCookies = {
      get: vi.fn((name: string) =>
        name === 'csrf_token' ? { value: 'test-token' } : undefined
      ),
    };
    (cookies as any).mockReturnValue(mockCookies);

    const request = new Request('http://localhost', {
      method: 'POST',
    });

    const result = await validateCSRF(request);
    expect(result).toEqual({ valid: false, error: 'Missing CSRF token header' });
  });

  it("returns error 'CSRF token mismatch' when header and cookie differ", async () => {
    const mockCookies = {
      get: vi.fn((name: string) =>
        name === 'csrf_token' ? { value: 'cookie-token' } : undefined
      ),
    };
    (cookies as any).mockReturnValue(mockCookies);

    const request = new Request('http://localhost', {
      method: 'POST',
      headers: {
        'x-csrf-token': 'header-token',
      },
    });

    const result = await validateCSRF(request);
    expect(result).toEqual({ valid: false, error: 'CSRF token mismatch' });
  });

  it('returns valid:true with complex token values (UUID-like strings)', async () => {
    const token = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const mockCookies = {
      get: vi.fn((name: string) =>
        name === 'csrf_token' ? { value: token } : undefined
      ),
    };
    (cookies as any).mockReturnValue(mockCookies);

    const request = new Request('http://localhost', {
      method: 'POST',
      headers: {
        'x-csrf-token': token,
      },
    });

    const result = await validateCSRF(request);
    expect(result).toEqual({ valid: true });
  });
});
