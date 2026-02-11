import type { Metadata } from 'next';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import StaggerReveal from '@/components/StaggerReveal';

export const metadata: Metadata = {
  title: 'Returns & Exchanges | DYMNDS',
  description: '30-day hassle-free returns on all DYMNDS orders. Learn about our return policy.',
  alternates: {
    canonical: 'https://dymnds.ca/returns',
  },
};

export default function ReturnsPage() {
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
              RETURNS & EXCHANGES
            </h1>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={200} duration={600}>
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Hassle-free returns. We stand behind our products, and we want you to be completely satisfied.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Policy Overview */}
      <section className="py-24 px-6 bg-neutral-950 border-y border-white/10">
        <div className="max-w-4xl mx-auto">
          <StaggerReveal
            staggerDelay={80}
            animation="fade-up"
            duration={600}
            threshold={0.2}
            className="grid md:grid-cols-3 gap-8"
          >
            {/* 30 Days */}
            <div className="card-premium p-8 border border-white/10 text-center">
              <p className="text-5xl font-bebas mb-4">30</p>
              <h3 className="text-lg font-bebas tracking-wider mb-3">
                Day Returns
              </h3>
              <p className="text-sm text-white/60">
                30 days from delivery to initiate a return or exchange
              </p>
            </div>

            {/* $0 Return Shipping */}
            <div className="card-premium p-8 border border-white/10 text-center">
              <p className="text-5xl font-bebas mb-4">$0</p>
              <h3 className="text-lg font-bebas tracking-wider mb-3">
                Return Shipping
              </h3>
              <p className="text-sm text-white/60">
                Free returns on all orders. We cover shipping costs.
              </p>
            </div>

            {/* Full Refunds */}
            <div className="card-premium p-8 border border-white/10 text-center">
              <p className="text-5xl font-bebas mb-4">100%</p>
              <h3 className="text-lg font-bebas tracking-wider mb-3">
                Full Refunds
              </h3>
              <p className="text-sm text-white/60">
                Refunded to your original payment method
              </p>
            </div>
          </StaggerReveal>
        </div>
      </section>

      {/* Return Policy Details */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-6">
            {/* Eligible Items */}
            <ScrollReveal animation="fade-up" delay={0} duration={600}>
              <div className="card-premium p-8 border border-white/10">
                <h3 className="text-xl font-bebas tracking-wider mb-6">
                  What&apos;s Eligible
                </h3>
                <div className="space-y-4">
                  <p className="text-white/70 leading-relaxed">
                    Items in original condition with tags attached. Unworn, unwashed, and unaltered garments returned within 30 days of delivery are fully eligible for return or exchange. Original packaging should be included when possible.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Not Eligible */}
            <ScrollReveal animation="fade-up" delay={100} duration={600}>
              <div className="card-premium p-8 border border-white/10">
                <h3 className="text-xl font-bebas tracking-wider mb-6">
                  What&apos;s Not Eligible
                </h3>
                <div className="space-y-4">
                  <p className="text-white/70 leading-relaxed">
                    Worn, washed, or altered items cannot be returned. Items without original tags or returned after 30 days from delivery are not eligible. Final sale items, if applicable, are non-returnable.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* How To Return */}
            <ScrollReveal animation="fade-up" delay={200} duration={600}>
              <div className="card-premium p-8 border border-white/10">
                <h3 className="text-xl font-bebas tracking-wider mb-6">
                  How To Return
                </h3>
                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 font-bebas">
                        1
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-medium mb-1">Email Us</p>
                      <p className="text-sm text-white/60">
                        Send an email to support@dymnds.ca with your order number and reason for return.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 font-bebas">
                        2
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-medium mb-1">Receive Label</p>
                      <p className="text-sm text-white/60">
                        We&apos;ll send you a prepaid return shipping label immediately.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 font-bebas">
                        3
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-medium mb-1">Pack & Ship</p>
                      <p className="text-sm text-white/60">
                        Pack the item securely and attach the return label to the outside.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 font-bebas">
                        4
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-medium mb-1">Get Refunded</p>
                      <p className="text-sm text-white/60">
                        Once we receive and inspect your item, we process your refund within 5-7 business days.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Exchanges */}
            <ScrollReveal animation="fade-up" delay={300} duration={600}>
              <div className="card-premium p-8 border border-white/10">
                <h3 className="text-xl font-bebas tracking-wider mb-6">
                  Exchanges
                </h3>
                <p className="text-white/70 leading-relaxed mb-4">
                  Need a different size or color? We&apos;ve got you covered. Follow the return process above and let us know what you&apos;d like to exchange for. We&apos;ll ship the new item as soon as we receive your return.
                </p>
                <p className="text-sm text-white/50">
                  Exchanges are subject to availability. If the item you want is out of stock, we&apos;ll issue a full refund instead.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-24 px-6 bg-neutral-950 border-t border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal animation="fade-up" delay={0} duration={600}>
            <h2 className="text-2xl font-bebas tracking-wider mb-6">
              Questions About Your Return?
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              We&apos;re here to help make the process smooth and stress-free. Reach out anytime with questions.
            </p>
            <a
              href="mailto:support@dymnds.ca?subject=Return/Exchange Question"
              className="btn-premium inline-block px-8 py-4 bg-white text-black font-bold tracking-wider uppercase rounded-lg hover:bg-white/90 transition-colors"
            >
              Contact Support
            </a>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
