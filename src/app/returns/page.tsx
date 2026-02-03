export const metadata = {
  title: 'Returns & Exchanges | DYMNDS',
  description: 'Return policy and exchange information for DYMNDS products.',
};

export default function ReturnsPage() {
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
            Returns & Exchanges
          </h1>
          
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Hassle-free returns. Because shopping online should be stress-free.
          </p>
        </div>
      </section>

      {/* Policy Overview */}
      <section className="py-16 px-6 bg-neutral-950 border-y border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">30</div>
              <h3 className="text-lg font-bebas italic tracking-wider mb-2">Day Returns</h3>
              <p className="text-sm text-white/50">30 days from delivery to return or exchange</p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">$0</div>
              <h3 className="text-lg font-bebas italic tracking-wider mb-2">Return Shipping</h3>
              <p className="text-sm text-white/50">Free returns on all orders</p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">✓</div>
              <h3 className="text-lg font-bebas italic tracking-wider mb-2">Full Refunds</h3>
              <p className="text-sm text-white/50">Original payment method</p>
            </div>
          </div>
        </div>
      </section>

      {/* Return Policy Details */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bebas italic tracking-wider mb-8 text-center">
            Return Policy
          </h2>

          <div className="space-y-8">
            {/* What's Eligible */}
            <div className="p-6 border border-white/10">
              <h3 className="text-lg font-bebas italic tracking-wider mb-4 flex items-center gap-3">
                <span className="text-green-400">✓</span> What&apos;s Eligible
              </h3>
              <ul className="space-y-2 text-white/60">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-white/40 rounded-full mt-2" />
                  Items in original condition with tags attached
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-white/40 rounded-full mt-2" />
                  Unworn, unwashed, and unaltered items
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-white/40 rounded-full mt-2" />
                  Items returned within 30 days of delivery
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-white/40 rounded-full mt-2" />
                  Items with original packaging (when possible)
                </li>
              </ul>
            </div>

            {/* What's Not Eligible */}
            <div className="p-6 border border-white/10">
              <h3 className="text-lg font-bebas italic tracking-wider mb-4 flex items-center gap-3">
                <span className="text-red-400">✕</span> What&apos;s Not Eligible
              </h3>
              <ul className="space-y-2 text-white/60">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-white/40 rounded-full mt-2" />
                  Worn, washed, or altered items
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-white/40 rounded-full mt-2" />
                  Items without original tags
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-white/40 rounded-full mt-2" />
                  Items returned after 30 days
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-white/40 rounded-full mt-2" />
                  Final sale items (if applicable)
                </li>
              </ul>
            </div>

            {/* How to Return */}
            <div className="p-6 border border-white/10">
              <h3 className="text-lg font-bebas italic tracking-wider mb-4">
                How To Return
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                  <div>
                    <p className="text-white font-medium">Email Us</p>
                    <p className="text-sm text-white/50">Send an email to support@dymnds.ca with your order number and reason for return</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                  <div>
                    <p className="text-white font-medium">Get Label</p>
                    <p className="text-sm text-white/50">We&apos;ll send you a prepaid return shipping label</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                  <div>
                    <p className="text-white font-medium">Pack & Ship</p>
                    <p className="text-sm text-white/50">Pack the item securely and attach the return label</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 font-bold">4</div>
                  <div>
                    <p className="text-white font-medium">Get Refunded</p>
                    <p className="text-sm text-white/50">Once we receive and inspect the item, we&apos;ll process your refund within 5-7 business days</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Exchanges */}
            <div className="p-6 border border-white/10">
              <h3 className="text-lg font-bebas italic tracking-wider mb-4">
                Exchanges
              </h3>
              <p className="text-white/60 mb-4">
                Need a different size or color? We&apos;ve got you. Follow the return process above and 
                let us know what you&apos;d like to exchange for. We&apos;ll ship the new item as soon as 
                we receive your return.
              </p>
              <p className="text-sm text-white/40">
                Exchanges are subject to availability. If the item you want is out of stock, 
                we&apos;ll issue a full refund instead.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 px-6 bg-neutral-950 border-t border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bebas italic tracking-wider mb-4">
            Questions About Your Return?
          </h2>
          <p className="text-white/60 mb-6">
            We&apos;re here to help make the process smooth. Reach out anytime.
          </p>
          <a 
            href="mailto:support@dymnds.ca?subject=Return/Exchange Question"
            className="inline-block px-8 py-4 bg-white text-black font-bold tracking-wider uppercase rounded-lg hover:bg-white/90 transition-colors"
          >
            Contact Support
          </a>
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
