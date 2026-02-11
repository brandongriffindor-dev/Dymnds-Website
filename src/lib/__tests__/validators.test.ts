import { describe, it, expect } from 'vitest';
import { ContactFormSchema, WaitlistSchema, AppWaitlistSchema } from '../validators';

// ─── ContactFormSchema ─────────────────────────────────────────

describe('ContactFormSchema', () => {
  const validContact = {
    name: 'Brandon',
    email: 'brandon@dymnds.ca',
    subject: 'general',
    message: 'This is a valid test message for the contact form.',
  };

  it('accepts valid contact data', () => {
    const result = ContactFormSchema.safeParse(validContact);
    expect(result.success).toBe(true);
  });

  it('lowercases email', () => {
    const result = ContactFormSchema.safeParse({
      ...validContact,
      email: 'BRANDON@DYMNDS.CA',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('brandon@dymnds.ca');
    }
  });

  it('rejects email with leading/trailing spaces (Zod validates before transform)', () => {
    const result = ContactFormSchema.safeParse({
      ...validContact,
      email: '  BRANDON@DYMNDS.CA  ',
    });
    // Zod email() validator runs before trim() transform
    expect(result.success).toBe(false);
  });

  it('trims name whitespace', () => {
    const result = ContactFormSchema.safeParse({
      ...validContact,
      name: '  Brandon  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Brandon');
    }
  });

  it('rejects empty name', () => {
    const result = ContactFormSchema.safeParse({ ...validContact, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name over 200 chars', () => {
    const result = ContactFormSchema.safeParse({
      ...validContact,
      name: 'A'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = ContactFormSchema.safeParse({
      ...validContact,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid subject enum', () => {
    const result = ContactFormSchema.safeParse({
      ...validContact,
      subject: 'invalid-subject',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid subject values', () => {
    const subjects = ['general', 'order', 'returns', 'partnership', 'press', 'other'];
    for (const subject of subjects) {
      const result = ContactFormSchema.safeParse({ ...validContact, subject });
      expect(result.success).toBe(true);
    }
  });

  it('rejects message under 10 chars', () => {
    const result = ContactFormSchema.safeParse({
      ...validContact,
      message: 'Short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects message over 5000 chars', () => {
    const result = ContactFormSchema.safeParse({
      ...validContact,
      message: 'A'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const result = ContactFormSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─── WaitlistSchema ────────────────────────────────────────────

describe('WaitlistSchema', () => {
  it('accepts valid email with default source', () => {
    const result = WaitlistSchema.safeParse({ email: 'user@dymnds.ca' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe('footer');
    }
  });

  it('accepts valid email with explicit source', () => {
    const result = WaitlistSchema.safeParse({
      email: 'user@dymnds.ca',
      source: 'hero',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe('hero');
    }
  });

  it('rejects invalid source enum', () => {
    const result = WaitlistSchema.safeParse({
      email: 'user@dymnds.ca',
      source: 'instagram',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = WaitlistSchema.safeParse({ email: 'bad' });
    expect(result.success).toBe(false);
  });

  it('lowercases email', () => {
    const result = WaitlistSchema.safeParse({ email: 'USER@DYMNDS.CA' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@dymnds.ca');
    }
  });

  it('rejects email with whitespace', () => {
    const result = WaitlistSchema.safeParse({ email: '  USER@DYMNDS.CA  ' });
    expect(result.success).toBe(false);
  });
});

// ─── AppWaitlistSchema ─────────────────────────────────────────

describe('AppWaitlistSchema', () => {
  it('accepts valid email', () => {
    const result = AppWaitlistSchema.safeParse({ email: 'user@dymnds.ca' });
    expect(result.success).toBe(true);
  });

  it('rejects empty email', () => {
    const result = AppWaitlistSchema.safeParse({ email: '' });
    expect(result.success).toBe(false);
  });

  it('rejects email over 254 chars', () => {
    const longEmail = 'a'.repeat(250) + '@b.ca';
    const result = AppWaitlistSchema.safeParse({ email: longEmail });
    expect(result.success).toBe(false);
  });
});
