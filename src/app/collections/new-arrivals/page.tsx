import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchProducts } from '@/lib/fetch-products';
import ScrollReveal from '@/components/ScrollReveal';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CollectionGrid from '@/components/CollectionGrid';

/**
 * New Arrivals — Server Component [PERF-101]
 * ISR revalidates every 60 seconds.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "New Arrivals | DYMNDS",
  description: "New drops from DYMNDS. Fresh premium athletic wear just landed — compression, training, and recovery gear. 10% of every order funds survivor healing.",
  openGraph: {
    title: "New Arrivals | DYMNDS",
    description: "New drops from DYMNDS. Fresh premium athletic wear just landed — compression, training, and recovery gear. 10% of every order funds survivor healing.",
    url: "https://dymnds.ca/collections/new-arrivals",
    images: [{
      url: "https://dymnds.ca/og-collection.png",
      width: 1200,
      height: 630,
      alt: "DYMNDS New Arrivals",
    }],
  },
  alternates: {
    canonical: "https://dymnds.ca/collections/new-arrivals",
  },
};

export default async function NewArrivalsPage() {
  const products = await fetchProducts({ newArrival: true });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dymnds.ca" },
      { "@type": "ListItem", "position": 2, "name": "New Arrivals", "item": "https://dymnds.ca/collections/new-arrivals" }
    ]
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "New Arrivals",
    "url": "https://dymnds.ca/collections/new-arrivals",
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
            <span className="text-white/60">New Arrivals</span>
          </nav>

          <div className="flex justify-center mb-8">
            <div className="badge-accent">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--accent)]"></span>
              </span>
              <span>Just Dropped</span>
            </div>
          </div>

          <ScrollReveal animation="fade-up" delay={0} duration={600} threshold={0.1}>
            <div className="text-center mb-16">
              <h1 className="text-6xl md:text-8xl font-bebas tracking-tight uppercase mb-6">
                New Arrivals
              </h1>
              <p className="text-lg text-white/40 max-w-2xl mx-auto">
                The latest pieces. Limited drops. Be the first to wear them.
              </p>
            </div>
          </ScrollReveal>

          <CollectionGrid
            products={products}
            showNewBadge
            emptyMessage="Fresh drops coming soon"
            emptySubtext="Check back for the latest arrivals"
          />
        </div>
      </section>

      <Footer />
    </main>
  );
}
