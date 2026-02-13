// TODO: Add EXCHANGE_RATE_API_KEY to your .env.local
// Free tier: https://www.exchangerate-api.com/ (1500 requests/month)
// Or use Open Exchange Rates: https://openexchangerates.org/

interface ExchangeRates {
  CAD_TO_USD: number;
  fetchedAt: number;
}

export type RateSource = 'live' | 'cache' | 'fallback';

export interface ExchangeRateResult {
  rate: number;
  source: RateSource;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const FALLBACK_RATE = 1.35; // Fallback if API is unavailable

let cachedRates: ExchangeRates | null = null;

/**
 * Get exchange rate with source metadata for transparency.
 * Returns both the rate and where it came from (live, cache, fallback).
 */
export async function getExchangeRateWithSource(): Promise<ExchangeRateResult> {
  // Return cached rate if fresh
  if (cachedRates && Date.now() - cachedRates.fetchedAt < CACHE_DURATION) {
    return { rate: cachedRates.CAD_TO_USD, source: 'cache' };
  }

  // Try fetching from API
  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!apiKey) {
      console.warn('EXCHANGE_RATE_API_KEY not set, using fallback rate');
      return { rate: FALLBACK_RATE, source: 'fallback' };
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
    return { rate, source: 'live' };
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
    // Return cached rate even if stale, or fallback
    if (cachedRates) {
      return { rate: cachedRates.CAD_TO_USD, source: 'cache' };
    }
    return { rate: FALLBACK_RATE, source: 'fallback' };
  }
}

/** Convenience wrapper that returns just the rate (backward-compatible) */
export async function getExchangeRate(): Promise<number> {
  const result = await getExchangeRateWithSource();
  return result.rate;
}

export function convertCadToUsd(cadAmount: number, rate: number): number {
  return Math.round(cadAmount * rate * 100) / 100;
}
