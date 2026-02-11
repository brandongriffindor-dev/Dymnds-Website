'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import StaggerReveal from '@/components/StaggerReveal';
import { useState } from 'react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'What is DYMNDS?',
      answer: 'DYMNDS is premium athletic wear built for those who push limits. Every piece is engineered for performance, comfort, and style. Plus, 10% of every purchase supports survivors on their healing journey.',
    },
    {
      question: 'How does the 10% impact work?',
      answer: '10% of every order goes directly to funding therapy, safe housing, and healing programs for survivors. When you wear DYMNDS, you help others shine.',
    },
    {
      question: 'What sizes do you offer?',
      answer: 'We offer sizes XS through XXL. Each product page has a detailed size guide and a "What&apos;s My Size?" calculator to help you find the perfect fit.',
    },
    {
      question: 'How do I care for my DYMNDS gear?',
      answer: 'Machine wash cold with like colors. Tumble dry low or hang dry. Do not bleach or iron. Our fabrics are built to last, but proper care extends their life even longer.',
    },
    {
      question: 'Can I change or cancel my order?',
      answer: 'We process orders quickly, but if you need to make changes, contact us at support@dymnds.ca within 2 hours of placing your order and we&apos;ll do our best to help.',
    },
  ];

  const quickLinks = [
    {
      title: 'Shipping Info',
      subtitle: 'Delivery times & tracking',
      href: '/shipping',
    },
    {
      title: 'Returns',
      subtitle: 'Exchanges & refunds',
      href: '/returns',
    },
    {
      title: 'Contact Us',
      subtitle: 'Get in touch directly',
      href: '/contact',
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <main id="main-content" className="min-h-screen bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />

      {/* Compact Header — let the content be the page */}
      <section className="pt-36 pb-8 px-6">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal animation="fade-up" delay={0} duration={600}>
            <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--accent)]/40 mb-3">Support</p>
            <h1 className="tracking-tight font-bebas leading-[0.88]" style={{ fontSize: 'clamp(4rem, 12vw, 9rem)' }}>
              Questions &<br />Answers
            </h1>
            <div className="w-12 h-[1px] bg-[var(--accent)]/30 mt-6" />
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <StaggerReveal staggerDelay={50} animation="fade-up" duration={800} threshold={0.2}>
            <div className="space-y-0">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-white/8">
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full py-6 flex items-center justify-between group hover:opacity-70 transition-opacity"
                    aria-expanded={openIndex === index}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <h3 id={`faq-question-${index}`} className="text-lg font-bebas tracking-wider text-left">
                      {faq.question}
                    </h3>
                    <div className="accordion-chevron ml-4 flex-shrink-0 transition-transform duration-300" style={{
                      transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </button>
                  <div
                    id={`faq-answer-${index}`}
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                    className="accordion-content overflow-hidden transition-all duration-300"
                    style={{
                      maxHeight: openIndex === index ? '500px' : '0px',
                      opacity: openIndex === index ? 1 : 0,
                    }}
                  >
                    <div className="pb-6 text-white/60 leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </StaggerReveal>

          {/* Ask First Question CTA */}
          <ScrollReveal animation="scale" delay={300} duration={1000} threshold={0.3}>
            <div className="mt-16 p-8 border border-white/10 bg-neutral-950 text-center">
              <h3 className="text-3xl font-bebas tracking-wider mb-3">
                Ask The First Question!
              </h3>
              <p className="text-white/60 mb-6">
                Have something on your mind? We&apos;re here to help. Send us your question and we&apos;ll add it to the list.
              </p>
              <a
                href="mailto:support@dymnds.ca?subject=FAQ Question"
                className="btn-premium inline-block px-8 py-4 bg-white text-black font-bold tracking-wider uppercase hover:bg-white/90 transition-colors"
              >
                Ask A Question
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-[var(--accent)]/10 to-transparent" />

      {/* Quick Links */}
      <section className="py-16 px-6 bg-neutral-950 border-b border-white/10">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal animation="fade-up" delay={0} duration={800}>
            <h2 className="text-2xl font-bebas tracking-wider mb-8 text-center">
              Quick Links
            </h2>
          </ScrollReveal>

          <StaggerReveal staggerDelay={100} animation="fade-up" duration={800} threshold={0.2}>
            <div className="grid md:grid-cols-3 gap-6">
              {quickLinks.map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="card-premium p-6 border border-white/10 hover:border-white/30 transition-all duration-300 text-center group"
                >
                  <div className="w-6 h-[1px] bg-[var(--accent)]/30 mx-auto mb-3" />
                  <h3 className="text-lg font-bebas mb-1 group-hover:opacity-80 transition-opacity">{link.title}</h3>
                  <p className="text-sm text-white/50">{link.subtitle}</p>
                </Link>
              ))}
            </div>
          </StaggerReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
