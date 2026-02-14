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
    <div className="card-interactive bg-[var(--surface-1)] overflow-hidden group">
      {/* Image Area */}
      <Link href={`/products/${product.slug}`} className="block overflow-hidden">
        <div className="aspect-[3/4] bg-neutral-900 flex items-center justify-center relative">
          {product.images && product.images.length > 0 ? (
            <div className="relative w-full h-full">
              {/* Primary image */}
              <Image
                src={product.images[0]}
                alt={product.title}
                fill
                loading={priority ? "eager" : "lazy"}
                priority={priority}
                className={`object-cover transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  product.images.length > 1 ? 'group-hover:opacity-0' : 'group-hover:scale-[1.04]'
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
                  className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]"
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

          {/* Gradient overlay — always subtle, stronger on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Quick view hint */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/90 bg-black/50 backdrop-blur-md px-4 py-2 border border-white/10">
              Quick View
            </span>
          </div>

          {/* Accent line at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left" />

          {/* New Badge */}
          {showNewBadge && (
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-[var(--accent)] text-black text-[10px] font-bebas tracking-wider uppercase">
              New
            </div>
          )}
        </div>
      </Link>

      {/* Content Area */}
      <div className="p-6">
        {/* Category */}
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-3">
          {product.category}
        </p>

        {/* Title */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-bebas text-xl uppercase tracking-wide mb-2 group-hover:text-[var(--accent)] transition-colors duration-400">
            {product.title}
          </h3>
        </Link>

        {/* Subtitle */}
        <p className="text-white/40 text-sm mb-4 leading-relaxed">
          {product.subtitle}
        </p>

        {/* Impact Badge */}
        <div className="flex items-center gap-2 mb-5 text-[var(--accent)]/60 text-xs">
          <div className="glow-dot" style={{ width: '5px', height: '5px' }} />
          <span className="tracking-wide">${donation} supports survivors</span>
        </div>

        {/* Price + Size Row */}
        <div className="flex items-end justify-between mb-5">
          <p className="text-xl font-bebas text-white">
            {formatPrice(displayPrice, currency)}
          </p>

          {/* Size availability dots */}
          {product.stock && Object.keys(product.stock).length > 0 && (
            <div className="flex gap-1">
              {['XS', 'S', 'M', 'L', 'XL'].map(size => {
                const inStock = (product.stock as Record<string, number>)?.[size] > 0;
                return (
                  <div key={size} className="flex flex-col items-center gap-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${inStock ? 'bg-white/40' : 'bg-white/8'}`} />
                    <span className={`text-[7px] transition-colors duration-300 ${inStock ? 'text-white/30' : 'text-white/10'}`}>{size}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* View Product Button */}
        <Link href={`/products/${product.slug}`}>
          <button className="w-full py-3.5 bg-white text-black font-bebas text-sm tracking-[0.2em] uppercase transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[var(--accent)] hover:shadow-[0_0_24px_-4px_rgba(200,169,126,0.25)]">
            View Product
          </button>
        </Link>
      </div>
    </div>
  );
}
