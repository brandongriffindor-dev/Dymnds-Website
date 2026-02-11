import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import StaggerReveal from '@/components/StaggerReveal';
import AnimatedCounter from '@/components/AnimatedCounter';

export const metadata: Metadata = {
  title: 'Our Impact | DYMNDS — 10% Changes Lives',
  description: '10% of every DYMNDS order funds therapy, safe housing, and support groups for survivors. See how your purchase creates change.',
  alternates: {
    canonical: 'https://dymnds.ca/impact',
  },
};

export default function ImpactPage() {
  const impactAreas = [
    {
      title: 'Therapy',
      desc: 'One-on-one counseling sessions for survivors on their healing journey.',
    },
    {
      title: 'Safe Housing',
      desc: 'Emergency shelter and transitional housing for those escaping abuse.',
    },
    {
      title: 'Support Groups',
      desc: 'Community healing through peer support and group therapy sessions.',
    },
  ];

  return (
    <main id="main-content" className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero — Oversized Stat as Visual Anchor */}
      <section className="pt-32 pb-16 px-6 relative overflow-hidden">
        {/* Giant decorative 10% — partially clipped for drama */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none" aria-hidden="true">
          <span className="text-[20rem] md:text-[28rem] font-bebas text-[var(--accent)]/[0.04] leading-none block">10%</span>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <ScrollReveal animation="fade-up" delay={0} duration={800}>
            <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--accent)]/50 mb-4">Our Impact</p>
          </ScrollReveal>

          <ScrollReveal animation="blur-up" delay={100} duration={1200}>
            <h1 className="tracking-tight mb-6 font-bebas leading-[0.85]" style={{ fontSize: 'clamp(4rem, 12vw, 10rem)' }}>
              Your Purchase<br />Has Power
            </h1>
          </ScrollReveal>

          <ScrollReveal animation="slide-right" delay={200} duration={800}>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">
              Every piece of DYMNDS gear helps a survivor take their first step toward healing.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--accent)]/10 to-transparent" />

      {/* The 10% Promise */}
      <section className="py-28 md:py-40 px-6 bg-neutral-950">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal animation="scale" delay={0} duration={1000} threshold={0.3}>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mb-16">
              <p className="text-8xl md:text-9xl font-bebas">
                <AnimatedCounter end={10} suffix="%" duration={2000} className="font-bebas" />
              </p>
              <div className="text-center md:text-left">
                <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-2">Of Every Order</p>
                <p className="text-2xl md:text-3xl">Funds survivor healing programs</p>
              </div>
            </div>
          </ScrollReveal>

          <StaggerReveal staggerDelay={120} animation="blur-up" duration={900} threshold={0.2}>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {impactAreas.map((area, i) => (
                <div key={i} className="card-premium p-8 border border-white/10 bg-neutral-900/50">
                  <div className="w-8 h-[1px] bg-[var(--accent)]/30 mx-auto mb-4" />
                  <p className="text-2xl font-bebas mb-3">{area.title}</p>
                  <p className="text-white/50">{area.desc}</p>
                </div>
              ))}
            </div>
          </StaggerReveal>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* The Story */}
      <section className="py-32 md:py-44 px-6 bg-black border-y border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal animation="fade-up" delay={0} duration={800}>
            <h2 className="text-4xl md:text-5xl tracking-tight mb-8 font-bebas">
              Why This Matters
            </h2>
          </ScrollReveal>

          <div className="space-y-6 text-lg text-white/50 leading-relaxed">
            <ScrollReveal animation="slide-left" delay={100} duration={900}>
              <p>
                Sexual abuse affects 1 in 3 women and 1 in 6 men. The journey to healing is long, expensive, and often isolating. Many survivors never get the support they need.
              </p>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={100} duration={800}>
              <p>
                We started DYMNDS because we believe in the power of community. When you wear our gear, you&apos;re not just investing in premium activewear—you&apos;re joining a movement of people who believe in lifting others as we lift ourselves.
              </p>
            </ScrollReveal>

            <ScrollReveal animation="blur-up" delay={100} duration={1000}>
              <p className="text-white">
                Every purchase creates a ripple effect. Your $89 Compression Tee funds a therapy session. Your $149 Heavy Hoodie provides a night of safe housing. Your choice to wear DYMNDS helps someone reclaim their strength.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* The Pledge */}
      <section className="py-20 md:py-28 px-6 bg-neutral-950">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal animation="fade-up" delay={0} duration={800}>
            <h2 className="text-3xl md:text-4xl tracking-tight mb-4 font-bebas">
              The Pledge
            </h2>
            <p className="text-white/50 mb-12 max-w-2xl mx-auto">
              Every single order contributes to survivor healing from day one. No minimum threshold, no waiting period, no exceptions.
            </p>
          </ScrollReveal>

          <ScrollReveal animation="scale" delay={100} duration={1000} threshold={0.3}>
            <div className="border-accent-glow p-12 text-center max-w-lg mx-auto">
              <p className="text-5xl md:text-6xl font-bebas mb-3 text-accent-gradient">Day One</p>
              <p className="text-white/60 font-medium mb-2">Impact Starts Immediately</p>
              <p className="text-white/30 text-sm">Your first order funds healing. Your second compounds it. Every purchase after that builds a movement.</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* The Commitment */}
      <section className="py-28 md:py-36 px-6 bg-neutral-950">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal animation="fade-up" delay={0} duration={800}>
            <h2 className="text-3xl md:text-4xl tracking-tight mb-12 text-center font-bebas">
              Our Commitment From Day One
            </h2>
          </ScrollReveal>

          <StaggerReveal staggerDelay={100} animation="scale" duration={1000} threshold={0.3}>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="card-premium p-8 border border-white/10 bg-neutral-900/30">
                <p className="text-5xl md:text-6xl font-bebas mb-3">
                  <AnimatedCounter end={10} suffix="%" duration={2000} className="font-bebas" />
                </p>
                <p className="text-white/60 font-medium mb-1">Of Every Order</p>
                <p className="text-white/30 text-sm">Goes directly to survivor programs. No exceptions. No delays.</p>
              </div>

              <div className="card-premium p-8 border border-white/10 bg-neutral-900/30">
                <p className="text-5xl md:text-6xl font-bebas mb-3">
                  <AnimatedCounter end={1} suffix="M+" prefix="$" duration={2000} className="font-bebas" />
                </p>
                <p className="text-white/60 font-medium mb-1">Our Goal by 2030</p>
                <p className="text-white/30 text-sm">In donations to therapy, housing, and healing programs. A target to pursue.</p>
              </div>

              <div className="card-premium p-8 border border-white/10 bg-neutral-900/30">
                <p className="text-5xl md:text-6xl font-bebas mb-3">
                  <AnimatedCounter end={100} suffix="%" duration={2000} className="font-bebas" />
                </p>
                <p className="text-white/60 font-medium mb-1">Transparency</p>
                <p className="text-white/30 text-sm">We publish quarterly impact reports. Where your money goes, always.</p>
              </div>
            </div>
          </StaggerReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-36 md:py-48 px-6 bg-neutral-950">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal animation="blur-up" delay={0} duration={1000}>
            <h2 className="text-4xl md:text-5xl tracking-tight mb-4 font-bebas">
              Join The Movement
            </h2>
            <p className="text-white/50 mb-10">
              Premium quality. Real impact. Zero pretension.
            </p>
          </ScrollReveal>

          <ScrollReveal animation="scale" delay={200} duration={800}>
            <Link
              href="/shop"
              className="btn-premium inline-block px-12 py-5 bg-[var(--accent)] text-black text-xs tracking-[0.2em] uppercase hover:bg-[var(--accent-light)] transition-all"
            >
              Shop Now
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
