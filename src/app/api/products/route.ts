import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { rateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { safeParseProduct, type ValidatedProduct } from '@/lib/schemas';

export async function GET(request: Request) {
  try {
    // ── Rate Limit ────────────────────────────────────────────
    const ip = getClientIP(request);
    const rl = await rateLimit(`products:${ip}`, RATE_LIMITS.products);

    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429 }
      );
    }

    // ── Parse Query Params ────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const newArrival = searchParams.get('newArrival');
    const bestSeller = searchParams.get('bestSeller');
    const slug = searchParams.get('slug');
    const maxResults = Math.min(
      parseInt(searchParams.get('limit') || '50', 10),
      100
    );

    // ── Build Query via Admin SDK ─────────────────────────────
    const db = getAdminDb();
    let queryRef: FirebaseFirestore.Query = db.collection('products');

    // SEC-006: Only return active, non-deleted products
    queryRef = queryRef.where('is_active', '==', true);

    if (category) {
      queryRef = queryRef.where('category', '==', category);
    }
    if (featured === 'true') {
      queryRef = queryRef.where('featured', '==', true);
    }
    if (newArrival === 'true') {
      queryRef = queryRef.where('newArrival', '==', true);
    }
    if (bestSeller === 'true') {
      queryRef = queryRef.where('bestSeller', '==', true);
    }
    if (slug) {
      queryRef = queryRef.where('slug', '==', slug);
    }

    queryRef = queryRef.orderBy('displayOrder', 'asc').limit(maxResults);

    let products: ValidatedProduct[] = [];

    try {
      const snapshot = await queryRef.get();
      products = snapshot.docs
        .map((doc) => safeParseProduct({ id: doc.id, ...doc.data() }))
        .filter((p): p is ValidatedProduct => p !== null);
    } catch {
      // Fallback: if composite index isn't built, filter is_active server-side at minimum
      const fallbackSnap = await db.collection('products').where('is_active', '==', true).get();
      let all = fallbackSnap.docs
        .map((doc) => safeParseProduct({ id: doc.id, ...doc.data() }))
        .filter((p): p is ValidatedProduct => p !== null);

      // SEC-006: Filter out deleted/inactive products in fallback path
      all = all.filter((p) => p.is_active !== false && !p.is_deleted);
      if (category) all = all.filter((p) => p.category === category);
      if (featured === 'true') all = all.filter((p) => p.featured);
      if (newArrival === 'true') all = all.filter((p) => p.newArrival);
      if (bestSeller === 'true') all = all.filter((p) => p.bestSeller);
      if (slug) all = all.filter((p) => p.slug === slug);

      all.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      products = all.slice(0, maxResults);
    }

    // ── Response with Cache Headers ───────────────────────────
    return NextResponse.json(
      { products },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    logger.error('Products API error', { route: '/api/products' }, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
