'use client';

import Image from 'next/image';
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedCounter from "@/components/AnimatedCounter";
import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import type { Product } from "@/lib/firebase";
import { ChevronDown } from 'lucide-react';
import { useCurrency, convertPrice, formatPrice, getCadPrice, type Currency } from '@/lib/stores/currency-store';

/**
 * Landing.love-tier homepage.
 * Framer Motion animations, parallax scroll, editorial product layout,
 * infinite marquee, grain overlay, word-by-word reveals.
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
    <div className="py-5 border-y border-white/[0.06] overflow-hidden bg-black relative select-none">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className="flex items-center gap-10 mx-10 font-bebas text-[15px] tracking-[0.35em] uppercase text-white/15"
          >
            <span>Pressure Creates Diamonds</span>
            <Image src="/diamond-white.png" alt="" width={10} height={10} className="opacity-20" />
            <span>Wear The Change</span>
            <Image src="/diamond-white.png" alt="" width={10} height={10} className="opacity-20" />
            <span>Premium Activewear</span>
            <Image src="/diamond-white.png" alt="" width={10} height={10} className="opacity-20" />
            <span>10% Funds Healing</span>
            <Image src="/diamond-white.png" alt="" width={10} height={10} className="opacity-20" />
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
            <Image src="/diamond-white.png" alt="" width={48} height={48} className="opacity-10" />
          </div>
        )}
        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      <h3 className={`${large ? 'text-2xl' : 'text-lg'} tracking-wide mb-1 font-bebas`}>
        {product.title}
      </h3>
      <p className="text-white/25 text-sm mb-2">{product.subtitle}</p>
      <p className={large ? 'text-lg' : 'text-base'}>
        {formatPrice(convertPrice(getCadPrice(product), currency), currency)}
      </p>
    </Link>
  );
}

/* ──────────────────── Main Component ──────────────────── */

export default function HomeClient({ menFeatured, womenFeatured }: HomeClientProps) {
  const currency = useCurrency();
  const heroRef = useRef(null);

  // Parallax the entire hero section as user scrolls down
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
      className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-white selection:text-black"
    >
      {/* Grain texture overlay */}
      <div className="grain-overlay" aria-hidden="true" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Navbar />

      {/* ═══════ HERO — Full Viewport Immersive ═══════ */}
      <section
        ref={heroRef}
        className="hero-height w-full flex flex-col items-center justify-center px-6 relative overflow-hidden"
      >
        {/* Subtle radial gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.04),transparent)]" />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="text-center max-w-4xl relative z-10"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src="/dymnds-logo-white.png"
              alt="DYMNDS"
              width={720}
              height={120}
              priority
              className="w-[80vw] max-w-[680px] mx-auto mb-16"
            />
          </motion.div>

          {/* Diamond icon */}
          <motion.div
            initial={{ opacity: 0, y: 20, rotate: -180 }}
            animate={{ opacity: 0.25, y: 0, rotate: 0 }}
            transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src="/diamond-white.png"
              alt=""
              width={24}
              height={24}
              priority
              className="h-6 w-auto mx-auto mb-14 animate-hero-breathe"
            />
          </motion.div>

          {/* Headline — word-by-word reveal */}
          <div className="overflow-hidden mb-6">
            {['Pressure', 'Creates', 'Diamonds'].map((word, i) => (
              <motion.span
                key={word}
                className="inline-block font-bebas text-[clamp(2.5rem,8vw,6rem)] tracking-tight text-white mr-[0.15em]"
                initial={{ y: '120%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.9,
                  delay: 0.6 + i * 0.12,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {word}
              </motion.span>
            ))}
          </div>

          {/* Sub-tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[11px] md:text-[13px] text-white/35 mb-16 tracking-[0.3em] max-w-md mx-auto uppercase"
          >
            Premium activewear &middot; 10% funds survivor healing
          </motion.p>

          {/* CTA Buttons — slide-fill hover effect */}
          <motion.div
            className="flex flex-col sm:flex-row gap-5 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href="/collections/men"
              className="group relative px-12 py-5 border border-white/25 text-white text-[11px] tracking-[0.25em] uppercase overflow-hidden transition-all duration-500 hover:border-white"
            >
              <span className="relative z-10 transition-colors duration-500 group-hover:text-black">
                Shop Men
              </span>
              <span className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            </Link>
            <Link
              href="/collections/women"
              className="group relative px-12 py-5 bg-white text-black text-[11px] tracking-[0.25em] uppercase overflow-hidden transition-all duration-500"
            >
              <span className="relative z-10 transition-colors duration-500 group-hover:text-white">
                Shop Women
              </span>
              <span className="absolute inset-0 bg-black transform translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          transition={{ delay: 2.2, duration: 1.2 }}
        >
          <span className="text-[9px] tracking-[0.5em] uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════ MARQUEE — Infinite Movement Band ═══════ */}
      <Marquee />

      {/* ═══════ STORY — Brand Manifesto ═══════ */}
      <section className="py-36 md:py-48 px-6 bg-black relative">
        <div className="max-w-3xl mx-auto text-center">
          <Parallax speed={-0.2}>
            <motion.div
              initial={{ opacity: 0, rotate: -90 }}
              whileInView={{ opacity: 0.12, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
            >
              <Image
                src="/diamond-white.png"
                alt=""
                width={32}
                height={32}
                loading="lazy"
                className="h-8 w-auto mx-auto mb-16"
              />
            </motion.div>
          </Parallax>

          <AnimatedHeading
            text="Pressure Creates Diamonds"
            className="text-5xl md:text-7xl lg:text-8xl tracking-tight mb-16 font-bebas"
          />

          <div className="space-y-12 text-lg md:text-xl text-white/35 leading-relaxed">
            {[
              'Just like a diamond forms under intense heat and pressure, strength emerges from struggle.',
              "Our gear is built for your hardest workouts \u2014 and your comeback stories. For the mornings you don\u2019t feel like showing up. For the moments when simply being here is the victory.",
            ].map((text, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.8, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                {text}
              </motion.p>
            ))}

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-white/60"
            >
              And because we believe in lifting others as we lift ourselves,
              <span className="text-white font-semibold"> 10% of every purchase</span> supports
              survivors on their journey from darkness to light.
            </motion.p>
          </div>
        </div>

        {/* Decorative gradient line */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-white/10 to-transparent"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          style={{ transformOrigin: 'top' }}
        />
      </section>

      {/* ═══════ COLLECTIONS — Editorial Grid Layout ═══════ */}
      {hasProducts && (
        <>
          {/* Men's Collection */}
          {menFeatured.length > 0 && (
            <section id="men" className="py-28 md:py-40 px-6 bg-neutral-950">
              <div className="max-w-7xl mx-auto">
                {/* Section header */}
                <motion.div
                  className="flex items-end justify-between mb-16"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div>
                    <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 mb-3">
                      The Collection
                    </p>
                    <h2 className="text-6xl md:text-7xl tracking-tight font-bebas">For Him</h2>
                  </div>
                  <Link
                    href="/collections/men"
                    className="group flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-white/25 hover:text-white transition-colors duration-500 pb-1"
                  >
                    View All
                    <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </Link>
                </motion.div>

                {/* Editorial: 1 hero (7 cols) + 2 supporting (5 cols) */}
                <div className="grid md:grid-cols-12 gap-6 md:gap-8">
                  {/* Hero product */}
                  {menFeatured.slice(0, 1).map((product) => (
                    <motion.div
                      key={product.id}
                      className="md:col-span-7"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <EditorialProductCard product={product} currency={currency} large />
                    </motion.div>
                  ))}

                  {/* Supporting products */}
                  <div className="md:col-span-5 grid gap-6 md:gap-8">
                    {menFeatured.slice(1, 3).map((product, i) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.9,
                          delay: 0.15 * (i + 1),
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

          {/* Women's Collection — mirrored layout */}
          {womenFeatured.length > 0 && (
            <section id="women" className="py-28 md:py-40 px-6 bg-black">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  className="flex items-end justify-between mb-16"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div>
                    <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 mb-3">
                      The Collection
                    </p>
                    <h2 className="text-6xl md:text-7xl tracking-tight font-bebas">For Her</h2>
                  </div>
                  <Link
                    href="/collections/women"
                    className="group flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-white/25 hover:text-white transition-colors duration-500 pb-1"
                  >
                    View All
                    <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </Link>
                </motion.div>

                {/* Mirrored editorial: 2 supporting (5 cols) + 1 hero (7 cols) */}
                <div className="grid md:grid-cols-12 gap-6 md:gap-8">
                  <div className="md:col-span-5 grid gap-6 md:gap-8 order-2 md:order-1">
                    {womenFeatured.slice(1, 3).map((product, i) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.9,
                          delay: 0.15 * i,
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
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
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

      {/* ═══════ IMPACT — The 10% Promise ═══════ */}
      <section className="py-32 md:py-44 px-6 bg-neutral-950 border-y border-white/[0.04] relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.015] rounded-full blur-[120px]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex flex-col md:flex-row items-center gap-8 md:gap-14 px-10 md:px-20 py-14 border border-white/[0.08]">
              <span className="text-7xl md:text-8xl font-bebas">
                <AnimatedCounter
                  end={10}
                  suffix="%"
                  className="text-7xl md:text-8xl font-bebas"
                />
              </span>
              <div className="text-left">
                <p className="text-[10px] tracking-[0.4em] uppercase text-white/30 mb-2">
                  Of Every Order Day One
                </p>
                <p className="text-lg md:text-xl leading-relaxed">
                  Funds therapy, safe housing, and healing programs for survivors
                </p>
              </div>
            </div>
          </motion.div>

          {/* Impact cards */}
          <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              {
                title: 'Therapy',
                desc: 'One-on-one counseling for survivors on their healing journey.',
              },
              {
                title: 'Safe Housing',
                desc: 'Emergency shelter for those escaping abuse.',
              },
              {
                title: 'Support Groups',
                desc: 'Community healing through peer support.',
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                className="p-8 text-center border border-white/[0.06] hover:border-white/[0.12] transition-colors duration-500"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <p className="text-3xl mb-3 font-bebas">{card.title}</p>
                <p className="text-white/30 text-sm leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <p className="mt-16 text-white/30 leading-relaxed max-w-2xl mx-auto text-lg">
              When you choose Dymnds, you&rsquo;re not just buying premium gear &mdash; you&rsquo;re
              helping someone take their first step toward recovery.
            </p>
            <Link
              href="/impact"
              className="group inline-flex items-center gap-2 mt-8 text-[11px] tracking-[0.2em] uppercase text-white/35 hover:text-white transition-colors duration-500 border-b border-white/15 pb-1"
            >
              Learn More
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════ FOUNDER'S QUOTE — Parallax ═══════ */}
      <section className="py-32 md:py-44 px-6 bg-black relative overflow-hidden">
        {/* Giant decorative quotation mark */}
        <span
          className="absolute -top-10 left-1/2 -translate-x-1/2 text-[14rem] md:text-[20rem] font-serif text-white/[0.02] leading-none select-none pointer-events-none"
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
            <Image
              src="/diamond-white.png"
              alt=""
              width={20}
              height={20}
              loading="lazy"
              className="h-5 w-auto mx-auto mb-14 opacity-10"
            />

            <blockquote className="text-2xl md:text-3xl lg:text-4xl font-light italic leading-relaxed mb-12 text-white/70">
              &ldquo;We started Dymnds because we were tired of fitness brands that were all
              surface and no substance. We wanted to build something where every purchase actually
              meant something &mdash; where pressure truly creates diamonds.&rdquo;
            </blockquote>
            <cite className="text-[11px] text-white/25 not-italic tracking-[0.3em] uppercase">
              &mdash; The Dymnds Team
            </cite>
          </motion.div>
        </Parallax>
      </section>

      {/* ═══════ APP TEASER ═══════ */}
      <motion.section
        className="py-16 md:py-20 px-6 bg-neutral-950 border-y border-white/[0.04]"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-green-400/80 mb-2">
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
            className="group relative px-8 py-3 border border-white/15 text-white text-[11px] tracking-[0.2em] uppercase overflow-hidden transition-all duration-500 hover:border-white/40 whitespace-nowrap"
          >
            <span className="relative z-10">Learn More</span>
          </Link>
        </div>
      </motion.section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-36 md:py-48 px-6 bg-black relative">
        {/* Subtle top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Image
              src="/diamond-white.png"
              alt=""
              width={36}
              height={36}
              loading="lazy"
              className="h-9 w-auto mx-auto mb-12 opacity-15"
            />
          </motion.div>

          <AnimatedHeading
            text="Wear The Change"
            className="text-5xl md:text-7xl tracking-tight mb-6 font-bebas"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white/30 mb-14 text-lg"
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
              className="group relative px-12 py-5 border border-white/25 text-white text-[11px] tracking-[0.25em] uppercase overflow-hidden transition-all duration-500 hover:border-white"
            >
              <span className="relative z-10 transition-colors duration-500 group-hover:text-black">
                Shop Men
              </span>
              <span className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            </Link>
            <Link
              href="/collections/women"
              className="group relative px-12 py-5 bg-white text-black text-[11px] tracking-[0.25em] uppercase overflow-hidden transition-all duration-500"
            >
              <span className="relative z-10 transition-colors duration-500 group-hover:text-white">
                Shop Women
              </span>
              <span className="absolute inset-0 bg-black transform translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
