'use client';

import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import StaggerReveal from '@/components/StaggerReveal';
import { useState } from 'react';
import Link from 'next/link';

export default function SizeGuidePage() {
  const [unit, setUnit] = useState<'imperial' | 'metric'>('imperial');

  const sizeChart = {
    tops: [
      { size: 'XS', chest: '32-34"', waist: '26-28"', chestCm: '81-86 cm', waistCm: '66-71 cm' },
      { size: 'S', chest: '35-37"', waist: '29-31"', chestCm: '89-94 cm', waistCm: '74-79 cm' },
      { size: 'M', chest: '38-40"', waist: '32-34"', chestCm: '97-102 cm', waistCm: '81-86 cm' },
      { size: 'L', chest: '41-43"', waist: '35-37"', chestCm: '104-109 cm', waistCm: '89-94 cm' },
      { size: 'XL', chest: '44-46"', waist: '38-40"', chestCm: '112-117 cm', waistCm: '97-102 cm' },
      { size: 'XXL', chest: '47-49"', waist: '41-43"', chestCm: '119-124 cm', waistCm: '104-109 cm' },
    ],
    bottoms: [
      { size: 'XS', waist: '26-28"', hip: '32-34"', waistCm: '66-71 cm', hipCm: '81-86 cm' },
      { size: 'S', waist: '29-31"', hip: '35-37"', waistCm: '74-79 cm', hipCm: '89-94 cm' },
      { size: 'M', waist: '32-34"', hip: '38-40"', waistCm: '81-86 cm', hipCm: '97-102 cm' },
      { size: 'L', waist: '35-37"', hip: '41-43"', waistCm: '89-94 cm', hipCm: '104-109 cm' },
      { size: 'XL', waist: '38-40"', hip: '44-46"', waistCm: '97-102 cm', hipCm: '112-117 cm' },
      { size: 'XXL', waist: '41-43"', hip: '47-49"', waistCm: '104-109 cm', hipCm: '119-124 cm' },
    ],
  };

  return (
    <main id="main-content" className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal animation="fade-up" delay={0} duration={600}>
            <Image
              src="/diamond-white.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-auto mx-auto mb-8 opacity-30"
            />
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={100} duration={600}>
            <h1 className="text-6xl md:text-8xl font-bebas tracking-tight mb-6">
              SIZE GUIDE
            </h1>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={200} duration={600}>
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Find your perfect fit. Measure twice, order once with confidence.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* How to Measure */}
      <section className="py-24 px-6 bg-neutral-950 border-y border-white/10">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal animation="fade-up" delay={0} duration={600} className="text-center mb-12">
            <h2 className="text-2xl font-bebas tracking-wider">
              How To Measure
            </h2>
          </ScrollReveal>

          <StaggerReveal
            staggerDelay={80}
            animation="fade-up"
            duration={600}
            threshold={0.2}
            className="grid md:grid-cols-3 gap-8"
          >
            {/* Chest */}
            <div className="card-premium p-8 border border-white/10 text-center">
              <h3 className="text-lg font-bebas tracking-wider mb-4">Chest</h3>
              <p className="text-white/70 leading-relaxed">
                Measure around the fullest part of your chest, keeping the measuring tape horizontal and snug.
              </p>
            </div>

            {/* Waist */}
            <div className="card-premium p-8 border border-white/10 text-center">
              <h3 className="text-lg font-bebas tracking-wider mb-4">Waist</h3>
              <p className="text-white/70 leading-relaxed">
                Measure around your natural waistline, typically where your pants normally sit.
              </p>
            </div>

            {/* Hips */}
            <div className="card-premium p-8 border border-white/10 text-center">
              <h3 className="text-lg font-bebas tracking-wider mb-4">Hips</h3>
              <p className="text-white/70 leading-relaxed">
                Measure around the fullest part of your hips, keeping the tape horizontal and level.
              </p>
            </div>
          </StaggerReveal>
        </div>
      </section>

      {/* Size Charts */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Unit Toggle */}
          <ScrollReveal animation="fade-up" delay={0} duration={600} className="mb-12">
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/60 uppercase tracking-wide">Measurements:</span>
              <div className="flex gap-3 bg-white/5 p-1 rounded border border-white/10">
                <button
                  onClick={() => setUnit('imperial')}
                  className={`px-4 py-2 rounded text-xs uppercase tracking-wider font-medium transition-all ${
                    unit === 'imperial'
                      ? 'bg-white text-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Inches
                </button>
                <button
                  onClick={() => setUnit('metric')}
                  className={`px-4 py-2 rounded text-xs uppercase tracking-wider font-medium transition-all ${
                    unit === 'metric'
                      ? 'bg-white text-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Centimeters
                </button>
              </div>
            </div>
          </ScrollReveal>

          {/* Tops Chart */}
          <ScrollReveal animation="fade-up" delay={0} duration={600} className="mb-16">
            <h2 className="text-2xl font-bebas tracking-wider mb-8">
              Tops & Hoodies
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40 font-medium">
                      Size
                    </th>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40 font-medium">
                      {unit === 'imperial' ? 'Chest' : 'Chest'}
                    </th>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40 font-medium">
                      {unit === 'imperial' ? 'Waist' : 'Waist'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sizeChart.tops.map((row) => (
                    <tr
                      key={row.size}
                      className="border-b border-white/8 hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="p-4 font-medium text-white">{row.size}</td>
                      <td className="p-4 text-white/70">{unit === 'imperial' ? row.chest : row.chestCm}</td>
                      <td className="p-4 text-white/70">{unit === 'imperial' ? row.waist : row.waistCm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>

          {/* Bottoms Chart */}
          <ScrollReveal animation="fade-up" delay={100} duration={600} className="mb-16">
            <h2 className="text-2xl font-bebas tracking-wider mb-8">
              Bottoms & Leggings
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40 font-medium">
                      Size
                    </th>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40 font-medium">
                      {unit === 'imperial' ? 'Waist' : 'Waist'}
                    </th>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40 font-medium">
                      {unit === 'imperial' ? 'Hip' : 'Hip'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sizeChart.bottoms.map((row) => (
                    <tr
                      key={row.size}
                      className="border-b border-white/8 hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="p-4 font-medium text-white">{row.size}</td>
                      <td className="p-4 text-white/70">{unit === 'imperial' ? row.waist : row.waistCm}</td>
                      <td className="p-4 text-white/70">{unit === 'imperial' ? row.hip : row.hipCm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>

          {/* Fit Tips */}
          <ScrollReveal animation="fade-up" delay={200} duration={600}>
            <div className="card-premium p-8 border border-white/10">
              <h3 className="text-xl font-bebas tracking-wider mb-8">
                Fit Tips
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-bebas tracking-wide uppercase text-white mb-3">
                    Compression Fit
                  </h4>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Our compression gear is designed to fit tight to your body. If you&apos;re between sizes, size up for a more comfortable fit or size down for maximum compression performance.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bebas tracking-wide uppercase text-white mb-3">
                    Relaxed Fit
                  </h4>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Hoodies, joggers, and casual wear have a relaxed fit. Order your normal size for the intended aesthetic and comfort level.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bebas tracking-wide uppercase text-white mb-3">
                    Stretch Factor
                  </h4>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Our 4-way stretch fabrics provide maximum flexibility. The garment will conform to your body shape after a few wears.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bebas tracking-wide uppercase text-white mb-3">
                    Still Unsure?
                  </h4>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Use the size calculator on any product page or email us for personalized sizing assistance.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Calculator CTA */}
      <section className="py-24 px-6 bg-neutral-950 border-t border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal animation="fade-up" delay={0} duration={600}>
            <h2 className="text-2xl font-bebas tracking-wider mb-6">
              Use Our Size Calculator
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              Every product page includes an interactive size calculator. Enter your measurements and we&apos;ll recommend the perfect size for you.
            </p>
            <Link
              href="/collections/all"
              className="btn-premium inline-block px-8 py-4 bg-white text-black font-bold tracking-wider uppercase rounded-lg hover:bg-white/90 transition-colors"
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
