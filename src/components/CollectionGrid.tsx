'use client';

import Image from 'next/image';
import StaggerReveal from '@/components/StaggerReveal';
import CollectionProductCard from '@/components/CollectionProductCard';
import type { Product } from '@/lib/firebase';

/**
 * Shared client wrapper for collection product grids.
 * Receives server-fetched products as props.
 * Handles animations and interactive product cards.
 */
interface CollectionGridProps {
  products: Product[];
  showNewBadge?: boolean;
  emptyMessage?: string;
  emptySubtext?: string;
}

export default function CollectionGrid({
  products,
  showNewBadge = false,
  emptyMessage = 'No products in this collection yet',
  emptySubtext = 'Check back soon for new drops.',
}: CollectionGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-32">
        <Image
          src="/diamond-white.png"
          alt=""
          width={40}
          height={40}
          className="opacity-10 mx-auto mb-6"
        />
        <div className="section-divider max-w-xs mx-auto mb-8" />
        <p className="font-bebas tracking-wider text-white/40 text-2xl mb-3">{emptyMessage}</p>
        <p className="text-white/30 text-sm">{emptySubtext}</p>
      </div>
    );
  }

  return (
    <StaggerReveal staggerDelay={50} animation="fade-up" duration={500} threshold={0.1} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((product, index) => (
        <CollectionProductCard
          key={product.id}
          product={product}
          showNewBadge={showNewBadge && index < 3}
          priority={index < 3}
        />
      ))}
    </StaggerReveal>
  );
}
