'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 min-h-[60vh] flex items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto px-6 py-24 text-center relative z-10">
          <img src="/diamond-white.png" alt="DYMNDS" className="h-16 w-auto mx-auto mb-8 opacity-60" />
          
          <h1 className="text-5xl md:text-8xl tracking-wider mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Our Story
          </h1>
          
          <p className="text-xl md:text-2xl opacity-70 max-w-3xl mx-auto leading-relaxed">
            DYMNDS was born from a simple belief: pressure creates diamonds. And every struggle can become strength.
          </p>
        </div>
      </section>

      {/* The Origin */}
      <section className="py-24 px-6 bg-neutral-950">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8 text-lg opacity-80 leading-relaxed">
            <p>
              We started DYMNDS because we were tired of fitness brands that were all surface and no substance. Brands that talked about &ldquo;crushing it&rdquo; but never addressed the real pressures people face.
            </p>
            <p>
              The truth is, real strength isn&apos;t just about lifting weights. It&apos;s about getting back up when life knocks you down. It&apos;s about turning your struggles into your superpowers.
            </p>
            <p>
              That&apos;s why we chose the diamond as our symbol. Diamonds aren&apos;t born beautiful—they&apos;re forged under immense pressure, deep in the earth. They emerge transformed, brilliant, unbreakable.
            </p>
            <p>
              And that&apos;s why 10% of everything we make goes to supporting survivors of sexual abuse. Because we believe in helping others discover their own diamond strength.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-3">What We Stand For</p>
            <h2 className="text-4xl md:text-6xl tracking-wider" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              Our Values
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '💎',
                title: 'Pressure Creates Diamonds',
                desc: 'We believe every struggle is an opportunity to become stronger. Your challenges are shaping you into something brilliant.',
              },
              {
                icon: '🤝',
                title: 'Give Back, Always',
                desc: '10% of every sale supports survivors. This isn\'t marketing—it\'s our core mission and non-negotiable commitment.',
              },
              {
                icon: '⚡',
                title: 'No Excuses, No Limits',
                desc: 'We build products for people who show up every day. Who push through when it\'s hard. Who refuse to settle.',
              },
              {
                icon: '🎯',
                title: 'Quality Over Hype',
                desc: 'No gimmicks. No shortcuts. Just premium materials, thoughtful design, and products that perform.',
              },
              {
                icon: '🌍',
                title: 'Community First',
                desc: 'DYMNDS is more than a brand—it\'s a movement of people committed to becoming their best selves.',
              },
              {
                icon: '💪',
                title: 'Strength in Authenticity',
                desc: 'We celebrate real people with real stories. No filters, no pretending—just honest pursuit of growth.',
              },
            ].map((value, i) => (
              <div key={i} className="p-8 bg-neutral-900 border border-white/5 hover:border-white/20 transition-all duration-500">
                <span className="text-4xl mb-4 block">{value.icon}</span>
                <h3 className="text-xl tracking-wider mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  {value.title}
                </h3>
                <p className="text-sm opacity-60 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Vision */}
      <section className="py-24 px-6 bg-neutral-950">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-4">Where We're Going</p>
          <h2 className="text-4xl md:text-6xl tracking-wider mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Our Vision
          </h2>
          <p className="text-xl opacity-70 leading-relaxed mb-12">
            We&apos;re building more than a clothing company. We&apos;re building a movement that proves business can be a force for good. Where every purchase creates real change. Where athletes support survivors. Where pressure truly creates diamonds.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold mb-2">$1M+</p>
              <p className="text-xs tracking-widest uppercase text-white/50">Goal: Donations by 2030</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">100K+</p>
              <p className="text-xs tracking-widest uppercase text-white/50">Goal: Athletes in Community</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">∞</p>
              <p className="text-xs tracking-widest uppercase text-white/50">Lives Changed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Us CTA */}
      <section className="py-32 px-6 bg-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <img src="/diamond-white.png" alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-auto" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl tracking-wider mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Join The Movement
          </h2>
          <p className="text-lg opacity-70 mb-10">
            Whether you shop, share, or just spread the word—you&apos;re part of something bigger.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/collections/all"
              className="inline-block px-10 py-4 bg-white text-black text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300 hover:scale-105"
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
        </div>
      </section>

      <Footer />
    </main>
  );
}