'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/components/CartContext';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Product } from '@/lib/firebase';

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function MenPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const q = query(collection(db, 'products'), where('category', '==', 'Men'));
      const snapshot = await getDocs(q);
      const productsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Product));
      setProducts(productsData);
      setLoading(false);
    };

    fetchProducts();
  }, []);

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
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/40 text-xl mb-4">No products yet</p>
              <p className="text-white/30">Add products in the admin dashboard</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function ProductCard({ product, onAddToCart }: { 
  product: Product;
  onAddToCart: (item: { id: string; name: string; price: number; quantity: number; size: string }) => void;
}) {
  const [added, setAdded] = useState(false);

  // Check if size is in stock
  const isSizeInStock = (size: string) => {
    return (product.stock as Record<string, number>)?.[size] > 0;
  };

  // Auto-select first available size (prefer M if in stock, otherwise first available)
  const getDefaultSize = () => {
    if (isSizeInStock('M')) return 'M';
    const firstAvailable = sizes.find(size => isSizeInStock(size));
    return firstAvailable || 'M';
  };

  const [selectedSize, setSelectedSize] = useState(getDefaultSize());

  const handleAdd = () => {
    if (!isSizeInStock(selectedSize)) return;
    
    onAddToCart({
      id: `${product.id}-${selectedSize}`,
      name: product.title,
      price: product.price,
      quantity: 1,
      size: selectedSize,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="aspect-[4/5] bg-neutral-900 mb-5 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all duration-500">
          <img src="/diamond-white.png" alt="" className="w-16 h-16 opacity-15 group-hover:opacity-40 transition-opacity duration-500" />
        </div>
      </Link>

      <div className="space-y-3">
        <Link href={`/products/${product.slug}`} className="block hover:opacity-70 transition-opacity">
          <h3 className="text-xl tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            {product.title}
          </h3>
        </Link>
        <p className="text-white/40 text-sm">{product.subtitle}</p>
        <p className="text-lg">${product.price}</p>

        <div className="flex gap-2 pt-2">
          {sizes.map((size) => {
            const inStock = isSizeInStock(size);
            return (
              <button
                key={size}
                onClick={() => inStock && setSelectedSize(size)}
                disabled={!inStock}
                className={`w-10 h-10 flex items-center justify-center text-xs transition-all ${
                  selectedSize === size
                    ? 'bg-white text-black'
                    : inStock
                      ? 'border border-white/20 text-white/50 hover:text-white hover:border-white/40'
                      : 'border border-neutral-800 text-neutral-700 cursor-not-allowed line-through'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleAdd}
          disabled={!isSizeInStock(selectedSize)}
          className={`w-full py-4 mt-3 text-xs tracking-[0.2em] uppercase transition-all ${
            added 
              ? 'bg-green-500 text-white' 
              : isSizeInStock(selectedSize)
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          }`}
        >
          {added ? 'Added ✓' : isSizeInStock(selectedSize) ? 'Add to Cart' : 'Out of Stock'}
        </button>

        <Link 
          href={`/products/${product.slug}`}
          className="block w-full py-3 text-center text-xs tracking-[0.2em] uppercase border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all"
        >
          View Product →
        </Link>
      </div>
    </div>
  );
}
