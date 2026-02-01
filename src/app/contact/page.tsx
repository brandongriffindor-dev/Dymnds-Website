'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 px-6 bg-gradient-to-b from-neutral-950 to-black">
        <div className="max-w-4xl mx-auto pt-16 text-center">
          <img src="/diamond-white.png" alt="DYMNDS" className="h-12 w-auto mx-auto mb-6 opacity-60" />
          
          <h1 className="text-5xl md:text-7xl tracking-wider mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Get In Touch
          </h1>
          
          <p className="text-lg opacity-70 max-w-xl mx-auto leading-relaxed">
            Questions, feedback, or just want to say hi? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16 px-6 bg-neutral-950">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl tracking-wider mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                Send Us A Message
              </h2>

              {submitted ? (
                <div className="p-8 bg-neutral-900 border border-white/10 text-center">
                  <span className="text-4xl mb-4 block">✓</span>
                  <h3 className="text-xl tracking-wider mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    Message Sent!
                  </h3>
                  <p className="text-sm opacity-60">
                    We&apos;ll get back to you within 24-48 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-white/50 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-neutral-900 border border-white/10 focus:border-white/30 transition-colors outline-none"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs tracking-widest uppercase text-white/50 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-neutral-900 border border-white/10 focus:border-white/30 transition-colors outline-none"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs tracking-widest uppercase text-white/50 mb-2">
                      Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-neutral-900 border border-white/10 focus:border-white/30 transition-colors outline-none"
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
                    <label className="block text-xs tracking-widest uppercase text-white/50 mb-2">
                      Message
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      rows={6}
                      className="w-full px-4 py-3 bg-neutral-900 border border-white/10 focus:border-white/30 transition-colors outline-none resize-none"
                      placeholder="How can we help?"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full px-8 py-4 bg-white text-black text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-2xl tracking-wider mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                Other Ways To Reach Us
              </h2>

              <div className="space-y-8">
                <div className="p-6 bg-neutral-900 border border-white/5">
                  <h3 className="text-lg tracking-wider mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    📧 Email
                  </h3>
                  <p className="text-sm opacity-60 mb-2">For general inquiries</p>
                  <a href="mailto:hello@dymnds.com" className="text-white hover:opacity-70 transition-opacity">
                    hello@dymnds.com
                  </a>
                </div>

                <div className="p-6 bg-neutral-900 border border-white/5">
                  <h3 className="text-lg tracking-wider mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    🛍️ Order Support
                  </h3>
                  <p className="text-sm opacity-60 mb-2">Questions about your order?</p>
                  <a href="mailto:support@dymnds.com" className="text-white hover:opacity-70 transition-opacity">
                    support@dymnds.com
                  </a>
                </div>

                <div className="p-6 bg-neutral-900 border border-white/5">
                  <h3 className="text-lg tracking-wider mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    📰 Press & Media
                  </h3>
                  <p className="text-sm opacity-60 mb-2">For press inquiries and interviews</p>
                  <a href="mailto:press@dymnds.com" className="text-white hover:opacity-70 transition-opacity">
                    press@dymnds.com
                  </a>
                </div>

                <div className="p-6 bg-neutral-900 border border-white/5">
                  <h3 className="text-lg tracking-wider mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    🤝 Partnerships
                  </h3>
                  <p className="text-sm opacity-60 mb-2">Want to collaborate?</p>
                  <a href="mailto:partners@dymnds.com" className="text-white hover:opacity-70 transition-opacity">
                    partners@dymnds.com
                  </a>
                </div>
              </div>

              {/* Social */}
              <div className="mt-12">
                <h3 className="text-lg tracking-wider mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  Follow Us
                </h3>
                <div className="flex gap-4">
                  {['Instagram', 'TikTok', 'Twitter', 'YouTube'].map((social) => (
                    <a
                      key={social}
                      href="#"
                      className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300"
                    >
                      <span className="text-sm font-bold">{social[0]}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Response Time */}
              <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-lg">
                <p className="text-sm opacity-70">
                  <strong>Response Time:</strong> We typically respond within 24-48 hours during business days. For urgent order issues, please include your order number in the subject line.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="py-16 px-6 bg-black border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl tracking-wider mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Common Questions?
          </h2>
          <p className="text-sm opacity-60 mb-6">
            Check out our FAQ for quick answers to the most common questions.
          </p>
          <a
            href="/faq"
            className="inline-block px-8 py-3 border border-white/40 text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300"
          >
            View FAQ
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}