'use client';

import Image from 'next/image';
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedCounter from "@/components/AnimatedCounter";
import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import type { Product } from "@/lib/firebase";
import { ChevronDown } from 'lucide-react';
import { useCurrency, convertPrice, formatPrice, getCadPrice, type Currency } from '@/lib/stores/currency-store';

/**
 * Landing.love-tier homepage.
 * Frost Bento-inspired bento grids, ambient hero, accent color system,
 * Framer Motion animations, parallax scroll, editorial product layout.
 */
interface HomeClientProps {
  menFeatured: Product[];
  womenFeatured: Product[];
}

/* ──────────────────── Sub-components ──────────────────── */

/** Word-by-word text reveal triggered on scroll */
function AnimatedHeading({
  text,
  className = '',
  delay = 0,
  tag: Tag = 'h2',
}: {
  text: string;
  className?: string;
  delay?: number;
  tag?: 'h1' | 'h2' | 'h3';
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const words = text.split(' ');

  return (
    <Tag ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em]">
          <motion.span
            className="inline-block"
            initial={{ y: '110%' }}
            animate={isInView ? { y: 0 } : { y: '110%' }}
            transition={{
              duration: 0.7,
              delay: delay + i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Parallax wrapper — shifts children by `speed` relative to scroll */
function Parallax({
  children,
  speed = 0.5,
  className = '',
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, speed * 100]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/** Infinite horizontal marquee band */
function Marquee() {
  return (
    <div className="py-8 border-y border-[var(--accent)]/[0.06] overflow-hidden bg-black relative select-none">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className="flex items-center gap-10 mx-10 font-bebas text-[22px] md:text-[28px] tracking-[0.25em] uppercase text-[var(--accent)]/30"
          >
            <span>Pressure Creates DYMNDS</span>
            <span className="text-[var(--accent)]/20">&#9670;</span>
            <span>Wear The Change</span>
            <span className="text-[var(--accent)]/20">&#9670;</span>
            <span>Premium Activewear</span>
            <span className="text-[var(--accent)]/20">&#9670;</span>
            <span>10% Funds Healing</span>
            <span className="text-[var(--accent)]/20">&#9670;</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Product card for editorial grid */
function EditorialProductCard({
  product,
  currency,
  large = false,
}: {
  product: Product;
  currency: Currency;
  large?: boolean;
}) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div
        className={`aspect-[4/5] bg-neutral-900 ${large ? 'mb-6' : 'mb-4'} overflow-hidden relative`}
      >
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            loading="lazy"
            className="object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            sizes={large ? '(max-width: 768px) 100vw, 58vw' : '(max-width: 768px) 100vw, 42vw'}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-shimmer" />
            <span className="text-[var(--accent)]/20 text-4xl font-bebas">DYMNDS</span>
          </div>
        )}
        {/* Hover gradient with accent tint */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {/* Quick-view hint on hover */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/80 bg-black/60 backdrop-blur-md px-5 py-2.5 border border-white/10">
            View Product
          </span>
        </div>
        {/* Accent line on hover */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left" />
      </div>
      <h3 className={`${large ? 'text-2xl' : 'text-lg'} tracking-wide mb-1 font-bebas group-hover:text-[var(--accent)] transition-colors duration-300`}>
        {product.title}
      </h3>
      <p className="text-white/25 text-sm mb-2">{product.subtitle}</p>
      <p className={`${large ? 'text-lg' : 'text-base'} text-[var(--accent)]`}>
        {formatPrice(convertPrice(getCadPrice(product), currency), currency)}
      </p>
    </Link>
  );
}

/** Inline homepage newsletter — reuses /api/waitlist */
function HomepageNewsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;
    setStatus('loading');

    try {
      const csrfRes = await fetch('/api/csrf');
      const { token } = await csrfRes.json();

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, csrf_token: token }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage('You\u2019re in. Welcome to the movement.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <section className="py-28 md:py-36 px-6 bg-black relative">
      <div className="section-divider-glow mb-20" />
      <div className="max-w-xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--accent)]/40 mb-4">
            Stay Connected
          </p>
          <h2 className="text-4xl md:text-5xl font-bebas tracking-tight mb-4">
            Join The Movement
          </h2>
          <p className="text-white/35 text-sm mb-10 leading-relaxed">
            First access to drops, behind-the-scenes content, and impact updates.
          </p>

          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-3"
            >
              <div className="glow-dot" />
              <p className="text-[var(--accent)] text-sm" aria-live="polite">
                {message}
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/20 input-premium focus:outline-none transition-all duration-300 focus:bg-white/[0.06]"
                aria-label="Email address"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-8 py-3.5 bg-[var(--accent)] text-black text-[11px] tracking-[0.2em] uppercase font-semibold hover:bg-[var(--accent-light)] transition-all duration-300 disabled:opacity-50 hover:shadow-[0_0_24px_-4px_rgba(200,169,126,0.3)]"
              >
                {status === 'loading' ? 'Joining...' : 'Join'}
              </button>
            </form>
          )}
          {status === 'error' && (
            <p className="text-red-400/70 text-xs mt-3" aria-live="polite">
              {message}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────── Main Component ──────────────────── */

export default function HomeClient({ menFeatured, womenFeatured }: HomeClientProps) {
  const currency = useCurrency();
  const heroRef = useRef(null);

  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(heroScrollProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(heroScrollProgress, [0, 1], [1, 0.95]);
  const heroY = useTransform(heroScrollProgress, [0, 1], [0, 120]);

  const hasProducts = menFeatured.length > 0 || womenFeatured.length > 0;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "DYMNDS",
    "url": "https://dymnds.ca",
    "logo": "https://dymnds.ca/dymnds-logo-black.png",
    "description": "Premium athletic wear. 10% of every order funds survivor healing.",
  };

  return (
    <main
      id="main-content"
      className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-[var(--accent)]/15 selection:text-white"
    >
      <div className="grain-overlay" aria-hidden="true" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Navbar />

      {/* ═══════ HERO ═══════ */}
      <section
        ref={heroRef}
        className="hero-height w-full flex items-end px-6 md:px-12 lg:px-20 pb-20 md:pb-28 relative overflow-hidden"
      >
        <div className="hero-ambient" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(200,169,126,0.06),transparent)]" />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="w-full relative z-10"
        >
          <div className="flex flex-col md:grid md:grid-cols-12 gap-8 md:gap-6 items-end">
            <div className="md:col-span-8 lg:col-span-9">
              {['Pressure', 'Creates', 'DYMNDS'].map((word, i) => (
                <div key={word} className="overflow-hidden">
                  <motion.div
                    className={`font-bebas tracking-[-0.03em] leading-[0.85] ${
                      word === 'DYMNDS' ? 'text-accent-gradient' : 'text-white'
                    }`}
                    style={{ fontSize: 'clamp(4.5rem, 18vw, 16rem)' }}
                    initial={{ y: '120%' }}
                    animate={{ y: 0 }}
                    transition={{
                      duration: 0.9,
                      delay: 0.3 + i * 0.12,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    {word}
                  </motion.div>
                </div>
              ))}
            </div>

            <div className="md:col-span-4 lg:col-span-3 flex flex-col items-start md:items-end gap-8 pb-2">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-16 h-[1px] bg-[var(--accent)]/50 origin-right hidden md:block"
              />

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
                className="text-[11px] md:text-[13px] text-white/40 tracking-[0.3em] max-w-[280px] uppercase text-left md:text-right leading-relaxed"
              >
                Forged in struggle &middot; Built for comebacks &middot; <span className="text-[var(--accent)]/60">10% heals</span>
              </motion.p>

              <motion.div
                className="flex flex-col gap-4 w-full md:w-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href="/collections/men"
                  className="group relative px-10 py-4 border border-[var(--accent)]/25 text-white text-[11px] tracking-[0.25em] uppercase overflow-hidden transition-all duration-500 hover:border-[var(--accent)] text-center"
                >
                  <span className="relative z-10 transition-colors duration-500 group-hover:text-black">
                    Shop Men
                  </span>
                  <span className="absolute inset-0 bg-[var(--accent)] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                </Link>
                <Link
                  href="/collections/women"
                  className="group relative px-10 py-4 bg-[var(--accent)] text-black text-[11px] tracking-[0.25em] uppercase overflow-hidden transition-all duration-500 text-center hover:shadow-[0_0_32px_-4px_rgba(200,169,126,0.25)]"
                >
                  <span className="relative z-10 transition-colors duration-500 group-hover:text-black">
                    Shop Women
                  </span>
                  <span className="absolute inset-0 bg-[var(--accent-light)] transform translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 2.2, duration: 1.2 }}
        >
          <span className="text-[9px] tracking-[0.5em] uppercase text-[var(--accent)]/60">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-4 h-4 text-[var(--accent)]/50" />
          </motion.div>
        </motion.div>
      </section>

      <Marquee />

      {/* ═══════ THE VOID — Full-Viewport Statement ═══════ */}
      <section className="min-h-[80vh] flex items-center justify-center px-6 bg-black relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent)]/[0.02] rounded-full blur-[150px]" />

        <div className="text-center relative z-10 max-w-5xl mx-auto">
          <motion.p
            className="text-[10px] tracking-[0.5em] uppercase text-[var(--accent)]/30 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Our Promise
          </motion.p>

          <motion.h2
            className="font-bebas leading-[0.85] tracking-tight text-white"
            style={{ fontSize: 'clamp(3rem, 10vw, 10rem)' }}
            initial={{ opacity: 0, filter: 'blur(12px)' }}
            whileInView={{ opacity: 1, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          >
            Your Gear Should<br />Mean Something
          </motion.h2>

          <motion.div
            className="w-12 h-[1px] bg-[var(--accent)]/20 mx-auto mt-10"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </section>

      {/* ═══════ BENTO GRID ═══════ */}
      <section className="py-0 bg-black">
        <div className="max-w-7xl mx-auto px-6 py-28 md:py-40">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--accent)]/40 mb-4">
              The DYMNDS Standard
            </p>
            <h2 className="text-5xl md:text-7xl tracking-tight font-bebas">
              Built Different
            </h2>
          </motion.div>

          <div className="bento-grid grid-cols-1 md:grid-cols-3 md:grid-rows-2">
            <motion.div
              className="bento-card md:col-span-2 md:row-span-2 flex flex-col justify-between min-h-[300px] md:min-h-[500px] relative"
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="absolute -right-4 -bottom-6 text-[12rem] md:text-[16rem] font-bebas text-[var(--accent)]/[0.04] leading-none select-none pointer-events-none" aria-hidden="true">
                10%
              </span>
              <div className="relative z-10">
                <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent)]/50 mb-4">Core Mission</p>
                <h3 className="text-4xl md:text-5xl font-bebas tracking-tight mb-6">
                  <span className="text-accent-gradient">10%</span> of Every Order<br />
                  Funds Survivor Healing
                </h3>
                <p className="text-white/40 text-lg leading-relaxed max-w-lg">
                  Not a pledge. Not a goal. From order one, 10% goes directly to therapy,
                  safe housing, and support programs. The price of your gear literally heals.
                </p>
              </div>
              <Link
                href="/impact"
                className="group inline-flex items-center gap-2 mt-8 text-[11px] tracking-[0.2em] uppercase text-[var(--accent)]/60 hover:text-[var(--accent)] transition-colors duration-500 w-fit"
              >
                See The Impact
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
              </Link>
            </motion.div>

            <motion.div
              className="bento-card flex flex-col justify-between min-h-[200px]"
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative z-10">
                <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent)]/50 mb-3">Materials</p>
                <h3 className="text-2xl font-bebas tracking-tight mb-3">Zero Shortcuts</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  Premium compression fabrics, moisture-wicking tech, reinforced seams. Tested in the gym, not just the boardroom.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="bento-card flex flex-col justify-between min-h-[200px]"
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative z-10">
                <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent)]/50 mb-3">Community</p>
                <h3 className="text-2xl font-bebas tracking-tight mb-3">For the Comeback</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  Built for the mornings you don&rsquo;t feel like showing up. For when being here is the victory.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ STORY ═══════ */}
      <section className="py-40 md:py-56 px-6 bg-[var(--surface-1)] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--accent)]/[0.03] rounded-full blur-[120px]" />

        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 md:gap-16 items-start relative z-10">
          <div className="md:col-span-5 md:sticky md:top-32">
            <AnimatedHeading
              text="Forged Under Pressure"
              className="text-6xl md:text-7xl lg:text-[6.5rem] leading-[0.85] tracking-tight font-bebas"
            />
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-16 h-[1px] bg-[var(--accent)]/40 mt-8 origin-left"
            />
          </div>

          <div className="md:col-span-7 space-y-10 text-lg md:text-xl text-white/40 leading-relaxed">
            {[
              'Diamonds aren\u2019t born brilliant. They\u2019re crushed, heated, and transformed under pressure most things can\u2019t survive.',
              "Your gear should match your story. Built for the hardest sets, the longest runs, the days when quitting sounds reasonable but you don\u2019t.",
            ].map((text, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.8, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                {text}
              </motion.p>
            ))}

            <motion.p
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-white/55"
            >
              And because we believe in lifting others as we lift ourselves,{' '}
              <span className="text-[var(--accent)] font-semibold">10% of every purchase</span>{' '}
              supports survivors turning their darkest chapters into diamond strength.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ═══════ COLLECTIONS ═══════ */}
      {hasProducts && (
        <>
          {menFeatured.length > 0 && (
            <section id="men" className="py-28 md:py-40 px-6 bg-black">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  className="flex items-end justify-between mb-16"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div>
                    <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--accent)]/40 mb-3">
                      The Collection
                    </p>
                    <h2 className="text-6xl md:text-7xl tracking-tight font-bebas">For Him</h2>
                  </div>
                  <Link
                    href="/collections/men"
                    className="group flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[var(--accent)]/50 hover:text-[var(--accent)] transition-colors duration-500 pb-1"
                  >
                    View All
                    <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                  </Link>
                </motion.div>

                <div className="grid md:grid-cols-12 gap-6 md:gap-8">
                  {menFeatured.slice(0, 1).map((product) => (
                    <motion.div
                      key={product.id}
                      className="md:col-span-7"
                      initial={{ opacity: 0, scale: 0.92, y: 80 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <EditorialProductCard product={product} currency={currency} large />
                    </motion.div>
                  ))}

                  <div className="md:col-span-5 grid gap-6 md:gap-8">
                    {menFeatured.slice(1, 3).map((product, i) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.9,
                          delay: 0.3 + i * 0.15,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      >
                        <EditorialProductCard product={product} currency={currency} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {womenFeatured.length > 0 && (
            <section id="women" className="py-32 md:py-48 px-6 bg-[var(--surface-1)]">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  className="flex items-end justify-between mb-16"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div>
                    <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--accent)]/40 mb-3">
                      The Collection
                    </p>
                    <h2 className="text-6xl md:text-7xl tracking-tight font-bebas">For Her</h2>
                  </div>
                  <Link
                    href="/collections/women"
                    className="group flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[var(--accent)]/50 hover:text-[var(--accent)] transition-colors duration-500 pb-1"
                  >
                    View All
                    <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                  </Link>
                </motion.div>

                <div className="grid md:grid-cols-12 gap-6 md:gap-8">
                  <div className="md:col-span-5 grid gap-6 md:gap-8 order-2 md:order-1">
                    {womenFeatured.slice(1, 3).map((product, i) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.9,
                          delay: 0.3 + i * 0.15,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      >
                        <EditorialProductCard product={product} currency={currency} />
                      </motion.div>
                    ))}
                  </div>

                  {womenFeatured.slice(0, 1).map((product) => (
                    <motion.div
                      key={product.id}
                      className="md:col-span-7 order-1 md:order-2"
                      initial={{ opacity: 0, scale: 0.92, y: 80 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <EditorialProductCard product={product} currency={currency} large />
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ═══════ IMPACT ═══════ */}
      <section className="py-36 md:py-52 px-6 bg-[var(--accent)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,transparent_30%,rgba(0,0,0,0.08)_100%)]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex flex-col md:flex-row items-center gap-8 md:gap-14 px-10 md:px-20 py-14">
              <span className="text-7xl md:text-8xl font-bebas text-black">
                <AnimatedCounter
                  end={10}
                  suffix="%"
                  className="text-7xl md:text-8xl font-bebas"
                />
              </span>
              <div className="text-left">
                <p className="text-[10px] tracking-[0.4em] uppercase text-black/50 mb-2">
                  Of Every Order From Day One
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-black/80">
                  Funds therapy, safe housing, and healing programs for survivors
                </p>
              </div>
            </div>
          </motion.div>

          <div className="mt-24 grid md:grid-cols-3 gap-[1px] bg-black/[0.1] max-w-3xl mx-auto">
            {[
              { title: 'Therapy', desc: 'One-on-one counseling for survivors on their healing journey.' },
              { title: 'Safe Housing', desc: 'Emergency shelter for those escaping abuse.' },
              { title: 'Support Groups', desc: 'Community healing through peer support.' },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                className="p-8 text-center bg-black hover:bg-neutral-900 transition-colors duration-500"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="text-3xl mb-3 font-bebas text-[var(--accent)]">{card.title}</p>
                <p className="text-white/40 text-sm leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Link
              href="/impact"
              className="group inline-flex items-center gap-2 mt-16 text-[11px] tracking-[0.2em] uppercase text-black/50 hover:text-black transition-colors duration-500 border-b border-black/20 pb-1"
            >
              Learn More
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════ HORIZONTAL SCROLL ═══════ */}
      <section className="py-8 bg-black overflow-hidden relative">
        <div className="flex whitespace-nowrap">
          <motion.div
            className="flex items-center gap-0"
            initial={{ x: 0 }}
            whileInView={{ x: '-50%' }}
            viewport={{ once: false }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          >
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex items-center gap-0">
                {['No Shortcuts', 'Real Impact', 'Zero Pretension', 'Built to Last', 'Pressure Creates DYMNDS'].map((value, i) => (
                  <span
                    key={`${setIdx}-${i}`}
                    className="font-bebas text-white/[0.04] tracking-tight leading-none px-6 md:px-10 flex-shrink-0"
                    style={{ fontSize: 'clamp(4rem, 12vw, 10rem)' }}
                  >
                    {value}
                    <span className="text-[var(--accent)]/[0.08] mx-4 md:mx-8">&#9670;</span>
                  </span>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════ FOUNDER'S QUOTE ═══════ */}
      <section className="py-28 md:py-40 px-6 bg-[var(--surface-1)] relative overflow-hidden">
        <span
          className="absolute -top-10 left-1/2 -translate-x-1/2 text-[14rem] md:text-[20rem] font-serif text-[var(--accent)]/[0.03] leading-none select-none pointer-events-none"
          aria-hidden="true"
        >
          &ldquo;
        </span>

        <Parallax speed={-0.15} className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
          >
            <div className="w-12 h-[1px] bg-[var(--accent)]/30 mx-auto mb-14" />

            <blockquote className="text-2xl md:text-3xl lg:text-4xl font-light italic leading-relaxed mb-12 text-white/60">
              &ldquo;We started Dymnds because we were tired of fitness brands that were all
              surface and no substance. We wanted to build something where every purchase actually
              meant something &mdash; where pressure truly creates diamonds.&rdquo;
            </blockquote>
            <cite className="text-[11px] text-[var(--accent)]/40 not-italic tracking-[0.3em] uppercase">
              &mdash; Brandon, Founder
            </cite>
          </motion.div>
        </Parallax>
      </section>

      {/* ═══════ APP TEASER ═══════ */}
      <motion.section
        className="py-16 md:py-20 px-6 bg-black border-y border-[var(--accent)]/[0.06]"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent)]/60 mb-2">
              Coming Soon &mdash; Free For Everyone
            </p>
            <p className="text-xl md:text-2xl font-bebas">
              The Dymnds App &mdash; Your Personal Fitness Coach
            </p>
            <p className="text-white/30 text-sm mt-2">
              Rep counter. Nutrition tracking. Progress analytics. All free.
            </p>
          </div>
          <Link
            href="/app"
            className="group relative px-8 py-3 border border-[var(--accent)]/20 text-[var(--accent)] text-[11px] tracking-[0.2em] uppercase overflow-hidden transition-all duration-500 hover:border-[var(--accent)]/50 whitespace-nowrap"
          >
            <span className="relative z-10">Learn More</span>
          </Link>
        </div>
      </motion.section>

      <HomepageNewsletter />

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-40 md:py-56 px-6 bg-black relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/15 to-transparent" />

        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-12 h-[1px] bg-[var(--accent)]/30 mx-auto mb-12"
          />

          <AnimatedHeading
            text="Wear The Change"
            className="text-5xl md:text-7xl tracking-tight mb-6 font-bebas"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white/35 mb-14 text-lg leading-relaxed"
          >
            Premium quality. Real impact. Every purchase heals.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-5 justify-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link
              href="/collections/men"
              className="group relative px-12 py-5 border border-[var(--accent)]/25 text-white text-[11px] tracking-[0.25em] uppercase overflow-hidden transition-all duration-500 hover:border-[var(--accent)]"
            >
              <span className="relative z-10 transition-colors duration-500 group-hover:text-black">
                Shop Men
              </span>
              <span className="absolute inset-0 bg-[var(--accent)] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            </Link>
            <Link
              href="/collections/women"
              className="group relative px-12 py-5 bg-[var(--accent)] text-black text-[11px] tracking-[0.25em] uppercase overflow-hidden transition-all duration-500 hover:shadow-[0_0_32px_-4px_rgba(200,169,126,0.25)]"
            >
              <span className="relative z-10 transition-colors duration-500 group-hover:text-black">
                Shop Women
              </span>
              <span className="absolute inset-0 bg-[var(--accent-light)] transform translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
