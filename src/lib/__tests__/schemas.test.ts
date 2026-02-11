import { describe, it, expect, vi } from 'vitest';
import {
  ProductReadSchema,
  OrderReadSchema,
  DiscountReadSchema,
  safeParseProduct,
  safeParseOrder,
  safeParseProducts,
  safeParseOrders,
} from '../schemas';

// ─── ProductReadSchema ─────────────────────────────────────────

describe('ProductReadSchema', () => {
  const validProduct = {
    id: 'prod_001',
    title: 'DYMNDS Classic Tee',
    slug: 'dymnds-classic-tee',
    price: 59.99,
    category: 'men',
    stock: { XS: 5, S: 10, M: 15, L: 10, XL: 5, XXL: 3 },
    images: ['https://firebasestorage.googleapis.com/img1.avif'],
  };

  it('accepts valid product data', () => {
    const result = ProductReadSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('provides default values for missing optional fields', () => {
    const result = ProductReadSchema.safeParse({ id: 'prod_min' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Unknown Product');
      expect(result.data.slug).toBe('');
      expect(result.data.price).toBe(0);
      expect(result.data.category).toBe('uncategorized');
      expect(result.data.featured).toBe(false);
      expect(result.data.displayOrder).toBe(999);
      expect(result.data.is_active).toBe(true);
    }
  });

  it('provides default stock values', () => {
    const result = ProductReadSchema.safeParse({ id: 'prod_002' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stock).toEqual({ XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
    }
  });

  it('allows passthrough of extra fields', () => {
    const result = ProductReadSchema.safeParse({
      ...validProduct,
      customField: 'should survive',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customField).toBe('should survive');
    }
  });

  it('rejects product without id', () => {
    const result = ProductReadSchema.safeParse({ title: 'No ID Product' });
    expect(result.success).toBe(false);
  });
});

// ─── OrderReadSchema ───────────────────────────────────────────

describe('OrderReadSchema', () => {
  const validOrder = {
    id: 'order_001',
    customer_email: 'customer@example.com',
    customer_name: 'John Doe',
    total_amount: 149.99,
    status: 'pending',
    items: [
      { product_name: 'Classic Tee', size: 'M', quantity: 2, price: 59.99 },
    ],
  };

  it('accepts valid order data', () => {
    const result = OrderReadSchema.safeParse(validOrder);
    expect(result.success).toBe(true);
  });

  it('defaults status to pending', () => {
    const result = OrderReadSchema.safeParse({ id: 'order_002' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('pending');
    }
  });

  it('defaults customer_name to Unknown', () => {
    const result = OrderReadSchema.safeParse({ id: 'order_003' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customer_name).toBe('Unknown');
    }
  });

  it('accepts all valid status values', () => {
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    for (const status of statuses) {
      const result = OrderReadSchema.safeParse({ id: 'order_004', status });
      expect(result.success).toBe(true);
    }
  });

  it('defaults items to empty array', () => {
    const result = OrderReadSchema.safeParse({ id: 'order_005' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toEqual([]);
    }
  });
});

// ─── DiscountReadSchema ────────────────────────────────────────

describe('DiscountReadSchema', () => {
  it('accepts valid discount', () => {
    const result = DiscountReadSchema.safeParse({
      id: 'disc_001',
      code: 'SAVE20',
      type: 'percentage',
      value: 20,
    });
    expect(result.success).toBe(true);
  });

  it('defaults type to percentage', () => {
    const result = DiscountReadSchema.safeParse({ id: 'disc_002' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('percentage');
    }
  });

  it('defaults isActive to true', () => {
    const result = DiscountReadSchema.safeParse({ id: 'disc_003' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
    }
  });
});

// ─── safeParseProduct ──────────────────────────────────────────

describe('safeParseProduct', () => {
  it('returns validated product for valid input', () => {
    const result = safeParseProduct({ id: 'prod_sp1', title: 'Test', price: 50 });
    expect(result).not.toBeNull();
    expect(result?.title).toBe('Test');
  });

  it('returns null for completely invalid data', () => {
    // Suppress console.warn in test
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = safeParseProduct({} as { id: string } & Record<string, unknown>);
    expect(result).toBeNull();
    vi.restoreAllMocks();
  });
});

// ─── safeParseProducts ─────────────────────────────────────────

describe('safeParseProducts', () => {
  it('filters out invalid products', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const docs = [
      { id: 'good_1', title: 'Good Product', price: 50 },
      {} as { id: string } & Record<string, unknown>, // invalid - no id
      { id: 'good_2', title: 'Another Good', price: 75 },
    ];
    const results = safeParseProducts(docs);
    expect(results.length).toBe(2);
    vi.restoreAllMocks();
  });
});

// ─── safeParseOrder / safeParseOrders ──────────────────────────

describe('safeParseOrder', () => {
  it('returns validated order for valid input', () => {
    const result = safeParseOrder({
      id: 'order_sp1',
      customer_email: 'test@test.com',
      total_amount: 100,
    });
    expect(result).not.toBeNull();
    expect(result?.total_amount).toBe(100);
  });

  it('returns null for missing id', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = safeParseOrder({} as { id: string } & Record<string, unknown>);
    expect(result).toBeNull();
    vi.restoreAllMocks();
  });
});

describe('safeParseOrders', () => {
  it('filters out invalid orders from array', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const docs = [
      { id: 'o1', customer_email: 'a@b.com', total_amount: 50 },
      {} as { id: string } & Record<string, unknown>,
    ];
    const results = safeParseOrders(docs);
    expect(results.length).toBe(1);
    vi.restoreAllMocks();
  });
});
