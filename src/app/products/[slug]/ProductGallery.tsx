'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductLightbox from '@/components/ProductLightbox';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  selectedImageIndex: number;
  isTransitioning: boolean;
  onImageChange: (index: number) => void;
}

export default function ProductGallery({
  images,
  productName,
  selectedImageIndex,
  isTransitioning,
  onImageChange,
}: ProductGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Touch/swipe for gallery
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
  };

  const nextImage = () => {
    onImageChange((selectedImageIndex + 1) % images.length);
  };

  const prevImage = () => {
    onImageChange((selectedImageIndex - 1 + images.length) % images.length);
  };

  return (
    <div className="mb-10 lg:mb-0">
      {/* Main Image */}
      <div
        className="relative aspect-[4/5] bg-neutral-900 rounded-lg overflow-hidden mb-4 cursor-zoom-in"
        role="button"
        tabIndex={0}
        aria-label={`View ${productName} full size`}
        onClick={() => images.length > 0 && setLightboxOpen(true)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && images.length > 0) {
            e.preventDefault();
            setLightboxOpen(true);
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {images.length > 0 ? (
          <Image
            src={images[selectedImageIndex]}
            alt={productName}
            fill
            className={`object-cover transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
            <div className="flex flex-col items-center gap-4 relative z-10">
              <Image src="/diamond-white.png" alt="" width={64} height={64} className="opacity-15" />
              <p className="text-xs tracking-[0.2em] uppercase text-white/20">Image Coming Soon</p>
            </div>
          </div>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-xs tracking-wider">
            {selectedImageIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => onImageChange(idx)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                selectedImageIndex === idx ? 'border-white scale-[1.02]' : 'border-transparent opacity-60 hover:opacity-100 hover:border-white/30'
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <ProductLightbox
        images={images}
        currentIndex={selectedImageIndex}
        productName={productName}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={onImageChange}
      />
    </div>
  );
}
