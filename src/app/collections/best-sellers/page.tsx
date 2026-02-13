import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchProducts } from '@/lib/fetch-products';
import ScrollReveal from '@/components/ScrollReveal';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CollectionGrid from '@/components/CollectionGrid';

/**
 * Best Sellers — Server Component [PERF-101]
 * ISR revalidates every 60 seconds.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Best Sellers | DYMNDS",
  description: "DYMNDS best sellers — the athletic wear our community can't stop wearing. Premium quality, purpose-driven design. 10% of every order funds survivor healing.",
  openGraph: {
    title: "Best Sellers | DYMNDS",
    description: "DYMNDS best sellers — the athletic wear our community can't stop wearing. Premium quality, purpose-driven design. 10% of every order funds survivor healing.",
    url: "https://dymnds.ca/collections/best-sellers",
    images: [{
      url: "https://dymnds.ca/og-collection.png",
      width: 1200,
      height: 630,
      alt: "DYMNDS Best Sellers",
    }],
  },
  alternates: {
    canonical: "https://dymnds.ca/collections/best-sellers",
  },
};

export default async function BestSellersPage() {
  const products = await fetchProducts({ bestSeller: true });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dymnds.ca" },
      { "@type": "ListItem", "position": 2, "name": "Best Sellers", "item": "https://dymnds.ca/collections/best-sellers" }
    ]
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Best Sellers",
    "url": "https://dymnds.ca/collections/best-sellers",
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

      <section className="pt-36 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <nav className="mb-8 flex items-center gap-2 text-xs text-white/40">
            <Link href="/" className="link-underline hover:text-white/70 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/60">Best Sellers</span>
          </nav>

          <div className="flex justify-center mb-8">
            <div className="badge-accent">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>Fan Favorites</span>
            </div>
          </div>

          <ScrollReveal animation="fade-up" delay={0} duration={600} threshold={0.1}>
            <div className="text-center mb-16">
              <h1 className="text-6xl md:text-8xl font-bebas tracking-tight uppercase mb-6">
                Best Sellers
              </h1>
              <p className="text-lg text-white/40 max-w-2xl mx-auto">
                The pieces everyone is wearing. Most loved. Most worn. Proven favorites.
              </p>
            </div>
          </ScrollReveal>

          {/* Social proof stats */}
          {products.length > 0 && (
            <div className="flex items-center justify-center gap-8 mb-12">
              <div className="text-center">
                <p className="text-3xl font-bebas text-[var(--accent)]">{products.length}</p>
                <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">Products</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-3xl font-bebas text-[var(--accent)]">4.9</p>
                <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">Avg Rating</p>
              </div>
            </div>
          )}

          <CollectionGrid
            products={products}
            emptyMessage="No best sellers yet"
            emptySubtext="Our most-loved pieces are coming soon."
          />
        </div>
      </section>

      <Footer />
    </main>
  );
}
