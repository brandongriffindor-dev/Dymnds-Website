'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/components/CartContext';
import { useState } from 'react';

const womenProducts = [
  { id: 'seamless-sports-bra', name: 'Seamless Sports Bra', price: 65, description: 'Support that moves with you. High-impact ready.' },
  { id: 'high-rise-leggings', name: 'High-Rise Leggings', price: 95, description: 'Compression that sculpts. Stays put through every squat.' },
  { id: 'cropped-tank', name: 'Cropped Tank', price: 55, description: 'Lightweight and breathable. Freedom to move.' },
  { id: 'running-shorts', name: 'Running Shorts', price: 68, description: 'Built for distance. Lightweight with secure pockets.' },
  { id: 'oversized-hoodie', name: 'Oversized Hoodie', price: 139, description: 'Your comfort zone. Soft, cozy, made for recovery.' },
  { id: 'joggers', name: 'Athletic Joggers', price: 109, description: 'Tapered fit, ultimate comfort. Gym to brunch.' },
];

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function WomenPage() {
  const { addToCart } = useCart();

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-4">The Collection</p>
            <h1 className="text-6xl md:text-8xl font-light tracking-tight mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              For Her
            </h1>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Strength meets style. Built for women who refuse to settle.
            </p>
          </div>

          {/* Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {womenProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function ProductCard({ product, onAddToCart }: { 
  product: typeof womenProducts[0]; 
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
