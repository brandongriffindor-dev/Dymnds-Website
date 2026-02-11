import type { Metadata } from 'next';
import Image from 'next/image';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: 'Privacy Policy | DYMNDS',
  description: 'How DYMNDS collects, uses, and protects your personal information.',
  alternates: {
    canonical: 'https://dymnds.ca/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <main id="main-content" className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Image src="/diamond-white.png" alt="" width={32} height={32} className="h-8 w-auto mx-auto mb-8 opacity-30" />
          <h1 className="text-6xl md:text-8xl font-light tracking-tight mb-6 font-bebas">
            Privacy Policy
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            How we collect, use, and protect your personal information.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-16">

          <p className="text-white/40 text-sm">Last updated: February 2026</p>

          {/* Who We Are */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">Who We Are</h2>
            <p className="text-white/60 leading-relaxed">
              DYMNDS Athletic Wear is a premium activewear brand based in Canada, operating at{' '}
              <Link href="https://dymnds.ca" className="text-white underline underline-offset-4 hover:text-white/80 transition-colors">dymnds.ca</Link>.
              We are committed to protecting your privacy and handling your data with transparency and care.
            </p>
          </div>

          {/* What Data We Collect */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">What Data We Collect</h2>
            <div className="space-y-6">
              <div className="pl-6 border-l border-white/10">
                <h3 className="text-lg font-bebas tracking-wider mb-2 text-white/80">Email Addresses</h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  Collected through waitlist signup, newsletter subscription, and contact form submissions.
                </p>
              </div>
              <div className="pl-6 border-l border-white/10">
                <h3 className="text-lg font-bebas tracking-wider mb-2 text-white/80">Contact Form Submissions</h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  Name, email, subject, and message content submitted through our contact page.
                </p>
              </div>
              <div className="pl-6 border-l border-white/10">
                <h3 className="text-lg font-bebas tracking-wider mb-2 text-white/80">Cart Data</h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  Your shopping cart is stored in your browser&apos;s localStorage. This data is not transmitted to our servers.
                </p>
              </div>
              <div className="pl-6 border-l border-white/10">
                <h3 className="text-lg font-bebas tracking-wider mb-2 text-white/80">IP-Based Location Data</h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  We use ipapi.co to detect your approximate location for currency display purposes (CAD vs USD pricing). This data is not stored permanently.
                </p>
              </div>
              <div className="pl-6 border-l border-white/10">
                <h3 className="text-lg font-bebas tracking-wider mb-2 text-white/80">Analytics Data</h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  Basic analytics via Vercel Analytics including page views and web vitals. No personal identification is collected.
                </p>
              </div>
            </div>
          </div>

          {/* How We Use the Data */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">How We Use Your Data</h2>
            <div className="space-y-6">
              <div className="pl-6 border-l border-white/10">
                <h3 className="text-lg font-bebas tracking-wider mb-2 text-white/80">Email Addresses</h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  To send launch updates, newsletter content, and respond to your inquiries.
                </p>
              </div>
              <div className="pl-6 border-l border-white/10">
                <h3 className="text-lg font-bebas tracking-wider mb-2 text-white/80">Contact Submissions</h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  To respond to your questions and feedback.
                </p>
              </div>
              <div className="pl-6 border-l border-white/10">
                <h3 className="text-lg font-bebas tracking-wider mb-2 text-white/80">Currency Detection</h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  To display prices in your local currency automatically.
                </p>
              </div>
              <div className="pl-6 border-l border-white/10">
                <h3 className="text-lg font-bebas tracking-wider mb-2 text-white/80">Analytics</h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  To improve website performance and user experience.
                </p>
              </div>
            </div>
          </div>

          {/* Data Storage and Security */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">Data Storage &amp; Security</h2>
            <div className="space-y-4 text-white/60 leading-relaxed text-sm">
              <p>
                Your data is stored securely using Google Firebase (Firestore). Firebase is operated by Google and
                complies with SOC 1, SOC 2, and ISO 27001 standards.
              </p>
              <p>
                We do not sell, rent, or share your personal information with third parties.
              </p>
            </div>
          </div>

          {/* Cookies and Local Storage */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">Cookies &amp; Local Storage</h2>
            <div className="space-y-4 text-white/60 leading-relaxed text-sm">
              <p>
                We use browser localStorage to persist your shopping cart (key: dymnds-cart) and currency
                preference (key: dymnds-currency). These are stored locally on your device and are not
                transmitted to our servers.
              </p>
              <p>
                Vercel Analytics may use cookies for performance monitoring.
              </p>
            </div>
          </div>

          {/* Your Rights */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">Your Rights</h2>
            <p className="text-white/40 text-xs tracking-widest uppercase mb-4">PIPEDA Compliance — Canadian Privacy Law</p>
            <div className="space-y-4 text-white/60 leading-relaxed text-sm">
              <p>You have the right to access your personal information held by DYMNDS.</p>
              <p>You have the right to request correction of inaccurate information.</p>
              <p>You have the right to withdraw consent for communications at any time.</p>
              <p>You can unsubscribe from any email communications using the unsubscribe link provided in every email.</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">Privacy Inquiries</h2>
            <p className="text-white/60 leading-relaxed text-sm">
              For any privacy-related questions or requests, contact us at{' '}
              <a href="mailto:privacy@dymnds.ca" className="text-white underline underline-offset-4 hover:text-white/80 transition-colors">
                privacy@dymnds.ca
              </a>
            </p>
          </div>

          {/* Changes */}
          <div>
            <h2 className="text-3xl font-bebas tracking-wider mb-6">Changes to This Policy</h2>
            <p className="text-white/60 leading-relaxed text-sm">
              We may update this privacy policy from time to time. Changes will be posted on this page
              with an updated revision date.
            </p>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
