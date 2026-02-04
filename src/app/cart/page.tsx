'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/components/CartContext';
import { useState } from 'react';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, subtotal, donation, clearCart } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const shipping = subtotal > 150 ? 0 : 12;
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    // Simulate checkout - in production, integrate with Shopify
    setTimeout(() => {
      alert('Checkout integration coming soon! This would connect to Shopify.');
      setCheckoutLoading(false);
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <Navbar />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl md:text-7xl font-bebas italic tracking-tight uppercase mb-4">
              Your Cart
            </h1>
            <p className="text-white/40 italic uppercase tracking-wide">
              {cart.length === 0 ? 'Your cart is empty' : `${cart.reduce((sum, item) => sum + item.quantity, 0)} item${cart.reduce((sum, item) => sum + item.quantity, 0) !== 1 ? 's' : ''}`}
            </p>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-8 bg-white/5 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-xl text-white/40 mb-4 italic">Your cart is waiting</p>
              <p className="text-white/30 mb-8 max-w-md mx-auto">
                Every purchase helps survivors heal. 10% of your order goes directly to recovery programs.
              </p>
              <Link 
                href="/collections/all"
                className="inline-flex min-h-[56px] px-12 items-center justify-center bg-white text-black font-bebas italic text-xl tracking-[0.3em] uppercase rounded-xl hover:scale-105 transition-all"
              >
                Checkout
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-6 p-6 bg-white/5 border border-white/10 rounded-2xl">
                    {/* Product Image */}
                    <div className="w-32 h-32 bg-neutral-900 rounded-xl flex items-center justify-center flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <img src="/diamond-white.png" alt="" className="w-16 h-16 opacity-30" />
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-bebas italic uppercase tracking-wide">{item.name}</h3>
                        <p className="text-white/40 text-sm mt-1">Size: {item.size}{item.color ? ` • Color: ${item.color}` : ''}</p>
                        <p className="text-white/60 font-bold mt-1">${item.price}</p>
                      </div>

                      <div className="flex items-center gap-6 mt-4">
                        {/* Quantity */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/40 uppercase tracking-wider">Qty:</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-10 h-10 flex items-center justify-center bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-colors"
                          >
                            −
                          </button>
                          <span className="w-10 text-center font-bold text-lg">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-10 h-10 flex items-center justify-center bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-colors"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove */}
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="px-4 py-2 text-xs uppercase tracking-wider text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400 rounded-lg transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-xl font-bebas italic">${item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}

                <button 
                  onClick={clearCart}
                  className="text-white/30 hover:text-white text-sm underline"
                >
                  Clear cart
                </button>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-32 p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <h2 className="text-2xl font-bebas italic uppercase tracking-wide mb-6">Order Summary</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-white/60">
                      <span>Subtotal</span>
                      <span>${subtotal}</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? 'Free' : `$${shipping}`}</span>
                    </div>
                    <div className="flex justify-between text-green-400">
                      <span>Your Impact (10%)</span>
                      <span>${donation.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4 mb-6">
                    <div className="flex justify-between text-xl font-bebas italic">
                      <span>Total</span>
                      <span>${total}</span>
                    </div>
                  </div>

                  {/* Impact Note */}
                  <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <p className="text-sm text-green-400 text-center">
                      Your purchase contributes ${donation.toFixed(2)} to support survivors
                    </p>
                  </div>

                  {/* Checkout Button */}
                  <button 
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="w-full min-h-[56px] flex items-center justify-center bg-white text-black font-bebas italic text-xl tracking-[0.3em] uppercase rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading ? 'Processing...' : 'Checkout'}
                  </button>

                  <p className="text-center text-white/30 text-xs mt-4">
                    Free shipping on orders over $150
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
