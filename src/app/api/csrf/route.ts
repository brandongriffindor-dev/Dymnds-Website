import { NextResponse } from 'next/server';

/**
 * GET /api/csrf
 * @deprecated CSRF token is now readable directly from the csrf_token cookie.
 * This endpoint is maintained for backwards compatibility during migration.
 */
export async function GET() {
  // CSRF cookie is no longer httpOnly — clients should read it directly
  // from document.cookie. This endpoint returns empty for safety.
  return NextResponse.json({ token: '' }, { status: 200 });
}
