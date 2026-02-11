import type { Metadata } from 'next';
import { fetchProducts } from '@/lib/fetch-products';
import AllCollectionClient from '@/components/AllCollectionClient';

/**
 * All Collections — Server Component [PERF-101]
 * ISR revalidates every 60 seconds.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop All | DYMNDS",
  description: "Shop the full DYMNDS collection. Premium athletic wear for men and women — compression, training, and recovery gear built under pressure. 10% funds survivor healing.",
  openGraph: {
    title: "Shop All | DYMNDS",
    description: "Shop the full DYMNDS collection. Premium athletic wear for men and women — compression, training, and recovery gear built under pressure. 10% funds survivor healing.",
    url: "https://dymnds.ca/collections/all",
    images: [{
      url: "https://dymnds.ca/og-collection.png",
      width: 1200,
      height: 630,
      alt: "DYMNDS — Shop All Collections",
    }],
  },
  alternates: {
    canonical: "https://dymnds.ca/collections/all",
  },
};

export default async function CollectionsPage() {
  const products = await fetchProducts();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dymnds.ca" },
      { "@type": "ListItem", "position": 2, "name": "Shop All", "item": "https://dymnds.ca/collections/all" }
    ]
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Shop All",
    "url": "https://dymnds.ca/collections/all",
    "numberOfItems": products.length,
    "itemListElement": products.slice(0, 12).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": `https://dymnds.ca/products/${p.slug}`,
      "name": p.title,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <AllCollectionClient products={products} />
    </>
  );
}
