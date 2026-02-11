import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const checks: Record<string, boolean> = {};
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Check Firebase connectivity via Admin SDK
  try {
    const db = getAdminDb();
    await db.collection('products').limit(1).get();
    checks.firebase = true;
  } catch {
    checks.firebase = false;
    status = 'unhealthy';
  }

  // Check Upstash Redis if configured
  if (process.env.UPSTASH_REDIS_REST_URL) {
    try {
      const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
      });
      checks.upstash = res.ok;
      if (!res.ok) status = 'degraded';
    } catch {
      checks.upstash = false;
      status = 'degraded';
    }
  }

  // Check Stripe API key validity (required for checkout)
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2026-01-28.clover',
      });
      await stripe.balance.retrieve();
      checks.stripe = true;
    } catch {
      checks.stripe = false;
      status = 'degraded';
    }
  } else {
    // Stripe not configured at all — degraded, checkout will fail
    checks.stripe = false;
    status = 'degraded';
  }

  // SEC-013: Only expose status and timestamp publicly.
  // Individual service checks (Upstash, etc.) are not exposed to prevent
  // infrastructure reconnaissance.
  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
    },
    { status: status === 'unhealthy' ? 503 : 200 }
  );
}
