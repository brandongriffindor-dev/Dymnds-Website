import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Firebase Admin SDK ───────────────────────────────────
const mockAdd = vi.fn().mockResolvedValue({ id: 'mock-doc-id' });

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      add: mockAdd,
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
    remaining: 4,
    limit: 5,
    resetAt: Date.now() + 900000,
  }),
  RATE_LIMITS: {
    contact: { limit: 5, windowSeconds: 900 },
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

import { POST } from '../../api/contact/route';
import { validateCSRF } from '@/lib/csrf';
import { rateLimit } from '@/lib/rate-limit';

beforeEach(() => {
  vi.clearAllMocks();
  // Restore default implementations after clearAllMocks
  vi.mocked(validateCSRF).mockResolvedValue({ valid: true });
  vi.mocked(rateLimit).mockResolvedValue({
    allowed: true,
    remaining: 4,
    limit: 5,
    resetAt: Date.now() + 900000,
  });
  mockAdd.mockResolvedValue({ id: 'mock-doc-id' });
});

function makeRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new Request('http://localhost:3000/api/contact', {
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

const validBody = {
  name: 'Brandon',
  email: 'brandon@dymnds.ca',
  subject: 'general',
  message: 'This is a test message for the contact form.',
};

describe('POST /api/contact', () => {
  it('returns 201 with valid data', async () => {
    const response = await POST(makeRequest(validBody));
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it('returns 400 with missing fields', async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain('check your input');
  });

  it('returns 400 with invalid email', async () => {
    const response = await POST(makeRequest({ ...validBody, email: 'not-email' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 with short message', async () => {
    const response = await POST(makeRequest({ ...validBody, message: 'Hi' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 with invalid subject', async () => {
    const response = await POST(makeRequest({ ...validBody, subject: 'invalid' }));
    expect(response.status).toBe(400);
  });

  it('returns 403 when CSRF validation fails', async () => {
    vi.mocked(validateCSRF).mockResolvedValueOnce({ valid: false, error: 'Missing CSRF cookie' });
    const response = await POST(makeRequest(validBody));
    expect(response.status).toBe(403);
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      limit: 5,
      resetAt: Date.now() + 60000,
    });

    const response = await POST(makeRequest(validBody));
    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json.error).toContain('Too many');
  });

  it('includes rate limit headers on 429 response', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      limit: 5,
      resetAt: Date.now() + 60000,
    });

    const response = await POST(makeRequest(validBody));
    expect(response.headers.get('Retry-After')).toBeTruthy();
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
  });
});
