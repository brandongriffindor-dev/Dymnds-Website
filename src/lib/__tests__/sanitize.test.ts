import { describe, it, expect } from 'vitest';
import { sanitizeString, sanitizeEmail, sanitizeObject } from '../sanitize';

// ─── sanitizeString ────────────────────────────────────────────

describe('sanitizeString', () => {
  it('returns clean strings unchanged', () => {
    expect(sanitizeString('Hello World')).toBe('Hello World');
  });

  it('strips script tags and their content', () => {
    const input = 'Hello<script>alert("xss")</script>World';
    expect(sanitizeString(input)).not.toContain('script');
    expect(sanitizeString(input)).not.toContain('alert');
  });

  it('strips style tags and their content', () => {
    const input = 'Hello<style>body{display:none}</style>World';
    expect(sanitizeString(input)).not.toContain('style');
    expect(sanitizeString(input)).not.toContain('display');
  });

  it('strips HTML tags but preserves text content', () => {
    const input = '<b>Bold</b> and <i>italic</i>';
    const result = sanitizeString(input);
    expect(result).toContain('Bold');
    expect(result).toContain('italic');
    expect(result).not.toContain('<b>');
    expect(result).not.toContain('<i>');
  });

  it('removes event handler attributes', () => {
    const input = '<div onerror="alert(1)">text more</div>';
    const result = sanitizeString(input);
    expect(result).not.toContain('onerror');
  });

  it('handles angle brackets in text', () => {
    // The < and > in "5 < 10 > 5" get caught by the HTML tag strip regex
    // then the re-encode step converts any remaining < > to entities
    const input = '5 < 10 and 10 > 5';
    const result = sanitizeString(input);
    // Should not contain raw angle brackets
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('handles nested script tags', () => {
    const input = '<script><script>alert("xss")</script></script>';
    const result = sanitizeString(input);
    expect(result).not.toContain('alert');
  });

  it('handles empty string', () => {
    expect(sanitizeString('')).toBe('');
  });

  it('handles img tag with onerror', () => {
    const input = '<img src=x onerror="alert(1)">';
    const result = sanitizeString(input);
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('<img');
  });
});

// ─── sanitizeEmail ─────────────────────────────────────────────

describe('sanitizeEmail', () => {
  it('returns clean emails unchanged', () => {
    expect(sanitizeEmail('user@dymnds.ca')).toBe('user@dymnds.ca');
  });

  it('lowercases email', () => {
    expect(sanitizeEmail('USER@DYMNDS.CA')).toBe('user@dymnds.ca');
  });

  it('trims whitespace', () => {
    expect(sanitizeEmail('  user@dymnds.ca  ')).toBe('user@dymnds.ca');
  });

  it('removes invalid characters', () => {
    expect(sanitizeEmail('user<script>@dymnds.ca')).toBe('userscript@dymnds.ca');
  });

  it('truncates to 254 characters', () => {
    const longEmail = 'a'.repeat(300) + '@b.ca';
    expect(sanitizeEmail(longEmail).length).toBeLessThanOrEqual(254);
  });

  it('preserves plus addressing', () => {
    expect(sanitizeEmail('user+tag@dymnds.ca')).toBe('user+tag@dymnds.ca');
  });

  it('preserves dots', () => {
    expect(sanitizeEmail('first.last@dymnds.ca')).toBe('first.last@dymnds.ca');
  });

  it('preserves hyphens', () => {
    expect(sanitizeEmail('first-last@dymnds.ca')).toBe('first-last@dymnds.ca');
  });
});

// ─── sanitizeObject ────────────────────────────────────────────

describe('sanitizeObject', () => {
  it('sanitizes all string values', () => {
    const input = {
      name: '<script>alert(1)</script>Brandon',
      email: 'USER@DYMNDS.CA',
      count: 42,
    };
    const result = sanitizeObject(input);
    expect(result.name).not.toContain('script');
    expect(result.email).toBe('user@dymnds.ca');
    expect(result.count).toBe(42); // non-strings untouched
  });

  it('uses sanitizeEmail for email fields', () => {
    const input = { email: '  USER@DYMNDS.CA  ', name: 'test' };
    const result = sanitizeObject(input);
    expect(result.email).toBe('user@dymnds.ca');
  });

  it('uses custom emailFields parameter', () => {
    const input = { contact_email: '  USER@DYMNDS.CA  ', name: 'test' };
    const result = sanitizeObject(input, ['contact_email']);
    expect(result.contact_email).toBe('user@dymnds.ca');
  });

  it('does not mutate original object', () => {
    const input = { name: '<b>Test</b>' };
    const original = { ...input };
    sanitizeObject(input);
    expect(input.name).toBe(original.name);
  });
});
