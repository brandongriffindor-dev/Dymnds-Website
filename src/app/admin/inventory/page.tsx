'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface InventoryLog {
  id: string;
  product_id: string;
  product_name: string;
  size: string;
  color: string;
  old_stock: number;
  new_stock: number;
  change: number;
  reason: string;
  user: string;
  created_at: string;
}

const LOGS_PAGE_SIZE = 100;

export default function InventoryPage() {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logsSnapshot = await getDocs(
          query(
            collection(db, 'inventory_logs'),
            orderBy('created_at', 'desc'),
            limit(LOGS_PAGE_SIZE)
          )
        );
        const logsData = logsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as InventoryLog
        );

        setLogs(logsData);

        // Set last document for pagination
        if (logsSnapshot.docs.length > 0) {
          setLastDoc(logsSnapshot.docs[logsSnapshot.docs.length - 1]);
        }

        // Determine if there are more results
        setHasMore(logsSnapshot.docs.length === LOGS_PAGE_SIZE);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching inventory logs:', error);
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const getChangeColor = (change: number): string => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-white';
  };

  const formatDate = (date: string): string => {
    const dateObj = new Date(date);
    return dateObj.toLocaleString();
  };

  const loadMoreLogs = async () => {
    if (!lastDoc || loadingMore) return;

    setLoadingMore(true);
    try {
      const logsSnapshot = await getDocs(
        query(
          collection(db, 'inventory_logs'),
          orderBy('created_at', 'desc'),
          startAfter(lastDoc),
          limit(LOGS_PAGE_SIZE)
        )
      );

      const logsData = logsSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as InventoryLog
      );

      setLogs((prevLogs) => [...prevLogs, ...logsData]);

      // Update last document for next pagination
      if (logsSnapshot.docs.length > 0) {
        setLastDoc(logsSnapshot.docs[logsSnapshot.docs.length - 1]);
      }

      // Update hasMore flag
      setHasMore(logsSnapshot.docs.length === LOGS_PAGE_SIZE);
    } catch (error) {
      console.error('Error loading more logs:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading inventory logs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bebas text-white mb-8">Inventory Audit Trail</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <p className="text-white/[0.6] text-sm mb-2">Total Changes</p>
            <p className="text-4xl font-bebas text-white">{logs.length}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <p className="text-white/[0.6] text-sm mb-2">Total Restocks</p>
            <p className="text-4xl font-bebas text-white">{logs.filter((log) => log.change > 0).length}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <p className="text-white/[0.6] text-sm mb-2">Total Sold/Removed</p>
            <p className="text-4xl font-bebas text-white">{logs.filter((log) => log.change < 0).length}</p>
          </div>
        </div>

        {/* Inventory Logs Table */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
          <h2 className="text-2xl font-bebas text-white mb-6">Change History</h2>

          {logs.length === 0 ? (
            <p className="text-white/[0.6] text-center py-8">No inventory changes yet.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-white text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-left py-3 px-4 text-white/[0.6]">Date</th>
                      <th className="text-left py-3 px-4 text-white/[0.6]">Product</th>
                      <th className="text-left py-3 px-4 text-white/[0.6]">Size</th>
                      <th className="text-center py-3 px-4 text-white/[0.6]">Old Stock</th>
                      <th className="text-center py-3 px-4 text-white/[0.6]">New Stock</th>
                      <th className="text-center py-3 px-4 text-white/[0.6]">Change</th>
                      <th className="text-left py-3 px-4 text-white/[0.6]">Reason</th>
                      <th className="text-left py-3 px-4 text-white/[0.6]">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-white/[0.08] hover:bg-white/[0.02]">
                        <td className="py-4 px-4 text-white/[0.7]">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-white">{log.product_name}</p>
                            <p className="text-white/[0.5] text-xs flex items-center gap-1">
                              {log.color && (
                                <>
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: log.color }}
                                  />
                                </>
                              )}
                              {log.color}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">{log.size}</td>
                        <td className="py-4 px-4 text-center">{log.old_stock}</td>
                        <td className="py-4 px-4 text-center">{log.new_stock}</td>
                        <td className={`py-4 px-4 text-center font-medium ${getChangeColor(log.change)}`}>
                          {log.change > 0 ? '+' : ''}{log.change}
                        </td>
                        <td className="py-4 px-4 text-white/[0.7]">{log.reason}</td>
                        <td className="py-4 px-4 text-white/[0.6]">{log.user}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination info and load more button */}
              <div className="mt-6 flex flex-col items-center gap-4">
                <p className="text-white/[0.6] text-sm">Showing {logs.length} logs</p>
                {hasMore && (
                  <button
                    onClick={loadMoreLogs}
                    disabled={loadingMore}
                    className="px-6 py-2 bg-white/[0.08] border border-white/[0.2] rounded-lg text-white hover:bg-white/[0.12] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
