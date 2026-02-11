'use client';

import Link from 'next/link';
import type { User } from '@/lib/firebase';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: '◆' },
  { label: 'Products', href: '/admin/products', icon: '▦' },
  { label: 'Orders', href: '/admin/orders', icon: '⬡' },
  { label: 'Customers', href: '/admin/customers', icon: '◉' },
  { label: 'Analytics', href: '/admin/analytics', icon: '◈' },
  { label: 'Discounts', href: '/admin/discounts', icon: '◇' },
  { label: 'Expenses', href: '/admin/expenses', icon: '▣' },
  { label: 'Alerts', href: '/admin/alerts', icon: '⚠' },
  { label: 'Inventory', href: '/admin/inventory', icon: '▤' },
  { label: 'Waitlist', href: '/admin/waitlist', icon: '◎' },
  { label: 'Messages', href: '/admin/messages', icon: '✉' },
];

interface AdminSidebarProps {
  pathname: string;
  pendingOrderCount: number;
  lowStockCount: number;
  unreadMessagesCount: number;
  notificationsEnabled: boolean;
  onEnableNotifications: () => Promise<void>;
  user: User | null;
  onLogout: () => Promise<void>;
  onOpenSearch: () => void;
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

export default function AdminSidebar({
  pathname,
  pendingOrderCount,
  lowStockCount,
  unreadMessagesCount,
  notificationsEnabled,
  onEnableNotifications,
  user,
  onLogout,
  onOpenSearch,
  mobileMenuOpen,
  onCloseMobileMenu,
}: AdminSidebarProps) {
  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside className={`fixed left-0 top-0 h-full w-64 bg-neutral-950 border-r border-white/[0.06] z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Logo */}
      <div className="p-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <span className="text-xl">◆</span>
          <div>
            <h1 className="text-xl font-bebas tracking-wider">DYMNDS OS</h1>
            <p className="text-white/25 text-[10px] tracking-widest uppercase">Command Center</p>
          </div>
        </div>
      </div>

      {/* Search trigger */}
      <div className="px-4 pt-4">
        <button
          onClick={() => {
            onOpenSearch();
            onCloseMobileMenu();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white/30 text-sm hover:bg-white/[0.05] transition-colors"
        >
          <span>⌕</span>
          <span>Search...</span>
          <span className="ml-auto text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded">⌘K</span>
        </button>
      </div>

      {/* Nav Items */}
      <nav aria-label="Admin navigation" className="px-3 pt-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const badge = item.label === 'Orders' && pendingOrderCount > 0
            ? pendingOrderCount
            : item.label === 'Alerts' && lowStockCount > 0
            ? lowStockCount
            : item.label === 'Messages' && unreadMessagesCount > 0
            ? unreadMessagesCount
            : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onCloseMobileMenu()}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm tracking-wider uppercase transition-all duration-200 ${
                active
                  ? 'bg-white text-black font-medium'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
              }`}
            >
              <span className={`text-base ${active ? 'opacity-100' : 'opacity-40'}`}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {badge && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  active ? 'bg-black/20 text-black' : 'bg-red-500/80 text-white'
                }`}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/[0.06] space-y-2">
        {/* Notification toggle */}
        {'Notification' in (typeof window !== 'undefined' ? window : {}) && (
          <button
            onClick={onEnableNotifications}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
              notificationsEnabled
                ? 'text-green-400/70 bg-green-500/[0.05]'
                : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
            }`}
          >
            <span>{notificationsEnabled ? '●' : '○'}</span>
            <span className="tracking-wider uppercase text-xs">{notificationsEnabled ? 'Alerts On' : 'Enable Alerts'}</span>
          </button>
        )}

        {/* User + Logout */}
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-xs text-white/40">A</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/30 truncate">{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="text-xs text-red-400/60 hover:text-red-400 transition-colors tracking-wider uppercase"
          >
            Exit
          </button>
        </div>
      </div>
    </aside>
  );
}
