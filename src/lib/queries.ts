import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy, QueryConstraint } from 'firebase/firestore';
import { safeParseProduct, type ValidatedProduct } from '@/lib/schemas';
import type { Category } from '@/lib/constants';

/**
 * Shared Firebase queries for products.
 * Single source of truth for common product fetching patterns.
 */

export async function getProductBySlug(slug: string): Promise<ValidatedProduct | null> {
  const q = query(
    collection(db, 'products'),
    where('slug', '==', slug),
    where('is_active', '==', true),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const product = safeParseProduct({ id: snap.docs[0].id, ...snap.docs[0].data() });
  // Filter out soft-deleted products
  if (product?.is_deleted) return null;
  return product;
}

export async function getProductsByCategory(category: Category): Promise<ValidatedProduct[]> {
  const q = query(
    collection(db, 'products'),
    where('category', '==', category),
    where('is_active', '==', true),
    orderBy('displayOrder', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => safeParseProduct({ id: doc.id, ...doc.data() })).filter((p): p is ValidatedProduct => p !== null);
}

export async function getFeaturedProducts(category?: Category): Promise<ValidatedProduct[]> {
  const constraints: QueryConstraint[] = [
    where('featured', '==', true),
    where('is_active', '==', true),
  ];
  if (category) constraints.push(where('category', '==', category));
  constraints.push(orderBy('displayOrder', 'asc'));

  const q = query(collection(db, 'products'), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(doc => safeParseProduct({ id: doc.id, ...doc.data() })).filter((p): p is ValidatedProduct => p !== null);
}

export async function getMatchingProduct(matchingSetSlug: string): Promise<ValidatedProduct | null> {
  return getProductBySlug(matchingSetSlug);
}
