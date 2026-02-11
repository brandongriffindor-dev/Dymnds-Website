import type { Metadata } from 'next';
import Image from 'next/image';
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

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal animation="fade-up" delay={0} duration={800}>
            <Image src="/diamond-white.png" alt="" width={40} height={40} className="h-10 w-auto mx-auto mb-8 opacity-30" />
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={100} duration={800}>
            <h1 className="text-6xl md:text-8xl tracking-tight mb-6 font-bebas">
              Your Purchase Has Power
            </h1>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={200} duration={800}>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">
              Every piece of DYMNDS gear helps a survivor take their first step toward healing.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Diamond Divider */}
      <div className="flex justify-center items-center py-8 px-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <Image src="/diamond-white.png" alt="" width={16} height={16} className="h-4 w-auto mx-4 opacity-30" />
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* The 10% Promise */}
      <section className="py-24 px-6 bg-neutral-950">
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

          <StaggerReveal staggerDelay={100} animation="fade-up" duration={800} threshold={0.2}>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {impactAreas.map((area, i) => (
                <div key={i} className="card-premium p-8 border border-white/10 bg-neutral-900/50">
                  <Image src="/diamond-white.png" alt="" width={24} height={24} className="h-6 w-auto opacity-60 mx-auto mb-4" />
                  <p className="text-2xl font-bebas mb-3">{area.title}</p>
                  <p className="text-white/50">{area.desc}</p>
                </div>
              ))}
            </div>
          </StaggerReveal>
        </div>
      </section>

      {/* Diamond Divider */}
      <div className="flex justify-center items-center py-8 px-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <Image src="/diamond-white.png" alt="" width={16} height={16} className="h-4 w-auto mx-4 opacity-30" />
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* The Story */}
      <section className="py-24 px-6 bg-black border-y border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal animation="fade-up" delay={0} duration={800}>
            <h2 className="text-4xl md:text-5xl tracking-tight mb-8 font-bebas">
              Why This Matters
            </h2>
          </ScrollReveal>

          <div className="space-y-6 text-lg text-white/50 leading-relaxed">
            <ScrollReveal animation="fade-up" delay={100} duration={800}>
              <p>
                Sexual abuse affects 1 in 3 women and 1 in 6 men. The journey to healing is long, expensive, and often isolating. Many survivors never get the support they need.
              </p>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={200} duration={800}>
              <p>
                We started DYMNDS because we believe in the power of community. When you wear our gear, you&apos;re not just investing in premium activewear—you&apos;re joining a movement of people who believe in lifting others as we lift ourselves.
              </p>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={300} duration={800}>
              <p className="text-white">
                Every purchase creates a ripple effect. Your $89 Compression Tee funds a therapy session. Your $149 Heavy Hoodie provides a night of safe housing. Your choice to wear DYMNDS helps someone reclaim their strength.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Diamond Divider */}
      <div className="flex justify-center items-center py-8 px-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <Image src="/diamond-white.png" alt="" width={16} height={16} className="h-4 w-auto mx-4 opacity-30" />
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Real Impact - So Far */}
      <section className="py-24 px-6 bg-neutral-950">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal animation="fade-up" delay={0} duration={800}>
            <h2 className="text-3xl md:text-4xl tracking-tight mb-4 text-center font-bebas">
              So Far
            </h2>
            <p className="text-center text-white/50 mb-12">The real numbers. No inflated claims. Every dollar accounted for.</p>
          </ScrollReveal>

          <StaggerReveal staggerDelay={100} animation="scale" duration={1000} threshold={0.3}>
            <div className="grid md:grid-cols-2 gap-8 text-center mb-8">
              <div className="card-premium p-12 border border-white/10 bg-neutral-900/30">
                <p className="text-6xl md:text-7xl font-bebas mb-3">
                  <AnimatedCounter end={0} prefix="$" duration={2000} className="font-bebas" />
                </p>
                <p className="text-white/60 font-medium mb-2">Total Donated</p>
                <p className="text-white/30 text-sm">Every order moves this number</p>
              </div>

              <div className="card-premium p-12 border border-white/10 bg-neutral-900/30">
                <p className="text-6xl md:text-7xl font-bebas mb-3">
                  <AnimatedCounter end={0} duration={2000} className="font-bebas" />
                </p>
                <p className="text-white/60 font-medium mb-2">Orders Placed</p>
                <p className="text-white/30 text-sm">Each one creates real healing support</p>
              </div>
            </div>

            <div className="p-8 border border-white/10 bg-neutral-900/20 text-center">
              <p className="text-white/40 text-sm mb-2">REAL-TIME IMPACT TRACKER</p>
              <p className="text-white/50">We&apos;re just getting started. As orders come in, this dashboard will update in real time. You&apos;ll see exactly where your money goes—down to the dollar.</p>
            </div>
          </StaggerReveal>
        </div>
      </section>

      {/* Diamond Divider */}
      <div className="flex justify-center items-center py-8 px-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <Image src="/diamond-white.png" alt="" width={16} height={16} className="h-4 w-auto mx-4 opacity-30" />
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* The Commitment */}
      <section className="py-24 px-6 bg-neutral-950">
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

      {/* Diamond Divider */}
      <div className="flex justify-center items-center py-8 px-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <Image src="/diamond-white.png" alt="" width={16} height={16} className="h-4 w-auto mx-4 opacity-30" />
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Partner Organizations */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal animation="fade-up" delay={0} duration={800}>
            <h2 className="text-3xl md:text-4xl tracking-tight mb-6 font-bebas">
              Our Partners
            </h2>
            <p className="text-white/50 mb-12 max-w-2xl mx-auto">
              We partner with verified organizations dedicated to survivor support and advocacy.
            </p>
            <div className="p-12 border border-white/10 border-dashed">
              <p className="text-white/30 italic">
                Partner organizations to be announced soon.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Diamond Divider */}
      <div className="flex justify-center items-center py-8 px-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <Image src="/diamond-white.png" alt="" width={16} height={16} className="h-4 w-auto mx-4 opacity-30" />
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* CTA */}
      <section className="py-32 px-6 bg-neutral-950">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal animation="fade-up" delay={0} duration={800}>
            <Image src="/diamond-white.png" alt="" width={32} height={32} className="h-8 w-auto mx-auto mb-8 opacity-30" />
            <h2 className="text-4xl md:text-5xl tracking-tight mb-4 font-bebas">
              Join The Movement
            </h2>
            <p className="text-white/50 mb-10">
              Premium quality. Real impact. Zero pretension.
            </p>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={200} duration={800}>
            <Link
              href="/shop"
              className="btn-premium inline-block px-12 py-5 bg-white text-black text-xs tracking-[0.2em] uppercase hover:bg-white/90 transition-all"
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
