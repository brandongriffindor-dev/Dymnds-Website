'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useCart } from "./CartContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-black/95 backdrop-blur-xl' : 'bg-black/80 backdrop-blur-sm'
      } border-b border-white/5`}>
        <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/diamond-white.png" alt="" className="h-7 w-auto" />
            <img src="/dymnds-only-white.png" alt="DYMNDS" className="h-5 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-xs tracking-[0.2em] uppercase">
            <Link href="/collections/men" className="hover:text-white/60 transition-colors">
              Men
            </Link>
            <Link href="/collections/women" className="hover:text-white/60 transition-colors">
              Women
            </Link>
            <Link href="/impact" className="hover:text-white/60 transition-colors">
              Impact
            </Link>
            <Link href="/app" className="hover:text-white/60 transition-colors">
              App
            </Link>
            <Link
              href="/cart"
              className="px-5 py-2.5 bg-white text-black hover:bg-white/90 transition-all flex items-center gap-2"
            >
              Checkout
              {totalItems > 0 && (
                <span className="bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
          >
            <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </nav>

        {/* Mobile Menu */}
        <div className={`md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10 transition-all duration-500 overflow-hidden ${
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-6 py-6 flex flex-col gap-4">
            <Link 
              href="/collections/men"
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg tracking-widest uppercase hover:opacity-70 transition-all"
            >
              Men
            </Link>
            <Link 
              href="/collections/women"
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg tracking-widest uppercase hover:opacity-70 transition-all"
            >
              Women
            </Link>
            <Link 
              href="/impact"
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg tracking-widest uppercase hover:opacity-70 transition-all"
            >
              Impact
            </Link>
            <Link 
              href="/app"
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg tracking-widest uppercase hover:opacity-70 transition-all"
            >
              App
            </Link>
            <Link 
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg tracking-widest uppercase hover:opacity-70 transition-all"
            >
              Checkout
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
