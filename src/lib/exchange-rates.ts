// TODO: Add EXCHANGE_RATE_API_KEY to your .env.local
// Free tier: https://www.exchangerate-api.com/ (1500 requests/month)
// Or use Open Exchange Rates: https://openexchangerates.org/

interface ExchangeRates {
  CAD_TO_USD: number;
  fetchedAt: number;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const FALLBACK_RATE = 1.35; // Fallback if API is unavailable

let cachedRates: ExchangeRates | null = null;

export async function getExchangeRate(): Promise<number> {
  // Return cached rate if fresh
  if (cachedRates && Date.now() - cachedRates.fetchedAt < CACHE_DURATION) {
    return cachedRates.CAD_TO_USD;
  }

  // Try fetching from API
  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!apiKey) {
      console.warn('EXCHANGE_RATE_API_KEY not set, using fallback rate');
      return FALLBACK_RATE;
    }

    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/CAD/USD`,
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) throw new Error(`Exchange rate API returned ${res.status}`);

    const data = await res.json();
    const rate = data.conversion_rate;

    if (typeof rate !== 'number' || rate <= 0) {
      throw new Error('Invalid rate received');
    }

    cachedRates = { CAD_TO_USD: rate, fetchedAt: Date.now() };
    return rate;
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
    // Return cached rate even if stale, or fallback
    return cachedRates?.CAD_TO_USD ?? FALLBACK_RATE;
  }
}

export function convertCadToUsd(cadAmount: number, rate: number): number {
  return Math.round(cadAmount * rate * 100) / 100;
}
