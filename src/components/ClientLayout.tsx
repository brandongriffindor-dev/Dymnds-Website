'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
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

  // First-visit branded loading sequence
  // Compute initial state synchronously to avoid setState-in-effect
  const [isFirstVisit] = useState(() => {
    if (typeof window === 'undefined') return false;
    const hasVisited = sessionStorage.getItem('dymnds-visited');
    if (!hasVisited) {
      sessionStorage.setItem('dymnds-visited', '1');
      return true;
    }
    return false;
  });
  const [loadingComplete, setLoadingComplete] = useState(!isFirstVisit);

  useEffect(() => {
    if (!isFirstVisit) return;
    const timer = setTimeout(() => {
      setLoadingComplete(true);
    }, 2200);
    return () => clearTimeout(timer);
  }, [isFirstVisit]);

  // Scroll progress indicator
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 50, restDelta: 0.001 });

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
      {/* First-visit branded loading sequence */}
      <AnimatePresence>
        {isFirstVisit && !loadingComplete && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Grain overlay on loader */}
            <div className="grain-overlay" aria-hidden="true" />

            <div className="text-center relative z-10">
              {/* Diamond icon assembles */}
              <motion.div
                initial={{ scale: 0, rotate: -45, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 0.15 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-12 h-12 border border-[var(--accent)]/30 mx-auto mb-8"
                style={{ transform: 'rotate(45deg)' }}
              />

              {/* Brand name cascades in */}
              <div className="overflow-hidden">
                <motion.div
                  className="font-bebas tracking-[0.3em] text-white/80"
                  style={{ fontSize: 'clamp(2rem, 6vw, 4rem)' }}
                  initial={{ y: '120%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  DYMNDS
                </motion.div>
              </div>

              {/* Accent line wipes in */}
              <motion.div
                className="w-16 h-[1px] bg-[var(--accent)]/40 mx-auto mt-6"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* Tagline fades */}
              <motion.p
                className="text-[9px] tracking-[0.5em] uppercase text-white/20 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.3 }}
              >
                Pressure Creates Diamonds
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-[var(--accent)] origin-left z-[60]"
        style={{ scaleX }}
      />
      <CursorEffect />
      <AnimatePresence mode="popLayout">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
}
