'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import type { Product, Order, WaitlistEntry, DashboardStats } from '@/lib/firebase';

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState<'overview' | 'inventory' | 'waitlist'>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalImpact: 0,
    waitlistCount: 0,
    totalRevenue: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Fetch products
      const productsQuery = query(collection(db, 'products'), orderBy('created_at', 'desc'));
      const productsSnap = await getDocs(productsQuery);
      const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);

      // Fetch orders
      const ordersQuery = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
      const ordersSnap = await getDocs(ordersQuery);
      const ordersData = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);

      // Fetch waitlist
      const waitlistQuery = query(collection(db, 'app_waitlist'), orderBy('signed_up_at', 'desc'));
      const waitlistSnap = await getDocs(waitlistQuery);
      const waitlistData = waitlistSnap.docs.map(doc => ({ email: doc.id, ...doc.data() } as WaitlistEntry));
      setWaitlist(waitlistData);

      // Calculate stats
      const totalRevenue = ordersData.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const totalImpact = totalRevenue * 0.10;
      
      setStats({
        totalImpact,
        waitlistCount: waitlistData.length,
        totalRevenue,
        totalOrders: ordersData.length,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }

    setLoading(false);
  };

  const updateStock = async (productId: string, size: string, newStock: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const updatedStock = { ...product.stock, [size]: newStock };
    
    try {
      await updateDoc(doc(db, 'products', productId), {
        stock: updatedStock,
        updated_at: new Date().toISOString()
      });
      
      setProducts(products.map(p => 
        p.id === productId ? { ...p, stock: updatedStock } : p
      ));
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const updateProductDetails = async (product: Product) => {
    try {
      await updateDoc(doc(db, 'products', product.id), {
        title: product.title,
        subtitle: product.subtitle,
        price: product.price,
        updated_at: new Date().toISOString()
      });
      
      setProducts(products.map(p => 
        p.id === product.id ? product : p
      ));
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading DYMNDS OS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-neutral-950 border-r border-white/10 z-50">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bebas italic tracking-wider">DYMNDS OS</h1>
          <p className="text-white/40 text-xs mt-1">Command Center</p>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveView('overview')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              activeView === 'overview' 
                ? 'bg-white text-black' 
                : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <span className="text-sm tracking-wider uppercase">Overview</span>
          </button>
          <button
            onClick={() => setActiveView('inventory')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              activeView === 'inventory' 
                ? 'bg-white text-black' 
                : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <span className="text-sm tracking-wider uppercase">Inventory</span>
          </button>
          <button
            onClick={() => setActiveView('waitlist')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              activeView === 'waitlist' 
                ? 'bg-white text-black' 
                : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <span className="text-sm tracking-wider uppercase">App Waitlist</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* CEO Overview */}
        {activeView === 'overview' && (
          <div>
            <h2 className="text-4xl font-bebas italic tracking-wider mb-8">CEO Overview</h2>
            
            <div className="grid grid-cols-3 gap-6">
              {/* Impact Fund Card */}
              <div className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 text-lg">💎</span>
                  </div>
                  <span className="text-white/40 text-xs uppercase tracking-wider">Impact Fund</span>
                </div>
                <p className="text-4xl font-bebas italic text-green-400">
                  ${stats.totalImpact.toFixed(2)}
                </p>
                <p className="text-white/40 text-sm mt-2">10% of all revenue</p>
              </div>

              {/* Waitlist Card */}
              <div className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 text-lg">📱</span>
                  </div>
                  <span className="text-white/40 text-xs uppercase tracking-wider">Waitlist Strength</span>
                </div>
                <p className="text-4xl font-bebas italic text-blue-400">
                  {stats.waitlistCount}
                </p>
                <p className="text-white/40 text-sm mt-2">App downloads waiting</p>
              </div>

              {/* Revenue Card */}
              <div className="p-6 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <span className="text-amber-400 text-lg">💰</span>
                  </div>
                  <span className="text-white/40 text-xs uppercase tracking-wider">Revenue</span>
                </div>
                <p className="text-4xl font-bebas italic text-amber-400">
                  ${stats.totalRevenue.toFixed(2)}
                </p>
                <p className="text-white/40 text-sm mt-2">{stats.totalOrders} orders</p>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Commander */}
        {activeView === 'inventory' && (
          <div>
            <h2 className="text-4xl font-bebas italic tracking-wider mb-8">Inventory Commander</h2>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Product</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">XS</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">S</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">M</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">L</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">XL</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">XXL</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-left hover:text-white/70 transition-colors"
                        >
                          <p className="font-medium">{product.title}</p>
                          <p className="text-white/40 text-xs">${product.price}</p>
                        </button>
                      </td>
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                        <td key={size} className="p-4">
                          <input
                            type="number"
                            value={(product.stock as Record<string, number>)?.[size] || 0}
                            onChange={(e) => updateStock(product.id, size, parseInt(e.target.value) || 0)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateStock(product.id, size, parseInt((e.target as HTMLInputElement).value) || 0);
                              }
                            }}
                            className="w-16 text-center bg-black border border-white/20 rounded px-2 py-1 text-sm focus:border-white/50 focus:outline-none"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* App Waitlist */}
        {activeView === 'waitlist' && (
          <div>
            <h2 className="text-4xl font-bebas italic tracking-wider mb-8">App Waitlist</h2>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Email</th>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Signed Up</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.map((entry) => (
                    <tr key={entry.email} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">{entry.email}</td>
                      <td className="p-4 text-white/60">
                        {entry.signed_up_at ? new Date(entry.signed_up_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 w-full max-w-lg">
            <h3 className="text-2xl font-bebas italic tracking-wider mb-6">Edit Product</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Title</label>
                <input
                  type="text"
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({...editingProduct, title: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Subtitle</label>
                <input
                  type="text"
                  value={editingProduct.subtitle}
                  onChange={(e) => setEditingProduct({...editingProduct, subtitle: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Price</label>
                <input
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 py-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateProductDetails(editingProduct)}
                className="flex-1 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
