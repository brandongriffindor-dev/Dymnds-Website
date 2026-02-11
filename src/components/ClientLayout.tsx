'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import { useIsCartOpen, useCartStore } from '@/lib/stores/cart-store';
import { useCurrencyStore } from '@/lib/stores/currency-store';
import CartDrawer from '@/components/CartDrawer';

// Fix #6: Dynamic import — no JS shipped to mobile where cursor effect is unused
const CursorEffect = dynamic(() => import('@/components/CursorEffect'), {
  ssr: false,
});

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const isCartOpen = useIsCartOpen();
  const closeCart = useCartStore(s => s.closeCart);
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  // Initialize currency detection on mount
  const initCurrency = useCurrencyStore(s => s.init);
  useEffect(() => {
    initCurrency();
  }, [initCurrency]);

  // Lenis smooth scrolling — makes the entire site feel premium
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Pause smooth scroll when cart drawer is open
  useEffect(() => {
    if (lenisRef.current) {
      if (isCartOpen) {
        lenisRef.current.stop();
      } else {
        lenisRef.current.start();
      }
    }
  }, [isCartOpen]);

  return (
    <>
      <CursorEffect />
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
}
