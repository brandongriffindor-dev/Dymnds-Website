'use client';

import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import { useCartItems, useSubtotal, useDonation, useCartStore } from '@/lib/stores/cart-store';
import { useState } from 'react';

export default function CartPage() {
  const cart = useCartItems();
  const subtotal = useSubtotal();
  const donation = useDonation();
  const removeFromCart = useCartStore(s => s.removeFromCart);
  const updateQuantity = useCartStore(s => s.updateQuantity);
  const clearCart = useCartStore(s => s.clearCart);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const shipping = subtotal > 150 ? 0 : 12;
  const total = subtotal + shipping;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
                <div className="mb-8 opacity-20">
                  <Image
                    src="/diamond-white.png"
                    alt=""
                    width={48}
                    height={48}
                  />
                </div>

                {/* Empty State Text */}
                <h2 className="text-3xl md:text-4xl font-bebas uppercase mb-6 tracking-tight">
                  YOUR CART IS EMPTY
                </h2>
                <p className="text-white/50 max-w-md mb-12 text-base leading-relaxed">
                  Every purchase helps survivors heal. 10% of your order goes directly to recovery programs.
                </p>

                {/* Shop Now Button */}
                <Link
                  href="/shop"
                  className="btn-premium bg-white text-black font-bebas uppercase tracking-widest py-4 px-12 inline-flex items-center justify-center transition-all hover:scale-105 duration-300"
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
                <div className="space-y-6 mb-8">
                  {cart.map((item, index) => (
                    <ScrollReveal
                      key={item.id}
                      animation="fade-up"
                      delay={index * 50}
                      duration={600}
                      className="card-premium bg-white/[0.03] border border-white/8 p-6 rounded-2xl"
                    >
                      <div className="flex gap-6">
                        {/* Product Image */}
                        <div className="relative w-28 h-28 flex-shrink-0 rounded-lg bg-neutral-900 overflow-hidden flex items-center justify-center">
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
                              width={40}
                              height={40}
                              className="opacity-20"
                            />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bebas text-lg uppercase tracking-wide mb-2">
                              {item.name}
                            </h3>
                            <div className="flex gap-4 text-xs text-white/40 uppercase tracking-wider mb-2">
                              {item.size && <span>Size: {item.size}</span>}
                              {item.color && <span>Color: {item.color}</span>}
                            </div>
                            <p className="text-white/80 font-medium">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateQuantity(item.id, item.size, Math.max(1, item.quantity - 1), item.color)}
                              className="btn-premium w-11 h-11 flex items-center justify-center bg-white text-black rounded-lg hover:scale-105 transition-all duration-200 font-bebas text-lg"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-bebas text-lg">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.size, item.quantity + 1, item.color)}
                              disabled={item.quantity >= 10}
                              className="btn-premium w-11 h-11 flex items-center justify-center bg-white text-black rounded-lg hover:scale-105 transition-all duration-200 font-bebas text-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Item Total & Remove */}
                        <div className="flex flex-col items-end justify-between">
                          <p className="font-bebas text-lg">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.id, item.size, item.color)}
                            className="text-xs uppercase tracking-wider text-white/40 hover:text-red-400 transition-colors duration-200"
                            aria-label="Remove item"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>

                {/* Clear Cart Button */}
                <button
                  onClick={clearCart}
                  className="text-xs uppercase tracking-widest text-white/30 hover:text-white transition-colors duration-200"
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
                  <div className="card-premium bg-white/[0.03] border border-white/8 rounded-2xl p-8">
                    <h2 className="font-bebas text-xl uppercase tracking-widest mb-8">
                      ORDER SUMMARY
                    </h2>

                    {/* Summary Lines */}
                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between text-white/60 text-sm">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-white/60 text-sm">
                        <span>Shipping</span>
                        <span className="font-medium">
                          {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-400 text-sm font-medium">
                        <span>Your Impact (10%)</span>
                        <span>${donation.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/8 py-6 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="font-bebas uppercase tracking-widest">Total</span>
                        <span className="font-bebas text-2xl">
                          ${total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Impact Note */}
                    <div className="bg-emerald-500/8 border border-emerald-500/15 rounded-lg p-4 mb-8">
                      <p className="text-xs text-emerald-400 text-center leading-relaxed">
                        Your purchase contributes <span className="font-semibold">${donation.toFixed(2)}</span> to support survivors
                      </p>
                    </div>

                    {/* Checkout Error */}
                    {checkoutError && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                        <p className="text-xs text-red-400 text-center">{checkoutError}</p>
                      </div>
                    )}

                    {/* Checkout Button */}
                    <button
                      onClick={handleCheckout}
                      disabled={checkoutLoading}
                      className="btn-premium bg-white text-black font-bebas uppercase tracking-widest w-full py-4 rounded-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                    >
                      {checkoutLoading ? 'PROCESSING...' : 'PROCEED TO CHECKOUT'}
                    </button>

                    {/* Shipping Progress */}
                    {subtotal < 150 ? (
                      <div className="text-center">
                        <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
                          <div className="bg-white h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min((subtotal / 150) * 100, 100)}%` }} />
                        </div>
                        <p className="text-xs text-white/40 uppercase tracking-wider">
                          ${(150 - subtotal).toFixed(0)} away from free shipping
                        </p>
                      </div>
                    ) : (
                      <p className="text-center text-xs text-emerald-400 uppercase tracking-wider">
                        You qualify for free shipping
                      </p>
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
