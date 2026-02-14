'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Product, Order, DashboardStats } from '@/lib/firebase';
import AnimatedCounter from '@/components/AnimatedCounter';

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalImpact: 0, waitlistCount: 0, totalRevenue: 0, totalOrders: 0 });
  const [messagesTotal, setMessagesTotal] = useState(0);
  const [messagesUnread, setMessagesUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsSnap, ordersSnap, waitlistSnap, messagesSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(query(collection(db, 'orders'), orderBy('created_at', 'desc'))),
          getDocs(query(collection(db, 'app_waitlist'), orderBy('signed_up_at', 'desc'))),
          getDocs(collection(db, 'contact_messages')),
        ]);

        const productsData = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        const ordersData = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        const waitlistData = waitlistSnap.docs.map(d => ({ email: d.id, ...d.data() }));

        setProducts(productsData);
        setOrders(ordersData);

        // Messages stats
        setMessagesTotal(messagesSnap.docs.length);
        setMessagesUnread(messagesSnap.docs.filter(d => d.data().read !== true).length);

        const totalRevenue = ordersData.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        setStats({
          totalImpact: totalRevenue * 0.10,
          waitlistCount: waitlistData.length,
          totalRevenue,
          totalOrders: ordersData.length,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/30 text-sm tracking-wider">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate low stock
  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  let lowStockCount = 0;
  let hasCritical = false;
  products.forEach(p => {
    const colors = p.colors || [];
    if (colors.length > 0) {
      colors.forEach((color) => {
        sizes.forEach(size => {
          const stock = (color.stock as Record<string, number>)?.[size] || 0;
          if (stock < 5) lowStockCount++;
          if (stock === 0) hasCritical = true;
        });
      });
    } else {
      sizes.forEach(size => {
        const stock = (p.stock as Record<string, number>)?.[size] || 0;
        if (stock < 5) lowStockCount++;
        if (stock === 0) hasCritical = true;
      });
    }
  });

  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-bebas tracking-wider">CEO Overview</h2>
          <p className="text-white/25 text-sm mt-1">Real-time business intelligence</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Impact Fund */}
        <div className="card-premium p-6 bg-gradient-to-br from-emerald-500/[0.08] to-emerald-500/[0.02] border border-emerald-500/[0.15] rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/[0.12] flex items-center justify-center">
              <span className="text-emerald-400">◆</span>
            </div>
            <span className="text-white/30 text-[10px] uppercase tracking-widest">Impact Fund</span>
          </div>
          <p className="text-3xl font-bebas text-emerald-400">
            $<AnimatedCounter end={parseFloat(stats.totalImpact.toFixed(2))} duration={1200} />
          </p>
          <p className="text-white/25 text-sm mt-2">10% of all revenue</p>
        </div>

        {/* Waitlist */}
        <div className="card-premium p-6 bg-gradient-to-br from-blue-500/[0.08] to-blue-500/[0.02] border border-blue-500/[0.15] rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/[0.12] flex items-center justify-center">
              <span className="text-blue-400">◎</span>
            </div>
            <span className="text-white/30 text-[10px] uppercase tracking-widest">App Waitlist</span>
          </div>
          <p className="text-3xl font-bebas text-blue-400">
            <AnimatedCounter end={stats.waitlistCount} duration={1200} />
          </p>
          <p className="text-white/25 text-sm mt-2">Downloads waiting</p>
        </div>

        {/* Revenue */}
        <div className="card-premium p-6 bg-gradient-to-br from-amber-500/[0.08] to-amber-500/[0.02] border border-amber-500/[0.15] rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/[0.12] flex items-center justify-center">
              <span className="text-amber-400">▣</span>
            </div>
            <span className="text-white/30 text-[10px] uppercase tracking-widest">Revenue</span>
          </div>
          <p className="text-3xl font-bebas text-amber-400">
            $<AnimatedCounter end={parseFloat(stats.totalRevenue.toFixed(2))} duration={1200} />
          </p>
          <p className="text-white/25 text-sm mt-2">{stats.totalOrders} orders</p>
        </div>

        {/* Low Stock */}
        {lowStockCount > 0 && (
          <Link href="/admin/alerts" className="card-premium p-6 bg-gradient-to-br from-red-500/[0.08] to-red-500/[0.02] border border-red-500/[0.15] rounded-2xl hover:border-red-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/[0.12] flex items-center justify-center">
                <span className="text-red-400">⚠</span>
              </div>
              <span className="text-white/30 text-[10px] uppercase tracking-widest">Low Stock</span>
            </div>
            <p className="text-3xl font-bebas text-red-400">
              <AnimatedCounter end={lowStockCount} duration={1200} />
            </p>
            <p className="text-white/25 text-sm mt-2">
              {hasCritical ? 'Some items out of stock' : 'Items need restocking'}
            </p>
          </Link>
        )}

        {/* Messages */}
        <Link href="/admin/messages" className={`card-premium p-6 bg-gradient-to-br ${messagesUnread > 0 ? 'from-violet-500/[0.08] to-violet-500/[0.02] border-violet-500/[0.15]' : 'from-white/[0.04] to-white/[0.01] border-white/[0.08]'} border rounded-2xl hover:border-violet-500/30 transition-colors`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${messagesUnread > 0 ? 'bg-violet-500/[0.12]' : 'bg-white/[0.06]'}`}>
              <span className={messagesUnread > 0 ? 'text-violet-400' : 'text-white/40'}>✉</span>
            </div>
            <span className="text-white/30 text-[10px] uppercase tracking-widest">Messages</span>
          </div>
          <p className={`text-3xl font-bebas ${messagesUnread > 0 ? 'text-violet-400' : 'text-white/40'}`}>
            <AnimatedCounter end={messagesTotal} duration={1200} />
          </p>
          <p className="text-white/25 text-sm mt-2">
            {messagesUnread > 0 ? `${messagesUnread} unread` : 'All read'}
          </p>
        </Link>
      </div>

      {/* Quick Actions + Recent Orders */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h3 className="text-lg font-bebas tracking-wider mb-5">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/products" className="btn-premium p-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-center hover:bg-white/[0.06] transition-colors">
              <span className="text-xl block mb-2">▦</span>
              <span className="text-xs tracking-wider uppercase text-white/50">Products</span>
            </Link>
            <Link href="/admin/orders" className="btn-premium p-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-center hover:bg-white/[0.06] transition-colors">
              <span className="text-xl block mb-2">⬡</span>
              <span className="text-xs tracking-wider uppercase text-white/50">Orders</span>
            </Link>
            <Link href="/admin/discounts" className="btn-premium p-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-center hover:bg-white/[0.06] transition-colors">
              <span className="text-xl block mb-2">◇</span>
              <span className="text-xs tracking-wider uppercase text-white/50">Discounts</span>
            </Link>
            <Link href="/admin/analytics" className="btn-premium p-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-center hover:bg-white/[0.06] transition-colors">
              <span className="text-xl block mb-2">◈</span>
              <span className="text-xs tracking-wider uppercase text-white/50">Analytics</span>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bebas tracking-wider">Recent Orders</h3>
            <Link href="/admin/orders" className="text-xs text-white/30 hover:text-white/50 transition-colors tracking-wider uppercase">
              View All →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-white/25 text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                  <div>
                    <p className="font-medium text-sm">#{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-white/30 text-xs">{order.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${order.total_amount?.toFixed(2)}</p>
                    <span className={`text-[10px] uppercase tracking-wider ${
                      order.status === 'pending' ? 'text-amber-400' :
                      order.status === 'processing' ? 'text-blue-400' :
                      order.status === 'shipped' ? 'text-purple-400' :
                      order.status === 'delivered' ? 'text-emerald-400' :
                      'text-red-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
