'use client';

import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import { useCartItems, useSubtotal, useDonation, useCartStore } from '@/lib/stores/cart-store';
import { useCurrency, convertPrice, formatPrice } from '@/lib/stores/currency-store';
import { getCSRFToken } from '@/lib/get-csrf-token';
import { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, Truck } from 'lucide-react';

export default function CartPage() {
  const cart = useCartItems();
  const subtotal = useSubtotal();
  const donation = useDonation();
  const currency = useCurrency();
  const removeFromCart = useCartStore(s => s.removeFromCart);
  const updateQuantity = useCartStore(s => s.updateQuantity);
  const clearCart = useCartStore(s => s.clearCart);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const shipping = subtotal > 150 ? 0 : 12;
  const total = subtotal + shipping;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const fmt = (cad: number) => formatPrice(convertPrice(cad, currency), currency);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const csrfToken = await getCSRFToken();
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.id,
            size: item.size,
            quantity: item.quantity,
            color: item.color,
            declaredPrice: item.price,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCheckoutError(data.error || 'Checkout failed. Please try again.');
        setCheckoutLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError('Failed to create checkout session.');
        setCheckoutLoading(false);
      }
    } catch {
      setCheckoutError('Network error. Please check your connection.');
      setCheckoutLoading(false);
    }
  };

  return (
    <main id="main-content" className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="pt-32 pb-20 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <ScrollReveal animation="fade-up" delay={0} duration={600} className="mb-16">
            <h1 className="text-5xl md:text-7xl font-bebas tracking-tight uppercase mb-4">
              YOUR CART
            </h1>
            <p className="text-white/40 uppercase tracking-widest text-sm font-inter">
              {totalItems === 0 ? 'EMPTY' : `${totalItems} ITEM${totalItems !== 1 ? 'S' : ''}`}
            </p>
          </ScrollReveal>

          {/* Empty Cart State */}
          {cart.length === 0 ? (
            <ScrollReveal animation="fade-up" delay={100} duration={600}>
              <div className="flex flex-col items-center justify-center py-24 text-center">
                {/* Diamond Icon */}
                <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center mb-8">
                  <ShoppingBag className="w-8 h-8 text-white/15" />
                </div>

                {/* Empty State Text */}
                <h2 className="text-3xl md:text-4xl font-bebas uppercase mb-4 tracking-tight">
                  YOUR CART IS EMPTY
                </h2>
                <p className="text-white/40 max-w-md mb-12 text-sm leading-relaxed">
                  Every purchase helps survivors heal. 10% of your order goes directly to recovery programs.
                </p>

                {/* Shop Now Button */}
                <Link
                  href="/shop"
                  className="px-12 py-4 bg-[var(--accent)] text-black font-bebas text-sm tracking-[0.2em] uppercase transition-all duration-400 hover:bg-[var(--accent-light)] hover:shadow-[0_0_32px_-4px_rgba(200,169,126,0.25)]"
                >
                  SHOP NOW
                </Link>
              </div>
            </ScrollReveal>
          ) : (
            // Cart with Items
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Left Column: Cart Items */}
              <div className="lg:col-span-2">
                <div className="space-y-4 mb-8">
                  {cart.map((item, index) => (
                    <ScrollReveal
                      key={item.id}
                      animation="fade-up"
                      delay={index * 50}
                      duration={600}
                      className="bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] p-5 md:p-6 transition-all duration-300"
                    >
                      <div className="flex gap-5 md:gap-6">
                        {/* Product Image */}
                        <div className="relative w-24 h-28 md:w-28 md:h-32 flex-shrink-0 bg-neutral-900 overflow-hidden flex items-center justify-center">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="112px"
                            />
                          ) : (
                            <Image
                              src="/diamond-white.png"
                              alt=""
                              width={32}
                              height={32}
                              className="opacity-15"
                            />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <h3 className="font-bebas text-lg uppercase tracking-wide mb-1.5 truncate">
                              {item.name}
                            </h3>
                            <div className="flex gap-3 text-[10px] text-white/35 uppercase tracking-[0.2em] mb-2">
                              {item.size && <span>Size: {item.size}</span>}
                              {item.color && <span>Color: {item.color}</span>}
                            </div>
                            <p className="text-sm text-[var(--accent)]">
                              {fmt(item.price)}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1.5 mt-3">
                            <button
                              onClick={() => updateQuantity(item.id, item.size, Math.max(1, item.quantity - 1), item.color)}
                              className="w-8 h-8 flex items-center justify-center border border-white/[0.08] hover:border-white/20 transition-colors duration-300"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.size, item.quantity + 1, item.color)}
                              disabled={item.quantity >= 10}
                              className="w-8 h-8 flex items-center justify-center border border-white/[0.08] hover:border-white/20 transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Item Total & Remove */}
                        <div className="flex flex-col items-end justify-between">
                          <p className="font-bebas text-lg">
                            {fmt(item.price * item.quantity)}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.id, item.size, item.color)}
                            className="text-white/20 hover:text-red-400 transition-colors duration-300"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>

                {/* Clear Cart Button */}
                <button
                  onClick={clearCart}
                  className="text-[10px] uppercase tracking-[0.25em] text-white/25 hover:text-white/60 transition-colors duration-300"
                >
                  CLEAR CART
                </button>
              </div>

              {/* Right Column: Order Summary */}
              <div className="lg:col-span-1">
                <ScrollReveal
                  animation="fade-up"
                  delay={150}
                  duration={600}
                  className="sticky top-32"
                >
                  <div className="bg-white/[0.02] border border-white/[0.06] p-7 md:p-8">
                    <h2 className="font-bebas text-xl uppercase tracking-wider mb-8">
                      ORDER SUMMARY
                    </h2>

                    {/* Summary Lines */}
                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between text-white/50 text-sm">
                        <span>Subtotal</span>
                        <span>{fmt(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-white/50 text-sm">
                        <span>Shipping</span>
                        <span className="font-medium">
                          {shipping === 0 ? 'FREE' : fmt(shipping)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[var(--accent)]/70 text-sm">
                        <span>Your Impact (10%)</span>
                        <span>{fmt(donation)}</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/[0.06] py-6 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="font-bebas uppercase tracking-wider text-white/80">Total</span>
                        <span className="font-bebas text-2xl">
                          {fmt(total)}
                        </span>
                      </div>
                    </div>

                    {/* Impact Note */}
                    <div className="glass-panel-accent p-4 mb-8">
                      <div className="flex items-center justify-center gap-2.5">
                        <div className="glow-dot" style={{ width: '5px', height: '5px' }} />
                        <p className="text-xs text-[var(--accent)]/60 text-center leading-relaxed">
                          Your purchase contributes <span className="font-semibold text-[var(--accent)]">{fmt(donation)}</span> to support survivors
                        </p>
                      </div>
                    </div>

                    {/* Checkout Error */}
                    {checkoutError && (
                      <div className="bg-red-500/[0.06] border border-red-500/15 p-3 mb-4">
                        <p className="text-xs text-red-400/80 text-center">{checkoutError}</p>
                      </div>
                    )}

                    {/* Checkout Button */}
                    <button
                      onClick={handleCheckout}
                      disabled={checkoutLoading}
                      className="w-full py-4 bg-[var(--accent)] text-black font-bebas text-sm tracking-[0.2em] uppercase transition-all duration-400 hover:bg-[var(--accent-light)] hover:shadow-[0_0_24px_-4px_rgba(200,169,126,0.25)] disabled:opacity-50 disabled:cursor-not-allowed mb-5"
                    >
                      {checkoutLoading ? 'PROCESSING...' : 'PROCEED TO CHECKOUT'}
                    </button>

                    {/* Shipping Progress */}
                    {subtotal < 150 ? (
                      <div className="text-center">
                        <div className="w-full bg-white/[0.06] h-1 mb-3">
                          <div
                            className="bg-[var(--accent)] h-1 transition-all duration-500"
                            style={{ width: `${Math.min((subtotal / 150) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-white/35">
                          <Truck className="w-3.5 h-3.5" />
                          <span className="uppercase tracking-wider">
                            {fmt(150 - subtotal)} away from free shipping
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-xs text-[var(--accent)]/70">
                        <Truck className="w-3.5 h-3.5" />
                        <span className="uppercase tracking-wider">
                          You qualify for free shipping
                        </span>
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
