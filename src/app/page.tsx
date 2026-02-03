'use client';

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AppWaitlistForm from "@/components/AppWaitlistForm";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import type { Product } from "@/lib/firebase";

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [menFeatured, setMenFeatured] = useState<Product[]>([]);
  const [womenFeatured, setWomenFeatured] = useState<Product[]>([]);

  useEffect(() => {
    setLoaded(true);
    
    // Fetch featured products
    const fetchFeatured = async () => {
      try {
        // Men's featured
        const menQuery = query(
          collection(db, 'products'), 
          where('category', '==', 'Men'),
          where('featured', '==', true),
          orderBy('displayOrder', 'asc'),
          limit(3)
        );
        const menSnap = await getDocs(menQuery);
        const menData = menSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setMenFeatured(menData);
        
        // Women's featured
        const womenQuery = query(
          collection(db, 'products'), 
          where('category', '==', 'Women'),
          where('featured', '==', true),
          orderBy('displayOrder', 'asc'),
          limit(3)
        );
        const womenSnap = await getDocs(womenQuery);
        const womenData = womenSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setWomenFeatured(womenData);
      } catch (err) {
        console.error('Error fetching featured products:', err);
      }
    };
    
    fetchFeatured();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar />

      {/* Hero - Pure Black */}
      <section className="h-screen w-full flex flex-col items-center justify-center px-6 relative">
        <div className="text-center max-w-4xl">
          {/* Logo */}
          <img 
            src="/dymnds-logo-white.png" 
            alt="DYMNDS" 
            className={`w-[90vw] max-w-[840px] mx-auto mb-10 transition-all duration-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          />
          
          {/* Diamond */}
          <img 
            src="/diamond-white.png" 
            alt="" 
            className={`h-10 w-auto mx-auto mb-10 opacity-50 transition-all duration-1000 delay-200 ${loaded ? 'opacity-50 translate-y-0' : 'opacity-0 translate-y-8'}`}
          />

          {/* Tagline */}
          <p className={`text-lg md:text-xl font-light tracking-wide text-white/70 mb-3 transition-all duration-1000 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Premium activewear
          </p>
          <p className={`text-lg md:text-xl font-light italic text-white/50 mb-12 transition-all duration-1000 delay-400 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            for those who believe looking good and doing good are the same thing
          </p>

          {/* CTAs */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Link 
              href="/collections/men"
              className="px-10 py-4 border border-white text-white text-xs tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all hover:scale-105"
            >
              Shop Men
            </Link>
            <Link 
              href="/collections/women"
              className="px-10 py-4 bg-white text-black text-xs tracking-[0.2em] uppercase hover:bg-white/90 transition-all hover:scale-105"
            >
              Shop Women
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-30">
          <span className="text-[10px] tracking-[0.3em] uppercase">Discover</span>
          <div className="w-px h-10 bg-gradient-to-b from-white to-transparent" />
        </div>
      </section>

      {/* The Story */}
      <section className="py-32 px-6 bg-black border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <img src="/diamond-white.png" alt="" className="h-8 w-auto mx-auto mb-12 opacity-25" />
          
          <h2 className="text-6xl md:text-8xl font-light tracking-tight mb-10" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Pressure Creates Diamonds
          </h2>
          
          <div className="space-y-8 text-lg md:text-xl text-white/50 leading-relaxed">
            <p>
              Just like a diamond forms under intense heat and pressure, 
              strength emerges from struggle.
            </p>
            <p>
              Our clothes are built for your hardest workouts—and your comeback stories. 
              For the mornings you don't feel like showing up. 
              For the moments when simply being here is the victory.
            </p>
            <p className="text-white">
              And because we believe in lifting others as we lift ourselves,
              <span className="font-semibold"> 10% of every purchase</span> supports survivors 
              on their journey from darkness to light.
            </p>
          </div>
        </div>
      </section>

      {/* Men's Collection Preview */}
      <section id="men" className="py-24 px-6 bg-neutral-950">
        <div className="max-w-6xl mx-auto">
          <div className={`flex items-end justify-between mb-12 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-2">The Collection</p>
              <h2 className="text-5xl md:text-6xl font-light tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                For Him
              </h2>
            </div>
            <Link href="/collections/men" className="text-xs tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors border-b border-white/20 pb-1">
              View All →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {menFeatured.length > 0 ? (
              menFeatured.map((product, index) => (
                <Link key={product.id} href={`/products/${product.slug}`} className={`group transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${index * 100 + 200}ms` }}>
                  <div className="aspect-[4/5] bg-neutral-900 mb-6 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all duration-500 group-hover:scale-[1.02]">
                    <img src="/diamond-white.png" alt="" className="w-12 h-12 opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                  </div>
                  <h3 className="text-xl tracking-wide mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    {product.title}
                  </h3>
                  <p className="text-white/40 text-sm mb-2">{product.subtitle}</p>
                  <p className="text-lg">${product.price}</p>
                </Link>
              ))
            ) : (
              // Fallback placeholder when no featured products
              <div className="col-span-3 text-center py-12">
                <p className="text-white/40">⭐ Star products in admin to feature them here</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Women's Collection Preview */}
      <section id="women" className="py-24 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className={`flex items-end justify-between mb-12 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-2">The Collection</p>
              <h2 className="text-5xl md:text-6xl font-light tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                For Her
              </h2>
            </div>
            <Link href="/collections/women" className="text-xs tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors border-b border-white/20 pb-1">
              View All →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {womenFeatured.length > 0 ? (
              womenFeatured.map((product, index) => (
                <Link key={product.id} href={`/products/${product.slug}`} className={`group transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${index * 100 + 200}ms` }}>
                  <div className="aspect-[4/5] bg-neutral-900 mb-5 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all duration-500 group-hover:scale-[1.02]">
                    <img src="/diamond-white.png" alt="" className="w-14 h-14 opacity-15 group-hover:opacity-40 transition-opacity duration-500" />
                  </div>
                  <h3 className="text-lg tracking-wide mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    {product.title}
                  </h3>
                  <p className="text-white/30 text-sm mb-2">{product.subtitle}</p>
                  <p className="text-base">${product.price}</p>
                </Link>
              ))
            ) : (
              // Fallback placeholder when no featured products
              <div className="col-span-3 text-center py-12">
                <p className="text-white/40">⭐ Star products in admin to feature them here</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-32 px-6 bg-neutral-950 border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex flex-col md:flex-row items-center gap-8 md:gap-12 px-10 md:px-16 py-10 border border-white/10">
            <span className="text-6xl md:text-7xl font-light" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>10%</span>
            <div className="text-left">
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-2">Of Every Order</p>
              <p className="text-lg md:text-xl">Funds therapy, safe housing, and healing programs for survivors</p>
            </div>
          </div>

          <p className="mt-12 text-white/40 leading-relaxed max-w-2xl mx-auto text-lg">
            When you choose Dymnds, you're not just buying premium gear—you're helping someone 
            take their first step toward recovery. Every thread has a purpose. Every purchase has power.
          </p>

          <p className="mt-8 text-xl md:text-2xl italic text-white/70">
            When you wear Dymnds, you help others shine.
          </p>

          <Link href="/impact" className="inline-block mt-10 text-xs tracking-[0.2em] uppercase text-white/50 hover:text-white transition-colors border-b border-white/20 pb-1">
            See The Impact
          </Link>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-3xl mx-auto text-center">
          <img src="/diamond-white.png" alt="" className="h-6 w-auto mx-auto mb-10 opacity-20" />
          <blockquote className="text-2xl md:text-3xl font-light italic leading-relaxed mb-8 text-white/80">
            "Every time I wear my Dymnds, I remember that my purchase helped someone heal. 
            It makes every rep, every mile, every drop of sweat mean something more."
          </blockquote>
          <cite className="text-sm text-white/40 not-italic tracking-wide">
            — Dymnds Customer
          </cite>
        </div>
      </section>

      {/* App Showcase - Full Feature Section */}
      <section className="py-24 px-6 bg-neutral-950 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="text-[10px] tracking-[0.3em] uppercase text-green-400 mb-4">Completely Free For Everyone</p>
            <h2 className="text-5xl md:text-6xl font-light tracking-tight mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              Your Personal Coach
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Stop paying for workout apps. The Dymnds app gives you a premium fitness tracker—rep counter, nutrition logging, and progress analytics—<span className="text-white">completely free</span>. No purchase required.
            </p>
          </div>

          {/* App Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { 
                icon: '💪', 
                title: 'Rep Counter', 
                desc: 'Auto-counts your reps using motion detection. No manual logging.' 
              },
              { 
                icon: '📊', 
                title: 'Workout Tracking', 
                desc: 'Log sets, weights, and exercises. Track PRs and progress over time.' 
              },
              { 
                icon: '🥗', 
                title: 'Nutrition Logging', 
                desc: 'Track macros and calories. Barcode scanner for easy food entry.' 
              },
              { 
                icon: '📈', 
                title: 'Progress Analytics', 
                desc: 'Visual charts showing strength gains, body composition, and consistency.' 
              },
            ].map((feature, index) => (
              <div key={feature.title} className="p-6 bg-black/30 border border-white/10 rounded-xl hover:border-white/20 transition-all group">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg tracking-wide mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  {feature.title}
                </h3>
                <p className="text-white/50 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* App Comparison */}
          <div className="bg-black/30 border border-white/10 rounded-2xl p-8 md:p-12 mb-12">
            <h3 className="text-2xl md:text-3xl font-light tracking-tight mb-8 text-center" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              Why Pay For Apps When Dymnds Gives You Everything For Free? And More...
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Competitor 1 */}
              <div className="p-6 border border-white/10 rounded-xl opacity-50">
                <p className="text-lg font-medium mb-2">MyFitnessPal</p>
                <p className="text-2xl font-bebas mb-4">$19.99/mo</p>
                <ul className="text-sm text-white/40 space-y-2">
                  <li>✓ Nutrition tracking</li>
                  <li>✓ Barcode scanner</li>
                  <li>✗ No workout logging</li>
                  <li>✗ No rep counting</li>
                </ul>
              </div>

              {/* Competitor 2 */}
              <div className="p-6 border border-white/10 rounded-xl opacity-50">
                <p className="text-lg font-medium mb-2">Hevy</p>
                <p className="text-2xl font-bebas mb-4">$9.99/mo</p>
                <ul className="text-sm text-white/40 space-y-2">
                  <li>✓ Workout logging</li>
                  <li>✓ Exercise database</li>
                  <li>✗ No nutrition tracking</li>
                  <li>✗ No rep counter</li>
                </ul>
              </div>

              {/* Dymnds App */}
              <div className="p-6 border-2 border-green-500/50 rounded-xl bg-green-500/5">
                <p className="text-lg font-medium mb-2 text-green-400">Dymnds App</p>
                <p className="text-2xl font-bebas mb-4 text-green-400">FREE</p>
                <ul className="text-sm text-white/70 space-y-2">
                  <li>✓ Nutrition tracking</li>
                  <li>✓ Workout logging</li>
                  <li>✓ Auto rep counter</li>
                  <li>✓ Progress analytics</li>
                  <li>✓ Barcode scanner</li>
                  <li>✓ All features unlocked</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-white/50 mb-6">Download the Dymnds app today—completely free, no strings attached. It's our gift to the fitness community.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setShowWaitlist(true)}
                className="px-10 py-4 bg-white text-black text-xs tracking-[0.2em] uppercase hover:bg-white/90 transition-all hover:scale-105"
              >
                Download Free App
              </button>
              <Link 
                href="/shop" 
                className="px-10 py-4 border border-white/30 text-white text-xs tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all"
              >
                Shop Dymnds Gear
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-black">
        <div className="max-w-2xl mx-auto text-center">
          <img src="/diamond-white.png" alt="" className="h-10 w-auto mx-auto mb-8 opacity-30" />
          <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Wear The Change
          </h2>
          <p className="text-white/40 mb-12 text-lg">
            Premium quality. Real impact. Zero pretension.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/collections/men" className="px-10 py-4 border border-white text-white text-xs tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all">
              Shop Men
            </Link>
            <Link href="/collections/women" className="px-10 py-4 bg-white text-black text-xs tracking-[0.2em] uppercase hover:bg-white/90 transition-all">
              Shop Women
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* App Waitlist Modal */}
      {showWaitlist && <AppWaitlistForm onClose={() => setShowWaitlist(false)} />}
    </main>
  );
}
