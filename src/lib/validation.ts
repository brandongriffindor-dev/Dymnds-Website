/**
 * Shared form validation utilities.
 * Single source of truth for all client-side validation.
 *
 * TODO: CONSOLIDATION - This file contains basic email/message validators.
 * The canonical source for comprehensive validation schemas is src/lib/schemas.ts
 * which uses Zod. Future refactoring should:
 * 1. Move client-side validators to use Zod schemas from schemas.ts
 * 2. Keep this file for lightweight client-only validation helpers
 * 3. Merge with validators.ts (see below) if both are needed
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const trimmed = email.trim();

  if (!trimmed) {
    return { valid: false, error: 'Email is required' };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true };
}

export function validateRequired(
  value: string,
  fieldName: string,
  maxLength: number = 500
): { valid: boolean; error?: string } {
  const trimmed = value.trim();

  if (!trimmed) {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} is too long (max ${maxLength} characters)` };
  }

  return { valid: true };
}

export function validateMessage(
  message: string,
  minLength: number = 10,
  maxLength: number = 5000
): { valid: boolean; error?: string } {
  const trimmed = message.trim();

  if (!trimmed) {
    return { valid: false, error: 'Message is required' };
  }

  if (trimmed.length < minLength) {
    return { valid: false, error: `Message must be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Message is too long (max ${maxLength} characters)` };
  }

  return { valid: true };
}
