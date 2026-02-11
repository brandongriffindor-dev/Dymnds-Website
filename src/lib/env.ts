import { z } from 'zod';

/**
 * Environment variable validation.
 * Production: throws if any Firebase vars are missing (fail fast on Vercel).
 * Development: warns and falls back to process.env (vars injected by Vercel at deploy time).
 */

const envSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
});

// Optional: Upstash Redis for distributed rate limiting (SEC-103).
// These are server-only env vars — NOT prefixed with NEXT_PUBLIC_.
// If not set, rate limiting falls back to in-memory (per-instance).
const upstashSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

type EnvVars = z.infer<typeof envSchema>;

function validateEnv(): EnvVars {
  const raw: EnvVars = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  };

  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  - ${i.path.join('.')}`)
      .join('\n');

    if (process.env.VERCEL === '1') {
      throw new Error(
        `DYMNDS: Missing required environment variables:\n${missing}\n\nSet these in Vercel Dashboard > Settings > Environment Variables.`
      );
    }

    console.warn(`[DYMNDS] Missing env vars (non-fatal in dev):\n${missing}`);
  }

  // Validate optional Upstash config (warn if partially configured)
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if ((upstashUrl && !upstashToken) || (!upstashUrl && upstashToken)) {
    console.warn(
      '[DYMNDS] Partial Upstash config detected. Both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set for distributed rate limiting.'
    );
  }

  upstashSchema.safeParse({ UPSTASH_REDIS_REST_URL: upstashUrl, UPSTASH_REDIS_REST_TOKEN: upstashToken });

  // Validate Firebase Admin SDK service account key (server-only, required for API routes)
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    if (process.env.VERCEL === '1') {
      console.error(
        '[DYMNDS] FIREBASE_SERVICE_ACCOUNT_KEY is not set. ' +
        'API routes (orders, contact, waitlist) will fail. ' +
        'Set it in Vercel Dashboard > Settings > Environment Variables.'
      );
    } else {
      console.warn(
        '[DYMNDS] FIREBASE_SERVICE_ACCOUNT_KEY not set (non-fatal in dev). ' +
        'Server-side Firestore operations will fail until configured.'
      );
    }
  } else {
    try {
      JSON.parse(serviceAccountKey);
    } catch {
      console.error(
        '[DYMNDS] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. ' +
        'Paste the entire contents of your service account JSON file.'
      );
    }
  }

  // ── Stripe keys (server-only, required for checkout + webhooks) ──────
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    if (process.env.VERCEL === '1') {
      console.error(
        '[DYMNDS] STRIPE_SECRET_KEY is not set. ' +
        'Checkout and webhook routes will fail. ' +
        'Set it in Vercel Dashboard > Settings > Environment Variables (Production only).'
      );
    } else {
      console.warn(
        '[DYMNDS] STRIPE_SECRET_KEY not set (non-fatal in dev). ' +
        'Checkout will fail until configured.'
      );
    }
  }

  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeWebhookSecret) {
    if (process.env.VERCEL === '1') {
      console.error(
        '[DYMNDS] STRIPE_WEBHOOK_SECRET is not set. ' +
        'Stripe webhook signature verification will fail. ' +
        'Set it in Vercel Dashboard > Settings > Environment Variables (Production only).'
      );
    } else {
      console.warn(
        '[DYMNDS] STRIPE_WEBHOOK_SECRET not set (non-fatal in dev). ' +
        'Webhook processing will fail until configured.'
      );
    }
  }

  // ── App URL (required for Stripe redirect URLs) ──────────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    if (process.env.VERCEL === '1') {
      console.error(
        '[DYMNDS] NEXT_PUBLIC_APP_URL is not set. ' +
        'Stripe checkout success/cancel redirects will break. ' +
        'Set it in Vercel Dashboard > Settings > Environment Variables ' +
        '(Production: https://dymnds.ca, Preview: your preview URL pattern).'
      );
    } else {
      console.warn(
        '[DYMNDS] NEXT_PUBLIC_APP_URL not set (non-fatal in dev). ' +
        'Stripe checkout redirects will use undefined URLs.'
      );
    }
  }

  // ── Exchange rate API key (optional, falls back to hardcoded rates) ──
  if (!process.env.EXCHANGE_RATE_API_KEY) {
    console.warn(
      '[DYMNDS] EXCHANGE_RATE_API_KEY not set. ' +
      'Currency conversion will use fallback rates that may drift from real values.'
    );
  }

  return raw;
}

export const env = validateEnv();
