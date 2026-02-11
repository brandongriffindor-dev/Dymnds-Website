import { describe, it, expect } from 'vitest';
import {
  getCadPrice,
  convertPrice,
  formatPrice,
} from '@/lib/stores/currency-store';

type Currency = 'CAD' | 'USD';

describe('currency-store', () => {
  describe('getCadPrice', () => {
    it('returns price_cad when both fields present', () => {
      const product = { price: 100, price_cad: 135 };
      expect(getCadPrice(product)).toBe(135);
    });

    it('falls back to price when no price_cad', () => {
      const product = { price: 100 };
      expect(getCadPrice(product)).toBe(100);
    });

    it('returns 0 when neither field exists', () => {
      const product = {};
      expect(getCadPrice(product)).toBe(0);
    });
  });

  describe('convertPrice', () => {
    it('returns same value for CAD', () => {
      const result = convertPrice(100, 'CAD' as Currency);
      expect(result).toBe(100);
    });

    it('divides by rate for USD (e.g. 135 CAD / 1.35 = 100 USD)', () => {
      const result = convertPrice(135, 'USD' as Currency);
      expect(result).toBe(100);
    });

    it('rounds to 2 decimal places', () => {
      const result = convertPrice(100, 'USD' as Currency);
      expect(result).toBe(74.07);
    });

    it('uses custom rate when provided', () => {
      const result = convertPrice(200, 'USD' as Currency, 2.0);
      expect(result).toBe(100);
    });

    it('uses default rate 1.35 when rate not provided', () => {
      const result = convertPrice(135, 'USD' as Currency);
      expect(result).toBe(100);
    });

    it('handles 0 correctly', () => {
      const cadResult = convertPrice(0, 'CAD' as Currency);
      const usdResult = convertPrice(0, 'USD' as Currency);
      expect(cadResult).toBe(0);
      expect(usdResult).toBe(0);
    });

    it('handles large numbers', () => {
      const result = convertPrice(1350000, 'USD' as Currency);
      expect(result).toBe(1000000);
    });
  });

  describe('formatPrice', () => {
    it("prepends 'CAD $' for CAD", () => {
      const result = formatPrice(100, 'CAD' as Currency);
      expect(result).toBe('CAD $100');
    });

    it("prepends 'USD $' for USD", () => {
      const result = formatPrice(100, 'USD' as Currency);
      expect(result).toBe('USD $100');
    });
  });
});
