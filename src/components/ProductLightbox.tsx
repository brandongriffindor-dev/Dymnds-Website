'use client';

import { useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ProductLightboxProps {
  images: string[];
  currentIndex: number;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function ProductLightbox({
  images,
  currentIndex,
  productName,
  isOpen,
  onClose,
  onNavigate,
}: ProductLightboxProps) {
  const lightboxRef = useRef<HTMLDivElement>(null);

  const goNext = useCallback(() => {
    onNavigate((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  const goPrev = useCallback(() => {
    onNavigate((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  // Keyboard navigation + body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          goNext();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, goNext, goPrev]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !lightboxRef.current) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !lightboxRef.current) return;
      const focusable = lightboxRef.current.querySelectorAll<HTMLElement>(
        'button, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleTab);

    // Focus the close button on open
    const timer = setTimeout(() => {
      lightboxRef.current?.querySelector<HTMLElement>('button')?.focus();
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleTab);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} image ${currentIndex + 1} of ${images.length}`}
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-11 h-11 flex items-center justify-center text-white/60 hover:text-white transition-colors duration-200 z-10"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-7 left-1/2 -translate-x-1/2 text-xs text-white/40 tracking-[0.2em] z-10">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Main image */}
          <motion.div
            key={currentIndex}
            className="relative w-full h-full max-w-5xl max-h-[85vh] mx-auto px-16"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[currentIndex]}
              alt={`${productName} - Image ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </motion.div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/[0.06] hover:bg-white/[0.12] rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 text-white/70" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/[0.06] hover:bg-white/[0.12] rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 text-white/70" />
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
