'use client';

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-16 px-6 border-t border-white/10 bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3 group mb-6">
              <img 
                src="/diamond-white.png" 
                alt="DYMNDS" 
                className="h-10 w-auto group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" 
              />
              <img 
                src="/dymnds-only-white.png" 
                alt="DYMNDS" 
                className="h-5 w-auto" 
              />
            </Link>
            <p className="text-sm opacity-60 leading-relaxed mb-6">
              Premium athletic wear for those who push limits. Pressure creates diamonds.
            </p>
            <div className="flex gap-4">
              {['Instagram', 'TikTok', 'Twitter', 'YouTube'].map((social) => (
                <a 
                  key={social}
                  href="#" 
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 hover:scale-110"
                  title={social}
                >
                  <span className="text-xs font-bold">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-sm tracking-widest uppercase mb-6 font-semibold">Shop</h4>
            <ul className="space-y-3">
              {[
                { name: 'All Products', href: '/shop' },
                { name: 'Men', href: '/collections/men' },
                { name: 'Women', href: '/collections/women' },
                { name: 'New Arrivals', href: '/collections/new-arrivals' },
                { name: 'Best Sellers', href: '/collections/all' },
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm opacity-60 hover:opacity-100 transition-opacity duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm tracking-widest uppercase mb-6 font-semibold">Company</h4>
            <ul className="space-y-3">
              {[
                { name: 'About Us', href: '/about' },
                { name: 'Our Impact', href: '/impact' },
                { name: 'The App', href: '/app' },
                { name: 'Contact', href: '/contact' },
                { name: 'Careers', href: '/careers' },
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm opacity-60 hover:opacity-100 transition-opacity duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm tracking-widest uppercase mb-6 font-semibold">Support</h4>
            <ul className="space-y-3">
              {[
                { name: 'FAQ', href: '/faq' },
                { name: 'Shipping Info', href: '/shipping' },
                { name: 'Returns & Exchanges', href: '/returns' },
                { name: 'Size Guide', href: '/size-guide' },
                { name: 'Email Us', href: 'mailto:support@dymnds.ca' },
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm opacity-60 hover:opacity-100 transition-opacity duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-white/10 pt-12 mb-12">
          <div className="max-w-xl mx-auto text-center">
            <h4 className="text-xl tracking-wider mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              Join The Movement
            </h4>
            <p className="text-sm opacity-60 mb-6">
              Subscribe for exclusive drops, early access, and 10% off your first order.
            </p>
            <form className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-sm focus:outline-none focus:border-white/40 transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white text-black text-sm tracking-wider uppercase rounded-lg hover:bg-white/90 transition-all duration-300 hover:scale-105"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
          <p className="text-xs opacity-40">© 2026 DYMNDS Athletic Wear. All rights reserved.</p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Accessibility'].map((link) => (
              <a 
                key={link}
                href="#" 
                className="text-xs opacity-40 hover:opacity-70 transition-opacity duration-300"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}