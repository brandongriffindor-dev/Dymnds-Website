'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, type User } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Product, Order } from '@/lib/firebase';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function GlobalSearchModal({ isOpen, onClose, user }: GlobalSearchModalProps) {
  const router = useRouter();
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [searchProducts, setSearchProducts] = useState<Product[]>([]);
  const [searchOrders, setSearchOrders] = useState<Order[]>([]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Note: isOpen state is managed by parent
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch search data when modal opens
  useEffect(() => {
    if (!isOpen || !user) return;
    const fetchSearchData = async () => {
      try {
        const [productsSnap, ordersSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(query(collection(db, 'orders'), orderBy('created_at', 'desc'))),
        ]);
        setSearchProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
        setSearchOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      } catch (err) {
        console.error('Error fetching search data:', err);
      }
    };
    fetchSearchData();
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-start justify-center pt-24 lg:pt-32 p-4">
      <div className="modal-panel bg-neutral-950 border border-white/[0.08] rounded-2xl w-full max-w-2xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
          <span className="text-white/30">⌕</span>
          <input
            type="text"
            autoFocus
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            placeholder="Search products, orders, customers..."
            className="flex-1 bg-transparent text-lg focus:outline-none text-white placeholder:text-white/20"
            aria-label="Search products, orders, and customers"
          />
          <button
            onClick={() => {
              onClose();
              setGlobalSearchQuery('');
            }}
            className="px-2 py-1 bg-white/[0.06] rounded text-xs text-white/30 hover:bg-white/[0.1] transition-colors"
            aria-label="Close search"
          >
            ESC
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {globalSearchQuery.length < 2 ? (
            <div className="p-8 text-center text-white/30">
              <p className="mb-2">Start typing to search...</p>
              <p className="text-sm text-white/20">Products, orders, customer emails</p>
            </div>
          ) : (
            <>
              {searchProducts.filter(p =>
                p.title?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                p.slug?.toLowerCase().includes(globalSearchQuery.toLowerCase())
              ).length > 0 && (
                <div className="p-2">
                  <p className="px-3 py-2 text-[10px] uppercase tracking-widest text-white/25">Products</p>
                  {searchProducts
                    .filter(p =>
                      p.title?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                      p.slug?.toLowerCase().includes(globalSearchQuery.toLowerCase())
                    )
                    .slice(0, 5)
                    .map(product => (
                      <button
                        key={product.id}
                        onClick={() => {
                          onClose();
                          setGlobalSearchQuery('');
                          router.push('/admin/products');
                        }}
                        className="w-full text-left px-3 py-3 rounded-xl hover:bg-white/[0.04] flex items-center gap-3 transition-colors"
                      >
                        <span className="text-white/20">▦</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.title}</p>
                          <p className="text-sm text-white/30">${product.price} · {product.category}</p>
                        </div>
                      </button>
                    ))}
                </div>
              )}

              {searchOrders.filter(o =>
                o.id?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                o.customer_name?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                o.customer_email?.toLowerCase().includes(globalSearchQuery.toLowerCase())
              ).length > 0 && (
                <div className="p-2 border-t border-white/[0.04]">
                  <p className="px-3 py-2 text-[10px] uppercase tracking-widest text-white/25">Orders</p>
                  {searchOrders
                    .filter(o =>
                      o.id?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                      o.customer_name?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                      o.customer_email?.toLowerCase().includes(globalSearchQuery.toLowerCase())
                    )
                    .slice(0, 5)
                    .map(order => (
                      <button
                        key={order.id}
                        onClick={() => {
                          onClose();
                          setGlobalSearchQuery('');
                          router.push('/admin/orders');
                        }}
                        className="w-full text-left px-3 py-3 rounded-xl hover:bg-white/[0.04] flex items-center gap-3 transition-colors"
                      >
                        <span className="text-white/20">⬡</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">#{order.id.slice(-6).toUpperCase()}</p>
                          <p className="text-sm text-white/30">{order.customer_name} · ${order.total_amount?.toFixed(2)}</p>
                        </div>
                      </button>
                    ))}
                </div>
              )}

              {(() => {
                const customers = Array.from(new Set(searchOrders.map(o => o.customer_email)));
                const filtered = customers.filter(email =>
                  email?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                  searchOrders.find(o => o.customer_email === email)?.customer_name?.toLowerCase().includes(globalSearchQuery.toLowerCase())
                );
                return filtered.length > 0 ? (
                  <div className="p-2 border-t border-white/[0.04]">
                    <p className="px-3 py-2 text-[10px] uppercase tracking-widest text-white/25">Customers</p>
                    {filtered.slice(0, 5).map(email => {
                      const customer = searchOrders.find(o => o.customer_email === email);
                      const orderCount = searchOrders.filter(o => o.customer_email === email).length;
                      return (
                        <button
                          key={email}
                          onClick={() => {
                            onClose();
                            setGlobalSearchQuery('');
                            router.push('/admin/customers');
                          }}
                          className="w-full text-left px-3 py-3 rounded-xl hover:bg-white/[0.04] flex items-center gap-3 transition-colors"
                        >
                          <span className="text-white/20">◉</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{customer?.customer_name || 'Unknown'}</p>
                            <p className="text-sm text-white/30">{email} · {orderCount} orders</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null;
              })()}

              {searchProducts.filter(p =>
                p.title?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                p.slug?.toLowerCase().includes(globalSearchQuery.toLowerCase())
              ).length === 0 &&
              searchOrders.filter(o =>
                o.id?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                o.customer_name?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                o.customer_email?.toLowerCase().includes(globalSearchQuery.toLowerCase())
              ).length === 0 && (
                <div className="p-8 text-center text-white/25">
                  No results for &ldquo;{globalSearchQuery}&rdquo;
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
