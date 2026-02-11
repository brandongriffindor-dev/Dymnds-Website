/**
 * POST /api/admin/audit
 *
 * SEC-FIX-004: Server-side audit log endpoint for client-side admin actions.
 *
 * The previous approach (audit-log.ts writing directly to Firestore via
 * client SDK) silently failed because Firestore rules block client writes
 * to admin_audit_log. This endpoint receives audit events from the admin UI,
 * verifies admin identity from the session cookie, and writes via Admin SDK.
 *
 * This ensures:
 * 1. Audit entries actually get written (not silently dropped)
 * 2. Admin email comes from verified JWT (not spoofable)
 * 3. All writes go through Admin SDK (tamper-resistant from client)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { logAdminActionServer, type ServerAuditAction } from '@/lib/audit-log-server';
import { logger } from '@/lib/logger';

/** Allowed audit actions from the client */
const ALLOWED_ACTIONS: string[] = [
  'order_status_updated',
  'order_deleted',
  'product_created',
  'product_updated',
  'product_deleted',
  'discount_created',
  'discount_updated',
  'discount_deleted',
  'customer_note_saved',
  'inventory_adjusted',
  'expense_created',
  'expense_deleted',
  'bulk_delete',
  'message_deleted',
  'waitlist_exported',
];

const AuditRequestSchema = z.object({
  action: z.string().min(1).max(100),
  details: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(request: Request) {
  try {
    // Verify admin identity from session cookie (NOT from client-supplied headers)
    const [admin, authError] = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const validation = AuditRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid audit request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { action, details } = validation.data;

    // Validate action is in the allowed list (prevent arbitrary log pollution)
    if (!ALLOWED_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Unknown audit action: ${action}` },
        { status: 400 }
      );
    }

    // Write via Admin SDK with verified admin email
    await logAdminActionServer(
      action as ServerAuditAction,
      {
        ...details,
        source: 'admin_ui',
      },
      admin.email
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('POST /api/admin/audit failed', {}, error);
    return NextResponse.json(
      { error: 'Failed to log audit action' },
      { status: 500 }
    );
  }
}
