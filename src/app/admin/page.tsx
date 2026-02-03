'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { db, storage, getAuthClient, signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy,
  addDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Product, Order, WaitlistEntry, DashboardStats } from '@/lib/firebase';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
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
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addError, setAddError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [newProduct, setNewProduct] = useState({
    slug: '',
    title: '',
    subtitle: '',
    price: 0,
    stock: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
    category: 'Men',
    productType: 'Tops',
    displayOrder: 1,
    featured: false,
    description: '',
    features: [] as string[],
    modelSize: '',
    modelHeight: '',
    deliveryInfo: 'Free shipping on orders over $100. Delivery in 3-5 business days.',
    returnsInfo: '30-day hassle-free returns. Items must be unworn with tags attached.',
    matchingSetSlug: '',
    sizeGuide: {
      chest: { XS: '32-34"', S: '35-37"', M: '38-40"', L: '41-43"', XL: '44-46"', XXL: '47-49"' },
      waist: { XS: '26-28"', S: '29-31"', M: '32-34"', L: '35-37"', XL: '38-40"', XXL: '41-43"' }
    },
    colors: [] as { name: string; hex: string; images: string[]; stock: { XS: number; S: number; M: number; L: number; XL: number; XXL: number } }[],
    imageUrl: '',
    images: [] as string[],
  });
  
  const [activeColorIndex, setActiveColorIndex] = useState(0);

  // Auto-generate slug from title
  useEffect(() => {
    if (newProduct.title && !newProduct.slug) {
      const slug = newProduct.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setNewProduct(prev => ({ ...prev, slug }));
    }
  }, [newProduct.title]);

  // Auth listener
  useEffect(() => {
    const auth = getAuthClient();
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        fetchData();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const auth = getAuthClient();
      if (!auth) throw new Error('Auth not available');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login error:', error.code, error.message);
      // Map Firebase error codes to friendly messages
      const errorMap: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-email': 'Invalid email format',
        'auth/invalid-credential': 'Invalid email or password',
        'auth/too-many-requests': 'Too many failed attempts. Try again later',
      };
      setLoginError(errorMap[error.code] || error.message || 'Login failed');
    }
  };

  const handleLogout = async () => {
    const auth = getAuthClient();
    if (auth) await signOut(auth);
  };

  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Fetch products - try displayOrder first, fallback to created_at
      let productsData: Product[] = [];
      try {
        const productsQuery = query(collection(db, 'products'), orderBy('displayOrder', 'asc'));
        const productsSnap = await getDocs(productsQuery);
        productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      } catch (queryError: any) {
        console.error('Error with displayOrder query:', queryError.message);
        // Fallback: fetch without ordering
        const fallbackQuery = query(collection(db, 'products'));
        const fallbackSnap = await getDocs(fallbackQuery);
        productsData = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        // Sort manually with default displayOrder of 999
        productsData.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
      }
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

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) return;
    
    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(products.filter(p => p.id !== productId));
      alert('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const updateDisplayOrder = async (productId: string, newOrder: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const currentOrder = product.displayOrder || 1;
    if (newOrder === currentOrder) return;
    
    try {
      // If moving to a lower number (earlier in list), shift products in between
      if (newOrder < currentOrder) {
        const productsToShift = products.filter(p => 
          p.id !== productId && 
          (p.displayOrder || 1) >= newOrder && 
          (p.displayOrder || 1) < currentOrder
        );
        for (const p of productsToShift) {
          await updateDoc(doc(db, 'products', p.id), {
            displayOrder: (p.displayOrder || 1) + 1,
            updated_at: new Date().toISOString()
          });
        }
      } 
      // If moving to a higher number (later in list), shift products in between
      else {
        const productsToShift = products.filter(p => 
          p.id !== productId && 
          (p.displayOrder || 1) <= newOrder && 
          (p.displayOrder || 1) > currentOrder
        );
        for (const p of productsToShift) {
          await updateDoc(doc(db, 'products', p.id), {
            displayOrder: (p.displayOrder || 1) - 1,
            updated_at: new Date().toISOString()
          });
        }
      }
      
      // Update the target product's order
      await updateDoc(doc(db, 'products', productId), {
        displayOrder: newOrder,
        updated_at: new Date().toISOString()
      });
      
      // Refresh data to show new order
      await fetchData();
      alert('Display order updated');
    } catch (error) {
      console.error('Error updating display order:', error);
      alert('Failed to update display order');
    }
  };

  const toggleFeatured = async (product: Product) => {
    const newFeaturedState = !product.featured;
    
    try {
      // If featuring, check if we need to unfeature another
      if (newFeaturedState) {
        const categoryFeatured = products.filter(p => 
          p.category === product.category && 
          p.featured && 
          p.id !== product.id
        );
        
        // If already 3 featured in this category, unfeature the oldest one
        if (categoryFeatured.length >= 3) {
          // Sort by created_at to find oldest
          const sorted = categoryFeatured.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          const oldest = sorted[0];
          
          await updateDoc(doc(db, 'products', oldest.id), {
            featured: false,
            updated_at: new Date().toISOString()
          });
          
          // Update local state
          setProducts(products.map(p => 
            p.id === oldest.id ? { ...p, featured: false } : p
          ));
        }
      }
      
      // Toggle the clicked product
      await updateDoc(doc(db, 'products', product.id), {
        featured: newFeaturedState,
        updated_at: new Date().toISOString()
      });
      
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, featured: newFeaturedState } : p
      ));
      
      alert(newFeaturedState ? '⭐ Added to spotlight' : 'Removed from spotlight');
    } catch (error) {
      console.error('Error toggling featured:', error);
      alert('Failed to update spotlight status');
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

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadImages(files);
    }
  }, []);

  const uploadImages = async (files: FileList) => {
    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      
      try {
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        uploadedUrls.push(downloadUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    setNewProduct(prev => ({
      ...prev,
      images: [...prev.images, ...uploadedUrls]
    }));
    setUploadingImages(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      await uploadImages(files);
    }
  };

  const removeImage = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addProduct = async () => {
    setAddError('');
    setIsAdding(true);
    
    // Validation
    if (!newProduct.slug.trim()) {
      setAddError('Slug is required');
      setIsAdding(false);
      return;
    }
    if (!newProduct.title.trim()) {
      setAddError('Title is required');
      setIsAdding(false);
      return;
    }
    if (newProduct.price <= 0) {
      setAddError('Price must be greater than 0');
      setIsAdding(false);
      return;
    }

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 10 seconds')), 10000);
    });

    try {
      console.log('Starting add product...', newProduct);
      
      const targetOrder = newProduct.displayOrder || 1;
      
      // Shift existing products to make room for the new one
      const productsToShift = products.filter(p => p.displayOrder >= targetOrder);
      for (const product of productsToShift) {
        await updateDoc(doc(db, 'products', product.id), {
          displayOrder: product.displayOrder + 1,
          updated_at: new Date().toISOString()
        });
      }
      
      // Build colors array with images and stock
      const colorsData = newProduct.colors.length > 0 
        ? newProduct.colors.map(color => ({
            name: color.name,
            hex: color.hex,
            images: color.images.length > 0 ? color.images : newProduct.images,
            stock: color.stock
          }))
        : undefined;

      // Normalize slug - lowercase, replace spaces/special chars with dashes
      const normalizedSlug = newProduct.slug.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Build product data - conditionally include fields to avoid undefined
      const productData: any = {
        slug: normalizedSlug,
        title: newProduct.title.trim(),
        subtitle: newProduct.subtitle.trim(),
        price: newProduct.price,
        category: newProduct.category,
        productType: newProduct.productType,
        displayOrder: targetOrder,
        featured: newProduct.featured,
        description: newProduct.description,
        features: newProduct.features.filter(f => f.trim()),
        modelSize: newProduct.modelSize,
        modelHeight: newProduct.modelHeight,
        deliveryInfo: newProduct.deliveryInfo,
        returnsInfo: newProduct.returnsInfo,
        matchingSetSlug: newProduct.matchingSetSlug,
        sizeGuide: newProduct.sizeGuide,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Add colors or stock/images (not both)
      if (colorsData) {
        productData.colors = colorsData;
      } else {
        productData.stock = newProduct.stock;
        productData.images = newProduct.images.length > 0 ? newProduct.images : (newProduct.imageUrl ? [newProduct.imageUrl] : []);
      }
      
      console.log('Adding to Firebase:', productData);
      
      // Race between Firebase call and timeout
      const docRef = await Promise.race([
        addDoc(collection(db, 'products'), productData),
        timeoutPromise
      ]) as any;
      
      console.log('Product added with ID:', docRef.id);
      
      // Refresh data to get correct order
      await fetchData();
      setShowAddProduct(false);
      setNewProduct({
        slug: '',
        title: '',
        subtitle: '',
        price: 0,
        stock: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
        category: 'Men',
        productType: 'Tops',
        displayOrder: 1,
        featured: false,
        description: '',
        features: [],
        modelSize: '',
        modelHeight: '',
        deliveryInfo: 'Free shipping on orders over $100. Delivery in 3-5 business days.',
        returnsInfo: '30-day hassle-free returns. Items must be unworn with tags attached.',
        matchingSetSlug: '',
        sizeGuide: {
          chest: { XS: '32-34"', S: '35-37"', M: '38-40"', L: '41-43"', XL: '44-46"', XXL: '47-49"' },
          waist: { XS: '26-28"', S: '29-31"', M: '32-34"', L: '35-37"', XL: '38-40"', XXL: '41-43"' }
        },
        colors: [],
        imageUrl: '',
        images: [],
      });
      setActiveColorIndex(0);
      alert('Product added successfully!');
    } catch (error: any) {
      console.error('Error adding product:', error);
      const errorMsg = error?.message || 'Unknown error';
      setAddError(`Failed to add product: ${errorMsg}`);
      alert(`Failed to add product: ${errorMsg}`);
    } finally {
      setIsAdding(false);
    }
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show login
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bebas italic tracking-wider mb-2">DYMNDS OS</h1>
            <p className="text-white/40">Admin Access</p>
          </div>
          
          <form onSubmit={handleLogin} className="bg-white/5 border border-white/10 rounded-2xl p-8">
            {loginError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {loginError}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40"
                  placeholder="admin@weardymnds.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full py-4 bg-white text-black font-bold tracking-wider uppercase rounded-lg hover:bg-white/90 transition-colors"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Data loading state
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
          
          <div className="pt-4 mt-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
            >
              <span className="text-sm tracking-wider uppercase">Logout</span>
            </button>
          </div>
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
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-bebas italic tracking-wider">Inventory Commander</h2>
              <button
                onClick={() => {
                  setShowAddProduct(true);
                  setAddError('');
                }}
                className="px-6 py-3 bg-white text-black text-sm font-bold tracking-wider uppercase rounded-lg hover:bg-white/90 transition-colors"
              >
                + Add Product
              </button>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">#</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">⭐</th>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Product</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">Type</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">XS</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">S</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">M</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">L</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">XL</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">XXL</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4 text-center">
                        <input
                          type="number"
                          min={1}
                          value={product.displayOrder || 1}
                          onChange={(e) => updateDisplayOrder(product.id, parseInt(e.target.value) || 1)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateDisplayOrder(product.id, parseInt((e.target as HTMLInputElement).value) || 1);
                            }
                          }}
                          className="w-12 text-center bg-black border border-white/20 rounded px-2 py-1 text-sm focus:border-white/50 focus:outline-none"
                          title="Click to change position (Enter to save)"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleFeatured(product)}
                          className={`text-xl transition-colors ${
                            product.featured ? 'text-yellow-400 hover:text-yellow-300' : 'text-white/20 hover:text-white/40'
                          }`}
                          title={product.featured ? 'Remove from spotlight' : 'Add to spotlight (max 3 per category)'}
                        >
                          {product.featured ? '⭐' : '☆'}
                        </button>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-left hover:text-white/70 transition-colors"
                        >
                          <p className="font-medium">{product.title}</p>
                          <p className="text-white/40 text-xs">${product.price} • {product.category}</p>
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-white/60 text-xs">{(product as any).productType || 'N/A'}</span>
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
                      <td className="p-4 text-center">
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded hover:bg-red-500/30 transition-colors"
                          title="Delete product"
                        >
                          Delete
                        </button>
                      </td>
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

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bebas italic tracking-wider mb-6">Add New Product</h3>
            
            {addError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {addError}
              </div>
            )}
            
            <div className="space-y-4">
              {/* Category Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Category (Gender)</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Product Type</label>
                  <select
                    value={newProduct.productType}
                    onChange={(e) => setNewProduct({...newProduct, productType: e.target.value})}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                  >
                    <option value="Tops">Tops</option>
                    <option value="Bottoms">Bottoms</option>
                    <option value="Outerwear">Outerwear</option>
                    <option value="Leggings">Leggings</option>
                    <option value="Shorts">Shorts</option>
                    <option value="Hoodies">Hoodies</option>
                    <option value="T-Shirts">T-Shirts</option>
                    <option value="Tank Tops">Tank Tops</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Slug (URL) *</label>
                <input
                  type="text"
                  value={newProduct.slug}
                  onChange={(e) => setNewProduct({...newProduct, slug: e.target.value})}
                  placeholder="e.g., heavy-hoodie"
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                />
                <p className="text-white/30 text-xs mt-1">Used in URL: /products/your-slug</p>
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Title *</label>
                <input
                  type="text"
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                  placeholder="Heavy Hoodie"
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Subtitle</label>
                <input
                  type="text"
                  value={newProduct.subtitle}
                  onChange={(e) => setNewProduct({...newProduct, subtitle: e.target.value})}
                  placeholder="Warmth without weight..."
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Price ($) *</label>
                <input
                  type="number"
                  value={newProduct.price || ''}
                  onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                  placeholder="149"
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Display Position</label>
                <input
                  type="number"
                  min={1}
                  value={newProduct.displayOrder || ''}
                  onChange={(e) => setNewProduct({...newProduct, displayOrder: parseInt(e.target.value) || 1})}
                  placeholder="1"
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                />
                <p className="text-white/30 text-xs mt-1">Position in grid (1 = first). Other items will auto-shift.</p>
              </div>

              {/* New Fields for Product Detail Page */}
              <div className="border-t border-white/10 pt-6 mt-6">
                <h4 className="text-sm font-medium text-white/60 mb-4">Product Details</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Description</label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      placeholder="Detailed product description..."
                      rows={3}
                      className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Features (one per line)</label>
                    <textarea
                      value={newProduct.features.join('\n')}
                      onChange={(e) => setNewProduct({...newProduct, features: e.target.value.split('\n').filter(f => f.trim())})}
                      placeholder="4-way stretch&#10;Moisture-wicking&#10;Anti-odor"
                      rows={3}
                      className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Model Size</label>
                      <input
                        type="text"
                        value={newProduct.modelSize}
                        onChange={(e) => setNewProduct({...newProduct, modelSize: e.target.value})}
                        placeholder="e.g., Medium"
                        className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Model Height</label>
                      <input
                        type="text"
                        value={newProduct.modelHeight}
                        onChange={(e) => setNewProduct({...newProduct, modelHeight: e.target.value})}
                        placeholder="e.g., 6'2"
                        className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Matching Set Product (Slug)</label>
                    <input
                      type="text"
                      value={newProduct.matchingSetSlug}
                      onChange={(e) => setNewProduct({...newProduct, matchingSetSlug: e.target.value})}
                      placeholder="e.g., compression-leggings"
                      className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                    />
                    <p className="text-white/30 text-xs mt-1">Enter the slug of the matching item to complete the look</p>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Delivery Info</label>
                    <input
                      type="text"
                      value={newProduct.deliveryInfo}
                      onChange={(e) => setNewProduct({...newProduct, deliveryInfo: e.target.value})}
                      placeholder="Free shipping on orders over $100. Delivery in 3-5 business days."
                      className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Returns Info</label>
                    <input
                      type="text"
                      value={newProduct.returnsInfo}
                      onChange={(e) => setNewProduct({...newProduct, returnsInfo: e.target.value})}
                      placeholder="30-day hassle-free returns. Items must be unworn with tags attached."
                      className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Colors Management */}
              <div className="border-t border-white/10 pt-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-white/60">Colors & Variants</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const newColor = {
                        name: `Color ${newProduct.colors.length + 1}`,
                        hex: '#000000',
                        images: [] as string[],
                        stock: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }
                      };
                      setNewProduct({...newProduct, colors: [...newProduct.colors, newColor]});
                      setActiveColorIndex(newProduct.colors.length);
                    }}
                    className="px-3 py-1 bg-white/10 text-white text-xs rounded hover:bg-white/20 transition-colors"
                  >
                    + Add Color
                  </button>
                </div>

                {newProduct.colors.length === 0 ? (
                  <p className="text-white/40 text-sm mb-4">No colors added. Add colors to manage different variants with separate images and stock.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Color Tabs */}
                    <div className="flex gap-2 flex-wrap">
                      {newProduct.colors.map((color, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveColorIndex(idx)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            activeColorIndex === idx 
                              ? 'bg-white/20 border border-white/40' 
                              : 'bg-white/5 border border-transparent hover:bg-white/10'
                          }`}
                        >
                          <div 
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span>{color.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Active Color Editor */}
                    {newProduct.colors[activeColorIndex] && (
                      <div className="p-4 bg-white/5 rounded-lg space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Color Name</label>
                            <input
                              type="text"
                              value={newProduct.colors[activeColorIndex].name}
                              onChange={(e) => {
                                const newColors = [...newProduct.colors];
                                newColors[activeColorIndex].name = e.target.value;
                                setNewProduct({...newProduct, colors: newColors});
                              }}
                              placeholder="e.g., Black"
                              className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Color Hex</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={newProduct.colors[activeColorIndex].hex}
                                onChange={(e) => {
                                  const newColors = [...newProduct.colors];
                                  newColors[activeColorIndex].hex = e.target.value;
                                  setNewProduct({...newProduct, colors: newColors});
                                }}
                                className="w-12 h-12 bg-transparent border border-white/20 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={newProduct.colors[activeColorIndex].hex}
                                onChange={(e) => {
                                  const newColors = [...newProduct.colors];
                                  newColors[activeColorIndex].hex = e.target.value;
                                  setNewProduct({...newProduct, colors: newColors});
                                }}
                                className="flex-1 bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none uppercase"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Color Images */}
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Color Images</label>
                          <div className="flex gap-2 flex-wrap mb-2">
                            {newProduct.colors[activeColorIndex].images.map((img, imgIdx) => (
                              <div key={imgIdx} className="relative w-16 h-16">
                                <img src={img} alt="" className="w-full h-full object-cover rounded" />
                                <button
                                  onClick={() => {
                                    const newColors = [...newProduct.colors];
                                    newColors[activeColorIndex].images = newColors[activeColorIndex].images.filter((_, i) => i !== imgIdx);
                                    setNewProduct({...newProduct, colors: newColors});
                                  }}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={async (e) => {
                              if (!e.target.files) return;
                              setUploadingImages(true);
                              const uploadedUrls: string[] = [];
                              for (const file of Array.from(e.target.files)) {
                                try {
                                  const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
                                  await uploadBytes(storageRef, file);
                                  const downloadUrl = await getDownloadURL(storageRef);
                                  uploadedUrls.push(downloadUrl);
                                } catch (error) {
                                  console.error('Error uploading image:', error);
                                }
                              }
                              const newColors = [...newProduct.colors];
                              newColors[activeColorIndex].images = [...newColors[activeColorIndex].images, ...uploadedUrls];
                              setNewProduct({...newProduct, colors: newColors});
                              setUploadingImages(false);
                            }}
                            className="text-sm text-white/60"
                          />
                        </div>

                        {/* Color Stock */}
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Stock by Size</label>
                          <div className="grid grid-cols-6 gap-2">
                            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                              <div key={size}>
                                <label className="block text-[10px] text-white/40 text-center mb-1">{size}</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={newProduct.colors[activeColorIndex].stock[size as keyof typeof newProduct.colors[0]['stock']]}
                                  onChange={(e) => {
                                    const newColors = [...newProduct.colors];
                                    newColors[activeColorIndex].stock[size as keyof typeof newProduct.colors[0]['stock']] = parseInt(e.target.value) || 0;
                                    setNewProduct({...newProduct, colors: newColors});
                                  }}
                                  className="w-full bg-black border border-white/20 rounded px-2 py-2 text-center text-sm focus:border-white/50 focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Remove Color Button */}
                        <button
                          onClick={() => {
                            const newColors = newProduct.colors.filter((_, i) => i !== activeColorIndex);
                            setNewProduct({...newProduct, colors: newColors});
                            setActiveColorIndex(Math.max(0, activeColorIndex - 1));
                          }}
                          className="text-red-400 text-xs hover:text-red-300"
                        >
                          Remove this color
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Simple Image Upload (for products without colors) */}
              <div className={newProduct.colors.length > 0 ? 'opacity-50 pointer-events-none' : ''}>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">
                  Product Images {newProduct.colors.length > 0 && '(Disabled - use color images above)'}
                </label>
                
                {/* Drag & Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    dragActive 
                      ? 'border-white bg-white/5' 
                      : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  <div className="text-4xl mb-3">📁</div>
                  <p className="text-white/60 text-sm mb-2">
                    Drag & drop PNG images here
                  </p>
                  <p className="text-white/40 text-xs mb-4">
                    or click to select files
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block px-4 py-2 bg-white/10 rounded-lg text-sm cursor-pointer hover:bg-white/20 transition-colors"
                  >
                    Select Images
                  </label>
                </div>

                {uploadingImages && (
                  <div className="mt-3 flex items-center gap-2 text-white/60 text-sm">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading images...
                  </div>
                )}

                {/* Preview uploaded images */}
                {newProduct.images.length > 0 && (
                  <div className="mt-4">
                    <p className="text-white/60 text-sm mb-2">Uploaded Images:</p>
                    <div className="flex gap-3 flex-wrap">
                      {newProduct.images.map((url, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={url} 
                            alt={`Product ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-white/20"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Or paste URL */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-white/40 text-xs mb-2">Or paste image URL:</p>
                  <input
                    type="text"
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                    placeholder="https://your-image-url.com/image.jpg"
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Initial Stock */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Initial Stock</label>
                <div className="grid grid-cols-6 gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                    <div key={size}>
                      <span className="text-xs text-white/40 block text-center mb-1">{size}</span>
                      <input
                        type="number"
                        min="0"
                        value={(newProduct.stock as Record<string, number>)[size]}
                        onChange={(e) => setNewProduct({
                          ...newProduct, 
                          stock: {...newProduct.stock, [size]: parseInt(e.target.value) || 0}
                        })}
                        className="w-full text-center bg-black border border-white/20 rounded px-2 py-2 text-sm focus:border-white/50 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setShowAddProduct(false);
                  setAddError('');
                }}
                disabled={isAdding}
                className="flex-1 py-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={addProduct}
                disabled={isAdding}
                className="flex-1 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAdding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Product'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
