'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from '@/lib/types';
import { safeParseOrder } from '@/lib/schemas';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/constants';

const ORDERS_PAGE_SIZE = 100;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Fetch orders with real-time updates
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const q = query(
      collection(db, 'orders'),
      orderBy('created_at', 'desc'),
      limit(ORDERS_PAGE_SIZE)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = [];
      snapshot.forEach((docSnap) => {
        const parsed = safeParseOrder({ id: docSnap.id, ...docSnap.data() });
        // Filter out soft-deleted orders and unparseable docs
        if (parsed && parsed.is_deleted !== true) {
          ordersData.push(parsed as Order);
        }
      });
      setOrders(ordersData);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === ORDERS_PAGE_SIZE);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter orders based on search and status
  useEffect(() => {
    let filtered = orders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  // Handle status update via API route
  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToastError(data.error || 'Failed to update status');
        setUpdating(false);
        return;
      }

      // onSnapshot will pick up the change automatically
      setUpdating(false);
    } catch (error) {
      console.error('Error updating order:', error);
      setToastError('Failed to update order status');
      setUpdating(false);
    }
  };

  // Handle bulk delete via server API (soft delete — sets is_deleted flag, preserves data)
  const handleBulkDelete = async () => {
    if (!window.confirm(`Archive ${selectedOrders.size} orders? They will be hidden but preserved for records.`)) return;

    setUpdating(true);
    try {
      const orderIds = Array.from(selectedOrders);

      const res = await fetch('/api/admin/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToastError(data.error || 'Failed to archive orders');
        setUpdating(false);
        return;
      }

      // onSnapshot will pick up the changes automatically
      setSelectedOrders(new Set());
      setUpdating(false);
    } catch (error) {
      console.error('Error archiving orders:', error);
      setToastError('Failed to archive orders');
      setUpdating(false);
    }
  };

  // Load more orders with cursor pagination
  const loadMoreOrders = async () => {
    if (!lastDoc || !hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'orders'),
        orderBy('created_at', 'desc'),
        startAfter(lastDoc),
        limit(ORDERS_PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      const newOrdersData: Order[] = [];
      snapshot.forEach((docSnap) => {
        const parsed = safeParseOrder({ id: docSnap.id, ...docSnap.data() });
        if (parsed) newOrdersData.push(parsed as Order);
      });

      setOrders((prev) => [...prev, ...newOrdersData]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || lastDoc);
      setHasMore(snapshot.docs.length === ORDERS_PAGE_SIZE);
      setLoadingMore(false);
    } catch (error) {
      console.error('Error loading more orders:', error);
      setLoadingMore(false);
    }
  };

  // Toggle order selection
  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  // Toggle all selection
  const toggleAllSelection = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  // Get stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  // Get status badge color
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'processing':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'shipped':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
      case 'delivered':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Toast Error */}
      {toastError && (
        <div className="fixed top-4 right-4 z-[80] bg-red-500/15 border border-red-500/30 backdrop-blur-xl px-5 py-3 rounded-xl flex items-center gap-3 animate-scale-in">
          <p className="text-sm text-red-300">{toastError}</p>
          <button onClick={() => setToastError(null)} className="text-red-300/60 hover:text-red-300 text-xs">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/[0.08] px-6 py-8">
        <h1 className="font-bebas text-4xl tracking-wider">Orders</h1>
        <p className="text-white/60 mt-2">Manage and track all orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 px-6 py-6">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-white/60 text-sm">Total Orders</div>
          <div className="font-bebas text-3xl mt-2">{stats.total}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-amber-300 text-sm">Pending</div>
          <div className="font-bebas text-3xl mt-2">{stats.pending}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-blue-300 text-sm">Processing</div>
          <div className="font-bebas text-3xl mt-2">{stats.processing}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-purple-300 text-sm">Shipped</div>
          <div className="font-bebas text-3xl mt-2">{stats.shipped}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-emerald-300 text-sm">Delivered</div>
          <div className="font-bebas text-3xl mt-2">{stats.delivered}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-red-300 text-sm">Cancelled</div>
          <div className="font-bebas text-3xl mt-2">{stats.cancelled}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-6 border-b border-white/[0.08]">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by email or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="input-premium"
            >
              <option value="all">All Status</option>
              {ORDER_STATUSES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {selectedOrders.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={updating}
              className="btn-premium bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30"
            >
              Delete ({selectedOrders.size})
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="px-6 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border border-white/20 border-t-white"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-white/60">No orders found</div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
              <table className="w-full">
                <thead className="bg-white/[0.03] border-b border-white/[0.08]">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                        onChange={toggleAllSelection}
                        className="w-4 h-4 rounded"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Order ID</th>
                    <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Customer</th>
                    <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Total</th>
                    <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Status</th>
                    <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Date</th>
                    <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-white/[0.08] hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="w-4 h-4 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">{order.id.substring(0, 8)}</td>
                      <td className="px-6 py-4 text-sm">{order.customer_email}</td>
                      <td className="px-6 py-4 text-sm">${order.total_amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs border ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/60">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => setSelectedOrderId(order.id)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="mt-6 flex justify-between items-center">
              <div className="text-white/60 text-sm">
                Showing {filteredOrders.length} of {orders.length} orders
              </div>
              {hasMore && (statusFilter === 'all') && !searchTerm && (
                <button
                  onClick={loadMoreOrders}
                  disabled={loadingMore}
                  className="btn-premium"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="modal-panel max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="font-bebas text-2xl">Order Details</h2>
              <button
                onClick={() => setSelectedOrderId(null)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Customer Info */}
            <div className="mb-6">
              <h3 className="font-bebas text-lg mb-3">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                <div>
                  <div className="text-white/60 text-sm">Email</div>
                  <div className="text-white">{selectedOrder.customer_email}</div>
                </div>
                <div>
                  <div className="text-white/60 text-sm">Phone</div>
                  <div className="text-white">{selectedOrder.customer_phone || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="mb-6">
              <h3 className="font-bebas text-lg mb-3">Shipping Address</h3>
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 text-sm">
                <div className="text-white">
                  {selectedOrder.shipping_address?.street || 'N/A'}<br />
                  {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state}{' '}
                  {selectedOrder.shipping_address?.zip || ''}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-6">
              <h3 className="font-bebas text-lg mb-3">Items</h3>
              <div className="space-y-2">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm bg-white/[0.02] border border-white/[0.08] rounded-lg p-3">
                    <div>
                      <div className="text-white">{item.product_name}</div>
                      <div className="text-white/60">x{item.quantity}</div>
                    </div>
                    <div className="text-white">${item.price.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Subtotal</span>
                  <span>${(selectedOrder.total_amount - (selectedOrder.shipping_cost || 0)).toFixed(2)}</span>
              </div>
              {selectedOrder.shipping_cost && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Shipping</span>
                  <span>${selectedOrder.shipping_cost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bebas text-lg border-t border-white/[0.08] pt-2">
                <span>Total</span>
                <span>${selectedOrder.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Status Update */}
            <div className="mb-6">
              <label className="text-white/60 text-sm">Update Status</label>
              <select
                defaultValue={selectedOrder.status}
                onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value as OrderStatus)}
                disabled={updating}
                className="input-premium mt-2"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button
              onClick={() => setSelectedOrderId(null)}
              className="btn-premium w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
