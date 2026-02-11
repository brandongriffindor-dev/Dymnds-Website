'use client';

import Image from 'next/image';
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from 'next/navigation';
import { useTotalItems } from '@/lib/stores/cart-store';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { name: 'Men', href: '/collections/men' },
  { name: 'Women', href: '/collections/women' },
  { name: 'Shop', href: '/shop' },
  { name: 'Impact', href: '/impact' },
  { name: 'App', href: '/app' },
];

export default function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalItems = useTotalItems();
  const prevItemsRef = useRef(totalItems);
  const [badgePulse, setBadgePulse] = useState(false);
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);

  // Hide navbar on scroll down, show on scroll up
  useMotionValueEvent(scrollY, 'change', (latest) => {
    const direction = latest > lastScrollY.current ? 'down' : 'up';
    if (direction === 'down' && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScrolled(latest > 50);
    lastScrollY.current = latest;
  });

  // Pulse the cart badge when items increase
  useEffect(() => {
    if (totalItems > prevItemsRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBadgePulse(true);
      const timer = setTimeout(() => setBadgePulse(false), 300);
      return () => clearTimeout(timer);
    }
    prevItemsRef.current = totalItems;
  }, [totalItems]);

  // Body scroll lock when mobile menu opens
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileMenuOpen]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Check if link is active
  const isActive = (href: string) => {
    if (href === '/shop') return pathname === '/shop';
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Hide navbar on admin routes — admin has its own layout
  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
          scrolled ? 'bg-black/90 backdrop-blur-2xl' : 'bg-transparent'
        } border-b ${scrolled ? 'border-white/[0.04]' : 'border-transparent'}`}
        animate={{ y: hidden && !mobileMenuOpen ? '-100%' : '0%' }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/diamond-white.png"
              alt=""
              width={24}
              height={24}
              priority
              className="h-6 w-auto transition-transform duration-300 group-hover:rotate-12"
            />
            <Image
              src="/dymnds-only-white.png"
              alt="DYMNDS"
              width={100}
              height={20}
              priority
              className="h-4 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10 text-[11px] tracking-[0.25em] uppercase">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-1 transition-all duration-300 ${
                  isActive(link.href) ? 'text-white/50' : 'text-white/70 hover:text-white'
                }`}
              >
                {link.name}
                {isActive(link.href) && (
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-px bg-white/30"
                    layoutId="nav-underline"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
            <Link
              href="/cart"
              className={`relative px-6 py-2.5 bg-white text-black text-[11px] tracking-[0.2em] uppercase transition-all duration-300 hover:bg-white/90 flex items-center gap-2 ${
                isActive('/cart') ? 'opacity-60' : ''
              }`}
            >
              Cart
              {totalItems > 0 && (
                <span
                  className={`bg-black text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-semibold ${
                    badgePulse ? 'animate-cart-pulse' : ''
                  }`}
                  aria-live="polite"
                  aria-label={`${totalItems} items in cart`}
                >
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button — animated hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <motion.span
              className="w-6 h-[1.5px] bg-white block origin-center"
              animate={mobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.span
              className="w-6 h-[1.5px] bg-white block"
              animate={mobileMenuOpen ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="w-6 h-[1.5px] bg-white block origin-center"
              animate={mobileMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </button>
        </nav>
      </motion.header>

      {/* Mobile Menu — Full Screen Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center safe-area-padding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-6 right-6 w-11 h-11 flex items-center justify-center hover:opacity-60 transition-opacity duration-300"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Menu links with staggered entrance */}
            <div className="flex flex-col items-center gap-2">
              {NAV_LINKS.map((link, idx) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{
                    duration: 0.5,
                    delay: idx * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`font-bebas text-5xl tracking-wider uppercase py-3 px-6 transition-all duration-300 flex items-center gap-3 ${
                      isActive(link.href) ? 'text-white/40' : 'text-white hover:text-white/60'
                    }`}
                  >
                    {isActive(link.href) && (
                      <Image
                        src="/diamond-white.png"
                        alt=""
                        width={12}
                        height={12}
                        className="h-3 w-auto inline-block mr-1"
                      />
                    )}
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              {/* Cart link */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, delay: NAV_LINKS.length * 0.06 }}
                className="mt-8 pt-8 border-t border-white/10"
              >
                <Link
                  href="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-bebas text-5xl tracking-wider uppercase py-3 px-6 flex items-center gap-3 ${
                    isActive('/cart') ? 'text-white/40' : 'text-white hover:text-white/60'
                  }`}
                >
                  {isActive('/cart') && (
                    <Image
                      src="/diamond-white.png"
                      alt=""
                      width={12}
                      height={12}
                      className="h-3 w-auto inline-block mr-1"
                    />
                  )}
                  Cart
                  {totalItems > 0 && (
                    <span className="bg-white text-black text-sm w-7 h-7 rounded-full flex items-center justify-center font-semibold ml-2">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
