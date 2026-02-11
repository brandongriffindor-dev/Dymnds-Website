import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import StaggerReveal from '@/components/StaggerReveal';
import AnimatedCounter from '@/components/AnimatedCounter';

export const metadata: Metadata = {
  title: 'Our Story | DYMNDS',
  description: 'Born from the belief that pressure creates diamonds. Learn why we donate 10% of every order to survivor healing programs.',
  alternates: {
    canonical: 'https://dymnds.ca/about',
  },
};

export default function AboutPage() {
  const coreCommitments = [
    {
      title: 'Built Under Pressure',
      desc: 'Every product is engineered for those who face real challenges. Premium materials, thoughtful design, zero shortcuts. We don\'t cut corners because our community doesn\'t accept them.',
      icon: '◆',
    },
    {
      title: '10% From Day One',
      desc: 'This isn\'t a goal or an aspiration. From order one to order infinity, 10% goes directly to supporting survivors. It\'s our core mission and non-negotiable commitment.',
      icon: '◆',
    },
    {
      title: 'No Shortcuts',
      desc: 'We believe in integrity over convenience. Real impact over quick profits. DYMNDS is built on the principle that pressure creates diamonds—and we apply that to everything we do.',
      icon: '◆',
    },
  ];

  const values = [
    {
      title: 'Pressure Creates Diamonds',
      desc: 'We believe every struggle is an opportunity to become stronger. Your challenges are shaping you into something brilliant.',
    },
    {
      title: 'Give Back, Always',
      desc: '10% of every sale supports survivors. This isn\'t marketing—it\'s our core mission and non-negotiable commitment.',
    },
    {
      title: 'No Excuses, No Limits',
      desc: 'We build products for people who show up every day. Who push through when it\'s hard. Who refuse to settle.',
    },
    {
      title: 'Quality Over Hype',
      desc: 'No gimmicks. No shortcuts. Just premium materials, thoughtful design, and products that perform.',
    },
    {
      title: 'Community First',
      desc: 'DYMNDS is more than a brand—it\'s a movement of people committed to becoming their best selves.',
    },
    {
      title: 'Strength in Authenticity',
      desc: 'We celebrate real people with real stories. No filters, no pretending—just honest pursuit of growth.',
    },
  ];

  return (
    <main id="main-content" className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero — Split Layout */}
      <section className="pt-36 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_50%,rgba(200,169,126,0.04),transparent)]" />
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-end relative z-10">
          <div className="md:col-span-5">
            <ScrollReveal animation="fade-up" delay={0} duration={800}>
              <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--accent)]/40 mb-4">Our Story</p>
              <h1 className="tracking-tight font-bebas leading-[0.82]" style={{ fontSize: 'clamp(5rem, 16vw, 13rem)' }}>
                BUILT<br />UNDER<br />PRESSURE
              </h1>
              <div className="w-16 h-[1px] bg-[var(--accent)]/40 mt-8" />
            </ScrollReveal>
          </div>
          <div className="md:col-span-7">
            <ScrollReveal animation="fade-up" delay={200} duration={800}>
              <p className="text-xl md:text-2xl text-white/50 leading-relaxed">
                DYMNDS was born from a simple belief: pressure creates diamonds. And every struggle can become strength.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* The Origin - Founder's Story */}
      <section className="py-28 px-6 bg-neutral-950">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <ScrollReveal animation="fade-up" delay={0} duration={800}>
              <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-4">Brandon&apos;s Story</p>
              <h2 className="text-4xl md:text-5xl tracking-wider mb-12 font-bebas">
                The Founder&apos;s Why
              </h2>
            </ScrollReveal>

            <div className="space-y-6 text-lg opacity-80 leading-relaxed border-l-2 border-[var(--accent)]/30 pl-8">
              <ScrollReveal animation="fade-up" delay={100} duration={800}>
                <p className="italic text-white/70">
                  &ldquo;I started DYMNDS because I was tired of fitness brands that were all surface and no substance. I wanted to build something where every purchase actually meant something—where the pressure we all face could be turned into something beautiful.&rdquo;
                </p>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={200} duration={800}>
                <p className="text-white/50">
                  The gym was always more than a gym for me. It was where I processed everything — the wins, the losses, the days I didn&apos;t want to get out of bed. And I realized that if gear could be part of that identity, it should carry weight beyond the fabric.
                </p>
              </ScrollReveal>
            </div>
          </div>

          <div className="space-y-8 text-lg opacity-80 leading-relaxed">
            <ScrollReveal animation="fade-up" delay={300} duration={800}>
              <p>
                We started DYMNDS because we were tired of fitness brands that were all surface and no substance. Brands that talked about &ldquo;crushing it&rdquo; but never addressed the real pressures people face.
              </p>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={400} duration={800}>
              <p>
                The truth is, real strength isn&apos;t just about lifting weights. It&apos;s about getting back up when life knocks you down. It&apos;s about turning your struggles into your superpowers.
              </p>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={500} duration={800}>
              <p>
                That&apos;s why we chose the diamond as our symbol. Diamonds aren&apos;t born beautiful—they&apos;re forged under immense pressure, deep in the earth. They emerge transformed, brilliant, unbreakable.
              </p>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={600} duration={800}>
              <p>
                And that&apos;s why 10% of everything we make goes to supporting survivors of sexual abuse. Because we believe in helping others discover their own diamond strength.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <div className="h-20" />

      {/* Core Commitments */}
      <section className="py-28 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <ScrollReveal animation="fade-up" delay={0} duration={800}>
              <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-3">What Drives Us</p>
              <h2 className="text-4xl md:text-6xl tracking-wider font-bebas">
                Our Core Commitments
              </h2>
            </ScrollReveal>
          </div>

          <StaggerReveal staggerDelay={100} animation="fade-up" duration={800} threshold={0.2}>
            <div className="grid md:grid-cols-3 gap-8">
              {coreCommitments.map((commitment, i) => (
                <div key={i} className="card-premium p-8 bg-neutral-900 border border-white/5 hover:border-white/20 transition-all duration-500">
                  <div className="text-4xl opacity-40 mb-4">{commitment.icon}</div>
                  <h3 className="text-xl tracking-wider mb-3 font-bebas">
                    {commitment.title}
                  </h3>
                  <p className="text-sm opacity-60 leading-relaxed">{commitment.desc}</p>
                </div>
              ))}
            </div>
          </StaggerReveal>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-[var(--accent)]/10 to-transparent" />

      {/* Values */}
      <section className="py-28 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <ScrollReveal animation="fade-up" delay={0} duration={800}>
              <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-3">What We Stand For</p>
              <h2 className="text-4xl md:text-6xl tracking-wider font-bebas">
                Our Values
              </h2>
            </ScrollReveal>
          </div>

          <StaggerReveal staggerDelay={100} animation="fade-up" duration={800} threshold={0.2}>
            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value, i) => (
                <div key={i} className="card-premium p-8 bg-neutral-900 border border-white/5 hover:border-white/20 transition-all duration-500">
                  <div className="w-8 h-[1px] bg-[var(--accent)]/30 mb-4" />
                  <h3 className="text-xl tracking-wider mb-3 font-bebas">
                    {value.title}
                  </h3>
                  <p className="text-sm opacity-60 leading-relaxed">{value.desc}</p>
                </div>
              ))}
            </div>
          </StaggerReveal>
        </div>
      </section>

      <div className="h-20" />

      {/* The Vision */}
      <section className="py-28 px-6 bg-neutral-950">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal animation="fade-up" delay={0} duration={800}>
            <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-4">Where We&apos;re Going</p>
            <h2 className="text-4xl md:text-6xl tracking-wider mb-8 font-bebas">
              Our Vision
            </h2>
            <p className="text-xl opacity-70 leading-relaxed mb-12">
              We&apos;re building more than a clothing company. We&apos;re building a movement that proves business can be a force for good. Where every purchase creates real change. Where athletes support survivors. Where pressure truly creates diamonds.
            </p>
          </ScrollReveal>

          <ScrollReveal animation="scale" delay={200} duration={1000} threshold={0.3}>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-5xl md:text-6xl font-bebas mb-2">
                  <AnimatedCounter end={1} suffix="M+" prefix="$" duration={2000} className="font-bebas" />
                </p>
                <p className="text-xs tracking-widest uppercase text-white/50">Goal: Donations by 2030</p>
              </div>
              <div>
                <p className="text-5xl md:text-6xl font-bebas mb-2">
                  <AnimatedCounter end={100} suffix="K+" duration={2000} className="font-bebas" />
                </p>
                <p className="text-xs tracking-widest uppercase text-white/50">Goal: Athletes in Community</p>
              </div>
              <div>
                <p className="text-5xl md:text-6xl font-bebas mb-2">∞</p>
                <p className="text-xs tracking-widest uppercase text-white/50">Lives Changed</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-[var(--accent)]/10 to-transparent" />

      {/* Join Us CTA */}
      <section className="py-32 px-6 bg-black relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <ScrollReveal animation="fade-up" delay={0} duration={800}>
            <h2 className="text-4xl md:text-6xl tracking-wider mb-6 font-bebas">
              Join The Movement
            </h2>
            <p className="text-lg opacity-70 mb-10">
              Whether you shop, share, or just spread the word—you&apos;re part of something bigger.
            </p>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={200} duration={800}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/collections/all"
                className="btn-premium inline-block px-10 py-4 bg-[var(--accent)] text-black text-sm tracking-widest uppercase hover:bg-[var(--accent-light)] transition-all duration-300 hover:scale-105"
              >
                Shop Now
              </Link>
              <Link
                href="/impact"
                className="inline-block px-10 py-4 border border-white/40 text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300 hover:scale-105"
              >
                Our Impact
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
