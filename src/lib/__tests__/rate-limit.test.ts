import { describe, it, expect } from 'vitest';
import { rateLimit, RATE_LIMITS, getClientIP } from '../rate-limit';

describe('rateLimit', () => {
  // Use unique identifiers per test to avoid cross-test pollution
  let testId = 0;
  const uniqueId = () => `test-${++testId}-${Date.now()}`;

  it('allows first request', async () => {
    const id = uniqueId();
    const result = await rateLimit(id, { limit: 5, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('decrements remaining count', async () => {
    const id = uniqueId();
    await rateLimit(id, { limit: 5, windowSeconds: 60 });
    const result = await rateLimit(id, { limit: 5, windowSeconds: 60 });
    expect(result.remaining).toBe(3);
  });

  it('blocks after limit exceeded', async () => {
    const id = uniqueId();
    const config = { limit: 3, windowSeconds: 60 };

    // Use up all 3 allowed
    await rateLimit(id, config);
    await rateLimit(id, config);
    await rateLimit(id, config);

    // 4th should be blocked
    const result = await rateLimit(id, config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('returns correct limit value', async () => {
    const id = uniqueId();
    const result = await rateLimit(id, { limit: 10, windowSeconds: 60 });
    expect(result.limit).toBe(10);
  });

  it('returns resetAt in the future', async () => {
    const id = uniqueId();
    const result = await rateLimit(id, { limit: 5, windowSeconds: 60 });
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it('remaining never goes below 0', async () => {
    const id = uniqueId();
    const config = { limit: 1, windowSeconds: 60 };

    await rateLimit(id, config); // uses the 1 allowed
    const result = await rateLimit(id, config); // over limit
    expect(result.remaining).toBe(0);

    const result2 = await rateLimit(id, config); // way over limit
    expect(result2.remaining).toBe(0);
  });

  it('different identifiers have independent limits', async () => {
    const id1 = uniqueId();
    const id2 = uniqueId();
    const config = { limit: 1, windowSeconds: 60 };

    await rateLimit(id1, config); // uses id1's limit
    const result = await rateLimit(id2, config); // id2 should still be allowed
    expect(result.allowed).toBe(true);
  });
});

// ─── RATE_LIMITS config ────────────────────────────────────────

describe('RATE_LIMITS', () => {
  it('has contact config: 5 per 15 min', () => {
    expect(RATE_LIMITS.contact.limit).toBe(5);
    expect(RATE_LIMITS.contact.windowSeconds).toBe(900);
  });

  it('has waitlist config: 3 per 10 min', () => {
    expect(RATE_LIMITS.waitlist.limit).toBe(3);
    expect(RATE_LIMITS.waitlist.windowSeconds).toBe(600);
  });

  it('has products config: 60 per 1 min', () => {
    expect(RATE_LIMITS.products.limit).toBe(60);
    expect(RATE_LIMITS.products.windowSeconds).toBe(60);
  });
});

// ─── getClientIP ───────────────────────────────────────────────

describe('getClientIP', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIP(req)).toBe('1.2.3.4');
  });

  it('extracts IP from x-real-ip header', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '10.0.0.1' },
    });
    expect(getClientIP(req)).toBe('10.0.0.1');
  });

  it('prefers x-forwarded-for over x-real-ip', () => {
    const req = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '1.2.3.4',
        'x-real-ip': '10.0.0.1',
      },
    });
    expect(getClientIP(req)).toBe('1.2.3.4');
  });

  it('returns "unknown" when no IP headers', () => {
    const req = new Request('http://localhost');
    expect(getClientIP(req)).toBe('unknown');
  });

  it('trims whitespace from forwarded IP', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '  1.2.3.4  , 5.6.7.8' },
    });
    expect(getClientIP(req)).toBe('1.2.3.4');
  });
});
