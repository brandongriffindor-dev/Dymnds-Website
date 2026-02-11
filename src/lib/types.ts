/**
 * Standalone type definitions for Dymnds entities.
 * Imported and re-exported from firebase.ts for backward compatibility.
 *
 * Types use centralized constants from constants.ts for literal unions.
 */

import type { OrderStatus, Size, Category, ProductType } from './constants';

// ─── Stock ──────────────────────────────────────────────────────

export type StockRecord = Record<Size, number>;

export type SizeGuideRecord = Record<Size, string>;

// ─── Product Color ──────────────────────────────────────────────

export interface ProductColor {
  name: string;
  hex: string;
  images: string[];
  stock: StockRecord;
}

// ─── Product ────────────────────────────────────────────────────

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  price: number; // Keep for backward compatibility, stores CAD
  price_cad?: number; // Explicit CAD price
  stock: StockRecord;
  images: string[];
  colors?: ProductColor[];
  category: Category | string; // Category literal preferred, string for backward compat
  productType?: ProductType | string;
  description?: string;
  features?: string[];
  modelSize?: string;
  modelHeight?: string;
  deliveryInfo?: string;
  returnsInfo?: string;
  matchingSetSlug?: string;
  sizeGuide?: {
    chest?: SizeGuideRecord;
    waist?: SizeGuideRecord;
  };
  displayOrder: number;
  featured: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  is_active: boolean;
  is_deleted?: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

// ─── Order Item ─────────────────────────────────────────────────

export interface OrderItem {
  product_id?: string;
  productId?: string; // API route uses this field name
  product_name?: string;
  title?: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
  image?: string;
}

// ─── Shipping Address ───────────────────────────────────────────

export interface ShippingAddress {
  name?: string;
  street?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  province?: string;
  zip?: string;
  postal_code?: string;
  postalCode?: string;
  country?: string;
}

// ─── Order ──────────────────────────────────────────────────────

export interface Order {
  id: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  total_amount: number;
  subtotal?: number;
  discount?: number;
  donation?: number;
  shipping_cost?: number;
  status: OrderStatus;
  payment_status?: string;
  items: OrderItem[];
  shipping_address: ShippingAddress;
  idempotency_key?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

// ─── Review ─────────────────────────────────────────────────────

export interface Review {
  id: string;
  productSlug?: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  verified: boolean;
  createdAt: { seconds: number };
}

// ─── Waitlist ───────────────────────────────────────────────────

export interface WaitlistEntry {
  email: string;
  signed_up_at: string;
}

// ─── Dashboard ──────────────────────────────────────────────────

export interface DashboardStats {
  totalImpact: number;
  waitlistCount: number;
  totalRevenue: number;
  totalOrders: number;
}
