import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Valid country codes for currency mapping
const SUPPORTED_COUNTRIES = new Set(['US', 'CA']);

export async function GET() {
  const headersList = await headers();
  const rawCountry = headersList.get('x-vercel-ip-country') || '';

  // Only trust recognized country codes; default to CA
  // NOTE: x-vercel-ip-country is set by Vercel's edge network and cannot
  // be spoofed by the client on Vercel-hosted deployments. On non-Vercel
  // environments, this defaults to CA safely. This is display-only for
  // currency selection — actual pricing is always verified server-side.
  const country = SUPPORTED_COUNTRIES.has(rawCountry) ? rawCountry : 'CA';
  const currency = country === 'US' ? 'USD' : 'CAD';

  return NextResponse.json({ currency, country }, {
    headers: {
      'Cache-Control': 'private, max-age=86400',
    },
  });
}
