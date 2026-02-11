/**
 * Zod-based form validators for client and server validation.
 *
 * TODO: CONSOLIDATION - This file contains ContactForm, Waitlist, and AppWaitlist schemas.
 * The canonical source for server-side schemas is src/lib/schemas.ts which defines
 * Firestore document schemas (ProductReadSchema, OrderReadSchema, etc.).
 *
 * Future consolidation should:
 * 1. Keep form-specific validators here (ContactForm, WaitlistForm, etc.)
 * 2. Move Firestore read/write schemas to schemas.ts
 * 3. Consider creating a separate src/lib/form-schemas.ts if both grow
 * 4. Update validation.ts to use Zod for all validators instead of regex
 */

import { z } from 'zod';

// ─── Contact Form ────────────────────────────────────────────────
export const ContactFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name is too long')
    .transform((val) => val.trim()),
  email: z
    .string()
    .min(1, 'Email is required')
    .max(254, 'Email is too long')
    .email('Please enter a valid email address')
    .transform((val) => val.trim().toLowerCase()),
  subject: z
    .enum(['general', 'order', 'returns', 'partnership', 'press', 'other'], {
      error: 'Invalid subject',
    }),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message is too long')
    .transform((val) => val.trim()),
});

export type ContactFormData = z.infer<typeof ContactFormSchema>;

// ─── Waitlist Signup ─────────────────────────────────────────────
export const WaitlistSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .max(254, 'Email is too long')
    .email('Please enter a valid email address')
    .transform((val) => val.trim().toLowerCase()),
  source: z
    .enum(['footer', 'hero', 'app', 'popup'])
    .optional()
    .default('footer'),
});

export type WaitlistData = z.infer<typeof WaitlistSchema>;

// ─── App Waitlist ────────────────────────────────────────────────
export const AppWaitlistSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .max(254, 'Email is too long')
    .email('Please enter a valid email address')
    .transform((val) => val.trim().toLowerCase()),
});

export type AppWaitlistData = z.infer<typeof AppWaitlistSchema>;
