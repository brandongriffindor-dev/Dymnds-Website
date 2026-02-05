'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { Product } from '@/lib/firebase';

export default function NewArrivalsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Get products marked as new arrivals (simple query to avoid index issues)
        const q = query(collection(db, 'products'), where('newArrival', '==', true));
        const snapshot = await getDocs(q);
        let productsData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Product));
        // Sort by displayOrder in memory
        productsData.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
        setProducts(productsData);
      } catch (err: any) {
        console.error('Query error:', err.message);
        setProducts([]);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero - Fresh Drop Energy */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Animated Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm text-green-400 tracking-wider uppercase">Just Dropped</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-6xl md:text-8xl font-bebas italic tracking-tight uppercase mb-6">
              New Arrivals
            </h1>
            <p className="text-lg text-white/40 max-w-2xl mx-auto italic">
              The latest pieces. Limited drops. Be the first to wear them.
            </p>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/40 text-xl mb-4">Fresh drops coming soon</p>
              <p className="text-white/30">Check back for the latest arrivals</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} isNew={index < 3} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function ProductCard({ product, isNew = false }: { 
  product: Product;
  isNew?: boolean;
}) {
  const donation = (product.price * 0.10).toFixed(2);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all group">
      {/* Image Placeholder */}
      <Link href={`/products/${product.slug}`} className="block">
        <div className="aspect-square bg-neutral-900 flex items-center justify-center relative">
          <img 
            src="/diamond-white.png" 
            alt="" 
            className="w-20 h-20 opacity-20 group-hover:opacity-40 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* New Badge on first 3 */}
          {isNew && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-white text-black text-xs font-bold tracking-wider uppercase rounded">
              New
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-6">
        <p className="text-xs tracking-widest uppercase text-white/40 mb-2">{product.category}</p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-2xl font-bebas italic uppercase tracking-wide mb-2 hover:opacity-70 transition-opacity">{product.title}</h3>
        </Link>
        <p className="text-white/60 text-sm mb-4">{product.subtitle}</p>

        {/* Impact */}
        <div className="flex items-center gap-2 mb-4 text-green-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span>${donation} supports survivors</span>
        </div>

        {/* Price */}
        <p className="text-2xl font-bebas italic mb-4">${product.price}</p>

        {/* View Product Button */}
        <Link href={`/products/${product.slug}`}>
          <button
            className="w-full py-4 font-bebas italic text-lg tracking-widest uppercase rounded-xl bg-white text-black hover:scale-[1.02] transition-all"
          >
            View Product
          </button>
        </Link>
      </div>
    </div>
  );
}
