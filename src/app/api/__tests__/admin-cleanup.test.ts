import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../../api/admin/cleanup/route';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Mock modules
vi.mock('@/lib/admin-auth', () => ({
  requireAdmin: vi.fn(() =>
    Promise.resolve([
      {
        authenticated: true,
        uid: 'admin-1',
        email: 'admin@test.com',
        role: 'super_admin',
        decodedToken: {},
      },
      null,
    ])
  ),
}));

vi.mock('@/lib/cleanup', () => ({
  findOrphanedCustomerNotes: vi.fn(() =>
    Promise.resolve({ count: 0, items: [] })
  ),
  purgeStaleWaitlistEntries: vi.fn(() =>
    Promise.resolve({ count: 0, items: [] })
  ),
  findOrdersWithoutProductRef: vi.fn(() =>
    Promise.resolve({ count: 0, items: [] })
  ),
  cleanupSoftDeletedRecords: vi.fn(() =>
    Promise.resolve({ count: 0, items: [] })
  ),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('admin/cleanup route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET handler', () => {
    it('returns 200 with report when admin authenticated', async () => {
      const { requireAdmin } = await import('@/lib/admin-auth');

      vi.mocked(requireAdmin).mockResolvedValue([
        {
          authenticated: true,
          uid: 'admin-1',
          email: 'admin@test.com',
          role: 'super_admin',
          decodedToken: {},
        },
        null,
      ]);

      const request = new NextRequest(new URL('http://localhost:3000/api/admin/cleanup'));

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('report');
      expect(data).toHaveProperty('generatedAt');
    });

    it('returns 401 when not authenticated', async () => {
      const { requireAdmin } = await import('@/lib/admin-auth');

      vi.mocked(requireAdmin).mockResolvedValue([
        null,
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      ]);

      const request = new NextRequest(new URL('http://localhost:3000/api/admin/cleanup'));

      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('report contains all 5 cleanup sections', async () => {
      const { requireAdmin } = await import('@/lib/admin-auth');
      const {
        findOrphanedCustomerNotes,
        purgeStaleWaitlistEntries,
        findOrdersWithoutProductRef,
        cleanupSoftDeletedRecords,
      } = await import('@/lib/cleanup');

      vi.mocked(requireAdmin).mockResolvedValue([
        {
          authenticated: true,
          uid: 'admin-1',
          email: 'admin@test.com',
          role: 'super_admin',
          decodedToken: {},
        },
        null,
      ]);

      vi.mocked(findOrphanedCustomerNotes).mockResolvedValue({
        count: 2,
        items: [],
      });
      vi.mocked(purgeStaleWaitlistEntries).mockResolvedValue({
        count: 5,
        items: [],
      });
      vi.mocked(findOrdersWithoutProductRef).mockResolvedValue({
        count: 1,
        items: [],
      });
      vi.mocked(cleanupSoftDeletedRecords).mockResolvedValue({
        count: 3,
        items: [],
      });

      const request = new NextRequest(new URL('http://localhost:3000/api/admin/cleanup'));

      const response = await GET(request);
      const data = await response.json();

      expect(data.report).toHaveProperty('orphanedNotes');
      expect(data.report).toHaveProperty('staleWaitlist');
      expect(data.report).toHaveProperty('ordersWithoutProductRef');
      expect(data.report).toHaveProperty('softDeletedProducts');
      expect(data.report).toHaveProperty('softDeletedOrders');
      expect(data.report.orphanedNotes.count).toBe(2);
      expect(data.report.staleWaitlist.count).toBe(5);
      expect(data.report.ordersWithoutProductRef.count).toBe(1);
      expect(data.report.softDeletedProducts.count).toBe(3);
      expect(data.report.softDeletedOrders.count).toBe(3);
    });

    it('calls all cleanup functions in parallel', async () => {
      const { requireAdmin } = await import('@/lib/admin-auth');
      const {
        findOrphanedCustomerNotes,
        purgeStaleWaitlistEntries,
        findOrdersWithoutProductRef,
        cleanupSoftDeletedRecords,
      } = await import('@/lib/cleanup');

      // Clear all mocks before setting up test-specific mocks
      vi.clearAllMocks();

      vi.mocked(requireAdmin).mockResolvedValue([
        {
          authenticated: true,
          uid: 'admin-1',
          email: 'admin@test.com',
          role: 'super_admin',
          decodedToken: {},
        },
        null,
      ]);

      vi.mocked(findOrphanedCustomerNotes).mockResolvedValue({ count: 0, items: [] });
      vi.mocked(purgeStaleWaitlistEntries).mockResolvedValue({ count: 0, items: [] });
      vi.mocked(findOrdersWithoutProductRef).mockResolvedValue({ count: 0, items: [] });
      vi.mocked(cleanupSoftDeletedRecords).mockResolvedValue({ count: 0, items: [] });

      const request = new NextRequest(new URL('http://localhost:3000/api/admin/cleanup'));

      const startTime = Date.now();
      await GET(request);
      const endTime = Date.now();

      expect(findOrphanedCustomerNotes).toHaveBeenCalled();
      expect(purgeStaleWaitlistEntries).toHaveBeenCalled();
      expect(findOrdersWithoutProductRef).toHaveBeenCalled();
      expect(cleanupSoftDeletedRecords).toHaveBeenCalled();

      // If called in parallel, all should be called by the time we reach here
      expect(findOrphanedCustomerNotes).toHaveBeenCalledTimes(1);
      expect(purgeStaleWaitlistEntries).toHaveBeenCalledTimes(1);
      expect(findOrdersWithoutProductRef).toHaveBeenCalledTimes(1);
      // cleanupSoftDeletedRecords is called twice: once for products, once for orders
      expect(cleanupSoftDeletedRecords).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST handler', () => {
    it('returns 405 regardless of auth', async () => {
      const { requireAdmin } = await import('@/lib/admin-auth');

      vi.mocked(requireAdmin).mockResolvedValue([
        {
          authenticated: true,
          uid: 'admin-1',
          email: 'admin@test.com',
          role: 'super_admin',
          decodedToken: {},
        },
        null,
      ]);

      const request = new NextRequest(new URL('http://localhost:3000/api/admin/cleanup'), {
        method: 'POST',
      });

      const response = await POST(request);

      expect(response.status).toBe(405);
    });
  });
});
