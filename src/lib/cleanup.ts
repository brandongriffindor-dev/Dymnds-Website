'use strict';

/**
 * Referential Integrity & Orphaned Data Cleanup Utilities
 * Uses Firebase Admin SDK (server-side, bypasses Firestore Security Rules).
 *
 * All functions detect orphaned/stale data without auto-deleting.
 * Returns typed results for admin review and confirmation.
 */

import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

// ============================================================================
// Type Definitions
// ============================================================================

export interface OrphanedNotesResult {
  count: number;
  emails: string[];
  orphanedDocIds?: string[];
}

export interface StaleWaitlistResult {
  count: number;
  emails: string[];
  staleDocIds?: string[];
}

export interface OrdersWithoutProductRefResult {
  count: number;
  orderIds: string[];
  affectedOrders?: Array<{
    orderId: string;
    affectedItemIndices: number[];
    customer_email: string;
  }>;
}

export interface SoftDeletedRecordsResult {
  count: number;
  ids: string[];
  records?: Array<{
    id: string;
    deleted_at: string;
    deletedDaysAgo: number;
  }>;
}

export interface CleanupReportResult {
  orphanedNotes: OrphanedNotesResult;
  staleWaitlist: StaleWaitlistResult;
  ordersWithoutProductRef: OrdersWithoutProductRefResult;
  softDeletedProducts: SoftDeletedRecordsResult;
  softDeletedOrders: SoftDeletedRecordsResult;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate days elapsed between a date string and now
 */
function getDaysOld(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Safely get all documents from a collection via Admin SDK
 */
async function getAllDocsFromCollection(collectionName: string): Promise<
  Array<{ id: string; data: Record<string, unknown> }>
> {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection(collectionName).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data() as Record<string, unknown>,
    }));
  } catch (error) {
    logger.error(`Failed to fetch collection: ${collectionName}`, {}, error);
    return [];
  }
}

// ============================================================================
// Cleanup Functions
// ============================================================================

/**
 * Find orphaned customer notes (notes without associated orders)
 */
export async function findOrphanedCustomerNotes(): Promise<OrphanedNotesResult> {
  const functionName = 'findOrphanedCustomerNotes';
  const orphanedEmails: string[] = [];
  const orphanedDocIds: string[] = [];

  try {
    logger.info('Starting orphaned notes scan', { function: functionName });

    const noteDocs = await getAllDocsFromCollection('customer_notes');

    if (noteDocs.length === 0) {
      logger.info('No customer notes found', { function: functionName });
      return { count: 0, emails: [], orphanedDocIds: [] };
    }

    const orderDocs = await getAllDocsFromCollection('orders');
    const emailsWithOrders = new Set<string>();
    orderDocs.forEach((orderDoc) => {
      const customerEmail = orderDoc.data.customer_email as string | undefined;
      if (customerEmail) {
        emailsWithOrders.add(customerEmail.toLowerCase());
      }
    });

    for (const noteDoc of noteDocs) {
      const noteEmail = noteDoc.id.toLowerCase();
      if (!emailsWithOrders.has(noteEmail)) {
        orphanedEmails.push(noteDoc.id);
        orphanedDocIds.push(noteDoc.id);
      }
    }

    logger.info('Orphaned notes scan complete', {
      function: functionName,
      orphanedCount: orphanedEmails.length,
      totalNotes: noteDocs.length,
    });

    return {
      count: orphanedEmails.length,
      emails: orphanedEmails,
      orphanedDocIds,
    };
  } catch (error) {
    logger.error('Error scanning for orphaned notes', { function: functionName }, error);
    return { count: 0, emails: [], orphanedDocIds: [] };
  }
}

/**
 * Find stale waitlist entries (entries older than specified days)
 */
export async function purgeStaleWaitlistEntries(daysOld: number = 90): Promise<StaleWaitlistResult> {
  const functionName = 'purgeStaleWaitlistEntries';
  const staleEmails: string[] = [];
  const staleDocIds: string[] = [];

  try {
    logger.info('Starting stale waitlist scan', { function: functionName, daysOld });

    const waitlistDocs = await getAllDocsFromCollection('waitlist');

    if (waitlistDocs.length === 0) {
      logger.info('No waitlist entries found', { function: functionName });
      return { count: 0, emails: [], staleDocIds: [] };
    }

    for (const waitlistDoc of waitlistDocs) {
      const signedUpAt = waitlistDoc.data.signed_up_at as string | undefined;
      if (!signedUpAt) continue;

      const daysSinceSignup = getDaysOld(signedUpAt);
      if (daysSinceSignup > daysOld) {
        const email = waitlistDoc.data.email as string | undefined;
        if (email) {
          staleEmails.push(email);
          staleDocIds.push(waitlistDoc.id);
        }
      }
    }

    logger.info('Stale waitlist scan complete', {
      function: functionName,
      staleCount: staleEmails.length,
      totalEntries: waitlistDocs.length,
      daysOld,
    });

    return { count: staleEmails.length, emails: staleEmails, staleDocIds };
  } catch (error) {
    logger.error('Error scanning for stale waitlist entries', { function: functionName }, error);
    return { count: 0, emails: [], staleDocIds: [] };
  }
}

/**
 * Find orders with missing product_id references
 */
export async function findOrdersWithoutProductRef(): Promise<OrdersWithoutProductRefResult> {
  const functionName = 'findOrdersWithoutProductRef';
  const affectedOrderIds: string[] = [];
  const affectedOrders: Array<{
    orderId: string;
    affectedItemIndices: number[];
    customer_email: string;
  }> = [];

  try {
    logger.info('Starting orders without product ref scan', { function: functionName });

    const orderDocs = await getAllDocsFromCollection('orders');

    if (orderDocs.length === 0) {
      logger.info('No orders found', { function: functionName });
      return { count: 0, orderIds: [], affectedOrders: [] };
    }

    for (const orderDoc of orderDocs) {
      const items = orderDoc.data.items as unknown[];
      const customerEmail = orderDoc.data.customer_email as string | undefined;

      if (!Array.isArray(items)) continue;

      const affectedItemIndices: number[] = [];

      items.forEach((item, index) => {
        if (typeof item !== 'object' || item === null) return;

        const itemObj = item as Record<string, unknown>;
        const hasProductId = 'product_id' in itemObj && itemObj.product_id !== undefined;

        if (!hasProductId) {
          affectedItemIndices.push(index);
        }
      });

      if (affectedItemIndices.length > 0) {
        affectedOrderIds.push(orderDoc.id);
        affectedOrders.push({
          orderId: orderDoc.id,
          affectedItemIndices,
          customer_email: customerEmail || 'unknown',
        });
      }
    }

    logger.info('Orders without product ref scan complete', {
      function: functionName,
      affectedCount: affectedOrderIds.length,
      totalOrders: orderDocs.length,
    });

    return { count: affectedOrderIds.length, orderIds: affectedOrderIds, affectedOrders };
  } catch (error) {
    logger.error('Error scanning for orders without product ref', { function: functionName }, error);
    return { count: 0, orderIds: [], affectedOrders: [] };
  }
}

/**
 * Find soft-deleted records ready for hard delete
 */
export async function cleanupSoftDeletedRecords(
  collectionName: 'products' | 'orders',
  retentionDays: number = 90
): Promise<SoftDeletedRecordsResult> {
  const functionName = 'cleanupSoftDeletedRecords';
  const readyForDeleteIds: string[] = [];
  const readyForDeleteRecords: Array<{
    id: string;
    deleted_at: string;
    deletedDaysAgo: number;
  }> = [];

  try {
    logger.info('Starting soft-deleted records scan', {
      function: functionName,
      collection: collectionName,
      retentionDays,
    });

    const docs = await getAllDocsFromCollection(collectionName);

    if (docs.length === 0) {
      logger.info(`No ${collectionName} found`, { function: functionName });
      return { count: 0, ids: [], records: [] };
    }

    for (const doc of docs) {
      const isDeleted = doc.data.is_deleted === true;
      const deletedAt = doc.data.deleted_at as string | undefined;

      if (!isDeleted || !deletedAt) continue;

      const daysSinceDelete = getDaysOld(deletedAt);
      if (daysSinceDelete > retentionDays) {
        readyForDeleteIds.push(doc.id);
        readyForDeleteRecords.push({
          id: doc.id,
          deleted_at: deletedAt,
          deletedDaysAgo: daysSinceDelete,
        });
      }
    }

    logger.info('Soft-deleted records scan complete', {
      function: functionName,
      collection: collectionName,
      readyForDeleteCount: readyForDeleteIds.length,
      totalRecords: docs.length,
      retentionDays,
    });

    return { count: readyForDeleteIds.length, ids: readyForDeleteIds, records: readyForDeleteRecords };
  } catch (error) {
    logger.error(`Error scanning soft-deleted ${collectionName}`, { function: functionName }, error);
    return { count: 0, ids: [], records: [] };
  }
}
