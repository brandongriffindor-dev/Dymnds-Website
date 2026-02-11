/**
 * Input sanitization using DOMPurify.
 * Strips HTML tags, script content, and dangerous attributes
 * from user input before it hits Firestore.
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize a string by stripping all HTML and dangerous content.
 * Returns plain text only — no HTML tags survive.
 */
export function sanitizeString(input: string): string {
  // ALLOWED_TAGS=[] strips ALL HTML — returns plain text only
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim();
}

/**
 * Sanitize an email address.
 * Emails have a more restricted character set, so we can be stricter.
 */
export function sanitizeEmail(email: string): string {
  return email
    .trim()
    .toLowerCase()
    // Remove any characters not valid in emails
    .replace(/[^\w.@+-]/g, '')
    // Limit length
    .slice(0, 254);
}

/**
 * Escape HTML special characters for safe interpolation into HTML templates.
 * Use this when inserting dynamic values into email HTML.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize all string values in an object.
 * SEC-016: Set deep=true to recursively sanitize nested objects.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  emailFields: string[] = ['email'],
  deep: boolean = false
): T {
  const result = { ...obj };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      if (emailFields.includes(key)) {
        (result as Record<string, unknown>)[key] = sanitizeEmail(value);
      } else {
        (result as Record<string, unknown>)[key] = sanitizeString(value);
      }
    } else if (deep && value && typeof value === 'object' && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>,
        emailFields,
        true
      );
    }
  }
  return result;
}
