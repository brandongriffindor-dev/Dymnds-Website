/**
 * Server-side audit logging using Firebase Admin SDK.
 *
 * SEC-009: Writes directly via Admin SDK, making log entries tamper-resistant.
 * Used for ALL audit logging — both API route actions and client-originated
 * actions routed through /api/admin/audit.
 *
 * SEC-FIX-004: The client-side audit-log.ts now calls the audit API endpoint
 * instead of writing directly to Firestore (which silently failed due to rules).
 */

import { getAdminDb, FieldValue } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

export type ServerAuditAction =
  | 'order_created_server'
  | 'order_status_updated_server'
  | 'critical_admin_action'
  | 'discount_created'
  | 'discount_updated'
  | 'discount_deleted'
  | 'product_created'
  | 'product_updated'
  | 'product_deleted'
  | 'stock_updated'
  // SEC-FIX-004: Client-originated actions (routed through /api/admin/audit)
  | 'order_status_updated'
  | 'order_deleted'
  | 'customer_note_saved'
  | 'inventory_adjusted'
  | 'expense_created'
  | 'expense_deleted'
  | 'bulk_delete'
  | 'message_deleted'
  | 'waitlist_exported';

/**
 * Log an action to admin_audit_log via Admin SDK (server-side only).
 * Non-blocking — catches errors internally so it never blocks the caller.
 */
export async function logAdminActionServer(
  action: ServerAuditAction,
  details: Record<string, unknown>,
  adminEmail?: string
): Promise<void> {
  try {
    const db = getAdminDb();
    await db.collection('admin_audit_log').add({
      action,
      details,
      admin_email: adminEmail || 'system',
      timestamp: FieldValue.serverTimestamp(),
      created_at: new Date().toISOString(),
      server_logged: true,
    });
  } catch (error) {
    logger.error('Server audit log write failed', { action }, error);
  }
}
