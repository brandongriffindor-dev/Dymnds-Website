/**
 * Sentry error monitoring integration.
 *
 * To activate:
 * 1. Create a Sentry account at sentry.io
 * 2. Create a Next.js project
 * 3. Add NEXT_PUBLIC_SENTRY_DSN to your environment variables
 * 4. Install: npm install @sentry/nextjs
 * 5. Run: npx @sentry/wizard@latest -i nextjs
 *
 * This file provides a lightweight wrapper for manual error reporting
 * that works both with and without Sentry installed.
 */

interface ErrorContext {
  route?: string;
  userId?: string;
  orderId?: string;
  [key: string]: unknown;
}

export function captureError(error: Error | unknown, context?: ErrorContext): void {
  // Log to console in all environments
  console.error('[DYMNDS Error]', error, context);

  // If Sentry is configured, forward to it
  // This will be activated when @sentry/nextjs is installed
  try {
    // Dynamic import to avoid build errors when Sentry isn't installed
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // @ts-expect-error - Sentry may not be installed yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      import('@sentry/nextjs').then((Sentry: any) => {
        Sentry.captureException(error, {
          extra: context,
        });
      }).catch(() => {
        // Sentry not installed yet — that's fine
      });
    }
  } catch {
    // Silently fail if Sentry isn't available
  }
}

export function setUser(userId: string, email?: string): void {
  try {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // @ts-expect-error - Sentry may not be installed yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      import('@sentry/nextjs').then((Sentry: any) => {
        Sentry.setUser({ id: userId, email });
      }).catch(() => {});
    }
  } catch {}
}
