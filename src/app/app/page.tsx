'use client';

import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AppWaitlistForm from '@/components/AppWaitlistForm';
import ScrollReveal from '@/components/ScrollReveal';
import StaggerReveal from '@/components/StaggerReveal';
import { useState, useEffect } from 'react';
import { Dumbbell, Apple, Trophy, Flame, Users, Camera, Brain, Moon } from 'lucide-react';

const features = [
  {
    icon: Dumbbell,
    title: 'Workout Tracking',
    description: 'Log every rep, set, and PR. Track your progress with detailed analytics and charts.',
  },
  {
    icon: Apple,
    title: 'Nutrition Logging',
    description: 'Scan barcodes, track macros, and hit your nutrition goals with our comprehensive food database.',
  },
  {
    icon: Trophy,
    title: 'Achievements',
    description: 'Unlock badges and achievements as you crush your goals. Bronze, silver, gold, and diamond tiers.',
  },
  {
    icon: Flame,
    title: 'Streak System',
    description: 'Build consistency with workout streaks. Never break the chain.',
  },
  {
    icon: Users,
    title: 'Challenge Friends',
    description: 'Compete with friends on workouts, steps, and more. Push each other to be better.',
  },
  {
    icon: Camera,
    title: 'Progress Photos',
    description: 'Document your transformation with progress photos and side-by-side comparisons.',
  },
  {
    icon: Brain,
    title: 'Smart Insights',
    description: 'AI-powered recommendations for your workouts and nutrition based on your goals.',
  },
  {
    icon: Moon,
    title: 'Recovery Tracking',
    description: 'Monitor sleep, stress, and recovery to optimize your performance.',
  },
];

export default function AppPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [showWaitlist, setShowWaitlist] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main id="main-content" className="min-h-screen bg-black text-white">
      <Navbar />

      {showWaitlist && (
        <AppWaitlistForm onClose={() => setShowWaitlist(false)} />
      )}

      {/* Hero Section */}
      <section className="pt-24 min-h-screen flex items-center relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '2s' }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <ScrollReveal animation="fade-up" delay={0} duration={600}>
              <div className="flex items-center gap-3 mb-6">
                <Image
                  src="/diamond-white.png"
                  alt="DYMNDS"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
                <span className="text-xs tracking-[0.3em] uppercase text-green-400 font-medium">
                  Coming Soon
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bebas tracking-wider mb-6">
                Your Fitness Coach
                <br />
                <span className="text-white/60">Is Almost Here</span>
              </h1>

              <p className="text-lg text-white/70 mb-8 leading-relaxed max-w-lg">
                The all-in-one fitness app that replaces your workout tracker, nutrition logger, and fitness community. Built for athletes who refuse to settle.
              </p>

              {/* Waitlist CTA */}
              <button
                onClick={() => setShowWaitlist(true)}
                className="btn-premium inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-lg hover:bg-white/90 transition-all duration-300 hover:scale-105 text-sm tracking-widest uppercase font-bold"
              >
                Get Early Access
              </button>

              <p className="text-white/30 text-xs mt-4">
                Free forever. Be the first to know when we launch.
              </p>
            </ScrollReveal>

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
                      <Image
                        src="/diamond-white.png"
                        alt="DYMNDS App"
                        width={80}
                        height={80}
                        className="h-20 w-auto mx-auto mb-6 animate-pulse"
                      />
                      <Image
                        src="/dymnds-only-white.png"
                        alt="DYMNDS"
                        width={100}
                        height={20}
                        className="h-5 w-auto mx-auto mb-4 opacity-70"
                      />
                      <p className="text-xs tracking-widest uppercase text-white/50 mb-8">
                        Your Force Awaits
                      </p>

                      {/* Feature preview */}
                      <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm flex flex-col items-center">
                        {(() => { const Icon = features[activeFeature].icon; return <Icon className="w-6 h-6 text-white/70 mb-1" />; })()}
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
                <div
                  className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-white/10 to-transparent rounded-2xl backdrop-blur-sm flex items-center justify-center animate-bounce"
                  style={{ animationDuration: '3s' }}
                >
                  <Dumbbell className="w-6 h-6 text-white/60" />
                </div>
                <div
                  className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-white/10 to-transparent rounded-2xl backdrop-blur-sm flex items-center justify-center animate-bounce"
                  style={{ animationDuration: '3s', animationDelay: '1s' }}
                >
                  <Flame className="w-6 h-6 text-white/60" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-neutral-950">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal animation="fade-up" delay={0} duration={600} className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-3 font-medium">
              Features
            </p>
            <h2 className="text-4xl md:text-6xl font-bebas tracking-wider">
              Everything You Need
            </h2>
          </ScrollReveal>

          <StaggerReveal
            staggerDelay={60}
            animation="fade-up"
            duration={600}
            threshold={0.2}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, i) => (
              <div
                key={i}
                className={`card-premium group p-6 bg-neutral-900 border border-white/5 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 cursor-pointer ${
                  activeFeature === i ? 'border-white/30 bg-neutral-800' : ''
                }`}
                onClick={() => setActiveFeature(i)}
              >
                <feature.icon className="w-8 h-8 mb-4 text-white/70 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal animation="fade-up" delay={0} duration={600} className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-3 font-medium">
              Simple
            </p>
            <h2 className="text-4xl md:text-6xl font-bebas tracking-wider">
              How It Works
            </h2>
          </ScrollReveal>

          <StaggerReveal
            staggerDelay={80}
            animation="fade-up"
            duration={600}
            threshold={0.2}
            className="grid md:grid-cols-3 gap-12"
          >
            {[
              {
                step: '01',
                title: 'Sign Up',
                desc: 'Join the waitlist and be the first to get access when we launch',
              },
              {
                step: '02',
                title: 'Set Goals',
                desc: 'Tell us your fitness goals and we customize your experience',
              },
              {
                step: '03',
                title: 'Crush It',
                desc: 'Track workouts, hit PRs, and watch yourself transform',
              },
            ].map((item, i) => (
              <div key={i} className="text-center relative">
                <div className="text-8xl font-bold text-white/5 absolute -top-8 left-1/2 -translate-x-1/2 font-bebas">
                  {item.step}
                </div>
                <div className="relative z-10 pt-12">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                    <span className="text-xl font-bold font-bebas">{item.step}</span>
                  </div>
                  <h3 className="text-2xl font-bebas tracking-wider mb-4">{item.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* CTA — Waitlist */}
      <section className="py-32 px-6 bg-gradient-to-b from-black to-neutral-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="/diamond-white.png"
            alt=""
            width={384}
            height={384}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-auto"
          />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <ScrollReveal animation="fade-up" delay={0} duration={600}>
            <h2 className="text-4xl md:text-6xl font-bebas tracking-wider mb-6">
              Be The First To Know
            </h2>
            <p className="text-lg text-white/70 mb-10 leading-relaxed">
              The Dymnds app is launching soon. Join the waitlist for exclusive early access and special launch offers.
            </p>
            <button
              onClick={() => setShowWaitlist(true)}
              className="btn-premium inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black text-sm tracking-widest uppercase rounded-lg hover:bg-white/90 transition-all duration-300 hover:scale-105 font-bold"
            >
              Join The Waitlist
            </button>
            <p className="text-white/30 text-xs mt-4">
              Free forever. No spam. Unsubscribe anytime.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
