import { fetchFeaturedProducts } from '@/lib/fetch-products';
import HomeClient from '@/components/HomeClient';

/**
 * Homepage — Server Component [PERF-102]
 *
 * Fetches featured products server-side, eliminating the client-side
 * useEffect waterfall. Products are available at first paint.
 * ISR revalidates every 60 seconds for fresh inventory.
 */
export const revalidate = 60;

export default async function Home() {
  const [menFeatured, womenFeatured] = await Promise.all([
    fetchFeaturedProducts('Men', 3),
    fetchFeaturedProducts('Women', 3),
  ]);

  return <HomeClient menFeatured={menFeatured} womenFeatured={womenFeatured} />;
}
