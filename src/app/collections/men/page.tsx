'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/components/CartContext';
import { useState } from 'react';

const menProducts = [
  { id: 'compression-tee', name: 'Compression Tee', price: 89, description: 'Your base layer for every battle. Sweat-wicking, 4-way stretch, built to move.' },
  { id: 'heavy-hoodie', name: 'Heavy Hoodie', price: 149, description: 'Warmth without weight. Your post-workout recovery layer.' },
  { id: 'performance-joggers', name: 'Performance Joggers', price: 119, description: 'Tapered fit, maximum comfort. From gym to street.' },
  { id: 'training-shorts', name: 'Training Shorts', price: 75, description: 'Built for leg day. Freedom of motion when it matters most.' },
  { id: 'muscle-tank', name: 'Muscle Tank', price: 55, description: 'Show the work. Lightweight, breathable, unrestricted.' },
  { id: 'zip-jacket', name: 'Zip Jacket', price: 129, description: 'Layer up. Transition seamlessly from warm-up to cool-down.' },
];

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function MenPage() {
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
              For Him
            </h1>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Built for your hardest workouts—and your comeback stories.
            </p>
          </div>

          {/* Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menProducts.map((product) => (
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
  product: typeof menProducts[0]; 
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
      <Link href={`/products/${product.id}`} className="block">
        <div className="aspect-[4/5] bg-neutral-900 mb-5 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all duration-500">
          <img src="/diamond-white.png" alt="" className="w-16 h-16 opacity-15 group-hover:opacity-40 transition-opacity duration-500" />
        </div>
      </Link>

      <div className="space-y-3">
        <Link href={`/products/${product.id}`} className="block hover:opacity-70 transition-opacity">
          <h3 className="text-xl tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            {product.name}
          </h3>
        </Link>
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

        <Link 
          href={`/products/${product.id}`}
          className="block w-full py-3 text-center text-xs tracking-[0.2em] uppercase border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all"
        >
          View Product →
        </Link>
      </div>
    </div>
  );
}
