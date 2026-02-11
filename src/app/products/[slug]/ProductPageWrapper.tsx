'use client';

import Link from 'next/link';
import ProductClient from './ProductClient';
import type { Product } from '@/lib/firebase';
import type { Review } from '@/lib/fetch-products';

/**
 * Fix #3: Firebase client SDK removed from this component.
 * No more client-side Firestore fallback — server provides all data.
 * This eliminates ~150KB of Firebase JS from the client bundle.
 */
interface ProductPageWrapperProps {
  initialProduct?: Record<string, unknown> | null;
  initialReviews?: Review[];
  initialMatchingProduct?: Product | null;
}

export default function ProductPageWrapper({
  initialProduct,
  initialReviews = [],
  initialMatchingProduct = null,
}: ProductPageWrapperProps) {
  if (!initialProduct) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-[10px] tracking-[0.4em] uppercase text-white/30 mb-4">404</p>
          <h1 className="text-4xl md:text-5xl font-bebas tracking-wider mb-4">Product Not Found</h1>
          <p className="text-white/40 text-sm mb-8">This item doesn&apos;t exist in our collection or may have been removed.</p>
          <Link href="/shop" className="btn-premium px-10 py-4 bg-white text-black text-xs tracking-[0.2em] uppercase hover:bg-white/90 transition-all inline-block">
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <ProductClient
      product={initialProduct as unknown as Product}
      initialReviews={initialReviews}
      initialMatchingProduct={initialMatchingProduct}
    />
  );
}
