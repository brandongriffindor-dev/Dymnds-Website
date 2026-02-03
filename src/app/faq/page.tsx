export const metadata = {
  title: 'FAQ | DYMNDS',
  description: 'Frequently asked questions about DYMNDS products, shipping, and more.',
};

export default function FAQPage() {
  const faqs = [
    {
      question: "What is DYMNDS?",
      answer: "DYMNDS is premium athletic wear built for those who push limits. Every piece is engineered for performance, comfort, and style. Plus, 10% of every purchase supports survivors on their healing journey."
    },
    {
      question: "How does the 10% impact work?",
      answer: "10% of every order goes directly to funding therapy, safe housing, and healing programs for survivors. When you wear DYMNDS, you help others shine."
    },
    {
      question: "What sizes do you offer?",
      answer: "We offer sizes XS through XXL. Each product page has a detailed size guide and a 'What's My Size?' calculator to help you find the perfect fit."
    },
    {
      question: "How do I care for my DYMNDS gear?",
      answer: "Machine wash cold with like colors. Tumble dry low or hang dry. Do not bleach or iron. Our fabrics are built to last, but proper care extends their life even longer."
    },
    {
      question: "Can I change or cancel my order?",
      answer: "We process orders quickly, but if you need to make changes, contact us at support@dymnds.ca within 2 hours of placing your order and we'll do our best to help."
    }
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Simple Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-white/10 bg-black/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/diamond-white.png" alt="" className="h-8 w-auto" />
            <img src="/dymnds-only-white.png" alt="DYMNDS" className="h-4 w-auto" />
          </a>
          <a href="/" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
            ← Back Home
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <img src="/diamond-white.png" alt="" className="h-8 w-auto mx-auto mb-8 opacity-30" />
          
          <h1 className="text-6xl md:text-8xl font-light tracking-tight mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Questions?
          </h1>
          
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            We&apos;ve got answers. If you don&apos;t see what you&apos;re looking for, reach out.
          </p>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-0">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="border-b border-white/10 py-8 first:border-t"
              >
                <h3 className="text-xl font-bebas italic tracking-wider mb-4">
                  {faq.question}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          {/* Ask First Question CTA */}
          <div className="mt-16 p-8 border border-white/10 bg-neutral-950 text-center">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-2xl font-bebas italic tracking-wider mb-3">
              Ask The First Question!
            </h3>
            <p className="text-white/60 mb-6">
              Have something on your mind? We&apos;re here to help. Send us your question and we&apos;ll add it to the list.
            </p>
            <a 
              href="mailto:support@dymnds.ca?subject=FAQ Question"
              className="inline-block px-8 py-4 bg-white text-black font-bold tracking-wider uppercase rounded-lg hover:bg-white/90 transition-colors"
            >
              Ask A Question
            </a>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-6 bg-neutral-950 border-y border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bebas italic tracking-wider mb-8 text-center">
            Quick Links
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <a href="/shipping" className="p-6 border border-white/10 hover:border-white/30 transition-colors text-center group">
              <div className="text-2xl mb-3">🚚</div>
              <h3 className="text-lg font-bebas italic mb-1">Shipping Info</h3>
              <p className="text-sm text-white/50">Delivery times & tracking</p>
            </a>
            
            <a href="/returns" className="p-6 border border-white/10 hover:border-white/30 transition-colors text-center group">
              <div className="text-2xl mb-3">↩️</div>
              <h3 className="text-lg font-bebas italic mb-1">Returns</h3>
              <p className="text-sm text-white/50">Exchanges & refunds</p>
            </a>
            
            <a href="/contact" className="p-6 border border-white/10 hover:border-white/30 transition-colors text-center group">
              <div className="text-2xl mb-3">📧</div>
              <h3 className="text-lg font-bebas italic mb-1">Contact Us</h3>
              <p className="text-sm text-white/50">Get in touch directly</p>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs opacity-40">© 2026 DYMNDS Athletic Wear. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
