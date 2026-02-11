'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import CollectionGrid from '@/components/CollectionGrid';
import type { Product } from '@/lib/firebase';

/**
 * Client wrapper for the "All Collections" page.
 * Handles client-side category filtering on server-fetched products.
 */
interface AllCollectionClientProps {
  products: Product[];
}

export default function AllCollectionClient({ products }: AllCollectionClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dymnds.ca" },
      { "@type": "ListItem", "position": 2, "name": "All Collections", "item": "https://dymnds.ca/collections/all" }
    ]
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Navbar />

      <section className="pt-36 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <nav className="mb-8 flex items-center gap-2 text-xs text-white/40">
            <Link href="/" className="link-underline hover:text-white/70 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/60">All Collections</span>
          </nav>

          <ScrollReveal animation="fade-up" delay={0} duration={600} threshold={0.1}>
            <div className="text-center mb-16">
              <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-4">Premium Activewear</p>
              <h1 className="text-6xl md:text-8xl font-bebas tracking-tight uppercase mb-6">
                Shop Collection
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

          <CollectionGrid products={filteredProducts} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
