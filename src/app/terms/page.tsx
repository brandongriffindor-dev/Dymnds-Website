import type { Metadata } from 'next';
import Image from 'next/image';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: 'Terms of Service | DYMNDS',
  description: 'Terms and conditions for using the DYMNDS website and purchasing products.',
  alternates: {
    canonical: 'https://dymnds.ca/terms',
  },
};

export default function TermsPage() {
  return (
    <main id="main-content" className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Image src="/diamond-white.png" alt="" width={32} height={32} className="h-8 w-auto mx-auto mb-8 opacity-30" />
          <h1 className="text-6xl md:text-8xl font-light tracking-tight mb-6 font-bebas">
            Terms of Service
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Please read these terms carefully before using our website.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-16">

          <p className="text-white/40 text-sm">Last updated: February 2026</p>

          {/* Agreement */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">Agreement to Terms</h2>
            <p className="text-white/60 leading-relaxed text-sm">
              By accessing and using dymnds.ca, you acknowledge that you have read, understood, and agree to be
              bound by these Terms of Service. If you do not agree with these terms, please do not use our website.
            </p>
          </div>

          {/* Use of Website */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">Use of the Website</h2>
            <div className="space-y-4 text-white/60 leading-relaxed text-sm">
              <p>You must be at least 16 years old to use this site.</p>
              <p>You agree not to misuse the site or interfere with its operation.</p>
              <p>We reserve the right to modify or discontinue the site at any time without notice.</p>
            </div>
          </div>

          {/* Products and Pricing */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">Products &amp; Pricing</h2>
            <div className="space-y-4 text-white/60 leading-relaxed text-sm">
              <p>All prices are listed in Canadian Dollars (CAD) unless otherwise indicated.</p>
              <p>USD prices are approximate conversions and may vary at the time of purchase.</p>
              <p>We reserve the right to change prices at any time without prior notice.</p>
              <p>Product descriptions and images are as accurate as possible but may vary slightly from actual products.</p>
            </div>
          </div>

          {/* Orders and Payment */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">Orders &amp; Payment</h2>
            <div className="space-y-4 text-white/60 leading-relaxed text-sm">
              <p>All payments are securely processed through our payment partner at checkout.</p>
              <p>By placing an order, you are making an offer to purchase the selected products.</p>
              <p>We reserve the right to refuse or cancel any order for any reason.</p>
              <p>You will receive an order confirmation email upon successful purchase.</p>
            </div>
          </div>

          {/* Impact Promise */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">The 10% Impact Promise</h2>
            <div className="space-y-4 text-white/60 leading-relaxed text-sm">
              <p>
                10% of every order is donated to organizations supporting survivor healing programs. This includes
                funding for therapy, safe housing, and support groups.
              </p>
              <p>
                Donation recipients and amounts will be published transparently on our{' '}
                <Link href="/impact" className="text-white underline underline-offset-4 hover:text-white/80 transition-colors">
                  Impact page
                </Link>.
              </p>
            </div>
          </div>

          {/* Shipping */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">Shipping &amp; Delivery</h2>
            <div className="space-y-4 text-white/60 leading-relaxed text-sm">
              <p>We currently ship to Canada and the United States.</p>
              <p>Standard shipping is free on all orders and takes 5–7 business days.</p>
              <p>Express shipping is available for $15 CAD and takes 2–3 business days.</p>
              <p>
                For full details, see our{' '}
                <Link href="/shipping" className="text-white underline underline-offset-4 hover:text-white/80 transition-colors">
                  Shipping Policy
                </Link>.
              </p>
            </div>
          </div>

          {/* Returns */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">Returns &amp; Exchanges</h2>
            <div className="space-y-4 text-white/60 leading-relaxed text-sm">
              <p>We offer a 30-day return policy on unworn, unwashed items with original tags attached.</p>
              <p>
                For full details, see our{' '}
                <Link href="/returns" className="text-white underline underline-offset-4 hover:text-white/80 transition-colors">
                  Returns Policy
                </Link>.
              </p>
            </div>
          </div>

          {/* Intellectual Property */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">Intellectual Property</h2>
            <div className="space-y-4 text-white/60 leading-relaxed text-sm">
              <p>
                All content on dymnds.ca — including logos, text, images, and design — is owned by DYMNDS
                and protected by applicable intellectual property laws.
              </p>
              <p>
                &ldquo;DYMNDS&rdquo; and &ldquo;Pressure Creates Diamonds&rdquo; are trademarks of DYMNDS.
              </p>
              <p>
                You may not reproduce, distribute, or use our content without written permission.
              </p>
            </div>
          </div>

          {/* Limitation of Liability */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">Limitation of Liability</h2>
            <div className="space-y-4 text-white/60 leading-relaxed text-sm">
              <p>
                DYMNDS and its services are provided &ldquo;as is&rdquo; without warranties of any kind,
                either express or implied.
              </p>
              <p>
                We are not liable for any indirect, incidental, special, or consequential damages arising
                from your use of the website or products.
              </p>
              <p>
                Our total liability shall not exceed the amount paid for the product in question.
              </p>
            </div>
          </div>

          {/* Governing Law */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">Governing Law</h2>
            <div className="space-y-4 text-white/60 leading-relaxed text-sm">
              <p>
                These terms are governed by and construed in accordance with the laws of the Province
                of Alberta, Canada.
              </p>
              <p>
                Any disputes arising from these terms shall be resolved in the courts of Alberta, Canada.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">Contact</h2>
            <p className="text-white/60 leading-relaxed text-sm">
              For questions about these terms, contact us at{' '}
              <a href="mailto:legal@dymnds.ca" className="text-white underline underline-offset-4 hover:text-white/80 transition-colors">
                legal@dymnds.ca
              </a>
            </p>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
