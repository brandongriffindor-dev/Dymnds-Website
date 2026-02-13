import { NextResponse } from 'next/server';
import { ContactFormSchema } from '@/lib/validators';
import { sanitizeString, sanitizeEmail } from '@/lib/sanitize';
import { rateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit';
import { validateCSRF } from '@/lib/csrf';
import { logger } from '@/lib/logger';
import { getAdminDb, FieldValue } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    // ── CSRF Validation ─────────────────────────────────────
    const csrf = await validateCSRF(request);
    if (!csrf.valid) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 403 });
    }

    // ── Rate Limit ────────────────────────────────────────────
    const ip = getClientIP(request);
    const rl = await rateLimit(`contact:${ip}`, RATE_LIMITS.contact);

    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
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
    const parsed = ContactFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please check your input and try again.' },
        { status: 400 }
      );
    }

    // ── Sanitize ──────────────────────────────────────────────
    const data = {
      name: sanitizeString(parsed.data.name),
      email: sanitizeEmail(parsed.data.email),
      subject: parsed.data.subject, // Enum — already validated
      message: sanitizeString(parsed.data.message),
      read: false, // New messages default to unread
      createdAt: FieldValue.serverTimestamp(),
    };

    // ── Write to Firestore via Admin SDK ─────────────────────
    const db = getAdminDb();
    await db.collection('contact_messages').add(data);

    return NextResponse.json(
      { success: true },
      { status: 201, headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    logger.error('Contact API error', { route: '/api/contact' }, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
