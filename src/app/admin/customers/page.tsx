'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db, getAuthClient } from '@/lib/firebase';
import type { Order } from '@/lib/firebase';
import { logAdminAction } from '@/lib/audit-log';

interface Customer {
  email: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate?: string;
  created_at?: string;
  notes?: string;
}

interface CustomerWithStats extends Customer {
  isVIP: boolean;
  avgOrderValue: number;
  lastOrderDaysAgo?: number;
}

const ORDERS_PAGE_SIZE = 200;

function buildCustomerStats(ordersData: (Order & { id: string })[]): CustomerWithStats[] {
  const customerMap = new Map<string, Customer>();

  ordersData.forEach((order) => {
    const email = order.customer_email;
    if (!customerMap.has(email)) {
      customerMap.set(email, {
        email,
        totalSpent: 0,
        orderCount: 0,
        lastOrderDate: order.created_at,
        notes: '',
      });
    }
    const customer = customerMap.get(email)!;
    customer.totalSpent += order.total_amount;
    customer.orderCount += 1;
    // Since orders are desc, only set lastOrderDate if not already set (first occurrence = most recent)
    if (!customer.lastOrderDate) {
      customer.lastOrderDate = order.created_at;
    }
  });

  return Array.from(customerMap.values()).map((customer) => {
    const lastOrderDate = customer.lastOrderDate ? new Date(customer.lastOrderDate) : null;
    const now = new Date();
    const daysDiff = lastOrderDate ? Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined;

    return {
      ...customer,
      isVIP: customer.totalSpent > 500,
      avgOrderValue: customer.orderCount > 0 ? customer.totalSpent / customer.orderCount : 0,
      lastOrderDaysAgo: daysDiff,
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);
}

export default function CustomersPage() {
  const getAdminEmail = () => {
    const auth = getAuthClient();
    return auth?.currentUser?.email || 'unknown';
  };

  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithStats[]>([]);
  const [orders, setOrders] = useState<(Order & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Initial fetch — limited batch of orders
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'orders'),
      orderBy('created_at', 'desc'),
      limit(ORDERS_PAGE_SIZE)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: (Order & { id: string })[] = [];
      snapshot.forEach((d) => {
        ordersData.push({ ...(d.data() as Order), id: d.id });
      });

      // Track last doc for pagination
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMore(snapshot.docs.length >= ORDERS_PAGE_SIZE);

      setOrders(ordersData);
      setCustomers(buildCustomerStats(ordersData));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load more orders
  const loadMoreOrders = async () => {
    if (!lastDoc || loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const q = query(
        collection(db, 'orders'),
        orderBy('created_at', 'desc'),
        startAfter(lastDoc),
        limit(ORDERS_PAGE_SIZE)
      );
      const snapshot = await getDocs(q);
      const newOrders: (Order & { id: string })[] = [];
      snapshot.forEach((d) => {
        newOrders.push({ ...(d.data() as Order), id: d.id });
      });

      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMore(snapshot.docs.length >= ORDERS_PAGE_SIZE);

      const allOrders = [...orders, ...newOrders];
      setOrders(allOrders);
      setCustomers(buildCustomerStats(allOrders));
    } catch (error) {
      console.error('Error loading more orders:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Filter customers based on search
  useEffect(() => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter((customer) =>
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm]);

  // Get stats
  const stats = {
    totalCustomers: customers.length,
    vipCustomers: customers.filter((c) => c.isVIP).length,
    activeThisMonth: customers.filter((c) => c.lastOrderDaysAgo && c.lastOrderDaysAgo <= 30).length,
    avgOrderValue: customers.length > 0
      ? (customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length).toFixed(2)
      : '0',
  };

  // Fetch customer notes
  const fetchCustomerNotes = async (email: string) => {
    try {
      const notesDoc = await getDocs(collection(db, 'customer_notes'));
      const note = notesDoc.docs.find((doc) => doc.id === email);
      if (note) {
        setNotesInput(note.data().notes || '');
      } else {
        setNotesInput('');
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  // Save customer notes
  const handleSaveNotes = async () => {
    if (!selectedCustomerEmail) return;

    setSavingNotes(true);
    try {
      await setDoc(
        doc(db, 'customer_notes', selectedCustomerEmail),
        { notes: notesInput, updated_at: new Date().toISOString() },
        { merge: true }
      );
      logAdminAction('customer_note_saved', {
        customerEmail: selectedCustomerEmail
      }, getAdminEmail());
      setSavingNotes(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      setSavingNotes(false);
    }
  };

  // Handle customer selection
  const handleSelectCustomer = (email: string) => {
    setSelectedCustomerEmail(email);
    fetchCustomerNotes(email);
  };

  // Get customer orders
  const getCustomerOrders = (email: string) => {
    return orders.filter((order) => order.customer_email === email);
  };

  const selectedCustomer = customers.find((c) => c.email === selectedCustomerEmail);
  const selectedCustomerOrders = selectedCustomerEmail ? getCustomerOrders(selectedCustomerEmail) : [];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/[0.08] px-6 py-8">
        <h1 className="font-bebas text-4xl tracking-wider">Customers</h1>
        <p className="text-white/60 mt-2">Manage and analyze customer relationships</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-6">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-white/60 text-sm">Total Customers</div>
          <div className="font-bebas text-3xl mt-2">{stats.totalCustomers}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-purple-300 text-sm">VIP Customers</div>
          <div className="font-bebas text-3xl mt-2">{stats.vipCustomers}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-emerald-300 text-sm">Active This Month</div>
          <div className="font-bebas text-3xl mt-2">{stats.activeThisMonth}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-blue-300 text-sm">Avg Order Value</div>
          <div className="font-bebas text-3xl mt-2">${stats.avgOrderValue}</div>
        </div>
      </div>

      {/* Search Control */}
      <div className="px-6 py-6 border-b border-white/[0.08]">
        <input
          type="text"
          placeholder="Search customers by email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-premium max-w-sm"
        />
      </div>

      {/* Customers Table */}
      <div className="px-6 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border border-white/20 border-t-white"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-white/60">No customers found</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
            <table className="w-full">
              <thead className="bg-white/[0.03] border-b border-white/[0.08]">
                <tr>
                  <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Email</th>
                  <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Orders</th>
                  <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Total Spent</th>
                  <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Avg Order</th>
                  <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Status</th>
                  <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Last Order</th>
                  <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.email} className="border-b border-white/[0.08] hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-sm">{customer.email}</td>
                    <td className="px-6 py-4 text-sm">{customer.orderCount}</td>
                    <td className="px-6 py-4 text-sm font-semibold">${customer.totalSpent.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">${customer.avgOrderValue.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {customer.isVIP && (
                        <span className="inline-block px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/50">
                          VIP
                        </span>
                      )}
                      {customer.lastOrderDaysAgo && customer.lastOrderDaysAgo <= 30 && (
                        <span className="inline-block px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 ml-2">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">
                      {customer.lastOrderDate
                        ? new Date(customer.lastOrderDate).toLocaleDateString()
                        : 'N/A'}
                      {customer.lastOrderDaysAgo && (
                        <div className="text-xs text-white/40">{customer.lastOrderDaysAgo} days ago</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleSelectCustomer(customer.email)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        View 360°
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More + Order Count */}
        {!loading && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-white/40 text-xs">
              Showing {orders.length} orders across {customers.length} customers
              {hasMore && ' (more available)'}
            </p>
            {hasMore && (
              <button
                onClick={loadMoreOrders}
                disabled={loadingMore}
                className="text-xs tracking-[0.2em] uppercase text-white/50 hover:text-white border border-white/20 px-4 py-2 rounded transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More Orders'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Customer 360° Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="modal-panel max-w-3xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="font-bebas text-2xl">Customer 360°</h2>
                <p className="text-white/60 text-sm mt-1">{selectedCustomer.email}</p>
              </div>
              <button
                onClick={() => setSelectedCustomerEmail(null)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Customer Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-3">
                <div className="text-white/60 text-xs">Orders</div>
                <div className="font-bebas text-2xl">{selectedCustomer.orderCount}</div>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-3">
                <div className="text-white/60 text-xs">Total Spent</div>
                <div className="font-bebas text-2xl">${selectedCustomer.totalSpent.toFixed(2)}</div>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-3">
                <div className="text-white/60 text-xs">Avg Order</div>
                <div className="font-bebas text-2xl">${selectedCustomer.avgOrderValue.toFixed(2)}</div>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-3">
                <div className="text-white/60 text-xs">Status</div>
                <div className="font-bebas text-sm mt-1">
                  {selectedCustomer.isVIP ? (
                    <span className="text-purple-300">VIP</span>
                  ) : (
                    <span className="text-white/60">Regular</span>
                  )}
                </div>
              </div>
            </div>

            {/* CRM Notes */}
            <div className="mb-6">
              <label className="text-white/60 text-sm block mb-2">CRM Notes</label>
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Add internal notes about this customer..."
                className="input-premium min-h-24 resize-none"
              />
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="btn-premium mt-2"
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>

            {/* Timeline */}
            <div className="mb-6">
              <h3 className="font-bebas text-lg mb-3">Order Timeline</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedCustomerOrders.length === 0 ? (
                  <div className="text-white/60 text-sm">No orders</div>
                ) : (
                  selectedCustomerOrders.map((order, idx) => (
                    <div key={idx} className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-3 flex justify-between items-start">
                      <div className="text-sm">
                        <div className="text-white font-medium">Order #{order.id.substring(0, 8)}</div>
                        <div className="text-white/60 text-xs mt-1">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">${order.total_amount.toFixed(2)}</div>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${
                          order.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                          order.status === 'processing' ? 'bg-blue-500/20 text-blue-300' :
                          order.status === 'shipped' ? 'bg-purple-500/20 text-purple-300' :
                          order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedCustomerEmail(null)}
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
