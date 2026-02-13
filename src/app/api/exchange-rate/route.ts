import { NextResponse } from 'next/server';
import { getExchangeRateWithSource } from '@/lib/exchange-rates';

export async function GET() {
  try {
    const { rate, source } = await getExchangeRateWithSource();
    return NextResponse.json(
      { rate, currency: 'CAD_TO_USD' },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          'X-Exchange-Rate-Source': source,
        },
      }
    );
  } catch {
    return NextResponse.json(
      { rate: 1.35, currency: 'CAD_TO_USD', fallback: true },
      {
        status: 200,
        headers: { 'X-Exchange-Rate-Source': 'fallback' },
      }
    );
  }
}
