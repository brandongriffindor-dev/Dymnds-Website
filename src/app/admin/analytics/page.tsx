'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Order {
  id: string;
  created_at: string;
  total: number;
  status: string;
  items: Array<{
    category: string;
    name: string;
  }>;
}

interface Product {
  id: string;
  name: string;
  category: string;
  variants?: Array<{
    color: string;
    sizes?: Record<string, number>;
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

  const revenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
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

  const colorVariants = products
    .flatMap((product) =>
      (product.variants || []).map((variant) => ({
        productName: product.name,
        productCategory: product.category,
        color: variant.color,
        sizes: variant.sizes || {},
      }))
    )
    .slice(0, 20);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bebas text-white mb-8">Analytics</h1>

        {/* Date Range Filter */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bebas text-white mb-4">Date Range</h2>
          <div className="flex gap-3 flex-wrap">
            {(['all', '7days', '30days', '90days', 'custom'] as const).map(
              (range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-xl font-medium transition ${
                    dateRange === range
                      ? 'bg-white text-black'
                      : 'bg-white/[0.08] text-white hover:bg-white/[0.12]'
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
                className="input-premium bg-white/[0.05] border border-white/[0.08] text-white"
              />
              <input
                type="date"
                value={customDates.end}
                onChange={(e) =>
                  setCustomDates({ ...customDates, end: e.target.value })
                }
                className="input-premium bg-white/[0.05] border border-white/[0.08] text-white"
              />
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <p className="text-white/[0.6] text-sm mb-2">Total Revenue</p>
            <p className="text-3xl font-bebas text-white">${revenue.toFixed(2)}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <p className="text-white/[0.6] text-sm mb-2">Total Orders</p>
            <p className="text-3xl font-bebas text-white">{filteredOrders.length}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <p className="text-white/[0.6] text-sm mb-2">Avg Order Value</p>
            <p className="text-3xl font-bebas text-white">
              ${avgOrderValue.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <p className="text-white/[0.6] text-sm mb-2">Impact Fund (10%)</p>
            <p className="text-3xl font-bebas text-white">${impactFund.toFixed(2)}</p>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bebas text-white mb-6">Sales by Category</h2>
          <div className="space-y-4">
            {Object.entries(salesByCategory).map(([category, count]) => {
              const percentage =
                filteredOrders.length > 0
                  ? (count / filteredOrders.length) * 100
                  : 0;
              return (
                <div key={category}>
                  <div className="flex justify-between mb-2">
                    <span className="text-white">{category}</span>
                    <span className="text-white/[0.6]">{count} sales</span>
                  </div>
                  <div className="w-full bg-white/[0.05] rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-white to-white/[0.5] h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bebas text-white mb-6">Order Status Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(orderStatusBreakdown).map(([status, count]) => (
              <div
                key={status}
                className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-4"
              >
                <p className="text-white/[0.6] text-sm capitalize mb-2">{status}</p>
                <p className="text-2xl font-bebas text-white">{count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Products & Color Variants */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
          <h2 className="text-2xl font-bebas text-white mb-6">
            Products & Color Variants
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-3 px-4 text-white/[0.6]">Product</th>
                  <th className="text-left py-3 px-4 text-white/[0.6]">Category</th>
                  <th className="text-left py-3 px-4 text-white/[0.6]">Color</th>
                  <th className="text-left py-3 px-4 text-white/[0.6]">Sizes</th>
                </tr>
              </thead>
              <tbody>
                {colorVariants.map((variant, idx) => (
                  <tr key={idx} className="border-b border-white/[0.08] hover:bg-white/[0.02]">
                    <td className="py-3 px-4">{variant.productName}</td>
                    <td className="py-3 px-4">{variant.productCategory}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-white/[0.2]"
                          style={{ backgroundColor: variant.color }}
                        />
                        {variant.color}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white/[0.6]">
                      {Object.keys(variant.sizes).join(', ') || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
