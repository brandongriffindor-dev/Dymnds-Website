import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchProducts } from '@/lib/fetch-products';
import ScrollReveal from '@/components/ScrollReveal';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CollectionGrid from '@/components/CollectionGrid';

/**
 * Women's Collection — Server Component [PERF-101]
 * ISR revalidates every 60 seconds.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Women's Collection | DYMNDS",
  description: "Shop DYMNDS women's premium activewear. High-performance leggings, training tops, and recovery layers — engineered under pressure. 10% of every order funds survivor healing.",
  openGraph: {
    title: "Women's Collection | DYMNDS",
    description: "Shop DYMNDS women's premium activewear. High-performance leggings, training tops, and recovery layers — engineered under pressure. 10% of every order funds survivor healing.",
    url: "https://dymnds.ca/collections/women",
    images: [{
      url: "https://dymnds.ca/og-collection.png",
      width: 1200,
      height: 630,
      alt: "DYMNDS Women's Collection",
    }],
  },
  alternates: {
    canonical: "https://dymnds.ca/collections/women",
  },
};

export default async function WomenPage() {
  const products = await fetchProducts({ category: 'Women' });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dymnds.ca" },
      { "@type": "ListItem", "position": 2, "name": "Women's Collection", "item": "https://dymnds.ca/collections/women" }
    ]
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Women's Collection",
    "url": "https://dymnds.ca/collections/women",
    "numberOfItems": products.length,
    "itemListElement": products.slice(0, 12).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": `https://dymnds.ca/products/${p.slug}`,
      "name": p.title,
    })),
  };

  return (
    <main id="main-content" className="min-h-screen bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <Navbar />

      <section className="pt-36 pb-24 px-6 relative overflow-hidden">
        {/* Decorative ambient glow — left side */}
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-[var(--accent)]/[0.02] rounded-full blur-[200px] -translate-x-1/4 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
        <div className="max-w-7xl mx-auto relative z-10">
          <nav className="mb-8 flex items-center gap-2 text-xs text-white/40">
            <Link href="/" className="link-underline hover:text-white/70 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/60">Women&apos;s Collection</span>
          </nav>

          <ScrollReveal animation="fade-up" delay={0} duration={600} threshold={0.1}>
            <div className="text-center mb-16">
              <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-4">The Collection</p>
              <h1 className="text-6xl md:text-8xl font-bebas tracking-tight uppercase mb-6">
                For Her
              </h1>
              <p className="text-white/50 text-lg max-w-xl mx-auto">
                Strength meets style. Built for women who refuse to settle.
              </p>
            </div>
          </ScrollReveal>

          <CollectionGrid products={products} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
