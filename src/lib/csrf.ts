import { cookies } from 'next/headers';

/**
 * Server-side CSRF validation for API routes.
 * Uses the double-submit cookie pattern:
 * - Middleware sets a csrf_token cookie (non-httpOnly, readable by JS)
 * - Client reads the cookie and sends it as X-CSRF-Token header
 * - API route validates that the header matches the cookie
 */
export async function validateCSRF(request: Request): Promise<{ valid: boolean; error?: string }> {
  const csrfHeader = request.headers.get('x-csrf-token');
  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get('csrf_token')?.value;

  if (!csrfCookie) {
    return { valid: false, error: 'Missing CSRF cookie' };
  }

  if (!csrfHeader) {
    return { valid: false, error: 'Missing CSRF token header' };
  }

  if (csrfHeader !== csrfCookie) {
    return { valid: false, error: 'CSRF token mismatch' };
  }

  return { valid: true };
}
