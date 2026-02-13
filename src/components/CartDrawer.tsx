'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import { useCartItems, useTotalItems, useSubtotal, useCartStore } from '@/lib/stores/cart-store';
import { useCurrency, convertPrice, formatPrice } from '@/lib/stores/currency-store';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const cart = useCartItems();
  const totalItems = useTotalItems();
  const subtotal = useSubtotal();
  const removeFromCart = useCartStore(s => s.removeFromCart);
  const updateQuantity = useCartStore(s => s.updateQuantity);
  const currency = useCurrency();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape + focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();

      // Focus trap
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus close button on open
    const timer = setTimeout(() => {
      drawerRef.current?.querySelector<HTMLElement>('button')?.focus();
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-neutral-950 border-l border-white/10 z-[70] transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="text-lg font-bebas tracking-wider">Your Cart (<span aria-live="polite" aria-atomic="true">{totalItems}</span>)</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-12 h-12 text-white/10 mb-4" />
              <p className="text-white/40 mb-6">Your cart is empty</p>
              <button
                onClick={onClose}
                className="px-8 py-3 border border-white/20 text-xs tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4 p-3 bg-white/[0.03] rounded-lg">
                  {/* Image */}
                  <div className="relative w-20 h-24 bg-neutral-900 rounded-md overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image src="/diamond-white.png" alt="" width={24} height={24} className="opacity-20" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{item.name}</h3>
                    <p className="text-xs text-white/40 mt-0.5">
                      Size: {item.size}{item.color ? ` / ${item.color}` : ''}
                    </p>
                    <p className="text-sm mt-1">
                      {formatPrice(convertPrice(item.price, currency), currency)}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity - 1, item.color)}
                          className="w-7 h-7 flex items-center justify-center border border-white/10 rounded hover:border-white/30 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1, item.color)}
                          className="w-7 h-7 flex items-center justify-center border border-white/10 rounded hover:border-white/30 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id, item.size, item.color)}
                        className="text-white/30 hover:text-red-400 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="px-6 py-5 border-t border-white/10 space-y-4">
            {/* Impact message */}
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Image src="/diamond-white.png" alt="" width={14} height={14} className="opacity-40" />
              <span>10% of your order funds survivor healing</span>
            </div>

            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Subtotal</span>
              <span className="text-lg font-medium">
                {formatPrice(convertPrice(subtotal, currency), currency)}
              </span>
            </div>

            {/* CTA Buttons */}
            <Link
              href="/cart"
              onClick={onClose}
              className="block w-full py-3.5 bg-white text-black text-center text-sm font-bold tracking-widest uppercase transition-all hover:bg-white/90"
            >
              View Cart & Checkout
            </Link>
            <button
              onClick={onClose}
              className="block w-full py-3 text-center text-xs tracking-[0.2em] uppercase text-white/50 hover:text-white transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
