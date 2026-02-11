'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCurrency, convertPrice, formatPrice, getCadPrice } from '@/lib/stores/currency-store';
import type { Product } from '@/lib/firebase';

interface CollectionProductCardProps {
  product: Product;
  showNewBadge?: boolean;
  priority?: boolean;
}

export default function CollectionProductCard({
  product,
  showNewBadge = false,
  priority = false,
}: CollectionProductCardProps) {
  const currency = useCurrency();
  const cadPrice = getCadPrice(product);
  const displayPrice = convertPrice(cadPrice, currency);
  const donation = (displayPrice * 0.10).toFixed(2);

  return (
    <div className="card-premium bg-white/5 border border-white/8 overflow-hidden group hover:border-white/20 transition-[var(--ease-premium)] duration-300">
      {/* Image Area */}
      <Link href={`/products/${product.slug}`} className="block overflow-hidden">
        <div className="aspect-[3/4] bg-neutral-900 flex items-center justify-center relative">
          {product.images && product.images.length > 0 ? (
            <div className="relative w-full h-full">
              {/* Primary image */}
              {/* Fix #5: Above-fold product images get priority loading */}
              <Image
                src={product.images[0]}
                alt={product.title}
                fill
                loading={priority ? "eager" : "lazy"}
                priority={priority}
                className={`object-cover transition-opacity duration-500 ${
                  product.images.length > 1 ? 'group-hover:opacity-0' : 'group-hover:scale-[1.03]'
                }`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {/* Secondary image (shows on hover if available) */}
              {product.images.length > 1 && (
                <Image
                  src={product.images[1]}
                  alt={`${product.title} alternate view`}
                  fill
                  loading="lazy"
                  className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 w-full h-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
              <Image
                src="/diamond-white.png"
                alt="DYMNDS"
                width={64}
                height={64}
                loading="lazy"
                className="opacity-15 relative z-10"
              />
              <p className="text-xs tracking-[0.2em] uppercase text-white/20 relative z-10">Image Coming Soon</p>
            </div>
          )}

          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-[var(--ease-premium)] duration-300" />

          {/* New Badge */}
          {showNewBadge && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-white text-black text-xs font-bebas tracking-wider uppercase rounded">
              New
            </div>
          )}
        </div>
      </Link>

      {/* Content Area */}
      <div className="p-6">
        {/* Category */}
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3">
          {product.category}
        </p>

        {/* Title */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-bebas text-xl uppercase tracking-wide mb-2 group-hover:opacity-70 transition-[var(--ease-premium)] duration-300">
            {product.title}
          </h3>
        </Link>

        {/* Subtitle */}
        <p className="text-white/50 text-sm mb-4">
          {product.subtitle}
        </p>

        {/* Impact Badge */}
        <div className="flex items-center gap-2 mb-4 text-[var(--accent)]/70 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/60" />
          <span className="tracking-wide">${donation} supports survivors</span>
        </div>

        {/* Price */}
        <p className="text-xl font-bebas mb-4">
          {formatPrice(displayPrice, currency)}
        </p>

        {/* Size availability dots */}
        {product.stock && Object.keys(product.stock).length > 0 && (
          <div className="flex gap-1.5 mb-4">
            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => {
              const inStock = (product.stock as Record<string, number>)?.[size] > 0;
              return (
                <div key={size} className="flex flex-col items-center gap-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${inStock ? 'bg-white/40' : 'bg-white/10'}`} />
                  <span className="text-[8px] text-white/20">{size}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* View Product Button */}
        <Link href={`/products/${product.slug}`}>
          <button className="btn-premium w-full py-3.5 bg-white text-black font-bebas text-sm tracking-[0.2em] uppercase hover:scale-[1.02] transition-[var(--ease-premium)] duration-300">
            View Product
          </button>
        </Link>
      </div>
    </div>
  );
}
