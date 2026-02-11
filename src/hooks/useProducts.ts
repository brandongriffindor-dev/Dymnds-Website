'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, QueryConstraint } from 'firebase/firestore';
import type { Product } from '@/lib/firebase';

export interface UseProductsOptions {
  category?: 'Men' | 'Women';
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
}

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
}

/**
 * Shared hook for fetching products from Firestore.
 * Replaces the copy-pasted query logic across 6+ collection pages.
 *
 * Handles:
 * - Composite queries with filters
 * - Fallback when indexes aren't built
 * - Client-side sorting as backup
 * - Loading and error states
 */
export function useProducts(options: UseProductsOptions = {}): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Serialize options to a stable string so useEffect doesn't re-run unnecessarily
  const optionsKey = JSON.stringify(options);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      const opts: UseProductsOptions = JSON.parse(optionsKey);

      try {
        // Build query constraints
        const constraints: QueryConstraint[] = [];

        if (opts.category) {
          constraints.push(where('category', '==', opts.category));
        }
        if (opts.featured) {
          constraints.push(where('featured', '==', true));
        }
        if (opts.newArrival) {
          constraints.push(where('newArrival', '==', true));
        }
        if (opts.bestSeller) {
          constraints.push(where('bestSeller', '==', true));
        }

        constraints.push(orderBy('displayOrder', 'asc'));

        const q = query(collection(db, 'products'), ...constraints);
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Product));

        setProducts(data);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Primary query failed:', err instanceof Error ? err.message : err);
        }

        // Fallback: simpler query without orderBy (index might not exist)
        try {
          const fallbackConstraints: QueryConstraint[] = [];

          if (opts.category) {
            fallbackConstraints.push(where('category', '==', opts.category));
          }
          if (opts.featured) {
            fallbackConstraints.push(where('featured', '==', true));
          }
          if (opts.newArrival) {
            fallbackConstraints.push(where('newArrival', '==', true));
          }
          if (opts.bestSeller) {
            fallbackConstraints.push(where('bestSeller', '==', true));
          }

          const fallbackQ = fallbackConstraints.length > 0
            ? query(collection(db, 'products'), ...fallbackConstraints)
            : query(collection(db, 'products'));

          const snap = await getDocs(fallbackQ);
          const data = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as Product));

          // Sort client-side
          data.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
          setProducts(data);
        } catch (fallbackErr) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Fallback query failed:', fallbackErr instanceof Error ? fallbackErr.message : fallbackErr);
          }
          setError('Unable to load products. Please try again.');
          setProducts([]);
        }
      }

      setLoading(false);
    };

    fetchProducts();
  }, [optionsKey]);

  return { products, loading, error };
}
