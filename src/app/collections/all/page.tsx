'use client';

import Link from 'next/link';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/components/CartContext';

const products = [
  {
    id: 'compression-tee',
    name: 'Compression Tee',
    price: 89,
    category: 'Men',
    description: 'Your base layer for every workout. Sweat-wicking, odor-resistant, built to move.',
    features: ['4-way stretch', 'Moisture-wicking', 'Anti-odor'],
  },
  {
    id: 'heavy-hoodie',
    name: 'Heavy Hoodie',
    price: 149,
    category: 'Men',
    description: 'Warmth without weight. Your post-workout recovery layer.',
    features: ['Premium cotton blend', 'Relaxed fit', 'Kangaroo pocket'],
  },
  {
    id: 'neural-joggers',
    name: 'Neural Joggers',
    price: 119,
    category: 'Men',
    description: 'Tapered fit, maximum comfort. From gym to street.',
    features: ['Tapered leg', 'Zip pockets', 'Breathable fabric'],
  },
  {
    id: 'sports-bra',
    name: 'Performance Sports Bra',
    price: 65,
    category: 'Women',
    description: 'Support that moves with you. High-impact ready.',
    features: ['High support', 'Removable cups', 'Moisture-wicking'],
  },
  {
    id: 'high-rise-leggings',
    name: 'High-Rise Leggings',
    price: 95,
    category: 'Women',
    description: 'Compression that sculpts. Stays put through every squat.',
    features: ['High waist', 'Squat-proof', 'Phone pocket'],
  },
  {
    id: 'cropped-tank',
    name: 'Cropped Tank',
    price: 55,
    category: 'Women',
    description: 'Lightweight and breathable. Freedom to move.',
    features: ['Cropped length', 'Relaxed fit', 'Soft fabric'],
  },
];

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function CollectionsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { addToCart } = useCart();

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const handleAddToCart = (product: typeof products[0], size: string) => {
    addToCart({
      id: `${product.id}-${size}`,
      name: product.name,
      price: product.price,
      quantity: 1,
      size,
    });
    alert(`${product.name} (Size ${size}) added to cart!`);
  };

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-4">Premium Activewear</p>
            <h1 className="text-6xl md:text-8xl font-bebas italic tracking-tight uppercase mb-6">
              Shop Collection
            </h1>
            <p className="text-lg text-white/40 max-w-2xl mx-auto italic">
              Every piece engineered for performance. 10% of every order supports survivors.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex justify-center gap-4 mb-12">
            {['All', 'Men', 'Women'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-3 text-sm tracking-widest uppercase rounded-xl transition-all ${
                  selectedCategory === cat
                    ? 'bg-white text-black'
                    : 'border border-white/20 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function ProductCard({ product, onAddToCart }: { 
  product: typeof products[0]; 
  onAddToCart: (p: typeof products[0], size: string) => void;
}) {
  const [selectedSize, setSelectedSize] = useState('M');
  const donation = (product.price * 0.10).toFixed(2);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
      {/* Image Placeholder */}
      <div className="aspect-square bg-neutral-900 flex items-center justify-center relative group">
        <img 
          src="/diamond-white.png" 
          alt="" 
          className="w-20 h-20 opacity-20 group-hover:opacity-40 transition-opacity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-xs tracking-widest uppercase text-white/40 mb-2">{product.category}</p>
        <h3 className="text-2xl font-bebas italic uppercase tracking-wide mb-2">{product.name}</h3>
        <p className="text-white/60 text-sm mb-4">{product.description}</p>
        
        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          {product.features.map((feature) => (
            <span key={feature} className="text-[10px] tracking-wider uppercase px-2 py-1 bg-white/5 rounded">
              {feature}
            </span>
          ))}
        </div>

        {/* Impact */}
        <div className="flex items-center gap-2 mb-4 text-green-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span>${donation} supports survivors</span>
        </div>

        {/* Price */}
        <p className="text-2xl font-bebas italic mb-4">${product.price}</p>

        {/* Size Selector */}
        <div className="mb-4">
          <p className="text-xs tracking-widest uppercase text-white/40 mb-2">Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`w-10 h-10 flex items-center justify-center text-sm rounded-lg transition-all ${
                  selectedSize === size
                    ? 'bg-white text-black'
                    : 'border border-white/20 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Add to Cart */}
        <button
          onClick={() => onAddToCart(product, selectedSize)}
          className="w-full py-4 bg-white text-black font-bebas italic text-lg tracking-widest uppercase rounded-xl hover:scale-[1.02] transition-transform"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
