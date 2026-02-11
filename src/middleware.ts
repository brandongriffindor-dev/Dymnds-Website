import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = '__session';
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';

// ─── JWT Verification (Edge-compatible with signature check) ──────

interface JWK {
  kty: string;
  kid: string;
  n: string;
  e: string;
  alg: string;
  use: string;
}

interface JWKSResponse {
  keys: JWK[];
}

let cachedKeys: { keys: JWK[]; fetchedAt: number } | null = null;
const KEY_CACHE_DURATION = 3600_000; // 1 hour

async function getFirebasePublicKeys(): Promise<JWK[]> {
  const now = Date.now();
  if (cachedKeys && (now - cachedKeys.fetchedAt) < KEY_CACHE_DURATION) {
    return cachedKeys.keys;
  }

  try {
    const res = await fetch(
      'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
      { next: { revalidate: 3600 } }
    );
    const data: JWKSResponse = await res.json();
    cachedKeys = { keys: data.keys, fetchedAt: now };
    return data.keys;
  } catch {
    return cachedKeys?.keys || [];
  }
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeJWTPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = base64UrlDecode(parts[1]);
    return JSON.parse(new TextDecoder().decode(payload));
  } catch {
    return null;
  }
}

function decodeJWTHeader(token: string): { kid?: string; alg?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const header = base64UrlDecode(parts[0]);
    return JSON.parse(new TextDecoder().decode(header));
  } catch {
    return null;
  }
}

async function verifyJWTSignature(token: string): Promise<boolean> {
  try {
    const header = decodeJWTHeader(token);
    if (!header?.kid || header.alg !== 'RS256') return false;

    const keys = await getFirebasePublicKeys();
    const jwk = keys.find(k => k.kid === header.kid);
    if (!jwk) return false;

    const parts = token.split('.');
    const signatureInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = base64UrlDecode(parts[2]);

    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signature as BufferSource,
      signatureInput
    );
  } catch {
    return false;
  }
}

async function isTokenValid(token: string): Promise<boolean> {
  const payload = decodeJWTPayload(token);
  if (!payload) return false;

  const now = Math.floor(Date.now() / 1000);

  // Check expiry
  if (typeof payload.exp !== 'number' || payload.exp < now) return false;

  // SEC-004: Check issued-at (must not be in the future, allow 5 min clock skew)
  if (typeof payload.iat !== 'number' || payload.iat > now + 300) return false;

  // SEC-004: Check subject (must be non-empty Firebase UID)
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) return false;

  // SEC-004: Check auth_time (must not be in the future)
  if (typeof payload.auth_time === 'number' && payload.auth_time > now + 300) return false;

  // Check issuer
  if (payload.iss !== `https://securetoken.google.com/${PROJECT_ID}`) return false;

  // Check audience
  if (payload.aud !== PROJECT_ID) return false;

  // SEC-025: Reject tokens without verified email for admin routes
  if (payload.email_verified === false) return false;

  // Verify cryptographic signature
  const signatureValid = await verifyJWTSignature(token);
  if (!signatureValid) return false;

  return true;
}

// ─── Security Headers ───────────────────────────────────────────

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  // SEC-014: Removed 'strict-dynamic' to allow Next.js inline scripts to execute.
  // 'unsafe-inline' allows inline scripts; future iteration should use nonces for stricter security.
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://firebasestorage.googleapis.com data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://firebasestorage.googleapis.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ')
  );

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

// ─── Middleware ──────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin Sub-Route Protection ──────────────────────────────
  // /admin itself is accessible (shows login form via layout).
  // /admin/* sub-routes AND /api/admin/* API routes require a valid session cookie.
  // SEC-001: Extends edge protection to admin API routes (previously unprotected).
  const isAdminSubRoute = pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/');

  if (isAdminSubRoute) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

    if (!sessionCookie || !(await isTokenValid(sessionCookie))) {
      // SEC-001: API admin routes return 401 JSON; page routes redirect to login
      if (pathname.startsWith('/api/admin/')) {
        const response = NextResponse.json(
          { error: 'Unauthorized. Admin authentication required.' },
          { status: 401 }
        );
        if (sessionCookie) {
          response.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' });
        }
        return addSecurityHeaders(response);
      }

      const loginUrl = new URL('/admin', request.url);
      const response = NextResponse.redirect(loginUrl);

      // Clear invalid/expired cookie
      if (sessionCookie) {
        response.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' });
      }

      return addSecurityHeaders(response);
    }
  }

  // ── Continue with security headers + CSRF cookie ────────────
  const response = NextResponse.next();

  // Set CSRF cookie if not present (NOT httpOnly for double-submit pattern)
  // Client reads cookie directly via document.cookie and sends as header
  const existingCSRF = request.cookies.get('csrf_token')?.value;
  if (!existingCSRF) {
    const csrfToken = crypto.randomUUID();
    response.cookies.set('csrf_token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });
    // Also set token in response header for client to read on initial load
    response.headers.set('x-csrf-token', csrfToken);
  }

  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    // Match all routes except static files, images, and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
};
