'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/lib/types';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  items: Array<{
    category: string;
    product_name: string;
  }>;
}

type DateRange = 'all' | '7days' | '30days' | '90days' | 'custom';

interface CustomDateRange {
  start: string;
  end: string;
}

const filterOrdersByDateRange = (
  orders: Order[],
  range: DateRange,
  customDates?: CustomDateRange
): Order[] => {
  if (range === 'all') return orders;

  const now = new Date();
  let startDate = new Date();

  switch (range) {
    case '7days':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30days':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90days':
      startDate.setDate(now.getDate() - 90);
      break;
    case 'custom':
      if (customDates) {
        startDate = new Date(customDates.start);
      }
      break;
  }

  return orders.filter((order) => {
    const orderDate = new Date(order.created_at);

    if (range === 'custom' && customDates) {
      const endDate = new Date(customDates.end);
      endDate.setHours(23, 59, 59, 999);
      return orderDate >= startDate && orderDate <= endDate;
    }

    return orderDate >= startDate;
  });
};

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customDates, setCustomDates] = useState<CustomDateRange>({
    start: '',
    end: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const ordersData = ordersSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Order
        );
        setOrders(ordersData);

        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData = productsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Product
        );
        setProducts(productsData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredOrders = filterOrdersByDateRange(orders, dateRange, customDates);

  const revenue = filteredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const impactFund = revenue * 0.1;
  const avgOrderValue = filteredOrders.length > 0 ? revenue / filteredOrders.length : 0;

  const salesByCategory: Record<string, number> = {};
  filteredOrders.forEach((order) => {
    order.items?.forEach((item) => {
      if (item.category) {
        salesByCategory[item.category] = (salesByCategory[item.category] || 0) + 1;
      }
    });
  });

  const orderStatusBreakdown: Record<string, number> = {};
  filteredOrders.forEach((order) => {
    const status = order.status || 'unknown';
    orderStatusBreakdown[status] = (orderStatusBreakdown[status] || 0) + 1;
  });

  // Build color variant data from products using the correct schema (colors, not variants)
  const colorVariants = products
    .flatMap((product) =>
      (product.colors || []).map((color) => ({
        productName: product.title,
        productCategory: product.category,
        color: color.name,
        hex: color.hex,
        sizes: color.stock || {},
      }))
    )
    .slice(0, 20);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/30 text-sm tracking-wider">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-bebas tracking-wider">Analytics</h2>
          <p className="text-white/25 text-sm mt-1">Revenue & performance insights</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-bebas tracking-wider mb-4">Date Range</h3>
        <div className="flex gap-3 flex-wrap">
          {(['all', '7days', '30days', '90days', 'custom'] as const).map(
            (range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2.5 rounded-xl text-sm tracking-wider uppercase transition-all duration-200 ${
                  dateRange === range
                    ? 'bg-white text-black font-medium'
                    : 'bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/60 hover:bg-white/[0.06]'
                }`}
              >
                {range === 'all'
                  ? 'All Time'
                  : range === '7days'
                    ? 'Last 7 Days'
                    : range === '30days'
                      ? 'Last 30 Days'
                      : range === '90days'
                        ? 'Last 90 Days'
                        : 'Custom'}
              </button>
            )
          )}
        </div>

        {dateRange === 'custom' && (
          <div className="mt-4 flex gap-4">
            <input
              type="date"
              value={customDates.start}
              onChange={(e) =>
                setCustomDates({ ...customDates, start: e.target.value })
              }
              className="input-premium"
            />
            <input
              type="date"
              value={customDates.end}
              onChange={(e) =>
                setCustomDates({ ...customDates, end: e.target.value })
              }
              className="input-premium"
            />
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="card-premium p-6 bg-gradient-to-br from-emerald-500/[0.08] to-emerald-500/[0.02] border border-emerald-500/[0.15] rounded-2xl">
          <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">Total Revenue</p>
          <p className="text-3xl font-bebas text-emerald-400">${revenue.toFixed(2)}</p>
        </div>
        <div className="card-premium p-6 bg-gradient-to-br from-blue-500/[0.08] to-blue-500/[0.02] border border-blue-500/[0.15] rounded-2xl">
          <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">Total Orders</p>
          <p className="text-3xl font-bebas text-blue-400">{filteredOrders.length}</p>
        </div>
        <div className="card-premium p-6 bg-gradient-to-br from-amber-500/[0.08] to-amber-500/[0.02] border border-amber-500/[0.15] rounded-2xl">
          <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">Avg Order Value</p>
          <p className="text-3xl font-bebas text-amber-400">${avgOrderValue.toFixed(2)}</p>
        </div>
        <div className="card-premium p-6 bg-gradient-to-br from-[var(--accent)]/[0.08] to-[var(--accent)]/[0.02] border border-[var(--accent)]/[0.15] rounded-2xl">
          <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">Impact Fund (10%)</p>
          <p className="text-3xl font-bebas text-[var(--accent)]">${impactFund.toFixed(2)}</p>
        </div>
      </div>

      {/* Sales by Category */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-bebas tracking-wider mb-6">Sales by Category</h3>
        {Object.keys(salesByCategory).length === 0 ? (
          <p className="text-white/25 text-sm text-center py-6">No category data available</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(salesByCategory).map(([category, count]) => {
              const percentage =
                filteredOrders.length > 0
                  ? (count / filteredOrders.length) * 100
                  : 0;
              return (
                <div key={category}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-white/70">{category}</span>
                    <span className="text-sm text-white/40">{count} sales</span>
                  </div>
                  <div className="w-full bg-white/[0.06] h-1.5 rounded-full">
                    <div
                      className="bg-gradient-to-r from-white to-white/50 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-bebas tracking-wider mb-6">Order Status Breakdown</h3>
        {Object.keys(orderStatusBreakdown).length === 0 ? (
          <p className="text-white/25 text-sm text-center py-6">No orders yet</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(orderStatusBreakdown).map(([status, count]) => (
              <div
                key={status}
                className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4"
              >
                <p className="text-white/40 text-xs capitalize mb-2">{status}</p>
                <p className="text-2xl font-bebas">{count}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Products & Color Variants */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-lg font-bebas tracking-wider mb-6">
          Products & Color Variants
        </h3>
        {colorVariants.length === 0 ? (
          <p className="text-white/25 text-sm text-center py-6">No color variants found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/[0.08]">
                <tr>
                  <th className="text-left py-3 px-4 text-white/40 text-xs uppercase tracking-wider">Product</th>
                  <th className="text-left py-3 px-4 text-white/40 text-xs uppercase tracking-wider">Category</th>
                  <th className="text-left py-3 px-4 text-white/40 text-xs uppercase tracking-wider">Color</th>
                  <th className="text-left py-3 px-4 text-white/40 text-xs uppercase tracking-wider">Stock by Size</th>
                </tr>
              </thead>
              <tbody>
                {colorVariants.map((variant, idx) => (
                  <tr key={idx} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-sm">{variant.productName}</td>
                    <td className="py-3 px-4 text-sm text-white/60">{variant.productCategory}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: variant.hex || '#888' }}
                        />
                        <span className="text-sm">{variant.color}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-white/50">
                      {Object.entries(variant.sizes as Record<string, number>)
                        .filter(([, qty]) => qty > 0)
                        .map(([size, qty]) => `${size}: ${qty}`)
                        .join(', ') || 'No stock'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
