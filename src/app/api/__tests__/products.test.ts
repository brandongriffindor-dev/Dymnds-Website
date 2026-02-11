import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock data ──────────────────────────────────────────────────
const mockDocs = [
  { id: 'prod_1', data: () => ({ title: 'Classic Tee', slug: 'classic-tee', category: 'men', price: 59.99, displayOrder: 1, featured: true, newArrival: false, bestSeller: false, is_active: true }) },
  { id: 'prod_2', data: () => ({ title: 'Joggers', slug: 'joggers', category: 'women', price: 89.99, displayOrder: 2, featured: false, newArrival: true, bestSeller: false, is_active: true }) },
  { id: 'prod_3', data: () => ({ title: 'Hoodie', slug: 'hoodie', category: 'men', price: 99.99, displayOrder: 3, featured: false, newArrival: false, bestSeller: true, is_active: true }) },
];

const mockQueryGet = vi.fn().mockResolvedValue({ docs: mockDocs });

// Chainable query mock — every .where()/.orderBy()/.limit() returns same chain
const createChainableQuery = () => {
  const chain: any = {
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    get: mockQueryGet,
  };
  return chain;
};

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => createChainableQuery()),
  })),
}));

// ─── Mock Rate Limit ────────────────────────────────────────────
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 59,
    limit: 60,
    resetAt: Date.now() + 60000,
  }),
  RATE_LIMITS: {
    products: { limit: 60, windowSeconds: 60 },
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

// ─── Mock schemas — pass-through ────────────────────────────────
vi.mock('@/lib/schemas', () => ({
  safeParseProduct: vi.fn((data: any) => data),
}));

import { GET } from '../../api/products/route';
import { rateLimit } from '@/lib/rate-limit';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockResolvedValue({
    allowed: true,
    remaining: 59,
    limit: 60,
    resetAt: Date.now() + 60000,
  });
  mockQueryGet.mockResolvedValue({ docs: mockDocs });
});

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/products');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString(), {
    method: 'GET',
    headers: {
      'x-forwarded-for': `test-${Math.random()}`,
    },
  });
}

describe('GET /api/products', () => {
  it('returns 200 with products array', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.products).toBeDefined();
    expect(Array.isArray(json.products)).toBe(true);
  });

  it('includes Cache-Control headers', async () => {
    const response = await GET(makeRequest());
    const cacheControl = response.headers.get('Cache-Control');
    expect(cacheControl).toContain('s-maxage=60');
    expect(cacheControl).toContain('stale-while-revalidate=300');
  });

  it('returns products with id and data merged', async () => {
    const response = await GET(makeRequest());
    const json = await response.json();
    const product = json.products[0];
    expect(product.id).toBe('prod_1');
    expect(product.title).toBe('Classic Tee');
  });

  it('handles query params without error', async () => {
    const response = await GET(makeRequest({ category: 'men', featured: 'true' }));
    expect(response.status).toBe(200);
  });

  it('handles slug query param', async () => {
    const response = await GET(makeRequest({ slug: 'classic-tee' }));
    expect(response.status).toBe(200);
  });

  it('caps limit to 100', async () => {
    const response = await GET(makeRequest({ limit: '500' }));
    expect(response.status).toBe(200);
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      limit: 60,
      resetAt: Date.now() + 60000,
    });

    const response = await GET(makeRequest());
    expect(response.status).toBe(429);
  });
});
