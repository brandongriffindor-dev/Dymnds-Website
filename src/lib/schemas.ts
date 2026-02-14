import { z } from 'zod';
import { ORDER_STATUSES, DISCOUNT_TYPES } from './constants';

/**
 * Read-time Zod schemas for Firestore documents.
 * Use safeParse on reads to prevent corrupted documents from crashing the app.
 * All fields have fallback defaults so a malformed doc still produces a usable object.
 *
 * These schemas are the single source of truth for Firestore document shapes.
 * The interfaces in types.ts should stay aligned with these.
 *
 * CANONICAL SOURCE FOR SERVER-SIDE VALIDATION
 * This file is the primary source for Firestore document validation (Products, Orders, Reviews, Discounts).
 * Related files:
 * - src/lib/validators.ts: Form-specific Zod schemas (ContactForm, WaitlistForm, etc.)
 * - src/lib/validation.ts: Lightweight client-side validators (email, message, required fields)
 *
 * TODO: CONSOLIDATION - Consider separating:
 * 1. Firestore schemas (ProductReadSchema, OrderReadSchema, etc.) - keep here
 * 2. Form schemas (ContactForm, WaitlistForm) - move to validators.ts or new form-schemas.ts
 * 3. Client-side validators (validateEmail, validateMessage) - keep in validation.ts with Zod integration
 */

// ─── Size Guide Entry Schema ────────────────────────────────────

const SizeGuideEntrySchema = z.object({
  XS: z.string().default(''),
  S: z.string().default(''),
  M: z.string().default(''),
  L: z.string().default(''),
  XL: z.string().default(''),
});

// ─── Stock Schema (shared) ──────────────────────────────────────

const StockSchema = z.object({
  XS: z.number().default(0),
  S: z.number().default(0),
  M: z.number().default(0),
  L: z.number().default(0),
  XL: z.number().default(0),
}).default({ XS: 0, S: 0, M: 0, L: 0, XL: 0 });

// ─── Product Color Schema ───────────────────────────────────────

const ProductColorSchema = z.object({
  name: z.string().default(''),
  hex: z.string().default('#000000'),
  images: z.array(z.string()).default([]),
  stock: StockSchema,
}).passthrough();

// ─── Product Read Schema ────────────────────────────────────────

export const ProductReadSchema = z.object({
  id: z.string(),
  title: z.string().default('Unknown Product'),
  slug: z.string().default(''),
  subtitle: z.string().default(''),
  price: z.number().default(0),
  price_cad: z.number().optional(),
  stock: StockSchema,
  images: z.array(z.string()).default([]),
  colors: z.array(ProductColorSchema).optional(),
  category: z.string().default('uncategorized'),
  productType: z.string().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  modelSize: z.string().optional(),
  modelHeight: z.string().optional(),
  deliveryInfo: z.string().optional(),
  returnsInfo: z.string().optional(),
  matchingSetSlug: z.string().optional(),
  sizeGuide: z.object({
    chest: SizeGuideEntrySchema.optional(),
    waist: SizeGuideEntrySchema.optional(),
  }).optional(),
  displayOrder: z.number().default(999),
  featured: z.boolean().default(false),
  newArrival: z.boolean().optional(),
  bestSeller: z.boolean().optional(),
  is_active: z.boolean().default(true),
  is_deleted: z.boolean().optional(),
  deleted_at: z.string().optional(),
  created_at: z.string().default(''),
  updated_at: z.string().default(''),
}).passthrough();

export type ValidatedProduct = z.infer<typeof ProductReadSchema>;

// ─── Order Item Schema ──────────────────────────────────────────

const OrderItemSchema = z.object({
  product_id: z.string().optional(),
  productId: z.string().optional(),
  product_name: z.string().optional(),
  title: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  quantity: z.number().default(1),
  price: z.number().default(0),
  image: z.string().optional(),
}).passthrough();

// ─── Shipping Address Schema ────────────────────────────────────

const ShippingAddressSchema = z.object({
  name: z.string().optional(),
  street: z.string().optional(),
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  province: z.string().optional(),
  zip: z.string().optional(),
  postal_code: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
}).passthrough().default({});

// ─── Order Read Schema ──────────────────────────────────────────

export const OrderReadSchema = z.object({
  id: z.string(),
  customer_email: z.string().default(''),
  customer_name: z.string().default('Unknown'),
  customer_phone: z.string().optional(),
  total_amount: z.number().default(0),
  subtotal: z.number().optional(),
  discount: z.number().optional(),
  donation: z.number().optional(),
  shipping_cost: z.number().optional(),
  status: z.enum(ORDER_STATUSES).default('pending'),
  payment_status: z.string().optional(),
  items: z.array(OrderItemSchema).default([]),
  shipping_address: ShippingAddressSchema,
  idempotency_key: z.string().optional(),
  is_deleted: z.boolean().optional(),
  deleted_at: z.string().optional(),
  created_at: z.string().default(''),
  updated_at: z.string().default(''),
}).passthrough();

export type ValidatedOrder = z.infer<typeof OrderReadSchema>;

// ─── Discount Read Schema ───────────────────────────────────────

export const DiscountReadSchema = z.object({
  id: z.string(),
  code: z.string().default(''),
  type: z.enum(DISCOUNT_TYPES).default('percentage'),
  value: z.number().default(0),
  isActive: z.boolean().default(true),
  maxUses: z.number().optional(),
  currentUses: z.number().optional(),
  minOrder: z.number().optional(),
  expiresAt: z.string().optional(),
  created_at: z.string().default(''),
  updated_at: z.string().optional(),
}).passthrough();

export type ValidatedDiscount = z.infer<typeof DiscountReadSchema>;

// ─── Review Read Schema ─────────────────────────────────────────

export const ReviewReadSchema = z.object({
  id: z.string(),
  productSlug: z.string().optional(),
  rating: z.number().default(0),
  title: z.string().default(''),
  body: z.string().default(''),
  authorName: z.string().default('Anonymous'),
  verified: z.boolean().default(false),
  createdAt: z.object({ seconds: z.number() }).default({ seconds: 0 }),
}).passthrough();

export type ValidatedReview = z.infer<typeof ReviewReadSchema>;

// ─── Safe Parse Helpers ─────────────────────────────────────────

/**
 * Safely parse a Firestore document as a Product.
 * Returns the validated product or null if completely unparseable.
 */
export function safeParseProduct(doc: { id: string } & Record<string, unknown>): ValidatedProduct | null {
  const result = ProductReadSchema.safeParse(doc);
  if (result.success) return result.data;
  console.warn(`[DYMNDS] Malformed product doc ${doc.id}:`, result.error.issues);
  return null;
}

/**
 * Safely parse a Firestore document as an Order.
 * Returns the validated order or null if completely unparseable.
 */
export function safeParseOrder(doc: { id: string } & Record<string, unknown>): ValidatedOrder | null {
  const result = OrderReadSchema.safeParse(doc);
  if (result.success) return result.data;
  console.warn(`[DYMNDS] Malformed order doc ${doc.id}:`, result.error.issues);
  return null;
}

/**
 * Safely parse a Firestore document as a Review.
 * Returns the validated review or null if completely unparseable.
 */
export function safeParseReview(doc: { id: string } & Record<string, unknown>): ValidatedReview | null {
  const result = ReviewReadSchema.safeParse(doc);
  if (result.success) return result.data;
  console.warn(`[DYMNDS] Malformed review doc ${doc.id}:`, result.error.issues);
  return null;
}

/**
 * Parse an array of Firestore docs, filtering out any that fail validation.
 */
export function safeParseProducts(docs: ({ id: string } & Record<string, unknown>)[]): ValidatedProduct[] {
  return docs.map(safeParseProduct).filter((p): p is ValidatedProduct => p !== null);
}

export function safeParseOrders(docs: ({ id: string } & Record<string, unknown>)[]): ValidatedOrder[] {
  return docs.map(safeParseOrder).filter((o): o is ValidatedOrder => o !== null);
}

export function safeParseReviews(docs: ({ id: string } & Record<string, unknown>)[]): ValidatedReview[] {
  return docs.map(safeParseReview).filter((r): r is ValidatedReview => r !== null);
}
