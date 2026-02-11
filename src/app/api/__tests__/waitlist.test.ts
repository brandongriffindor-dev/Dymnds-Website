import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Firebase Admin SDK ───────────────────────────────────
const mockAdd = vi.fn().mockResolvedValue({ id: 'mock-doc-id' });
const mockWhereGet = vi.fn().mockResolvedValue({ empty: true, docs: [] });

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      add: mockAdd,
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: mockWhereGet,
        })),
      })),
    })),
  })),
  FieldValue: {
    serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
  },
}));

// ─── Mock CSRF ──────────────────────────────────────────────────
vi.mock('@/lib/csrf', () => ({
  validateCSRF: vi.fn().mockResolvedValue({ valid: true }),
}));

// ─── Mock Rate Limit ────────────────────────────────────────────
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 2,
    limit: 3,
    resetAt: Date.now() + 600000,
  }),
  RATE_LIMITS: {
    waitlist: { limit: 3, windowSeconds: 600 },
  },
  getClientIP: vi.fn((req: Request) => req.headers.get('x-forwarded-for') || '127.0.0.1'),
}));

// ─── Mock Logger ────────────────────────────────────────────────
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { POST } from '../../api/waitlist/route';
import { validateCSRF } from '@/lib/csrf';
import { rateLimit } from '@/lib/rate-limit';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(validateCSRF).mockResolvedValue({ valid: true });
  vi.mocked(rateLimit).mockResolvedValue({
    allowed: true,
    remaining: 2,
    limit: 3,
    resetAt: Date.now() + 600000,
  });
  mockAdd.mockResolvedValue({ id: 'mock-doc-id' });
  mockWhereGet.mockResolvedValue({ empty: true, docs: [] });
});

function makeRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new Request('http://localhost:3000/api/waitlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': `test-${Math.random()}`,
      'x-csrf-token': 'mock-csrf-token',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/waitlist', () => {
  it('returns 201 for valid newsletter signup', async () => {
    const response = await POST(makeRequest({ email: 'user@dymnds.ca' }));
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it('returns welcome message for newsletter', async () => {
    const response = await POST(makeRequest({ email: 'user@dymnds.ca' }));
    const json = await response.json();
    expect(json.message).toContain('Welcome');
  });

  it('returns 400 for invalid email', async () => {
    const response = await POST(makeRequest({ email: 'not-an-email' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 for empty email', async () => {
    const response = await POST(makeRequest({ email: '' }));
    expect(response.status).toBe(400);
  });

  it('returns 201 for valid app waitlist signup', async () => {
    const response = await POST(makeRequest({ email: 'app@dymnds.ca', type: 'app' }));
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.message).toContain('list');
  });

  it('returns 400 for invalid app waitlist email', async () => {
    const response = await POST(makeRequest({ email: 'bad', type: 'app' }));
    expect(response.status).toBe(400);
  });

  it('returns 403 when CSRF fails', async () => {
    vi.mocked(validateCSRF).mockResolvedValueOnce({ valid: false, error: 'CSRF mismatch' });
    const response = await POST(makeRequest({ email: 'user@dymnds.ca' }));
    expect(response.status).toBe(403);
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      limit: 3,
      resetAt: Date.now() + 60000,
    });
    const response = await POST(makeRequest({ email: 'blocked@dymnds.ca' }));
    expect(response.status).toBe(429);
  });

  it('includes Retry-After header on 429', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      limit: 3,
      resetAt: Date.now() + 60000,
    });
    const response = await POST(makeRequest({ email: 'blocked@dymnds.ca' }));
    expect(response.headers.get('Retry-After')).toBeTruthy();
  });
});
