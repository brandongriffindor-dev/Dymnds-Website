/**
 * Centralized business constants for Dymnds.
 *
 * Use `as const` arrays as the single source of truth.
 * Derive TypeScript types AND Zod schemas from these.
 *
 * NEVER hardcode these values elsewhere in the codebase.
 */

// ─── Order Statuses ─────────────────────────────────────────────
export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// ─── Payment Statuses ───────────────────────────────────────────
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// ─── Sizes ──────────────────────────────────────────────────────
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export type Size = (typeof SIZES)[number];

/** Default stock object with all sizes set to 0 */
export const DEFAULT_STOCK: Record<Size, number> = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 };

// ─── Categories ─────────────────────────────────────────────────
export const CATEGORIES = ['Men', 'Women'] as const;
export type Category = (typeof CATEGORIES)[number];

// ─── Product Types ──────────────────────────────────────────────
export const PRODUCT_TYPES = [
  'Tops',
  'Bottoms',
  'Outerwear',
  'Leggings',
  'Shorts',
  'Hoodies',
  'T-Shirts',
  'Tank Tops',
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

// ─── Discount Types ─────────────────────────────────────────────
export const DISCOUNT_TYPES = ['percentage', 'fixed'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

// ─── Shipping Countries ─────────────────────────────────────────
export const SHIPPING_COUNTRIES = ['CA', 'US'] as const;
export type ShippingCountry = (typeof SHIPPING_COUNTRIES)[number];

// ─── Donation Rate ──────────────────────────────────────────────
export const DONATION_RATE = 0.10;
