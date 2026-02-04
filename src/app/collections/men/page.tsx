'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { Product } from '@/lib/firebase';

export default function MenPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Try with ordering first
        const q = query(collection(db, 'products'), where('category', '==', 'Men'), orderBy('displayOrder', 'asc'));
        const snapshot = await getDocs(q);
        const productsData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Product));
        setProducts(productsData);
      } catch (err: any) {
        console.error('Query error:', err.message);
        // Fallback: fetch without orderBy
        const fallbackQ = query(collection(db, 'products'), where('category', '==', 'Men'));
        const fallbackSnap = await getDocs(fallbackQ);
        const productsData = fallbackSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Product));
        // Sort manually
        productsData.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
        setProducts(productsData);
      }
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
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="aspect-[4/5] bg-neutral-900 mb-6 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all duration-500 group-hover:scale-[1.02]">
        <img src="/diamond-white.png" alt="" className="w-12 h-12 opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
      </div>
      <h3 className="text-xl tracking-wide mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
        {product.title}
      </h3>
      <p className="text-white/40 text-sm mb-2">{product.subtitle}</p>
      <p className="text-lg">${product.price}</p>
    </Link>
  );
}
