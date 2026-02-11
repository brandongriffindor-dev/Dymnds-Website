/**
 * Client-side audit logging — routes through /api/admin/audit.
 *
 * SEC-FIX-004: Previously wrote directly to Firestore via client SDK,
 * but Firestore rules (allow write: if false) on admin_audit_log caused
 * every write to SILENTLY FAIL. Now routes through a server endpoint that:
 *
 * 1. Verifies admin identity from the session cookie (not spoofable)
 * 2. Writes via Admin SDK (bypasses Firestore rules)
 * 3. Records the verified admin email (not client-supplied)
 *
 * Still non-blocking (fire-and-forget) so it never blocks UI actions.
 */

import { logger } from '@/lib/logger';

export type AuditAction =
  | 'order_status_updated'
  | 'order_deleted'
  | 'product_created'
  | 'product_updated'
  | 'product_deleted'
  | 'discount_created'
  | 'discount_updated'
  | 'discount_deleted'
  | 'customer_note_saved'
  | 'inventory_adjusted'
  | 'expense_created'
  | 'expense_deleted'
  | 'bulk_delete'
  | 'message_deleted'
  | 'waitlist_exported';

interface AuditDetails {
  [key: string]: string | number | boolean | undefined;
}

/** Read CSRF token from cookie for the audit API call */
function getCSRFToken(): string {
  if (typeof document === 'undefined') return '';
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))
    ?.split('=')[1] || '';
}

/**
 * Logs an admin action via the server-side audit API endpoint.
 * Non-blocking — fires and forgets so it never blocks UI actions.
 *
 * The admin email is extracted from the verified session cookie server-side,
 * so the adminEmail parameter is kept for backward compatibility but ignored.
 */
export function logAdminAction(
  action: AuditAction,
  details: AuditDetails,
  _adminEmail?: string // Ignored — server extracts email from verified JWT
): void {
  const csrfToken = getCSRFToken();

  fetch('/api/admin/audit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
    },
    body: JSON.stringify({ action, details }),
  }).catch((error) => {
    logger.error('Audit log API call failed', { action }, error);
  });
}
