import { NextResponse } from 'next/server';
import { WaitlistSchema, AppWaitlistSchema } from '@/lib/validators';
import { sanitizeEmail } from '@/lib/sanitize';
import { rateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit';
import { validateCSRF } from '@/lib/csrf';
import { logger } from '@/lib/logger';
import { getAdminDb, FieldValue } from '@/lib/firebase-admin';

// In-memory recent email cache to avoid redundant Firestore reads on rapid resubmits
const recentEmails = new Map<string, number>();
const RECENT_EMAIL_TTL = 5 * 60 * 1000; // 5 minutes

function isRecentlySubmitted(email: string): boolean {
  const submittedAt = recentEmails.get(email);
  if (!submittedAt) return false;
  if (Date.now() - submittedAt > RECENT_EMAIL_TTL) {
    recentEmails.delete(email);
    return false;
  }
  return true;
}

function markAsSubmitted(email: string): void {
  recentEmails.set(email, Date.now());
  // Cleanup old entries periodically (every 100 writes)
  if (recentEmails.size > 100) {
    const now = Date.now();
    for (const [key, ts] of recentEmails) {
      if (now - ts > RECENT_EMAIL_TTL) recentEmails.delete(key);
    }
  }
}

export async function POST(request: Request) {
  try {
    // ── CSRF Validation ─────────────────────────────────────
    const csrf = await validateCSRF(request);
    if (!csrf.valid) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 403 });
    }

    // ── Rate Limit ────────────────────────────────────────────
    const ip = getClientIP(request);
    const rl = await rateLimit(`waitlist:${ip}`, RATE_LIMITS.waitlist);

    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many signups. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(rl.limit),
            'X-RateLimit-Remaining': String(rl.remaining),
          },
        }
      );
    }

    // ── Parse & Validate ──────────────────────────────────────
    const body = await request.json();
    const type = body.type || 'newsletter'; // 'newsletter' or 'app'
    const db = getAdminDb();

    if (type === 'app') {
      // App waitlist
      const parsed = AppWaitlistSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        );
      }

      const email = sanitizeEmail(parsed.data.email);

      // Fast in-memory duplicate check (avoids Firestore read on rapid resubmits)
      if (isRecentlySubmitted(`app:${email}`)) {
        return NextResponse.json(
          { success: true, message: "You're already on the list!" },
          { status: 200 }
        );
      }

      // Deduplicate: check if email already signed up
      const existingApp = await db.collection('app_waitlist')
        .where('email', '==', email).limit(1).get();
      if (!existingApp.empty) {
        markAsSubmitted(`app:${email}`);
        return NextResponse.json(
          { success: true, message: "You're already on the list!" },
          { status: 200 }
        );
      }

      await db.collection('app_waitlist').add({
        email,
        createdAt: FieldValue.serverTimestamp(),
      });
      markAsSubmitted(`app:${email}`);

      return NextResponse.json(
        { success: true, message: "You're on the list!" },
        { status: 201 }
      );
    } else {
      // Newsletter/footer waitlist
      const parsed = WaitlistSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        );
      }

      const email = sanitizeEmail(parsed.data.email);

      // Fast in-memory duplicate check (avoids Firestore read on rapid resubmits)
      if (isRecentlySubmitted(`newsletter:${email}`)) {
        return NextResponse.json(
          { success: true, message: 'Welcome to the movement.' },
          { status: 200 }
        );
      }

      // Deduplicate: check if email already signed up
      const existingWaitlist = await db.collection('waitlist')
        .where('email', '==', email).limit(1).get();
      if (!existingWaitlist.empty) {
        markAsSubmitted(`newsletter:${email}`);
        return NextResponse.json(
          { success: true, message: 'Welcome to the movement.' },
          { status: 200 }
        );
      }

      await db.collection('waitlist').add({
        email,
        createdAt: FieldValue.serverTimestamp(),
        source: parsed.data.source,
      });
      markAsSubmitted(`newsletter:${email}`);

      return NextResponse.json(
        { success: true, message: 'Welcome to the movement.' },
        { status: 201 }
      );
    }
  } catch (error) {
    logger.error('Waitlist API error', { route: '/api/waitlist' }, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
