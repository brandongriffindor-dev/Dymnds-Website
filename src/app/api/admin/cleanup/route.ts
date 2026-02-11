import { NextResponse, NextRequest } from 'next/server';
import {
  findOrphanedCustomerNotes,
  purgeStaleWaitlistEntries,
  findOrdersWithoutProductRef,
  cleanupSoftDeletedRecords,
  type CleanupReportResult,
} from '@/lib/cleanup';
import { logger } from '@/lib/logger';
import { generateRequestId } from '@/lib/request-id';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * Response type for the cleanup report endpoint
 */
interface CleanupReportResponse {
  success: boolean;
  report?: CleanupReportResult;
  generatedAt: string;
  error?: string;
}

/**
 * GET /api/admin/cleanup
 *
 * Returns a comprehensive cleanup report with:
 * - Orphaned customer notes
 * - Stale waitlist entries (>90 days)
 * - Orders without product references (DAT-105)
 * - Soft-deleted products (>90 days)
 * - Soft-deleted orders (>90 days)
 *
 * Requires valid admin authentication.
 * Does NOT perform any deletions — data is for admin review only.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const endpoint = 'GET /api/admin/cleanup';

  try {
    // Verify admin authentication
    const [admin, authError] = await requireAdmin(request, { skipCSRF: true });

    if (authError) {
      logger.warn('Unauthorized cleanup report access attempt', {
        endpoint,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      });

      return authError;
    }

    logger.info('Cleanup report requested', {
      endpoint,
      requestedAt: new Date().toISOString(),
    });

    // Run all cleanup checks in parallel
    const [
      orphanedNotes,
      staleWaitlist,
      ordersWithoutProductRef,
      softDeletedProducts,
      softDeletedOrders,
    ] = await Promise.all([
      findOrphanedCustomerNotes(),
      purgeStaleWaitlistEntries(90),
      findOrdersWithoutProductRef(),
      cleanupSoftDeletedRecords('products', 90),
      cleanupSoftDeletedRecords('orders', 90),
    ]);

    const report: CleanupReportResult = {
      orphanedNotes,
      staleWaitlist,
      ordersWithoutProductRef,
      softDeletedProducts,
      softDeletedOrders,
    };

    const generatedAt = new Date().toISOString();

    // Log summary of findings
    logger.info('Cleanup report generated successfully', {
      endpoint,
      generatedAt,
      orphanedNotesCount: orphanedNotes.count,
      staleWaitlistCount: staleWaitlist.count,
      ordersWithoutProductRefCount: ordersWithoutProductRef.count,
      softDeletedProductsCount: softDeletedProducts.count,
      softDeletedOrdersCount: softDeletedOrders.count,
      totalIssuesFound:
        orphanedNotes.count +
        staleWaitlist.count +
        ordersWithoutProductRef.count +
        softDeletedProducts.count +
        softDeletedOrders.count,
    });

    return NextResponse.json(
      {
        success: true,
        report,
        generatedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    const requestId = generateRequestId();
    logger.error('Error generating cleanup report', { endpoint, requestId }, error);

    return NextResponse.json(
      {
        success: false,
        generatedAt: new Date().toISOString(),
        error: 'Internal server error while generating cleanup report.',
        requestId,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/cleanup is intentionally not implemented
 * Hard deletions must be handled separately with explicit admin confirmation
 * and should use protected admin endpoints with additional safeguards.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest): Promise<NextResponse> {
  logger.warn('POST /api/admin/cleanup attempted', {
    endpoint: 'POST /api/admin/cleanup',
    message: 'Hard deletions not supported via cleanup endpoint',
  });

  return NextResponse.json(
    {
      success: false,
      error: 'POST method not supported. Use GET to retrieve cleanup report only.',
    },
    { status: 405 }
  );
}
