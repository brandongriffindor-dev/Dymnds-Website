'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Product } from '@/lib/firebase';

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('displayOrder', 'asc'));
        const snapshot = await getDocs(q);
        const productsData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Product));
        setProducts(productsData);
      } catch (err: any) {
        console.error('Query error:', err.message);
        const fallbackQ = query(collection(db, 'products'));
        const fallbackSnap = await getDocs(fallbackQ);
        const productsData = fallbackSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Product));
        productsData.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
        setProducts(productsData);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-4">Premium Activewear</p>
            <h1 className="text-6xl md:text-8xl font-bebas italic tracking-tight uppercase mb-6">
              All Products
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
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/40 text-xl mb-4">No products yet</p>
              <p className="text-white/30">Add products in the admin dashboard</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
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
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
      {/* Image Placeholder */}
      <Link href={`/products/${product.slug}`} className="block">
        <div className="aspect-square bg-neutral-900 flex items-center justify-center relative group">
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
