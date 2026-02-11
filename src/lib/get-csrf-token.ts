/**
 * Client-side CSRF token reader.
 * Reads the csrf_token directly from document.cookie (non-httpOnly).
 * Include the return value as X-CSRF-Token header on all POST/PUT/DELETE requests.
 *
 * SEC-014 fix: Cookie is no longer httpOnly, so we read it directly
 * instead of fetching from /api/csrf (which leaked the token via GET).
 */

export async function getCSRFToken(): Promise<string> {
  if (typeof document === 'undefined') return '';

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf_token='));

  return match ? decodeURIComponent(match.split('=')[1]) : '';
}

/**
 * Reset cached token (no-op now since we read directly from cookie).
 * Kept for API compatibility.
 */
export function resetCSRFToken() {
  // No cache to reset — reads directly from cookie each time
}
