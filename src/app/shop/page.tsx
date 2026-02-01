'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/components/CartContext';
import { useState } from 'react';

const products = [
  { id: 'compression-tee', name: 'Compression Tee', price: 89, category: 'Men', description: 'Your base layer for every battle.' },
  { id: 'heavy-hoodie', name: 'Heavy Hoodie', price: 149, category: 'Men', description: 'Built for recovery days.' },
  { id: 'performance-joggers', name: 'Performance Joggers', price: 119, category: 'Men', description: 'From gym to street.' },
  { id: 'seamless-sports-bra', name: 'Seamless Sports Bra', price: 65, category: 'Women', description: 'Support that moves with you.' },
  { id: 'high-rise-leggings', name: 'High-Rise Leggings', price: 95, category: 'Women', description: 'Sculpted for every squat.' },
  { id: 'cropped-tank', name: 'Cropped Tank', price: 55, category: 'Women', description: 'Freedom to move.' },
];

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'men' | 'women'>('all');
  const { addToCart, cart, subtotal } = useCart();
  const [showCart, setShowCart] = useState(false);

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category.toLowerCase() === activeCategory);

  const handleCheckout = () => {
    // Redirect to Shopify checkout
    // Replace with your actual Shopify store URL
    window.location.href = 'https://dymnds.myshopify.com/cart';
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Products Column */}
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="mb-12">
                <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  Shop
                </h1>
                <p className="text-white/50">Premium activewear. Real impact.</p>
              </div>

              {/* Category Filter */}
              <div className="flex gap-4 mb-10">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'men', label: 'Men' },
                  { key: 'women', label: 'Women' },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key as 'all' | 'men' | 'women')}
                    className={`px-6 py-3 text-xs tracking-[0.2em] uppercase transition-all ${
                      activeCategory === cat.key
                        ? 'bg-white text-black'
                        : 'border border-white/20 text-white/60 hover:text-white hover:border-white/40'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              <div className="grid md:grid-cols-2 gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                ))}
              </div>
            </div>

            {/* Cart/Checkout Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 border border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    Your Cart
                  </h2>
                  <span className="text-sm text-white/50">
                    {cart.length} {cart.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/40 mb-4">Your cart is empty</p>
                    <p className="text-white/30 text-sm">Add items to make an impact</p>
                    <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
                      <p className="text-xs text-white/50">
                        💎 Every $89 funds 1 hour of survivor therapy
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-3 border-b border-white/5">
                          <div>
                            <p className="text-sm">{item.name}</p>
                            <p className="text-xs text-white/40">Size: {item.size} × {item.quantity}</p>
                          </div>
                          <p className="text-sm">${item.price * item.quantity}</p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/10 pt-4 mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-white/60">Subtotal</span>
                        <span>${subtotal}</span>
                      </div>
                    </div>

                    {/* Impact Calculator */}
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">💎</span>
                        <span className="text-sm font-medium text-green-400">Your Impact</span>
                      </div>
                      <p className="text-2xl font-light text-white mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                        {(subtotal * 0.1 / 89 * 60).toFixed(0)} minutes
                      </p>
                      <p className="text-xs text-white/60">
                        of trauma therapy funded for survivors
                      </p>
                      <div className="mt-3 pt-3 border-t border-green-500/20">
                        <p className="text-xs text-white/40">
                          ${(subtotal * 0.1).toFixed(2)} donated • 10% of every order
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-4 mb-6">
                      <div className="flex justify-between text-lg">
                        <span>Total</span>
                        <span>${subtotal}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleCheckout}
                      className="w-full py-4 bg-white text-black text-xs tracking-[0.2em] uppercase hover:bg-white/90 transition-all"
                    >
                      Checkout
                    </button>

                    <p className="text-center text-white/30 text-xs mt-4">
                      When you wear Dymnds, you help others shine
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function ProductCard({ product, onAddToCart }: { 
  product: typeof products[0]; 
  onAddToCart: (item: { id: string; name: string; price: number; quantity: number; size: string }) => void;
}) {
  const [selectedSize, setSelectedSize] = useState('M');
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart({
      id: `${product.id}-${selectedSize}`,
      name: product.name,
      price: product.price,
      quantity: 1,
      size: selectedSize,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group">
      <div className="aspect-[4/5] bg-neutral-900 mb-5 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all duration-500">
        <img src="/diamond-white.png" alt="" className="w-16 h-16 opacity-15 group-hover:opacity-40 transition-opacity duration-500" />
      </div>

      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/30">{product.category}</p>
        <h3 className="text-xl tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          {product.name}
        </h3>
        <p className="text-white/40 text-sm">{product.description}</p>
        <p className="text-lg">${product.price}</p>

        <div className="flex gap-2 pt-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`w-10 h-10 flex items-center justify-center text-xs transition-all ${
                selectedSize === size
                  ? 'bg-white text-black'
                  : 'border border-white/20 text-white/50 hover:text-white hover:border-white/40'
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        <button
          onClick={handleAdd}
          className={`w-full py-4 mt-3 text-xs tracking-[0.2em] uppercase transition-all ${
            added 
              ? 'bg-green-500 text-white' 
              : 'bg-white text-black hover:bg-white/90'
          }`}
        >
          {added ? 'Added ✓' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
