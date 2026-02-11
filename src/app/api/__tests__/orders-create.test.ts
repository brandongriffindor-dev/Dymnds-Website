import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock crypto.randomUUID ─────────────────────────────────────────
vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'fixed-uuid-1234-5678-9012-345678901234'),
}));

// ─── Mock next/headers ──────────────────────────────────────────────
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: 'mock-csrf-token' }),
  }),
}));

// ─── Mock CSRF ──────────────────────────────────────────────────────
vi.mock('@/lib/csrf', () => ({
  validateCSRF: vi.fn().mockResolvedValue({ valid: true }),
}));

// ─── Mock Rate Limit ────────────────────────────────────────────────
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
  getClientIP: vi.fn(),
  RATE_LIMITS: {
    ordersCreate: { max: 5, windowMs: 60000 },
  },
}));

// ─── Mock Sanitize ──────────────────────────────────────────────────
vi.mock('@/lib/sanitize', () => ({
  sanitizeString: vi.fn((input: string) => input),
  sanitizeEmail: vi.fn((input: string) => input.toLowerCase()),
}));

// ─── Mock Logger ────────────────────────────────────────────────────
vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// ─── Mock Audit Log ─────────────────────────────────────────────────
vi.mock('@/lib/audit-log-server', () => ({
  logAdminActionServer: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock Firebase Admin ────────────────────────────────────────────
const createMockDb = () => {
  const mockCollections: Record<string, any> = {
    products: new Map(),
    orders: new Map(),
    discounts: new Map(),
    inventory_logs: new Map(),
    discount_uses: new Map(),
  };

  const mockTransaction = {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const db = {
    collection: vi.fn((name: string) => ({
      doc: vi.fn((id?: string) => {
        const docId = id || `doc-${Math.random().toString(36).substr(2, 9)}`;
        return {
          id: docId,
          get: vi.fn(async () => {
            const data = mockCollections[name]?.get(docId);
            return {
              exists: !!data,
              data: () => data,
              id: docId,
              ref: { collection: vi.fn(), id: docId },
            };
          }),
          collection: vi.fn((subcollectionName: string) => ({
            doc: vi.fn((subId?: string) => {
              const subDocId = subId || `subdoc-${Math.random().toString(36).substr(2, 9)}`;
              return {
                id: subDocId,
                get: vi.fn(async () => {
                  const subData = mockCollections[`${name}/${docId}/${subcollectionName}`]?.get(subDocId);
                  return {
                    exists: !!subData,
                    data: () => subData,
                    id: subDocId,
                    ref: { id: subDocId },
                  };
                }),
              };
            }),
          })),
          ref: { id: docId, collection: vi.fn() },
        };
      }),
      where: vi.fn((field: string, operator: string, value: any) => ({
        limit: vi.fn((count: number) => ({
          get: vi.fn(async () => {
            const entries = Array.from(mockCollections[name]?.entries() || []);
            const docs = entries
              .filter(([, doc]: [string, any]) => {
                if (operator === '==') return doc[field] === value;
                return false;
              })
              .slice(0, count)
              .map(([key, data]: [string, any]) => ({
                id: key,
                data: () => data,
                ref: {
                  id: key,
                  collection: vi.fn((subCol: string) => ({
                    doc: vi.fn((subId?: string) => ({
                      id: subId || `subdoc-${Math.random().toString(36).substr(2, 9)}`,
                    })),
                  })),
                },
              }));
            return {
              empty: docs.length === 0,
              docs,
            };
          }),
        })),
      })),
      add: vi.fn(async (data: any) => {
        const newId = `doc-${Math.random().toString(36).substr(2, 9)}`;
        mockCollections[name]?.set(newId, data);
        return { id: newId };
      }),
    })),
    runTransaction: vi.fn(async (callback: (tx: any) => Promise<any>) => {
      // Setup transaction with collection access
      const txWithCollections = {
        ...mockTransaction,
        get: vi.fn(async (ref: any) => {
          // Handle document ref
          if (ref.id) {
            const collectionName = ref.id.split('/')[0];
            // Try to find in mock collections
            for (const [name, map] of Object.entries(mockCollections)) {
              const found = (map as Map<any, any>).get(ref.id);
              if (found) {
                return {
                  exists: true,
                  data: () => found,
                  id: ref.id,
                  ref,
                };
              }
            }
            return { exists: false, data: () => undefined, id: ref.id, ref };
          }
          return { exists: false, data: () => undefined };
        }),
        set: vi.fn(async (ref: any, data: any) => {
          const docId = ref.id || `doc-${Math.random().toString(36).substr(2, 9)}`;
          // Store in appropriate collection based on context
          for (const [name, map] of Object.entries(mockCollections)) {
            (map as Map<any, any>).set(docId, data);
          }
        }),
        update: vi.fn(),
        delete: vi.fn(),
      };

      return callback(txWithCollections);
    }),
  };

  return { db, mockCollections, mockTransaction };
};

let mockDbSetup: any;

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(() => mockDbSetup.db),
  FieldValue: {
    increment: (n: number) => ({ _type: 'increment', value: n }),
    serverTimestamp: () => ({ _type: 'serverTimestamp' }),
  },
}));

// ─── Mock Constants ─────────────────────────────────────────────────
vi.mock('@/lib/constants', () => ({
  SIZES: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
}));

// ─── Mock Types ─────────────────────────────────────────────────────
vi.mock('@/lib/types', () => ({}));

// ─── Import Actual Route Handler ────────────────────────────────────
import { POST } from '../../api/orders/create/route';
import { validateCSRF } from '@/lib/csrf';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { sanitizeString, sanitizeEmail } from '@/lib/sanitize';
import { getAdminDb, FieldValue } from '@/lib/firebase-admin';

let ipCounter = 0;

beforeEach(() => {
  vi.clearAllMocks();
  mockDbSetup = createMockDb();

  // Default mock implementations
  vi.mocked(getClientIP).mockImplementation((req: Request) => {
    const header = req.headers.get('x-forwarded-for');
    return header || `test-ip-${ipCounter++}`;
  });

  vi.mocked(rateLimit).mockResolvedValue({
    allowed: true,
    remaining: 4,
    limit: 5,
    resetAt: Date.now() + 60000,
  });

  vi.mocked(validateCSRF).mockResolvedValue({ valid: true });
});

function makeRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  return new Request('http://localhost:3000/api/orders/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': `test-ip-${ipCounter}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/orders/create', () => {
  describe('Happy Path', () => {
    it('returns 201 with valid order data', async () => {
      // Setup product
      mockDbSetup.mockCollections.products.set('prod-001', {
        id: 'prod-001',
        price: 99.99,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.orderId).toBeDefined();
      expect(json.total).toBe(99.99);
    });

    it('calculates total correctly with multiple items', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 50.00,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });
      mockDbSetup.mockCollections.products.set('prod-002', {
        price: 75.00,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      const request = makeRequest({
        items: [
          { productId: 'prod-001', size: 'M', quantity: 2, declaredPrice: 50.00 },
          { productId: 'prod-002', size: 'L', quantity: 1, declaredPrice: 75.00 },
        ],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const json = await response.json();
      // (50 * 2) + (75 * 1) = 175
      expect(json.total).toBe(175.00);
    });
  });

  describe('Validation Errors', () => {
    it('returns 400 with empty body', async () => {
      const response = await POST(
        new Request('http://localhost:3000/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        })
      );
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Validation failed');
    });

    it('returns 400 with invalid email', async () => {
      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'not-an-email',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Validation failed');
    });

    it('returns 400 with quantity below minimum (0)', async () => {
      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 0, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('returns 400 with quantity above maximum (11)', async () => {
      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 11, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('returns 400 with missing required shipping fields', async () => {
      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          // missing line1
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('returns 400 with invalid country code', async () => {
      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'UK',
        },
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('CSRF Protection', () => {
    it('returns 403 when CSRF validation fails', async () => {
      vi.mocked(validateCSRF).mockResolvedValueOnce({ valid: false, error: 'CSRF mismatch' });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toBe('Invalid request');
    });
  });

  describe('Rate Limiting', () => {
    it('returns 429 when rate limited', async () => {
      vi.mocked(rateLimit).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        limit: 5,
        resetAt: Date.now() + 60000,
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(429);
      const json = await response.json();
      expect(json.error).toBe('Too many requests');
    });
  });

  describe('Idempotency', () => {
    it('returns existing order when idempotency_key matches (duplicate: true)', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      const idempotencyKey = 'idempotency-key-12345';

      // First request
      const request1 = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
        idempotency_key: idempotencyKey,
      });

      const response1 = await POST(request1);
      expect(response1.status).toBe(201);
      const json1 = await response1.json();
      const orderId = json1.orderId;

      // Setup mock to return existing order on second request
      mockDbSetup.mockCollections.orders.set(orderId, {
        idempotency_key: idempotencyKey,
      });

      // Second request with same idempotency key
      const request2 = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
        idempotency_key: idempotencyKey,
      });

      const response2 = await POST(request2);
      expect(response2.status).toBe(200);
      const json2 = await response2.json();
      expect(json2.duplicate).toBe(true);
      expect(json2.orderId).toBeDefined();
    });
  });

  describe('Product Availability Checks', () => {
    it('returns 400 when product not found', async () => {
      const request = makeRequest({
        items: [{ productId: 'nonexistent-prod', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('not found');
    });

    it('returns 409 when product is deleted (is_deleted: true)', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_deleted: true,
        is_active: true,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(409);
      const json = await response.json();
      expect(json.error).toContain('no longer available');
    });

    it('returns 409 when product is inactive (is_active: false)', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_active: false,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(409);
      const json = await response.json();
      expect(json.error).toContain('no longer available');
    });

    it('returns 409 when price mismatch (declaredPrice differs from DB by > 0.01)', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 95.00 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(409);
      const json = await response.json();
      expect(json.error).toContain('Price has changed');
    });

    it('allows small floating point differences (< 0.01)', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.98 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });
  });

  describe('Discount Code Validation', () => {
    it('returns 400 for invalid discount code', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        discountCode: 'INVALID-CODE',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('Invalid discount code');
    });

    it('returns 400 for expired discount code', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      mockDbSetup.mockCollections.discounts.set('disc-001', {
        code: 'EXPIRED-CODE',
        type: 'percentage',
        value: 20,
        active: true,
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        maxUses: 100,
        currentUses: 0,
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        discountCode: 'EXPIRED-CODE',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('expired');
    });

    it('returns 400 for inactive discount code', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      mockDbSetup.mockCollections.discounts.set('disc-001', {
        code: 'INACTIVE-CODE',
        type: 'percentage',
        value: 20,
        active: false,
        maxUses: 100,
        currentUses: 0,
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        discountCode: 'INACTIVE-CODE',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('no longer active');
    });

    it('returns 400 when discount code max uses reached', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      mockDbSetup.mockCollections.discounts.set('disc-001', {
        code: 'LIMITED-CODE',
        type: 'percentage',
        value: 20,
        active: true,
        maxUses: 5,
        currentUses: 5,
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        discountCode: 'LIMITED-CODE',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('usage limit');
    });

    it('returns 400 when per-email usage already exists for discount', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      mockDbSetup.mockCollections.discounts.set('disc-001', {
        code: 'ONE-TIME-CODE',
        type: 'percentage',
        value: 20,
        active: true,
        maxUses: 100,
        currentUses: 1,
      });

      // Store per-email usage record so transaction.get finds it
      mockDbSetup.mockCollections.discount_uses.set('user@example.com', {
        email: 'user@example.com',
        used_at: new Date().toISOString(),
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        discountCode: 'ONE-TIME-CODE',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('already used this discount');
    });
  });

  describe('Discount Calculations', () => {
    it('applies percentage discount correctly (20% of $100 = $20)', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 100.00,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      mockDbSetup.mockCollections.discounts.set('disc-001', {
        code: 'PERCENT20',
        type: 'percentage',
        value: 20,
        active: true,
        maxUses: 100,
        currentUses: 0,
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 100.00 }],
        customerEmail: 'user@example.com',
        discountCode: 'PERCENT20',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const json = await response.json();
      // 100 - (100 * 0.20) = 80
      expect(json.total).toBe(80.00);
    });

    it('caps fixed discount at server total', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 50.00,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      mockDbSetup.mockCollections.discounts.set('disc-001', {
        code: 'FIXED100',
        type: 'fixed',
        value: 100,
        active: true,
        maxUses: 100,
        currentUses: 0,
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 50.00 }],
        customerEmail: 'user@example.com',
        discountCode: 'FIXED100',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const json = await response.json();
      // Fixed discount of 100 capped at total of 50
      expect(json.total).toBe(0);
    });

    it('caps percentage discount at 100%', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 100.00,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      mockDbSetup.mockCollections.discounts.set('disc-001', {
        code: 'PERCENT150',
        type: 'percentage',
        value: 150,
        active: true,
        maxUses: 100,
        currentUses: 0,
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 100.00 }],
        customerEmail: 'user@example.com',
        discountCode: 'PERCENT150',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const json = await response.json();
      // Percentage capped at 100%, so total = 0
      expect(json.total).toBe(0);
    });

    it('returns 400 when minimum order not met for discount', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 50.00,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      mockDbSetup.mockCollections.discounts.set('disc-001', {
        code: 'MINORDER100',
        type: 'percentage',
        value: 20,
        active: true,
        maxUses: 100,
        currentUses: 0,
        minOrder: 100,
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 50.00 }],
        customerEmail: 'user@example.com',
        discountCode: 'MINORDER100',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('Minimum order');
    });
  });

  describe('Stock Management', () => {
    it('returns 409 when stock insufficient', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_active: true,
        is_deleted: false,
        stock: { XS: 0, S: 0, M: 2, L: 10, XL: 10, XXL: 10 },
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 5, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(409);
      const json = await response.json();
      expect(json.error).toContain('Insufficient stock');
    });

    it('handles color variants with separate stock', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_active: true,
        is_deleted: false,
        colors: [
          { name: 'Red', stock: { XS: 5, S: 5, M: 5, L: 5, XL: 5, XXL: 5 } },
          { name: 'Blue', stock: { XS: 0, S: 0, M: 3, L: 10, XL: 10, XXL: 10 } },
        ],
        stock: { XS: 5, S: 5, M: 8, L: 15, XL: 15, XXL: 15 },
      });

      const request = makeRequest({
        items: [
          { productId: 'prod-001', size: 'M', color: 'Blue', quantity: 2, declaredPrice: 99.99 },
        ],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });
  });

  describe('Discount Rollback', () => {
    it('rollbacks discount when order transaction fails', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_active: true,
        is_deleted: false,
        stock: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, // Insufficient stock
      });

      mockDbSetup.mockCollections.discounts.set('disc-001', {
        code: 'ROLLBACK-TEST',
        type: 'percentage',
        value: 20,
        active: true,
        maxUses: 100,
        currentUses: 0,
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        discountCode: 'ROLLBACK-TEST',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      // Should fail due to insufficient stock
      expect(response.status).toBe(409);
    });
  });

  describe('Sanitization', () => {
    it('sanitizes email to lowercase', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'User@Example.COM',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      expect(sanitizeEmail).toHaveBeenCalledWith('User@Example.COM');
    });

    it('sanitizes address fields', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John<script>Doe</script>',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      expect(sanitizeString).toHaveBeenCalledWith('John<script>Doe</script>');
    });
  });

  describe('Order Creation Details', () => {
    it('creates order with donation amount (10% of total)', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 100.00,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 100.00 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const json = await response.json();
      // 10% of 100 = 10
      expect(json.total).toBe(100.00);
    });

    it('stores order with idempotency key when provided', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      const idempotencyKey = 'unique-key-12345';

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
        idempotency_key: idempotencyKey,
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });
  });

  describe('Logging and Audit', () => {
    it('logs successful order creation', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      // Verify logAdminActionServer was called
      const { logAdminActionServer } = await import('@/lib/audit-log-server');
      expect(logAdminActionServer).toHaveBeenCalledWith(
        'order_created_server',
        expect.objectContaining({
          orderId: expect.any(String),
          itemCount: 1,
          total: 99.99,
          ip: expect.any(String),
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles multiple items with different price points', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 50.00,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });
      mockDbSetup.mockCollections.products.set('prod-002', {
        price: 150.00,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      const request = makeRequest({
        items: [
          { productId: 'prod-001', size: 'S', quantity: 3, declaredPrice: 50.00 },
          { productId: 'prod-002', size: 'L', quantity: 2, declaredPrice: 150.00 },
        ],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const json = await response.json();
      // (50 * 3) + (150 * 2) = 150 + 300 = 450
      expect(json.total).toBe(450.00);
    });

    it('handles order with no optional fields', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_active: true,
        is_deleted: false,
        stock: { XS: 10, S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
      });

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.orderId).toBeDefined();
    });

    it('handles order with all optional fields', async () => {
      mockDbSetup.mockCollections.products.set('prod-001', {
        price: 99.99,
        is_active: true,
        is_deleted: false,
        colors: [
          { name: 'Red', stock: { XS: 5, S: 5, M: 5, L: 5, XL: 5, XXL: 5 } },
        ],
        stock: { XS: 5, S: 5, M: 5, L: 5, XL: 5, XXL: 5 },
      });

      mockDbSetup.mockCollections.discounts.set('disc-001', {
        code: 'FULL20',
        type: 'percentage',
        value: 20,
        active: true,
        maxUses: 100,
        currentUses: 0,
      });

      const request = makeRequest({
        items: [
          { productId: 'prod-001', size: 'M', color: 'Red', quantity: 1, declaredPrice: 99.99 },
        ],
        customerEmail: 'user@example.com',
        discountCode: 'FULL20',
        idempotency_key: 'full-order-key',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          line2: 'Apt 4B',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on unexpected errors', async () => {
      vi.mocked(validateCSRF).mockRejectedValueOnce(new Error('Unexpected error'));

      const request = makeRequest({
        items: [{ productId: 'prod-001', size: 'M', quantity: 1, declaredPrice: 99.99 }],
        customerEmail: 'user@example.com',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M1A 1A1',
          country: 'CA',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Internal server error');
    });
  });
});
