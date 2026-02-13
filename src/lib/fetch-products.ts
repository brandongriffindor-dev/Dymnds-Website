import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit, QueryConstraint } from 'firebase/firestore';
import { safeParseProduct, safeParseReview, type ValidatedProduct, type ValidatedReview } from '@/lib/schemas';
import type { Category } from '@/lib/constants';

// Re-export Review type for backward compatibility
export type { Review } from '@/lib/types';

/**
 * Server-side product fetching for SSR pages.
 * Mirrors the useProducts hook logic but runs at request time on the server.
 * Used by server components to fetch products before render.
 *
 * The Firebase client SDK works in Node.js — no Admin SDK needed.
 */

export interface FetchProductsOptions {
  category?: Category;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  maxResults?: number;
}

export async function fetchProducts(options: FetchProductsOptions = {}): Promise<ValidatedProduct[]> {
  const { category, featured, newArrival, bestSeller, maxResults = 50 } = options;

  try {
    const constraints: QueryConstraint[] = [];

    // SEC-006: Only return active products
    constraints.push(where('is_active', '==', true));

    if (category) constraints.push(where('category', '==', category));
    if (featured) constraints.push(where('featured', '==', true));
    if (newArrival) constraints.push(where('newArrival', '==', true));
    if (bestSeller) constraints.push(where('bestSeller', '==', true));

    constraints.push(orderBy('displayOrder', 'asc'));
    constraints.push(limit(maxResults));

    const q = query(collection(db, 'products'), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map(doc => safeParseProduct({ id: doc.id, ...doc.data() }))
      .filter((p): p is ValidatedProduct => p !== null && !p.is_deleted);
  } catch {
    // Fallback: if composite index isn't built, fetch without orderBy
    try {
      const fallbackConstraints: QueryConstraint[] = [
        // Always filter is_active server-side, even in fallback
        where('is_active', '==', true),
      ];

      if (category) fallbackConstraints.push(where('category', '==', category));
      if (featured) fallbackConstraints.push(where('featured', '==', true));
      if (newArrival) fallbackConstraints.push(where('newArrival', '==', true));
      if (bestSeller) fallbackConstraints.push(where('bestSeller', '==', true));

      const fallbackQ = query(collection(db, 'products'), ...fallbackConstraints);

      const snap = await getDocs(fallbackQ);
      let data = snap.docs
        .map(doc => safeParseProduct({ id: doc.id, ...doc.data() }))
        .filter((p): p is ValidatedProduct => p !== null);

      // SEC-006: Filter out deleted/inactive products in fallback
      data = data.filter(p => p.is_active !== false && !p.is_deleted);

      data.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
      return data.slice(0, maxResults);
    } catch (fallbackErr) {
      console.error('[DYMNDS] Product fetch failed:', fallbackErr);
      return [];
    }
  }
}

/**
 * Fetch featured products for a specific category.
 * Used by the homepage to load men's and women's featured sections.
 */
export async function fetchFeaturedProducts(category: Category, max = 3): Promise<ValidatedProduct[]> {
  return fetchProducts({ category, featured: true, maxResults: max });
}

/**
 * Fetch reviews for a product server-side.
 * Fix #3/#4: Moves Firestore review fetch from client to server,
 * eliminating Firebase client SDK from the product page bundle.
 */
export async function fetchReviews(productSlug: string, max = 10): Promise<ValidatedReview[]> {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('productSlug', '==', productSlug),
      orderBy('createdAt', 'desc'),
      limit(max)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => safeParseReview({ id: d.id, ...d.data() }))
      .filter((r): r is ValidatedReview => r !== null);
  } catch (err) {
    console.error('[DYMNDS] Review fetch failed:', err);
    return [];
  }
}
