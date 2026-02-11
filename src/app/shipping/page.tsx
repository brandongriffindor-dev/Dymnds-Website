import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import StaggerReveal from '@/components/StaggerReveal';

export const metadata: Metadata = {
  title: 'Shipping Information | DYMNDS',
  description: 'Free standard shipping on all orders. Express shipping available. Canada and USA.',
  alternates: {
    canonical: 'https://dymnds.ca/shipping',
  },
};

export default function ShippingPage() {
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
              SHIPPING
            </h1>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={200} duration={600}>
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Fast, reliable delivery to Canada & the United States. Your order ships within 24-48 hours, and we provide full tracking.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Shipping Options */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <StaggerReveal
            staggerDelay={80}
            animation="fade-up"
            duration={600}
            threshold={0.2}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* Standard Shipping */}
            <div className="card-premium p-8 border border-white/10">
              <h3 className="text-2xl font-bebas tracking-wider mb-4">
                Standard Shipping
              </h3>
              <p className="text-4xl font-bebas mb-2">FREE</p>
              <p className="text-sm text-white/50 mb-6">On orders over $100</p>
              <div className="space-y-3">
                <p className="text-white/70 leading-relaxed">
                  Delivery in 3-5 business days to Canada and USA. All shipments include tracking information sent directly to your email.
                </p>
              </div>
            </div>

            {/* Express Shipping */}
            <div className="card-premium p-8 border border-white/10">
              <h3 className="text-2xl font-bebas tracking-wider mb-4">
                Express Shipping
              </h3>
              <p className="text-4xl font-bebas mb-2">$15</p>
              <p className="text-sm text-white/50 mb-6">Priority delivery</p>
              <div className="space-y-3">
                <p className="text-white/70 leading-relaxed">
                  When you need it fast. 1-2 business days to Canada and USA with priority tracking and handling.
                </p>
              </div>
            </div>
          </StaggerReveal>
        </div>
      </section>

      {/* Processing Time */}
      <section className="py-24 px-6 bg-neutral-950 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal animation="fade-up" delay={0} duration={600}>
            <div className="card-premium p-8 border border-white/10">
              <h2 className="text-2xl font-bebas tracking-wider mb-6">
                Processing Time
              </h2>
              <div className="space-y-4">
                <p className="text-white/70 leading-relaxed">
                  All orders are processed within 24-48 hours, excluding weekends and holidays. You&apos;ll receive a confirmation email with detailed tracking information as soon as your order ships. No need to wait wondering about your status.
                </p>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs uppercase tracking-wider text-white/40 mb-2">
                    Typical Processing Window
                  </p>
                  <p className="text-lg font-bebas tracking-wide">1-2 Business Days</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* International Shipping */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal animation="fade-up" delay={0} duration={600}>
            <div className="card-premium p-8 border border-white/10">
              <h2 className="text-2xl font-bebas tracking-wider mb-6">
                International Shipping
              </h2>
              <p className="text-white/70 leading-relaxed mb-6">
                We currently ship to Canada and the United States. International expansion to additional countries is coming soon. Subscribe to our newsletter to be notified when we open shipping to your region.
              </p>
              <div className="flex gap-3">
                <span className="px-4 py-2 bg-white/5 border border-white/10 rounded text-sm font-medium">
                  🇨🇦 Canada
                </span>
                <span className="px-4 py-2 bg-white/5 border border-white/10 rounded text-sm font-medium">
                  🇺🇸 USA
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Track Order */}
      <section className="py-24 px-6 bg-neutral-950 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal animation="fade-up" delay={0} duration={600}>
            <h2 className="text-2xl font-bebas tracking-wider mb-6">
              Track Your Order
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              Once your order ships, you&apos;ll receive an email with your unique tracking number. You can use this number with our shipping partner to monitor your package in real-time.
            </p>
            <a
              href="mailto:support@dymnds.ca?subject=Order Tracking"
              className="btn-premium inline-block px-8 py-4 bg-white text-black font-bold tracking-wider uppercase rounded-lg hover:bg-white/90 transition-colors"
            >
              Contact Support For Tracking
            </a>
          </ScrollReveal>
        </div>
      </section>

      {/* Questions Footer */}
      <section className="py-24 px-6 border-t border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal animation="fade-up" delay={0} duration={600}>
            <h2 className="text-2xl font-bebas tracking-wider mb-6">
              Still Have Questions?
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              Our customer support team is here to help. We typically respond within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="mailto:support@dymnds.ca"
                className="btn-premium px-6 py-3 border border-white/20 hover:bg-white hover:text-black transition-colors text-sm uppercase tracking-wider font-medium"
              >
                Email Us
              </a>
              <Link
                href="/faq"
                className="btn-premium px-6 py-3 border border-white/20 hover:bg-white hover:text-black transition-colors text-sm uppercase tracking-wider font-medium"
              >
                View FAQ
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
