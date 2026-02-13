import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { generateRequestId } from '@/lib/request-id';
import { getAdminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { validateCSRF } from '@/lib/csrf';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

const SESSION_COOKIE = '__session';
const SESSION_MAX_AGE = 3600; // 1 hour (matches Firebase token expiry)

/**
 * POST /api/auth/session
 *
 * Receives a Firebase ID token, verifies it via Firebase Admin SDK
 * (full signature + claims + revocation check), verifies admin status,
 * and sets an httpOnly session cookie for middleware to check.
 *
 * SEC-FIX-004: Replaced REST API lookup with Admin SDK verifyIdToken()
 * for proper cryptographic verification including revocation check.
 */
export async function POST(request: Request) {
  try {
    // SEC-010: CSRF validation
    const csrf = await validateCSRF(request);
    if (!csrf.valid) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 403 });
    }

    // SEC-012: Server-side rate limiting (10 attempts per 5 minutes per IP)
    const ip = getClientIP(request);
    const rl = await rateLimit(`auth-session:${ip}`, { limit: 10, windowSeconds: 300 });
    if (!rl.allowed) {
      logger.warn('Auth session rate limit exceeded', { ip });
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    // SEC-FIX-004: Verify token via Firebase Admin SDK
    // This cryptographically verifies the signature, checks expiry, audience,
    // issuer, and optionally checks if the token has been revoked.
    const db = getAdminDb(); // Ensures admin SDK app is initialized
    const auth = getAuth();

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken, true); // checkRevoked=true
    } catch (err) {
      const code = (err as { code?: string })?.code;
      logger.warn('Token verification failed at session endpoint', { code, ip });
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const uid = decodedToken.uid;
    if (!uid) {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 401 });
    }

    // Verify user is admin by checking admins collection via Admin SDK
    try {
      const adminDoc = await db.collection('admins').doc(uid).get();

      if (!adminDoc.exists) {
        logger.warn('Non-admin login attempt', { uid, ip });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } catch (error) {
      logger.error('Error checking admin status', { uid }, error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Set httpOnly session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });

    return NextResponse.json(
      { success: true },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    const requestId = generateRequestId();
    logger.error('Session API error', { route: '/api/auth/session', requestId }, error);
    return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/session
 * Clears the session cookie on logout.
 */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return NextResponse.json({ success: true });
}
