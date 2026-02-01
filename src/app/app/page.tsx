'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";

const features = [
  {
    icon: '💪',
    title: 'Workout Tracking',
    description: 'Log every rep, set, and PR. Track your progress with detailed analytics and charts.',
  },
  {
    icon: '🍎',
    title: 'Nutrition Logging',
    description: 'Scan barcodes, track macros, and hit your nutrition goals with our comprehensive food database.',
  },
  {
    icon: '🏆',
    title: 'Achievements',
    description: 'Unlock badges and achievements as you crush your goals. Bronze, silver, gold, and diamond tiers.',
  },
  {
    icon: '🔥',
    title: 'Streak System',
    description: 'Build consistency with workout streaks. Never break the chain.',
  },
  {
    icon: '👥',
    title: 'Challenge Friends',
    description: 'Compete with friends on workouts, steps, and more. Push each other to be better.',
  },
  {
    icon: '📊',
    title: 'Progress Photos',
    description: 'Document your transformation with progress photos and side-by-side comparisons.',
  },
  {
    icon: '🧠',
    title: 'Smart Insights',
    description: 'AI-powered recommendations for your workouts and nutrition based on your goals.',
  },
  {
    icon: '🌙',
    title: 'Recovery Tracking',
    description: 'Monitor sleep, stress, and recovery to optimize your performance.',
  },
];

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'Fitness Enthusiast',
    quote: 'DYMNDS replaced 3 apps for me. Everything I need in one place.',
    rating: 5,
  },
  {
    name: 'Marcus J.',
    role: 'Personal Trainer',
    quote: 'The challenge feature keeps my clients engaged like nothing else.',
    rating: 5,
  },
  {
    name: 'Elena K.',
    role: 'Marathon Runner',
    quote: 'Clean design, powerful features. This is what fitness apps should be.',
    rating: 5,
  },
];

export default function AppPage() {
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 min-h-screen flex items-center relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src="/diamond-white.png" alt="DYMNDS" className="h-8 w-auto" />
                <span className="text-xs tracking-[0.3em] uppercase text-white/50">The App</span>
              </div>

              <h1 className="text-5xl md:text-7xl tracking-wider mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                Your Fitness<br />
                <span className="text-white/60">Starts Here</span>
              </h1>

              <p className="text-lg opacity-70 mb-8 leading-relaxed max-w-lg">
                The all-in-one fitness app that replaces your workout tracker, nutrition logger, and fitness community. Built for athletes who refuse to settle.
              </p>

              {/* App Store Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <a href="#" className="group inline-flex items-center gap-3 px-6 py-4 bg-white text-black rounded-xl hover:bg-white/90 transition-all duration-300 hover:scale-105">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-[10px] opacity-70">Download on the</p>
                    <p className="text-lg font-semibold -mt-1">App Store</p>
                  </div>
                </a>
                <a href="#" className="group inline-flex items-center gap-3 px-6 py-4 border border-white/40 rounded-xl hover:bg-white hover:text-black transition-all duration-300 hover:scale-105">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-[10px] opacity-70">Get it on</p>
                    <p className="text-lg font-semibold -mt-1">Google Play</p>
                  </div>
                </a>
              </div>

              {/* Stats */}
              <div className="flex gap-8">
                <div>
                  <p className="text-3xl font-bold">Free</p>
                  <p className="text-xs tracking-widest uppercase text-white/50">To Download</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">4.9★</p>
                  <p className="text-xs tracking-widest uppercase text-white/50">App Store</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">50K+</p>
                  <p className="text-xs tracking-widest uppercase text-white/50">Athletes</p>
                </div>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" />
                
                {/* Phone */}
                <div className="relative w-72 h-[580px] bg-gradient-to-b from-neutral-800 via-neutral-900 to-neutral-800 rounded-[3rem] p-2 shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-b from-black via-neutral-900 to-black rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Screen content */}
                    <div className="text-center px-6">
                      <img src="/diamond-white.png" alt="DYMNDS App" className="h-20 w-auto mx-auto mb-6 animate-pulse" />
                      <img src="/dymnds-only-white.png" alt="DYMNDS" className="h-5 w-auto mx-auto mb-4 opacity-70" />
                      <p className="text-xs tracking-widest uppercase text-white/50 mb-8">Your Force Awaits</p>
                      
                      {/* Feature preview */}
                      <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm">
                        <p className="text-2xl mb-1">{features[activeFeature].icon}</p>
                        <p className="text-sm font-semibold">{features[activeFeature].title}</p>
                      </div>
                    </div>
                    
                    {/* Notch */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full" />
                    
                    {/* Home indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-white/10 to-transparent rounded-2xl backdrop-blur-sm flex items-center justify-center animate-bounce" style={{ animationDuration: '3s' }}>
                  <span className="text-2xl">💪</span>
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-white/10 to-transparent rounded-2xl backdrop-blur-sm flex items-center justify-center animate-bounce" style={{ animationDuration: '3s', animationDelay: '1s' }}>
                  <span className="text-2xl">🔥</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-neutral-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-3">Features</p>
            <h2 className="text-4xl md:text-6xl tracking-wider" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              Everything You Need
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`group p-6 bg-neutral-900 border border-white/5 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 cursor-pointer ${
                  activeFeature === i ? 'border-white/30 bg-neutral-800' : ''
                }`}
                onClick={() => setActiveFeature(i)}
              >
                <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </span>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm opacity-60 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-3">Simple</p>
            <h2 className="text-4xl md:text-6xl tracking-wider" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'Download', desc: 'Get the app free from App Store or Google Play' },
              { step: '02', title: 'Set Goals', desc: 'Tell us your fitness goals and we customize your experience' },
              { step: '03', title: 'Crush It', desc: 'Track workouts, hit PRs, and watch yourself transform' },
            ].map((item, i) => (
              <div key={i} className="text-center relative">
                <div className="text-8xl font-bold text-white/5 absolute -top-8 left-1/2 -translate-x-1/2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  {item.step}
                </div>
                <div className="relative z-10 pt-12">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                    <span className="text-xl font-bold">{item.step}</span>
                  </div>
                  <h3 className="text-2xl tracking-wider mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    {item.title}
                  </h3>
                  <p className="text-sm opacity-60">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-neutral-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-3">Reviews</p>
            <h2 className="text-4xl md:text-6xl tracking-wider" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              Athletes Love Us
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="p-8 bg-neutral-900 border border-white/5">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <span key={j} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-lg mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm opacity-50">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 bg-gradient-to-b from-black to-neutral-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src="/diamond-white.png" alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-auto" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl tracking-wider mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Ready to Transform?
          </h2>
          <p className="text-lg opacity-70 mb-10">
            Join thousands of athletes who&apos;ve made DYMNDS their fitness home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black text-sm tracking-widest uppercase rounded-lg hover:bg-white/90 transition-all duration-300 hover:scale-105">
              Download Free
            </a>
            <a href="#" className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/40 text-sm tracking-widest uppercase rounded-lg hover:bg-white hover:text-black transition-all duration-300 hover:scale-105">
              Learn More
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}