'use client';

import Image from 'next/image';
import Link from "next/link";
import { useState } from "react";
import { usePathname } from 'next/navigation';
import { getCSRFToken } from '@/lib/get-csrf-token';
import ScrollReveal from '@/components/ScrollReveal';

const SHOP_LINKS = [
  { name: 'All Products', href: '/shop' },
  { name: 'Men', href: '/collections/men' },
  { name: 'Women', href: '/collections/women' },
  { name: 'New Arrivals', href: '/collections/new-arrivals' },
  { name: 'Best Sellers', href: '/collections/best-sellers' },
];

const COMPANY_LINKS = [
  { name: 'About Us', href: '/about' },
  { name: 'Our Impact', href: '/impact' },
  { name: 'The App', href: '/app' },
  { name: 'Careers', href: '/careers' },
  { name: 'Contact', href: '/contact' },
];

const SUPPORT_LINKS = [
  { name: 'FAQ', href: '/faq' },
  { name: 'Size Guide', href: '/size-guide' },
  { name: 'Shipping Info', href: '/shipping' },
  { name: 'Returns & Exchanges', href: '/returns' },
  { name: 'Email Us', href: 'mailto:info@dymnds.ca' },
];

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Hide footer on admin routes
  if (pathname?.startsWith('/admin')) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setStatus('submitting');
    try {
      const csrfToken = await getCSRFToken();
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ email, source: 'footer' }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <footer className="py-20 md:py-24 px-6 border-t border-white/10 bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content - 4 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-3 group mb-6 w-fit hover:opacity-80 transition-opacity duration-300"
            >
              <Image
                src="/diamond-white.png"
                alt="DYMNDS"
                width={40}
                height={40}
                className="h-10 w-auto group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300"
              />
              <Image
                src="/dymnds-only-white.png"
                alt="DYMNDS"
                width={100}
                height={20}
                className="h-5 w-auto"
              />
            </Link>
            <p className="text-sm opacity-60 leading-relaxed mb-6">
              Premium athletic wear for those who push limits.
            </p>
            <p className="text-xs text-white/30">
              info@dymnds.ca
            </p>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="font-bebas text-sm tracking-widest uppercase mb-6 font-semibold">
              Shop
            </h4>
            <ul className="space-y-3">
              {SHOP_LINKS.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="link-underline text-sm opacity-60 hover:opacity-100 transition-opacity duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-bebas text-sm tracking-widest uppercase mb-6 font-semibold">
              Company
            </h4>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="link-underline text-sm opacity-60 hover:opacity-100 transition-opacity duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="font-bebas text-sm tracking-widest uppercase mb-6 font-semibold">
              Support
            </h4>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="link-underline text-sm opacity-60 hover:opacity-100 transition-opacity duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="pt-12 mb-12">
          <div className="section-divider mb-12" />
          <div className="max-w-xl mx-auto text-center">
            <h4 className="font-bebas text-2xl md:text-3xl tracking-wider mb-4">
              Join The Movement
            </h4>
            <p className="text-sm opacity-60 mb-6">
              Subscribe for exclusive drops and 10% off your first order.
            </p>
            {status === 'success' ? (
              <p className="text-white/60 text-sm py-3" aria-live="polite">
                You&apos;re on the list. Welcome to the movement.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex max-w-md mx-auto">
                <input
                  type="email"
                  id="footer-newsletter-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  aria-label="Email for newsletter signup"
                  className="input-premium flex-1 px-4 py-3 bg-white/5 border border-white/20 border-r-0 text-sm focus:outline-none focus:border-white/40 transition-colors"
                  disabled={status === 'submitting'}
                  required
                />
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="px-6 py-3 bg-[var(--accent)] text-black text-sm tracking-wider uppercase font-semibold disabled:opacity-50 transition-colors hover:bg-[var(--accent-light)] whitespace-nowrap"
                >
                  {status === 'submitting' ? '...' : 'Subscribe'}
                </button>
              </form>
            )}
            {status === 'error' && (
              <p className="text-red-400/60 text-xs mt-2">
                Something went wrong. Try again.
              </p>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5">
          <div className="flex flex-col items-center md:items-start gap-4">
            <p className="font-bebas text-lg tracking-wider">
              Pressure Creates Diamonds
            </p>
            <p className="text-xs opacity-40">
              © 2026 DYMNDS. All rights reserved.
            </p>
          </div>
          <nav aria-label="Legal" className="flex flex-wrap gap-6 justify-center md:justify-end">
            <Link
              href="/privacy"
              className="link-underline text-xs opacity-40 hover:opacity-70 transition-opacity duration-300"
            >
              Privacy Policy
            </Link>
            <Link
              href="/returns"
              className="link-underline text-xs opacity-40 hover:opacity-70 transition-opacity duration-300"
            >
              Returns
            </Link>
            <Link
              href="/terms"
              className="link-underline text-xs opacity-40 hover:opacity-70 transition-opacity duration-300"
            >
              Terms of Service
            </Link>
          </nav>
        </div>

        {/* Oversized ghost DYMNDS watermark — animated entrance */}
        <div className="mt-12 pt-8 text-center overflow-hidden">
          <ScrollReveal animation="scale" delay={0} duration={1200} threshold={0.1}>
            <p className="font-bebas text-white/[0.04] leading-none tracking-tight whitespace-nowrap" style={{ fontSize: 'clamp(5rem, 15vw, 14rem)' }}>
              DYMNDS
            </p>
          </ScrollReveal>
        </div>
      </div>
    </footer>
  );
}
