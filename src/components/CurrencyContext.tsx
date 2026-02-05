'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Currency = 'CAD' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'CAD',
  isLoading: true,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('CAD');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectCurrency = async () => {
      // Check localStorage first
      const stored = localStorage.getItem('dymnds-currency') as Currency | null;
      
      if (stored) {
        setCurrency(stored);
        setIsLoading(false);
        return;
      }

      // Detect via IP
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        // US users get USD, everyone else gets CAD
        const detectedCurrency: Currency = data.country_code === 'US' ? 'USD' : 'CAD';
        
        setCurrency(detectedCurrency);
        localStorage.setItem('dymnds-currency', detectedCurrency);
      } catch (error) {
        // Default to CAD on error
        console.error('Geo detection failed:', error);
        setCurrency('CAD');
        localStorage.setItem('dymnds-currency', 'CAD');
      }
      
      setIsLoading(false);
    };

    detectCurrency();
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

// Helper function to get CAD price from product
export function getCadPrice(product: { price?: number; price_cad?: number }): number {
  return product.price_cad ?? product.price ?? 0;
}

// Helper function to convert CAD to displayed price
export function convertPrice(cadPrice: number, currency: Currency): number {
  if (currency === 'CAD') return cadPrice;
  
  // USD: divide by 1.35, round UP to nearest dollar
  const usdPrice = cadPrice / 1.35;
  return Math.ceil(usdPrice);
}

// Helper to format price with currency symbol
export function formatPrice(price: number, currency: Currency): string {
  const symbol = currency === 'CAD' ? 'CAD $' : 'USD $';
  return `${symbol}${price}`;
}
