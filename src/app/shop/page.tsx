'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import StaggerReveal from '@/components/StaggerReveal';
import CollectionProductCard from '@/components/CollectionProductCard';
import { useProducts } from '@/hooks/useProducts';

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { products, loading, error: fetchError } = useProducts();

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <main id="main-content" className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal animation="fade-up" delay={0} duration={600} threshold={0.1}>
            <div className="text-center mb-16">
              <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-4">Premium Activewear</p>
              <h1 className="text-6xl md:text-8xl font-bebas tracking-tight uppercase mb-6">
                Shop All
              </h1>
              <p className="text-lg text-white/40 max-w-2xl mx-auto">
                Every piece engineered for performance. 10% of every order supports survivors.
              </p>
            </div>
          </ScrollReveal>

          {/* Category Filter */}
          <div className="flex justify-center gap-4 mb-16">
            {['All', 'Men', 'Women'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn-premium px-6 py-3 text-sm tracking-widest uppercase transition-[var(--ease-premium)] duration-300 ${
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-neutral-800 rounded-xl mb-4" />
                  <div className="p-6 space-y-3">
                    <div className="h-3 bg-neutral-800 rounded w-1/4" />
                    <div className="h-6 bg-neutral-800 rounded w-3/4" />
                    <div className="h-3 bg-neutral-800 rounded w-1/2" />
                    <div className="h-5 bg-neutral-800 rounded w-1/3" />
                    <div className="h-12 bg-neutral-800 rounded-lg w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : fetchError ? (
            <div className="text-center py-20">
              <p className="text-white/40 text-xl mb-4">{fetchError}</p>
              <button onClick={() => window.location.reload()} className="text-xs tracking-[0.2em] uppercase text-white/50 hover:text-white border-b border-white/20 pb-1 transition-colors">
                Retry
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/40 text-xl mb-4">No products yet</p>
              <p className="text-white/30">Add products in the admin dashboard</p>
            </div>
          ) : (
            <StaggerReveal staggerDelay={50} animation="fade-up" duration={500} threshold={0.1}>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map((product) => (
                  <CollectionProductCard key={product.id} product={product} />
                ))}
              </div>
            </StaggerReveal>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
