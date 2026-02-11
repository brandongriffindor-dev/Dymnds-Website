'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import { useState } from 'react';
import { getCSRFToken } from '@/lib/get-csrf-token';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setStatus('submitting');
    setErrorMessage('');

    try {
      const csrfToken = await getCSRFToken();
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: 'general',
        message: '',
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    }
  };

  const contactInfo = [
    {
      title: 'Email',
      subtitle: 'For general inquiries',
      link: 'mailto:hello@dymnds.ca',
      email: 'hello@dymnds.ca',
    },
    {
      title: 'Order Support',
      subtitle: 'Questions about your order?',
      link: 'mailto:support@dymnds.ca',
      email: 'support@dymnds.ca',
    },
    {
      title: 'Press & Media',
      subtitle: 'For press inquiries and interviews',
      link: 'mailto:press@dymnds.ca',
      email: 'press@dymnds.ca',
    },
    {
      title: 'Partnerships',
      subtitle: 'Want to collaborate?',
      link: 'mailto:partners@dymnds.ca',
      email: 'partners@dymnds.ca',
    },
  ];

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "DYMNDS",
    "url": "https://dymnds.ca",
    "logo": "https://dymnds.ca/dymnds-logo-black.png",
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "email": "hello@dymnds.ca",
        "url": "https://dymnds.ca/contact",
      },
      {
        "@type": "ContactPoint",
        "contactType": "sales",
        "email": "support@dymnds.ca",
        "url": "https://dymnds.ca/contact",
      },
    ],
  };

  return (
    <main id="main-content" className="min-h-screen bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <Navbar />

      {/* Hero — Minimal */}
      <section className="pt-36 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal animation="fade-up" delay={0} duration={800}>
            <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--accent)]/40 mb-4">Contact</p>
            <h1 className="tracking-tight font-bebas mb-4 leading-[0.85]" style={{ fontSize: 'clamp(4.5rem, 14vw, 11rem)' }}>
              GET IN<br />TOUCH
            </h1>
            <div className="w-16 h-[1px] bg-[var(--accent)]/30 mb-8" />
            <p className="text-lg text-white/50 max-w-xl leading-relaxed">
              Questions, feedback, or just want to say hi? We&apos;d love to hear from you.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16 px-6 bg-neutral-950">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16">
            {/* Contact Form */}
            <ScrollReveal animation="fade-up" delay={0} duration={800}>
              <div>
                <h2 className="text-2xl tracking-wider mb-8 font-bebas">
                  Send Us A Message
                </h2>

                {status === 'success' ? (
                  <div className="p-8 bg-neutral-900 border border-white/10 text-center">
                    <span className="text-4xl mb-4 block">✓</span>
                    <h3 className="text-xl tracking-wider mb-2 font-bebas">
                      Message Sent!
                    </h3>
                    <p className="text-sm opacity-60">
                      We&apos;ll get back to you within 24-48 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="contact-name" className="block text-xs tracking-widest uppercase text-white/50 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        id="contact-name"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: '' });
                        }}
                        className={`input-premium w-full px-4 py-3 bg-neutral-900 border ${errors.name ? 'border-red-400/50' : 'border-white/10'} focus:border-white/30 transition-colors outline-none`}
                        placeholder="Your name"
                      />
                      {errors.name && <p className="text-red-400/70 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="contact-email" className="block text-xs tracking-widest uppercase text-white/50 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="contact-email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: '' });
                        }}
                        className={`input-premium w-full px-4 py-3 bg-neutral-900 border ${errors.email ? 'border-red-400/50' : 'border-white/10'} focus:border-white/30 transition-colors outline-none`}
                        placeholder="you@example.com"
                      />
                      {errors.email && <p className="text-red-400/70 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label htmlFor="contact-subject" className="block text-xs tracking-widest uppercase text-white/50 mb-2">
                        Subject
                      </label>
                      <select
                        id="contact-subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="input-premium w-full px-4 py-3 bg-neutral-900 border border-white/10 focus:border-white/30 transition-colors outline-none"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="order">Order Support</option>
                        <option value="returns">Returns & Exchanges</option>
                        <option value="partnership">Partnership</option>
                        <option value="press">Press & Media</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="contact-message" className="block text-xs tracking-widest uppercase text-white/50 mb-2">
                        Message
                      </label>
                      <textarea
                        id="contact-message"
                        value={formData.message}
                        onChange={(e) => {
                          setFormData({ ...formData, message: e.target.value });
                          if (errors.message) setErrors({ ...errors, message: '' });
                        }}
                        rows={6}
                        className={`input-premium w-full px-4 py-3 bg-neutral-900 border ${errors.message ? 'border-red-400/50' : 'border-white/10'} focus:border-white/30 transition-colors outline-none resize-none`}
                        placeholder="How can we help? (minimum 10 characters)"
                      />
                      {errors.message && <p className="text-red-400/70 text-xs mt-1">{errors.message}</p>}
                    </div>

                    {status === 'error' && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {errorMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="btn-premium w-full px-8 py-4 bg-white text-black text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {status === 'submitting' ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </ScrollReveal>

            {/* Contact Info */}
            <ScrollReveal animation="fade-up" delay={100} duration={800}>
              <div>
                <h2 className="text-2xl tracking-wider mb-8 font-bebas">
                  Other Ways To Reach Us
                </h2>

                <div className="space-y-8">
                  {contactInfo.map((info, i) => (
                    <a key={i} href={info.link} className="card-premium p-6 bg-neutral-900 border border-white/5 hover:border-white/20 transition-all duration-300 group">
                      <div className="mb-2">
                        <h3 className="text-lg tracking-wider font-bebas group-hover:text-white/70 transition-colors">
                          {info.title}
                        </h3>
                      </div>
                      <p className="text-sm opacity-60 mb-2">{info.subtitle}</p>
                      <p className="text-white group-hover:opacity-70 transition-opacity">
                        {info.email}
                      </p>
                    </a>
                  ))}
                </div>

                {/* Response Time */}
                <div className="mt-12 p-6 bg-white/5 border border-white/10">
                  <p className="text-sm opacity-70">
                    <strong>Response Time:</strong> We typically respond within 24-48 hours during business days. For urgent order issues, please include your order number in the subject line.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="py-16 px-6 bg-black border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal animation="fade-up" delay={0} duration={800}>
            <h2 className="text-2xl tracking-wider mb-4 font-bebas">
              Common Questions?
            </h2>
            <p className="text-sm opacity-60 mb-6">
              Check out our FAQ for quick answers to the most common questions.
            </p>
            <Link
              href="/faq"
              className="btn-premium inline-block px-8 py-3 border border-white/40 text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300"
            >
              View FAQ
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
