'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { Product } from '@/lib/firebase';

export default function BestSellersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Get products marked as best sellers (simple query to avoid index issues)
        const q = query(collection(db, 'products'), where('bestSeller', '==', true));
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

      {/* Hero - Fan Favorites Energy */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm text-amber-400 tracking-wider uppercase">Fan Favorites</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-6xl md:text-8xl font-bebas italic tracking-tight uppercase mb-6">
              Best Sellers
            </h1>
            <p className="text-lg text-white/40 max-w-2xl mx-auto italic">
              The pieces everyone&apos;s wearing. Most loved. Most worn. Proven favorites.
            </p>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/40 text-xl mb-4">No best sellers yet</p>
              <p className="text-white/30">Mark products as best sellers in the admin dashboard</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function ProductCard({ product }: { 
  product: Product;
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
