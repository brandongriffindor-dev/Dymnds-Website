'use client';

import { create } from 'zustand';

export type Currency = 'CAD' | 'USD';

interface CurrencyState {
  currency: Currency;
  rate: number; // CAD_TO_USD exchange rate
  isLoading: boolean;
  _initialized: boolean;
}

interface CurrencyActions {
  init: () => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState & CurrencyActions>((set, get) => ({
  currency: 'CAD',
  rate: 1.35, // Default CAD_TO_USD rate
  isLoading: true,
  _initialized: false,

  init: async () => {
    if (get()._initialized) return;
    set({ _initialized: true });

    // Helper: fetch exchange rate from API
    const loadExchangeRate = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch('/api/exchange-rate', { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        const rate = data.rate ?? 1.35;
        set({ rate });
      } catch {
        // Keep default rate (1.35)
      }
    };

    // Check localStorage first
    try {
      const stored = localStorage.getItem('dymnds-currency') as Currency | null;
      if (stored) {
        set({ currency: stored, isLoading: false });
        loadExchangeRate();
        return;
      }
    } catch {
      // localStorage unavailable
    }

    // Detect via Vercel geo headers
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const response = await fetch('/api/geo', { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await response.json();

      const detectedCurrency: Currency = data.currency || 'CAD';
      set({ currency: detectedCurrency, isLoading: false });
      try {
        localStorage.setItem('dymnds-currency', detectedCurrency);
      } catch {
        // Storage full
      }
    } catch {
      set({ currency: 'CAD', isLoading: false });
      try {
        localStorage.setItem('dymnds-currency', 'CAD');
      } catch {
        // Storage full
      }
    }

    // Fetch exchange rate after currency is set
    loadExchangeRate();
  },
}));

// ---- Pure utility functions (no store dependency) ----

export function getCadPrice(product: { price?: number; price_cad?: number }): number {
  return product.price_cad ?? product.price ?? 0;
}

export function convertPrice(cadPrice: number, currency: Currency, rate: number = 1.35): number {
  if (currency === 'CAD') return cadPrice;
  const usdPrice = cadPrice / rate;
  return Math.round(usdPrice * 100) / 100;
}

export function formatPrice(price: number, currency: Currency): string {
  const symbol = currency === 'CAD' ? 'CAD $' : 'USD $';
  return `${symbol}${price.toFixed(2)}`;
}

// Hook for convenience
export const useCurrency = () => useCurrencyStore(s => s.currency);
export const useCurrencyLoading = () => useCurrencyStore(s => s.isLoading);
