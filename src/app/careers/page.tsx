import type { Metadata } from 'next';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import StaggerReveal from '@/components/StaggerReveal';

export const metadata: Metadata = {
  title: 'Careers | DYMNDS',
  description: 'Join the DYMNDS team. Build something legendary.',
  alternates: {
    canonical: 'https://dymnds.ca/careers',
  },
};

export default function CareersPage() {
  const lookingFor = [
    {
      title: 'Pressure Makes Diamonds',
      desc: 'You thrive under intensity. You don\'t fold when things get hard.',
    },
    {
      title: 'Obsessed With Details',
      desc: 'You notice the things others miss. You care about the 1%.',
    },
    {
      title: 'Impact Over Everything',
      desc: 'You want your work to matter. You want to help people shine.',
    },
  ];

  return (
    <main id="main-content" className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal animation="fade-up" delay={0} duration={800}>
            <Image src="/diamond-white.png" alt="" width={32} height={32} className="h-8 w-auto mx-auto mb-8 opacity-30" />
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={100} duration={800}>
            <h1 className="text-6xl md:text-8xl tracking-tight mb-6 font-bebas">
              CAREERS
            </h1>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={200} duration={800}>
            <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
              We&apos;re building something legendary. When the time is right, we&apos;ll be looking for people who believe in pressure, persistence, and purpose.
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

      {/* No Positions Available */}
      <section className="py-24 px-6 bg-neutral-950 border-b border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal animation="fade-up" delay={0} duration={800}>
            <h2 className="text-3xl font-bebas tracking-wider mb-4">
              No Positions Available
            </h2>

            <p className="text-white/60 mb-8">
              We&apos;re not hiring at the moment, but that doesn&apos;t mean we won&apos;t be soon.
            </p>

            <p className="text-white/40 text-sm mb-12">
              Check back. Or better yet—make us notice you.
            </p>
          </ScrollReveal>

          {/* What We Look For */}
          <ScrollReveal animation="fade-up" delay={100} duration={800}>
            <h3 className="text-2xl font-bebas tracking-wider mb-8">
              What We Look For
            </h3>
          </ScrollReveal>

          <StaggerReveal staggerDelay={100} animation="fade-up" duration={800} threshold={0.2}>
            <div className="grid md:grid-cols-3 gap-6">
              {lookingFor.map((item, i) => (
                <div key={i} className="card-premium p-6 border border-white/10 bg-black/30 hover:border-white/20 transition-all duration-300">
                  <div className="mb-4">
                    <Image src="/diamond-white.png" alt="" width={24} height={24} className="h-6 w-auto opacity-60" />
                  </div>
                  <h3 className="text-lg font-bebas mb-2">{item.title}</h3>
                  <p className="text-sm text-white/50">{item.desc}</p>
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

      {/* Stay Connected */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal animation="fade-up" delay={0} duration={800}>
            <h2 className="text-2xl font-bebas tracking-wider mb-4">
              Join The Movement
            </h2>

            <p className="text-white/60 mb-8">
              When we&apos;re ready to grow, you&apos;ll hear it here first.
            </p>

            <a
              href="mailto:careers@dymnds.ca?subject=Career Interest"
              className="btn-premium inline-block px-8 py-4 bg-white text-black text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300"
            >
              Get In Touch
            </a>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
