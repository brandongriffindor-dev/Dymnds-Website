import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('env validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('exports env object when all vars present', async () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-key';
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123:web:abc';

    const { env } = await import('../env');
    expect(env.NEXT_PUBLIC_FIREBASE_API_KEY).toBe('test-key');
    expect(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBe('test-project');
  });

  it('warns in dev when vars are missing', async () => {
    // Ensure we're not on Vercel
    delete process.env.VERCEL;
    // Clear all firebase vars
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    delete process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { env } = await import('../env');
    // Should warn, not throw
    expect(warnSpy).toHaveBeenCalled();
    expect(env).toBeDefined();

    vi.restoreAllMocks();
  });

  it('throws on Vercel when vars are missing', async () => {
    process.env.VERCEL = '1';
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    delete process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

    await expect(async () => {
      await import('../env');
    }).rejects.toThrow('Missing required environment variables');
  });
});
