import type { Metadata } from 'next';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { fetchReviews } from '@/lib/fetch-products';
import { getProductBySlug } from '@/lib/queries';
import ProductPageWrapper from './ProductPageWrapper';

// ISR: revalidate product pages every 60 seconds
export const revalidate = 60;

// Pre-generate all active product pages at build time for faster TTFB + crawl speed
export async function generateStaticParams() {
  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    return productsSnap.docs
      .filter((doc) => {
        const data = doc.data();
        return data.is_active !== false && data.is_deleted !== true;
      })
      .map((doc) => ({ slug: doc.data().slug as string }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  try {
    const q = query(collection(db, 'products'), where('slug', '==', slug));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const product = snap.docs[0].data();
      return {
        title: `${product.title} | DYMNDS`,
        description: `${product.title} — Premium athletic wear by DYMNDS. 10% of your purchase funds survivor healing.`,
        alternates: {
          canonical: `https://dymnds.ca/products/${slug}`,
        },
        openGraph: {
          title: `${product.title} | DYMNDS`,
          description: `${product.title} — Premium athletic wear by DYMNDS.`,
          images: product.images?.[0] ? [{ url: product.images[0], width: 1200, height: 630, alt: product.title }] : [{ url: 'https://dymnds.ca/og-product.png', width: 1200, height: 630, alt: product.title }],
        },
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }

  return {
    title: 'Product | DYMNDS',
    description: 'Premium athletic wear by DYMNDS. 10% of your purchase funds survivor healing.',
  };
}

/**
 * Fix #3/#4: All data now fetched server-side in parallel.
 * Reviews + matching product no longer trigger client-side Firestore waterfalls.
 * This eliminates ~150KB of Firebase client SDK from the product page bundle.
 */
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch product server-side (reuses the same query from generateMetadata via Next.js dedup)
  let initialProduct: Record<string, unknown> | null = null;
  try {
    const q = query(collection(db, 'products'), where('slug', '==', slug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const doc = snap.docs[0];
      initialProduct = { id: doc.id, ...doc.data() };
    }
  } catch (error) {
    console.error('Error fetching product:', error);
  }

  // Fetch reviews + matching product in parallel (server-side, no client JS needed)
  const matchingSlug = initialProduct?.matchingSetSlug as string | undefined;
  const [reviews, matchingProduct] = await Promise.all([
    fetchReviews(slug),
    matchingSlug ? getProductBySlug(matchingSlug) : Promise.resolve(null),
  ]);

  return (
    <ProductPageWrapper
      initialProduct={initialProduct}
      initialReviews={reviews}
      initialMatchingProduct={matchingProduct}
    />
  );
}
