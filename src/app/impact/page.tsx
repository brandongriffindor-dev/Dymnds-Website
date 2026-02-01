'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ImpactPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <img src="/diamond-white.png" alt="" className="h-10 w-auto mx-auto mb-8 opacity-30" />
          <h1 className="text-6xl md:text-8xl font-light tracking-tight mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Your Purchase Has Power
          </h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto">
            Every piece of Dymnds gear helps a survivor take their first step toward healing.
          </p>
        </div>
      </section>

      {/* The 10% Promise */}
      <section className="py-24 px-6 bg-neutral-950">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mb-16">
            <span className="text-8xl md:text-9xl font-light" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>10%</span>
            <div className="text-center md:text-left">
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-2">Of Every Order</p>
              <p className="text-2xl md:text-3xl">Funds survivor healing programs</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-8 border border-white/10">
              <p className="text-4xl font-light mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Therapy</p>
              <p className="text-white/50">One-on-one counseling sessions for survivors on their healing journey.</p>
            </div>
            <div className="p-8 border border-white/10">
              <p className="text-4xl font-light mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Safe Housing</p>
              <p className="text-white/50">Emergency shelter and transitional housing for those escaping abuse.</p>
            </div>
            <div className="p-8 border border-white/10">
              <p className="text-4xl font-light mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Support Groups</p>
              <p className="text-white/50">Community healing through peer support and group therapy sessions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Story */}
      <section className="py-24 px-6 bg-black border-y border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Why This Matters
          </h2>
          <div className="space-y-6 text-lg text-white/50 leading-relaxed">
            <p>
              Sexual abuse affects 1 in 3 women and 1 in 6 men. The journey to healing is long, 
              expensive, and often isolating. Many survivors never get the support they need.
            </p>
            <p>
              We started Dymnds because we believe in the power of community. When you wear our gear, 
              you're not just investing in premium activewear—you're joining a movement of people 
              who believe in lifting others as we lift ourselves.
            </p>
            <p className="text-white">
              Every purchase creates a ripple effect. Your $89 Compression Tee funds a therapy session. 
              Your $149 Heavy Hoodie provides a night of safe housing. Your choice to wear Dymnds 
              helps someone reclaim their strength.
            </p>
          </div>
        </div>
      </section>

      {/* Impact Counter */}
      <section className="py-24 px-6 bg-neutral-950">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-5xl md:text-6xl font-light mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>$0</p>
              <p className="text-white/40">Donated to date</p>
            </div>
            <div>
              <p className="text-5xl md:text-6xl font-light mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>0</p>
              <p className="text-white/40">Survivors supported</p>
            </div>
            <div>
              <p className="text-5xl md:text-6xl font-light mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>0</p>
              <p className="text-white/40">Therapy sessions funded</p>
            </div>
          </div>
          <p className="text-center text-white/30 text-sm mt-8">
            *Counters will update after February 25, 2026 launch
          </p>
        </div>
      </section>

      {/* Partner Organizations */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Our Partners
          </h2>
          <p className="text-white/50 mb-12 max-w-2xl mx-auto">
            We partner with verified organizations dedicated to survivor support and advocacy.
          </p>
          <div className="p-12 border border-white/10 border-dashed">
            <p className="text-white/30 italic">
              Partner organizations to be announced at launch.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 bg-neutral-950">
        <div className="max-w-2xl mx-auto text-center">
          <img src="/diamond-white.png" alt="" className="h-8 w-auto mx-auto mb-8 opacity-30" />
          <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Join The Movement
          </h2>
          <p className="text-white/50 mb-10">
            Premium quality. Real impact. Zero pretension.
          </p>
          <Link
            href="/shop"
            className="inline-block px-12 py-5 bg-white text-black text-xs tracking-[0.2em] uppercase hover:bg-white/90 transition-all"
          >
            Shop Now
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
