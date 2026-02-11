/**
 * Shared server-side admin authentication & authorization utility.
 *
 * SEC-FIX-002: Every admin API route MUST call verifyAdminRequest()
 * instead of relying solely on edge middleware. This provides defense-in-depth
 * against middleware bypass vulnerabilities (e.g., CVE-2025-29927).
 *
 * Combines:
 * - JWT signature verification via Firebase Admin SDK (verifyIdToken)
 * - Admin role check against Firestore admins collection
 * - CSRF double-submit cookie validation
 * - Optional RBAC role enforcement
 */

import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { validateCSRF } from '@/lib/csrf';
import { logger } from '@/lib/logger';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// ─── Types ────────────────────────────────────────────────────────

const SESSION_COOKIE = '__session';

/**
 * Admin roles ordered by privilege level.
 * Existing admins without a role field default to 'super_admin'
 * to maintain backward compatibility.
 */
export type AdminRole = 'super_admin' | 'manager' | 'inventory' | 'read_only';

/** Permissions each role grants */
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ['*'],
  manager: ['products', 'orders', 'discounts', 'customers', 'messages', 'analytics', 'expenses', 'waitlist', 'alerts'],
  inventory: ['products.read', 'stock', 'inventory', 'alerts'],
  read_only: ['read'],
};

export type AdminAuthSuccess = {
  authenticated: true;
  uid: string;
  email: string;
  role: AdminRole;
  decodedToken: DecodedIdToken;
};

export type AdminAuthFailure = {
  authenticated: false;
  error: string;
};

export type AdminAuthResult = AdminAuthSuccess | AdminAuthFailure;

interface VerifyOptions {
  /** Roles allowed to access this resource. Omit to allow any admin. */
  requireRole?: AdminRole[];
  /** Skip CSRF validation (for GET-only routes). Default: false */
  skipCSRF?: boolean;
}

// ─── Main Verification Function ────────────────────────────────────

/**
 * Verifies that the current request is from an authenticated admin.
 *
 * 1. Validates CSRF token (unless skipped)
 * 2. Reads __session cookie
 * 3. Verifies JWT signature + expiry + revocation via Firebase Admin SDK
 * 4. Checks UID exists in Firestore admins collection
 * 5. Optionally checks RBAC role
 *
 * @returns AdminAuthResult — check .authenticated before using uid/email/role
 */
export async function verifyAdminRequest(
  request: Request,
  options?: VerifyOptions
): Promise<AdminAuthResult> {
  try {
    // ── Step 1: CSRF validation (skip for GET routes) ──────────────
    if (!options?.skipCSRF) {
      const csrf = await validateCSRF(request);
      if (!csrf.valid) {
        logger.warn('Admin request failed CSRF validation', {
          error: csrf.error,
        });
        return { authenticated: false, error: 'CSRF validation failed' };
      }
    }

    // ── Step 2: Read session cookie ────────────────────────────────
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionCookie) {
      return { authenticated: false, error: 'No session cookie' };
    }

    // ── Step 3: Verify JWT via Firebase Admin SDK ──────────────────
    // getAdminDb() ensures the Admin SDK app is initialized
    const db = getAdminDb();
    const auth = getAuth();

    let decodedToken: DecodedIdToken;
    try {
      // checkRevoked=true: rejects tokens revoked via Firebase Console
      decodedToken = await auth.verifyIdToken(sessionCookie, true);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/id-token-expired') {
        return { authenticated: false, error: 'Session expired' };
      }
      if (code === 'auth/id-token-revoked') {
        return { authenticated: false, error: 'Session revoked' };
      }
      logger.warn('JWT verification failed', { code }, err);
      return { authenticated: false, error: 'Invalid session token' };
    }

    const uid = decodedToken.uid;
    if (!uid) {
      return { authenticated: false, error: 'No UID in token' };
    }

    // ── Step 4: Verify admin status in Firestore ───────────────────
    const adminDoc = await db.collection('admins').doc(uid).get();

    if (!adminDoc.exists) {
      logger.warn('Non-admin token used on admin route', { uid });
      return { authenticated: false, error: 'Not an admin' };
    }

    const adminData = adminDoc.data();
    // Default to super_admin for backward compatibility with existing admins
    const role = (adminData?.role as AdminRole) || 'super_admin';
    const email = decodedToken.email || (adminData?.email as string) || 'unknown';

    // ── Step 5: RBAC role check ────────────────────────────────────
    if (options?.requireRole && options.requireRole.length > 0) {
      if (!options.requireRole.includes(role)) {
        logger.warn('Admin lacks required role', {
          uid,
          role,
          required: options.requireRole,
        });
        return { authenticated: false, error: 'Insufficient permissions' };
      }
    }

    return {
      authenticated: true,
      uid,
      email,
      role,
      decodedToken,
    };
  } catch (error) {
    logger.error('Admin auth verification failed', {}, error);
    return { authenticated: false, error: 'Auth verification failed' };
  }
}

// ─── Response Helpers ──────────────────────────────────────────────

/** Standard 401 response for unauthenticated requests */
export function unauthorizedResponse(error?: string): NextResponse {
  return NextResponse.json(
    { error: error || 'Unauthorized. Admin authentication required.' },
    { status: 401 }
  );
}

/** Standard 403 response for insufficient permissions */
export function forbiddenResponse(error?: string): NextResponse {
  return NextResponse.json(
    { error: error || 'Insufficient permissions.' },
    { status: 403 }
  );
}

/**
 * Helper: verify admin and return early response if not authorized.
 * Use in route handlers for concise auth gating:
 *
 * ```ts
 * const [auth, errorResponse] = await requireAdmin(request);
 * if (errorResponse) return errorResponse;
 * // auth is guaranteed to be AdminAuthSuccess here
 * ```
 */
export async function requireAdmin(
  request: Request,
  options?: VerifyOptions
): Promise<[AdminAuthSuccess, null] | [null, NextResponse]> {
  const result = await verifyAdminRequest(request, options);

  if (!result.authenticated) {
    const status = result.error === 'Insufficient permissions' ? 403 : 401;
    const response = status === 403
      ? forbiddenResponse(result.error)
      : unauthorizedResponse(result.error);
    return [null, response];
  }

  return [result, null];
}
