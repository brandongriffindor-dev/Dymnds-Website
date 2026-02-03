export const metadata = {
  title: 'Shipping Info | DYMNDS',
  description: 'Shipping information, delivery times, and tracking for DYMNDS orders.',
};

export default function ShippingPage() {
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
            Shipping
          </h1>
          
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Fast, reliable delivery. From our hands to yours.
          </p>
        </div>
      </section>

      {/* Shipping Options */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Standard Shipping */}
            <div className="p-8 border border-white/10 bg-neutral-950">
              <div className="text-3xl mb-4">📦</div>
              <h3 className="text-2xl font-bebas italic tracking-wider mb-2">Standard Shipping</h3>
              <p className="text-3xl font-medium mb-4">FREE</p>
              <p className="text-white/60 mb-4">On orders over $100</p>
              <ul className="space-y-2 text-sm text-white/50">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-white/40 rounded-full" />
                  3-5 business days
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-white/40 rounded-full" />
                  Tracking included
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-white/40 rounded-full" />
                  Canada & USA
                </li>
              </ul>
            </div>

            {/* Express Shipping */}
            <div className="p-8 border border-white/10 bg-neutral-950">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-2xl font-bebas italic tracking-wider mb-2">Express Shipping</h3>
              <p className="text-3xl font-medium mb-4">$15</p>
              <p className="text-white/60 mb-4">For when you need it fast</p>
              <ul className="space-y-2 text-sm text-white/50">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-white/40 rounded-full" />
                  1-2 business days
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-white/40 rounded-full" />
                  Priority tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-white/40 rounded-full" />
                  Canada & USA
                </li>
              </ul>
            </div>
          </div>

          {/* Processing Time */}
          <div className="p-8 border border-white/10 mb-12">
            <h3 className="text-xl font-bebas italic tracking-wider mb-4">Processing Time</h3>
            <p className="text-white/60 mb-4">
              Orders are processed within 24-48 hours (excluding weekends and holidays). 
              You&apos;ll receive a confirmation email with tracking information once your order ships.
            </p>
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
              <div className="text-2xl">⏱️</div>
              <div>
                <p className="text-sm text-white/40">Typical processing time</p>
                <p className="text-lg font-medium">1-2 business days</p>
              </div>
            </div>
          </div>

          {/* International */}
          <div className="p-8 border border-white/10 mb-12">
            <h3 className="text-xl font-bebas italic tracking-wider mb-4">International Shipping</h3>
            <p className="text-white/60 mb-4">
              We currently ship to Canada and the USA. International shipping to other countries 
              coming soon. Sign up for our newsletter to be the first to know.
            </p>
            <div className="flex gap-4">
              <span className="px-4 py-2 bg-white/10 rounded text-sm">🇨🇦 Canada</span>
              <span className="px-4 py-2 bg-white/10 rounded text-sm">🇺🇸 USA</span>
            </div>
          </div>

          {/* Tracking */}
          <div className="p-8 border border-white/10 text-center">
            <div className="text-3xl mb-4">📍</div>
            <h3 className="text-xl font-bebas italic tracking-wider mb-4">Track Your Order</h3>
            <p className="text-white/60 mb-6">
              Once your order ships, you&apos;ll receive an email with your tracking number. 
              You can also contact us anytime for an update.
            </p>
            <a 
              href="mailto:support@dymnds.ca?subject=Order Tracking"
              className="inline-block px-8 py-4 bg-white text-black font-bold tracking-wider uppercase rounded-lg hover:bg-white/90 transition-colors"
            >
              Track My Order
            </a>
          </div>
        </div>
      </section>

      {/* Questions */}
      <section className="py-16 px-6 bg-neutral-950 border-t border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bebas italic tracking-wider mb-4">
            Still Have Questions?
          </h2>
          <p className="text-white/60 mb-6">
            We&apos;re here to help. Reach out and we&apos;ll get back to you within 24 hours.
          </p>
          <div className="flex justify-center gap-4">
            <a 
              href="mailto:support@dymnds.ca"
              className="px-6 py-3 border border-white/20 hover:bg-white hover:text-black transition-colors"
            >
              Email Us
            </a>
            <a 
              href="/faq"
              className="px-6 py-3 border border-white/20 hover:bg-white hover:text-black transition-colors"
            >
              View FAQ
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <a href="/" className="flex items-center gap-3 group mb-6">
                <img src="/diamond-white.png" alt="DYMNDS" className="h-10 w-auto group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
                <img src="/dymnds-only-white.png" alt="DYMNDS" className="h-5 w-auto" />
              </a>
              <p className="text-sm opacity-60 leading-relaxed mb-6">
                Premium athletic wear for those who push limits. Pressure creates diamonds.
              </p>
            </div>

            {/* Shop */}
            <div>
              <h4 className="text-sm tracking-widest uppercase mb-6 font-semibold">Shop</h4>
              <ul className="space-y-3">
                <li><a href="/shop" className="text-sm opacity-60 hover:opacity-100 transition-opacity">All Products</a></li>
                <li><a href="/collections/men" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Men</a></li>
                <li><a href="/collections/women" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Women</a></li>
                <li><a href="/collections/all" className="text-sm opacity-60 hover:opacity-100 transition-opacity">New Arrivals</a></li>
                <li><a href="/collections/all" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Best Sellers</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm tracking-widest uppercase mb-6 font-semibold">Company</h4>
              <ul className="space-y-3">
                <li><a href="/about" className="text-sm opacity-60 hover:opacity-100 transition-opacity">About Us</a></li>
                <li><a href="/impact" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Our Impact</a></li>
                <li><a href="/app" className="text-sm opacity-60 hover:opacity-100 transition-opacity">The App</a></li>
                <li><a href="/contact" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Contact</a></li>
                <li><a href="/careers" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Careers</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm tracking-widest uppercase mb-6 font-semibold">Support</h4>
              <ul className="space-y-3">
                <li><a href="/faq" className="text-sm opacity-60 hover:opacity-100 transition-opacity">FAQ</a></li>
                <li><a href="/shipping" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Shipping Info</a></li>
                <li><a href="/returns" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Returns & Exchanges</a></li>
                <li><a href="/size-guide" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Size Guide</a></li>
                <li><a href="mailto:support@dymnds.ca" className="text-sm opacity-60 hover:opacity-100 transition-opacity">Email Us</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
            <p className="text-xs opacity-40">© 2026 DYMNDS Athletic Wear. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-xs opacity-40 hover:opacity-70 transition-opacity">Privacy Policy</a>
              <a href="#" className="text-xs opacity-40 hover:opacity-70 transition-opacity">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
