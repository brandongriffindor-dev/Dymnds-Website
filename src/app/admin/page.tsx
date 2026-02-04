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
  
  const [activeView, setActiveView] = useState<'overview' | 'inventory' | 'orders' | 'customers' | 'analytics' | 'discounts' | 'alerts' | 'waitlist' | 'finance'>('overview');
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
  
  // Discount codes state
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [newDiscount, setNewDiscount] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    minOrder: 0,
    maxUses: 100,
    usedCount: 0,
    expiresAt: '',
    isActive: true,
  });

  // Finance / Expenses state
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    category: 'Shipping' as 'Shipping' | 'Marketing' | 'Software' | 'Inventory' | 'Legal/Admin' | 'Other',
    date: new Date().toISOString().split('T')[0],
    gstAmount: 0,
    hasGst: false,
  });
  const [financeView, setFinanceView] = useState<'daily' | 'monthly' | 'expenses' | 'tax'>('daily');

  // Search state
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Order detail view state
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for global search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
      // Escape to close search
      if (e.key === 'Escape') {
        setShowGlobalSearch(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

      // Fetch discounts
      const discountsQuery = query(collection(db, 'discounts'), orderBy('created_at', 'desc'));
      const discountsSnap = await getDocs(discountsQuery);
      const discountsData = discountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDiscounts(discountsData);

      // Fetch expenses
      const expensesQuery = query(collection(db, 'expenses'), orderBy('date', 'desc'));
      const expensesSnap = await getDocs(expensesQuery);
      const expensesData = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesData);

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
            onClick={() => setActiveView('orders')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              activeView === 'orders' 
                ? 'bg-white text-black' 
                : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <span className="text-sm tracking-wider uppercase">Orders</span>
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {orders.filter(o => o.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveView('customers')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              activeView === 'customers' 
                ? 'bg-white text-black' 
                : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <span className="text-sm tracking-wider uppercase">Customers</span>
          </button>
          <button
            onClick={() => setActiveView('analytics')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              activeView === 'analytics' 
                ? 'bg-white text-black' 
                : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <span className="text-sm tracking-wider uppercase">Analytics</span>
          </button>
          <button
            onClick={() => setActiveView('discounts')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              activeView === 'discounts' 
                ? 'bg-white text-black' 
                : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <span className="text-sm tracking-wider uppercase">Discounts</span>
          </button>
          <button
            onClick={() => setActiveView('alerts')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              activeView === 'alerts' 
                ? 'bg-white text-black' 
                : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <span className="text-sm tracking-wider uppercase">Alerts</span>
            {(() => {
              const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
              const lowStockProducts = products.filter(p => {
                return sizes.some(size => ((p.stock as Record<string, number>)?.[size] || 0) < 5);
              });
              return lowStockProducts.length > 0 ? (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {lowStockProducts.length}
                </span>
              ) : null;
            })()}
          </button>
          <button
            onClick={() => setActiveView('finance')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              activeView === 'finance' 
                ? 'bg-white text-black' 
                : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <span className="text-sm tracking-wider uppercase">Finance</span>
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
            
            <div className="grid grid-cols-4 gap-6">
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

              {/* Low Stock Alert Card */}
              {(() => {
                const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
                const lowStockProducts = products.filter(p => {
                  return sizes.some(size => ((p.stock as Record<string, number>)?.[size] || 0) < 5);
                });
                const hasCritical = products.some(p => {
                  return sizes.some(size => ((p.stock as Record<string, number>)?.[size] || 0) === 0);
                });
                
                if (lowStockProducts.length === 0) return null;
                
                return (
                  <div 
                    className="p-6 bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-2xl cursor-pointer hover:border-red-500/40 transition-all"
                    onClick={() => setActiveView('alerts')}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <span className="text-red-400 text-lg">⚠️</span>
                      </div>
                      <span className="text-white/40 text-xs uppercase tracking-wider">Low Stock Alert</span>
                    </div>
                    <p className="text-4xl font-bebas italic text-red-400">
                      {lowStockProducts.length}
                    </p>
                    <p className="text-white/40 text-sm mt-2">
                      {hasCritical ? 'Some items out of stock' : 'Products need restocking'}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Inventory Commander */}
        {activeView === 'inventory' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-bebas italic tracking-wider">Inventory Commander</h2>
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">🔍</span>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30 w-64"
                  />
                </div>
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
                  {products
                    .filter(p => 
                      !productSearch || 
                      p.title?.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.slug?.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.category?.toLowerCase().includes(productSearch.toLowerCase())
                    )
                    .map((product) => (
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
        {/* Orders View */}
        {activeView === 'orders' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-bebas italic tracking-wider">Order Fulfillment</h2>
              <div className="flex gap-4">
                {/* Search */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">🔍</span>
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search orders..."
                    className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30 w-48"
                  />
                </div>
                <select 
                  className="bg-black border border-white/20 rounded-lg px-4 py-2 text-sm"
                  onChange={(e) => {
                    const status = e.target.value;
                    if (status === 'all') {
                      fetchData();
                    } else {
                      const filtered = orders.filter(o => o.status === status);
                      setOrders(filtered);
                    }
                  }}
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Orders Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-yellow-400 mb-1">Pending</p>
                <p className="text-2xl font-bebas italic">{orders.filter(o => o.status === 'pending').length}</p>
              </div>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-blue-400 mb-1">Processing</p>
                <p className="text-2xl font-bebas italic">{orders.filter(o => o.status === 'processing').length}</p>
              </div>
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-purple-400 mb-1">Shipped</p>
                <p className="text-2xl font-bebas italic">{orders.filter(o => o.status === 'shipped').length}</p>
              </div>
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-green-400 mb-1">Delivered</p>
                <p className="text-2xl font-bebas italic">{orders.filter(o => o.status === 'delivered').length}</p>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Order ID</th>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Customer</th>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Date</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">Items</th>
                    <th className="text-right p-4 text-xs uppercase tracking-wider text-white/40">Total</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">Status</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-white/40">
                        No orders yet. Orders will appear here when customers check out.
                      </td>
                    </tr>
                  ) : (
                    orders
                      .filter(o => 
                        !orderSearch ||
                        o.id?.toLowerCase().includes(orderSearch.toLowerCase()) ||
                        o.customer_name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
                        o.customer_email?.toLowerCase().includes(orderSearch.toLowerCase())
                      )
                      .map((order) => (
                      <tr 
                        key={order.id} 
                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                        onClick={() => setViewingOrder(order)}
                      >
                        <td className="p-4">
                          <span className="font-mono text-sm">#{order.id.slice(-6).toUpperCase()}</span>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-white/40 text-xs">{order.customer_email}</p>
                        </td>
                        <td className="p-4 text-white/60 text-sm">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4 text-center">
                          {order.items?.length || 0} items
                        </td>
                        <td className="p-4 text-right font-medium">
                          ${order.total_amount?.toFixed(2) || '0.00'}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs uppercase ${
                            order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            order.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                            order.status === 'shipped' ? 'bg-purple-500/20 text-purple-400' :
                            order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={order.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                await updateDoc(doc(db, 'orders', order.id), {
                                  status: newStatus,
                                  updated_at: new Date().toISOString()
                                });
                                setOrders(orders.map(o => 
                                  o.id === order.id ? { ...o, status: newStatus as any } : o
                                ));
                              } catch (err) {
                                console.error('Error updating order:', err);
                              }
                            }}
                            className="bg-black border border-white/20 rounded px-2 py-1 text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customers View */}
        {activeView === 'customers' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-bebas italic tracking-wider">Customer Database</h2>
              {/* Search */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">🔍</span>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers..."
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30 w-64"
                />
              </div>
            </div>
            
            {/* Customer Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Total Customers</p>
                <p className="text-2xl font-bebas italic">{Array.from(new Set(orders.map(o => o.customer_email))).length}</p>
              </div>
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-green-400 mb-1">VIP Customers</p>
                <p className="text-2xl font-bebas italic text-green-400">
                  {Array.from(new Set(orders.map(o => o.customer_email))).filter(email => {
                    const customerOrders = orders.filter(o => o.customer_email === email);
                    const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
                    return totalSpent > 500;
                  }).length}
                </p>
              </div>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-blue-400 mb-1">Active This Month</p>
                <p className="text-2xl font-bebas italic text-blue-400">
                  {Array.from(new Set(orders.filter(o => {
                    const orderDate = new Date(o.created_at);
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return orderDate >= monthAgo;
                  }).map(o => o.customer_email))).length}
                </p>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-amber-400 mb-1">Avg. Order Value</p>
                <p className="text-2xl font-bebas italic text-amber-400">
                  ${orders.length > 0 ? (orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / orders.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Customer</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">Orders</th>
                    <th className="text-right p-4 text-xs uppercase tracking-wider text-white/40">Total Spent</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">Status</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">Last Order</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(new Set(orders.map(o => o.customer_email))).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-white/40">
                        No customers yet. Customers will appear here when they place orders.
                      </td>
                    </tr>
                  ) : (
                    Array.from(new Set(orders.map(o => o.customer_email)))
                      .filter(email => {
                        if (!customerSearch) return true;
                        const customer = orders.find(o => o.customer_email === email);
                        return (
                          email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                          customer?.customer_name?.toLowerCase().includes(customerSearch.toLowerCase())
                        );
                      })
                      .map(email => {
                        const customerOrders = orders.filter(o => o.customer_email === email);
                        const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
                        const orderCount = customerOrders.length;
                        const lastOrder = customerOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                        const isVIP = totalSpent > 500;
                        const isActive = lastOrder && new Date(lastOrder.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                        
                        return (
                          <tr key={email} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-4">
                              <p className="font-medium">{customerOrders[0]?.customer_name || 'Unknown'}</p>
                              <p className="text-white/40 text-xs">{email}</p>
                            </td>
                            <td className="p-4 text-center">
                              <span className="px-3 py-1 bg-white/10 rounded-full text-sm">{orderCount}</span>
                            </td>
                            <td className="p-4 text-right font-medium">
                              ${totalSpent.toFixed(2)}
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex gap-1 justify-center">
                                {isVIP && (
                                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full" title="VIP: Spent over $500">
                                    VIP
                                  </span>
                                )}
                                {isActive && (
                                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full" title="Active: Ordered in last 30 days">
                                    Active
                                  </span>
                                )}
                                {!isVIP && !isActive && (
                                  <span className="px-2 py-1 bg-white/10 text-white/40 text-xs rounded-full">
                                    Regular
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-center text-white/60 text-sm">
                              {lastOrder?.created_at ? new Date(lastOrder.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <div>
            <h2 className="text-4xl font-bebas italic tracking-wider mb-8">Business Analytics</h2>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl">
                <p className="text-xs uppercase tracking-wider text-green-400 mb-2">Total Revenue</p>
                <p className="text-4xl font-bebas italic text-green-400">
                  ${stats.totalRevenue.toFixed(2)}
                </p>
                <p className="text-white/40 text-sm mt-1">Lifetime</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl">
                <p className="text-xs uppercase tracking-wider text-blue-400 mb-2">Total Orders</p>
                <p className="text-4xl font-bebas italic text-blue-400">
                  {stats.totalOrders}
                </p>
                <p className="text-white/40 text-sm mt-1">All time</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl">
                <p className="text-xs uppercase tracking-wider text-amber-400 mb-2">Avg Order Value</p>
                <p className="text-4xl font-bebas italic text-amber-400">
                  ${stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00'}
                </p>
                <p className="text-white/40 text-sm mt-1">Per order</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-2xl">
                <p className="text-xs uppercase tracking-wider text-purple-400 mb-2">Impact Fund</p>
                <p className="text-4xl font-bebas italic text-purple-400">
                  ${stats.totalImpact.toFixed(2)}
                </p>
                <p className="text-white/40 text-sm mt-1">10% of revenue</p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Revenue by Category */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <h3 className="text-lg font-bebas italic tracking-wider mb-4">Sales by Category</h3>
                <div className="space-y-3">
                  {['Men', 'Women'].map(category => {
                    const categoryOrders = orders.filter(o => {
                      // Check if any items in the order match this category
                      // For now, simple calculation based on product data we have
                      return true; // Placeholder - would need order items with category
                    });
                    const categoryRevenue = categoryOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0) * 0.5; // Estimated split
                    const percentage = stats.totalRevenue > 0 ? (categoryRevenue / stats.totalRevenue) * 100 : 0;
                    
                    return (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{category}</span>
                          <span className="text-white/60">${categoryRevenue.toFixed(2)} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${category === 'Men' ? 'bg-blue-500' : 'bg-pink-500'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Status Breakdown */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <h3 className="text-lg font-bebas italic tracking-wider mb-4">Order Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { status: 'pending', label: 'Pending', color: 'bg-yellow-500' },
                    { status: 'processing', label: 'Processing', color: 'bg-blue-500' },
                    { status: 'shipped', label: 'Shipped', color: 'bg-purple-500' },
                    { status: 'delivered', label: 'Delivered', color: 'bg-green-500' },
                  ].map(({ status, label, color }) => {
                    const count = orders.filter(o => o.status === status).length;
                    const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
                    
                    return (
                      <div key={status} className="p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${color}`} />
                          <span className="text-sm text-white/60">{label}</span>
                        </div>
                        <p className="text-2xl font-bebas italic">{count}</p>
                        <p className="text-xs text-white/40">{percentage.toFixed(1)}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <h3 className="text-lg font-bebas italic tracking-wider mb-4">Top Performing Products</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {products.slice(0, 6).map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.title}</p>
                      <p className="text-sm text-white/40">${product.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bebas italic text-green-400">
                        ${(product.price * Math.floor(Math.random() * 20)).toFixed(0)}
                      </p>
                      <p className="text-xs text-white/40">est. revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Discounts View */}
        {activeView === 'discounts' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-bebas italic tracking-wider">Promo Codes</h2>
              <button
                onClick={() => setShowAddDiscount(true)}
                className="px-6 py-3 bg-white text-black text-sm font-bold tracking-wider uppercase rounded-lg hover:bg-white/90 transition-colors"
              >
                + Create Code
              </button>
            </div>

            {/* Active Codes Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-green-400 mb-1">Active Codes</p>
                <p className="text-3xl font-bebas italic text-green-400">{discounts.filter(d => d.isActive && new Date(d.expiresAt) > new Date()).length}</p>
              </div>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-blue-400 mb-1">Total Uses</p>
                <p className="text-3xl font-bebas italic text-blue-400">{discounts.reduce((sum, d) => sum + (d.usedCount || 0), 0)}</p>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-amber-400 mb-1">Expired</p>
                <p className="text-3xl font-bebas italic text-amber-400">{discounts.filter(d => new Date(d.expiresAt) <= new Date()).length}</p>
              </div>
            </div>

            {/* Discounts Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Code</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">Discount</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">Uses</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">Expires</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">Status</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-white/40">
                        No promo codes yet. Create one to get started.
                      </td>
                    </tr>
                  ) : (
                    discounts.map((discount) => (
                      <tr key={discount.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4">
                          <span className="font-mono font-bold text-lg">{discount.code}</span>
                          {discount.minOrder > 0 && (
                            <p className="text-xs text-white/40">Min order: ${discount.minOrder}</p>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-green-400 font-bold">
                            {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}
                          </span>
                          <span className="text-white/40 text-sm ml-1">OFF</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                            {discount.usedCount || 0} / {discount.maxUses}
                          </span>
                        </td>
                        <td className="p-4 text-center text-white/60 text-sm">
                          {discount.expiresAt ? new Date(discount.expiresAt).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs uppercase ${
                            discount.isActive && new Date(discount.expiresAt) > new Date()
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {discount.isActive && new Date(discount.expiresAt) > new Date() ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'discounts', discount.id), {
                                  isActive: !discount.isActive,
                                  updated_at: new Date().toISOString()
                                });
                                setDiscounts(discounts.map(d => 
                                  d.id === discount.id ? { ...d, isActive: !d.isActive } : d
                                ));
                              } catch (err) {
                                console.error('Error toggling discount:', err);
                              }
                            }}
                            className="px-3 py-1.5 bg-white/10 text-white text-xs rounded hover:bg-white/20 transition-colors"
                          >
                            {discount.isActive ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Alerts View - Low Stock */}
        {activeView === 'alerts' && (
          <div>
            <h2 className="text-4xl font-bebas italic tracking-wider mb-8">Low Stock Alerts</h2>

            {/* Alert Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {(() => {
                const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
                const lowStockProducts = products.filter(p => {
                  return sizes.some(size => ((p.stock as Record<string, number>)?.[size] || 0) < 5);
                });
                const criticalStock = products.filter(p => {
                  return sizes.some(size => ((p.stock as Record<string, number>)?.[size] || 0) === 0);
                });
                const lowStockCount = lowStockProducts.length;
                const criticalCount = criticalStock.length;
                const totalLowItems = products.reduce((sum, p) => {
                  return sum + sizes.filter(size => ((p.stock as Record<string, number>)?.[size] || 0) < 5).length;
                }, 0);

                return (
                  <>
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-xs uppercase tracking-wider text-yellow-400 mb-1">Low Stock Items</p>
                      <p className="text-3xl font-bebas italic text-yellow-400">{totalLowItems}</p>
                      <p className="text-xs text-white/40 mt-1">&lt; 5 units</p>
                    </div>
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-xs uppercase tracking-wider text-red-400 mb-1">Out of Stock</p>
                      <p className="text-3xl font-bebas italic text-red-400">{criticalCount}</p>
                      <p className="text-xs text-white/40 mt-1">0 units</p>
                    </div>
                    <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <p className="text-xs uppercase tracking-wider text-orange-400 mb-1">Products Affected</p>
                      <p className="text-3xl font-bebas italic text-orange-400">{lowStockCount}</p>
                      <p className="text-xs text-white/40 mt-1">need restock</p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Low Stock Products */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full min-w-[900px]">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Product</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">XS</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">S</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">M</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">L</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">XL</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">XXL</th>
                    <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
                    const lowStockProducts = products.filter(p => 
                      sizes.some(size => ((p.stock as Record<string, number>)?.[size] || 0) < 5)
                    );

                    if (lowStockProducts.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-white/40">
                            ✅ All stock levels are healthy! No alerts at this time.
                          </td>
                        </tr>
                      );
                    }

                    return lowStockProducts.map((product) => (
                      <tr key={product.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4">
                          <p className="font-medium">{product.title}</p>
                          <p className="text-white/40 text-xs">{product.category}</p>
                        </td>
                        {sizes.map((size) => {
                          const stock = (product.stock as Record<string, number>)?.[size] || 0;
                          const isLow = stock < 5;
                          const isCritical = stock === 0;
                          
                          return (
                            <td key={size} className="p-4 text-center">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                isCritical ? 'bg-red-500 text-white' :
                                isLow ? 'bg-yellow-500 text-black' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {stock}
                              </span>
                            </td>
                          );
                        })}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setActiveView('inventory')}
                            className="px-3 py-1.5 bg-white/10 text-white text-xs rounded hover:bg-white/20 transition-colors"
                          >
                            Restock
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Finance View */}
        {activeView === 'finance' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-bebas italic tracking-wider">Financial Overview</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setFinanceView('daily')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    financeView === 'daily' ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  Daily P&L
                </button>
                <button
                  onClick={() => setFinanceView('monthly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    financeView === 'monthly' ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setFinanceView('expenses')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    financeView === 'expenses' ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  Expenses
                </button>
                <button
                  onClick={() => setFinanceView('tax')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    financeView === 'tax' ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  Tax Prep
                </button>
              </div>
            </div>

            {/* Daily P&L View */}
            {financeView === 'daily' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                {(() => {
                  const today = new Date().toISOString().split('T')[0];
                  const todayOrders = orders.filter(o => o.created_at?.split('T')[0] === today);
                  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
                  const todayExpenses = expenses.filter(e => e.date === today).reduce((sum, e) => sum + (e.amount || 0), 0);
                  const todayNet = todayRevenue - todayExpenses;
                  const todayDonation = todayRevenue * 0.10;
                  
                  return (
                    <>
                      <div className="grid grid-cols-5 gap-4">
                        <div className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl">
                          <p className="text-xs uppercase tracking-wider text-green-400 mb-2">Today's Revenue</p>
                          <p className="text-3xl font-bebas italic text-green-400">${todayRevenue.toFixed(2)}</p>
                          <p className="text-white/40 text-sm mt-1">{todayOrders.length} orders</p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-2xl">
                          <p className="text-xs uppercase tracking-wider text-red-400 mb-2">Today's Expenses</p>
                          <p className="text-3xl font-bebas italic text-red-400">${todayExpenses.toFixed(2)}</p>
                          <p className="text-white/40 text-sm mt-1">{expenses.filter(e => e.date === today).length} transactions</p>
                        </div>
                        <div className={`p-6 bg-gradient-to-br ${todayNet >= 0 ? 'from-blue-500/10 to-blue-500/5 border-blue-500/20' : 'from-orange-500/10 to-orange-500/5 border-orange-500/20'} border rounded-2xl`}>
                          <p className={`text-xs uppercase tracking-wider ${todayNet >= 0 ? 'text-blue-400' : 'text-orange-400'} mb-2`}>Net Profit</p>
                          <p className={`text-3xl font-bebas italic ${todayNet >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>${todayNet.toFixed(2)}</p>
                          <p className="text-white/40 text-sm mt-1">{todayNet >= 0 ? 'In the green' : 'In the red'}</p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-2xl">
                          <p className="text-xs uppercase tracking-wider text-purple-400 mb-2">Impact Fund (10%)</p>
                          <p className="text-3xl font-bebas italic text-purple-400">${todayDonation.toFixed(2)}</p>
                          <p className="text-white/40 text-sm mt-1">Auto-calculated</p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl">
                          <p className="text-xs uppercase tracking-wider text-amber-400 mb-2">Margin</p>
                          <p className="text-3xl font-bebas italic text-amber-400">
                            {todayRevenue > 0 ? ((todayNet / todayRevenue) * 100).toFixed(1) : '0.0'}%
                          </p>
                          <p className="text-white/40 text-sm mt-1">Profit margin</p>
                        </div>
                      </div>

                      {/* Today's Activity */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                          <h3 className="text-lg font-bebas italic tracking-wider mb-4">Today's Orders</h3>
                          {todayOrders.length === 0 ? (
                            <p className="text-white/40 text-center py-8">No orders today yet.</p>
                          ) : (
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {todayOrders.map(order => (
                                <div key={order.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                  <div>
                                    <p className="font-medium">#{order.id.slice(-6).toUpperCase()}</p>
                                    <p className="text-white/40 text-xs">{order.customer_name}</p>
                                  </div>
                                  <p className="text-green-400 font-bebas italic text-xl">+${order.total_amount?.toFixed(2)}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                          <h3 className="text-lg font-bebas italic tracking-wider mb-4">Today's Expenses</h3>
                          {expenses.filter(e => e.date === today).length === 0 ? (
                            <p className="text-white/40 text-center py-8">No expenses recorded today.</p>
                          ) : (
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {expenses.filter(e => e.date === today).map(expense => (
                                <div key={expense.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                  <div>
                                    <p className="font-medium">{expense.description}</p>
                                    <p className="text-white/40 text-xs">{expense.category}</p>
                                  </div>
                                  <p className="text-red-400 font-bebas italic text-xl">-${expense.amount?.toFixed(2)}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Monthly View */}
            {financeView === 'monthly' && (
              <div className="space-y-6">
                {(() => {
                  const currentMonth = new Date().toISOString().slice(0, 7); // "2026-02"
                  const monthlyOrders = orders.filter(o => o.created_at?.startsWith(currentMonth));
                  const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
                  const monthlyExpenses = expenses.filter(e => e.date?.startsWith(currentMonth)).reduce((sum, e) => sum + (e.amount || 0), 0);
                  const monthlyNet = monthlyRevenue - monthlyExpenses;
                  const monthlyDonation = monthlyRevenue * 0.10;
                  const monthlyGst = expenses.filter(e => e.date?.startsWith(currentMonth) && e.hasGst).reduce((sum, e) => sum + (e.gstAmount || 0), 0);
                  
                  // Get last 6 months for chart
                  const months: string[] = [];
                  for (let i = 5; i >= 0; i--) {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    months.push(d.toISOString().slice(0, 7));
                  }
                  
                  return (
                    <>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl">
                          <p className="text-xs uppercase tracking-wider text-green-400 mb-2">{currentMonth} Revenue</p>
                          <p className="text-4xl font-bebas italic text-green-400">${monthlyRevenue.toFixed(2)}</p>
                          <p className="text-white/40 text-sm mt-1">{monthlyOrders.length} orders</p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-2xl">
                          <p className="text-xs uppercase tracking-wider text-red-400 mb-2">{currentMonth} Expenses</p>
                          <p className="text-4xl font-bebas italic text-red-400">${monthlyExpenses.toFixed(2)}</p>
                          <p className="text-white/40 text-sm mt-1">{expenses.filter(e => e.date?.startsWith(currentMonth)).length} transactions</p>
                        </div>
                        <div className={`p-6 bg-gradient-to-br ${monthlyNet >= 0 ? 'from-blue-500/10 to-blue-500/5 border-blue-500/20' : 'from-orange-500/10 to-orange-500/5 border-orange-500/20'} border rounded-2xl`}>
                          <p className={`text-xs uppercase tracking-wider ${monthlyNet >= 0 ? 'text-blue-400' : 'text-orange-400'} mb-2`}>Net Profit</p>
                          <p className={`text-4xl font-bebas italic ${monthlyNet >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>${monthlyNet.toFixed(2)}</p>
                          <p className="text-white/40 text-sm mt-1">This month</p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-2xl">
                          <p className="text-xs uppercase tracking-wider text-purple-400 mb-2">GST Paid</p>
                          <p className="text-4xl font-bebas italic text-purple-400">${monthlyGst.toFixed(2)}</p>
                          <p className="text-white/40 text-sm mt-1">Input tax credits</p>
                        </div>
                      </div>

                      {/* Simple Bar Chart */}
                      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <h3 className="text-lg font-bebas italic tracking-wider mb-4">6-Month Trend</h3>
                        <div className="flex items-end justify-between h-48 gap-2">
                          {months.map(month => {
                            const mOrders = orders.filter(o => o.created_at?.startsWith(month));
                            const mRevenue = mOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
                            const mExpenses = expenses.filter(e => e.date?.startsWith(month)).reduce((sum, e) => sum + (e.amount || 0), 0);
                            const maxVal = Math.max(...months.map(m => {
                              const r = orders.filter(o => o.created_at?.startsWith(m)).reduce((s, o) => s + (o.total_amount || 0), 0);
                              const e = expenses.filter(x => x.date?.startsWith(m)).reduce((s, x) => s + (x.amount || 0), 0);
                              return Math.max(r, e);
                            }), 1);
                            
                            return (
                              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full flex flex-col gap-1 h-36 justify-end">
                                  <div 
                                    className="w-full bg-green-500/60 rounded-t"
                                    style={{ height: `${(mRevenue / maxVal) * 100}%`, minHeight: mRevenue > 0 ? '4px' : '0' }}
                                    title={`Revenue: $${mRevenue.toFixed(2)}`}
                                  />
                                  <div 
                                    className="w-full bg-red-500/60 rounded-t"
                                    style={{ height: `${(mExpenses / maxVal) * 100}%`, minHeight: mExpenses > 0 ? '4px' : '0' }}
                                    title={`Expenses: $${mExpenses.toFixed(2)}`}
                                  />
                                </div>
                                <p className="text-xs text-white/40">{month.slice(5)}</p>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-center gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500/60 rounded" />
                            <span className="text-xs text-white/60">Revenue</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500/60 rounded" />
                            <span className="text-xs text-white/60">Expenses</span>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Expenses View */}
            {financeView === 'expenses' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bebas italic tracking-wider">Expense Tracker</h3>
                    <p className="text-white/40 text-sm">{expenses.length} total transactions</p>
                  </div>
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="px-6 py-3 bg-white text-black text-sm font-bold tracking-wider uppercase rounded-lg hover:bg-white/90 transition-colors"
                  >
                    + Add Expense
                  </button>
                </div>

                {/* Expense Categories Summary */}
                <div className="grid grid-cols-6 gap-4 mb-6">
                  {['Shipping', 'Marketing', 'Software', 'Inventory', 'Legal/Admin', 'Other'].map(cat => {
                    const catTotal = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + (e.amount || 0), 0);
                    return (
                      <div key={cat} className="p-4 bg-white/5 border border-white/10 rounded-lg text-center">
                        <p className="text-white/40 text-xs uppercase mb-1">{cat}</p>
                        <p className="text-xl font-bebas italic">${catTotal.toFixed(0)}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Expenses Table */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Date</th>
                        <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Description</th>
                        <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">Category</th>
                        <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">GST</th>
                        <th className="text-right p-4 text-xs uppercase tracking-wider text-white/40">Amount</th>
                        <th className="text-center p-4 text-xs uppercase tracking-wider text-white/40">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-white/40">
                            No expenses recorded yet. Click "Add Expense" to get started.
                          </td>
                        </tr>
                      ) : (
                        expenses.map(expense => (
                          <tr key={expense.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-4 text-white/60 text-sm">{expense.date}</td>
                            <td className="p-4">{expense.description}</td>
                            <td className="p-4 text-center">
                              <span className="px-3 py-1 bg-white/10 rounded-full text-xs">{expense.category}</span>
                            </td>
                            <td className="p-4 text-center">
                              {expense.hasGst ? (
                                <span className="text-green-400 text-xs">${expense.gstAmount?.toFixed(2)}</span>
                              ) : (
                                <span className="text-white/20 text-xs">—</span>
                              )}
                            </td>
                            <td className="p-4 text-right font-bebas italic text-lg">${expense.amount?.toFixed(2)}</td>
                            <td className="p-4 text-center">
                              <button
                                onClick={async () => {
                                  if (!confirm('Delete this expense?')) return;
                                  try {
                                    await deleteDoc(doc(db, 'expenses', expense.id));
                                    setExpenses(expenses.filter(e => e.id !== expense.id));
                                  } catch (err) {
                                    console.error('Error deleting expense:', err);
                                  }
                                }}
                                className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30 transition-colors"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tax Prep View */}
            {financeView === 'tax' && (
              <div className="space-y-6">
                {(() => {
                  const currentYear = new Date().getFullYear();
                  const ytdOrders = orders.filter(o => o.created_at?.startsWith(String(currentYear)));
                  const ytdRevenue = ytdOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
                  const ytdExpenses = expenses.filter(e => e.date?.startsWith(String(currentYear))).reduce((sum, e) => sum + (e.amount || 0), 0);
                  const ytdGst = expenses.filter(e => e.date?.startsWith(String(currentYear)) && e.hasGst).reduce((sum, e) => sum + (e.gstAmount || 0), 0);
                  const estimatedTaxable = ytdRevenue - ytdExpenses;
                  const estimatedTax = estimatedTaxable > 0 ? estimatedTaxable * 0.25 : 0; // Rough 25% estimate
                  
                  return (
                    <>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl">
                          <p className="text-xs uppercase tracking-wider text-blue-400 mb-2">YTD Revenue</p>
                          <p className="text-3xl font-bebas italic text-blue-400">${ytdRevenue.toFixed(2)}</p>
                          <p className="text-white/40 text-sm mt-1">{currentYear}</p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-2xl">
                          <p className="text-xs uppercase tracking-wider text-red-400 mb-2">YTD Expenses</p>
                          <p className="text-3xl font-bebas italic text-red-400">${ytdExpenses.toFixed(2)}</p>
                          <p className="text-white/40 text-sm mt-1">Deductible</p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-2xl">
                          <p className="text-xs uppercase tracking-wider text-purple-400 mb-2">GST Credits</p>
                          <p className="text-3xl font-bebas italic text-purple-400">${ytdGst.toFixed(2)}</p>
                          <p className="text-white/40 text-sm mt-1">Input tax credits</p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl">
                          <p className="text-xs uppercase tracking-wider text-amber-400 mb-2">Est. Tax Owed</p>
                          <p className="text-3xl font-bebas italic text-amber-400">${estimatedTax.toFixed(2)}</p>
                          <p className="text-white/40 text-sm mt-1">~25% of profit</p>
                        </div>
                      </div>

                      {/* Tax Notes */}
                      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <h3 className="text-lg font-bebas italic tracking-wider mb-4">Tax Preparation Notes</h3>
                        <div className="space-y-3 text-sm text-white/60">
                          <p>• <strong>GST/HST:</strong> You have ${ytdGst.toFixed(2)} in input tax credits from business expenses.</p>
                          <p>• <strong>Deductible Expenses:</strong> ${ytdExpenses.toFixed(2)} in total business expenses recorded.</p>
                          <p>• <strong>Home Office:</strong> If you work from home, you may claim a portion of rent/utilities.</p>
                          <p>• <strong>Vehicle:</strong> Track business mileage for additional deductions.</p>
                          <p>• <strong>Professional Fees:</strong> Accountant and legal fees are 100% deductible.</p>
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/10">
                          <p className="text-xs text-white/40">
                            <strong>Note:</strong> Tax estimates are rough (25% of profit). Consult an accountant for accurate calculations. 
                            This is not tax advice.
                          </p>
                        </div>
                      </div>

                      {/* Export Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            const csv = [
                              ['Date', 'Description', 'Category', 'Amount', 'GST', 'Total'].join(','),
                              ...expenses.map(e => [
                                e.date,
                                `"${e.description}"`,
                                e.category,
                                e.amount,
                                e.hasGst ? e.gstAmount : 0,
                                e.hasGst ? e.amount + e.gstAmount : e.amount
                              ].join(','))
                            ].join('\n');
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `expenses-${currentYear}.csv`;
                            a.click();
                          }}
                          className="px-6 py-3 bg-white text-black text-sm font-bold tracking-wider uppercase rounded-lg hover:bg-white/90 transition-colors"
                        >
                          Export Expenses (CSV)
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Add Expense Modal */}
            {showAddExpense && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 w-full max-w-lg">
                  <h3 className="text-2xl font-bebas italic tracking-wider mb-6">Add Expense</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Description *</label>
                      <input
                        type="text"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                        placeholder="e.g., Shopify subscription"
                        className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Amount ($) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newExpense.amount || ''}
                          onChange={(e) => {
                            const amount = parseFloat(e.target.value) || 0;
                            const gstAmount = newExpense.hasGst ? amount * 0.05 : 0;
                            setNewExpense({...newExpense, amount, gstAmount});
                          }}
                          placeholder="49.99"
                          className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Category</label>
                        <select
                          value={newExpense.category}
                          onChange={(e) => setNewExpense({...newExpense, category: e.target.value as any})}
                          className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                        >
                          <option value="Shipping">Shipping</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Software">Software</option>
                          <option value="Inventory">Inventory</option>
                          <option value="Legal/Admin">Legal/Admin</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Date</label>
                      <input
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                        className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                      <input
                        type="checkbox"
                        id="hasGst"
                        checked={newExpense.hasGst}
                        onChange={(e) => {
                          const hasGst = e.target.checked;
                          const gstAmount = hasGst ? (newExpense.amount || 0) * 0.05 : 0;
                          setNewExpense({...newExpense, hasGst, gstAmount});
                        }}
                        className="w-5 h-5 rounded border-white/20 bg-black"
                      />
                      <label htmlFor="hasGst" className="flex-1">
                        <span className="text-sm font-medium">Includes GST (5%)</span>
                        <p className="text-xs text-white/40">Check if this expense includes GST</p>
                      </label>
                      {newExpense.hasGst && (
                        <span className="text-green-400 font-bebas italic">+${newExpense.gstAmount.toFixed(2)} GST</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={() => {
                        setShowAddExpense(false);
                        setNewExpense({
                          description: '',
                          amount: 0,
                          category: 'Shipping',
                          date: new Date().toISOString().split('T')[0],
                          gstAmount: 0,
                          hasGst: false,
                        });
                      }}
                      className="flex-1 py-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!newExpense.description || !newExpense.amount) return;
                        try {
                          const expenseData = {
                            description: newExpense.description,
                            amount: newExpense.amount,
                            category: newExpense.category,
                            date: newExpense.date,
                            hasGst: newExpense.hasGst,
                            gstAmount: newExpense.gstAmount,
                            created_at: new Date().toISOString(),
                          };
                          const docRef = await addDoc(collection(db, 'expenses'), expenseData);
                          setExpenses([{ id: docRef.id, ...expenseData }, ...expenses]);
                          setShowAddExpense(false);
                          setNewExpense({
                            description: '',
                            amount: 0,
                            category: 'Shipping',
                            date: new Date().toISOString().split('T')[0],
                            gstAmount: 0,
                            hasGst: false,
                          });
                        } catch (err) {
                          console.error('Error adding expense:', err);
                        }
                      }}
                      disabled={!newExpense.description || !newExpense.amount}
                      className="flex-1 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-bold disabled:opacity-50"
                    >
                      Add Expense
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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

      {/* Global Search Modal */}
      {showGlobalSearch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-start justify-center pt-32 p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden">
            {/* Search Input */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <span className="text-white/40 text-xl">🔍</span>
              <input
                type="text"
                autoFocus
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder="Search products, orders, customers..."
                className="flex-1 bg-transparent text-lg focus:outline-none text-white placeholder:text-white/40"
              />
              <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/40">ESC</span>
            </div>
            
            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto">
              {globalSearchQuery.length < 2 ? (
                <div className="p-8 text-center text-white/40">
                  <p className="mb-2">Start typing to search...</p>
                  <p className="text-sm">Try: product name, order ID, customer email</p>
                </div>
              ) : (
                <>
                  {/* Products Results */}
                  {products.filter(p => 
                    p.title?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                    p.slug?.toLowerCase().includes(globalSearchQuery.toLowerCase())
                  ).length > 0 && (
                    <div className="p-2">
                      <p className="px-3 py-2 text-xs uppercase tracking-wider text-white/40">Products</p>
                      {products
                        .filter(p => 
                          p.title?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                          p.slug?.toLowerCase().includes(globalSearchQuery.toLowerCase())
                        )
                        .slice(0, 5)
                        .map(product => (
                          <button
                            key={product.id}
                            onClick={() => {
                              setShowGlobalSearch(false);
                              setGlobalSearchQuery('');
                              setActiveView('inventory');
                              setEditingProduct(product);
                            }}
                            className="w-full text-left px-3 py-3 rounded-lg hover:bg-white/5 flex items-center gap-3"
                          >
                            <span className="text-2xl">📦</span>
                            <div className="flex-1">
                              <p className="font-medium">{product.title}</p>
                              <p className="text-sm text-white/40">${product.price} • {product.category}</p>
                            </div>
                            <span className="text-white/20 text-sm">Edit →</span>
                          </button>
                        ))}
                    </div>
                  )}
                  
                  {/* Orders Results */}
                  {orders.filter(o => 
                    o.id?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                    o.customer_name?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                    o.customer_email?.toLowerCase().includes(globalSearchQuery.toLowerCase())
                  ).length > 0 && (
                    <div className="p-2 border-t border-white/5">
                      <p className="px-3 py-2 text-xs uppercase tracking-wider text-white/40">Orders</p>
                      {orders
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
                              setShowGlobalSearch(false);
                              setGlobalSearchQuery('');
                              setActiveView('orders');
                            }}
                            className="w-full text-left px-3 py-3 rounded-lg hover:bg-white/5 flex items-center gap-3"
                          >
                            <span className="text-2xl">🛒</span>
                            <div className="flex-1">
                              <p className="font-medium">Order #{order.id.slice(-6).toUpperCase()}</p>
                              <p className="text-sm text-white/40">{order.customer_name} • ${order.total_amount?.toFixed(2)}</p>
                            </div>
                            <span className="text-white/20 text-sm">View →</span>
                          </button>
                        ))}
                    </div>
                  )}
                  
                  {/* Customers Results */}
                  {(() => {
                    const uniqueCustomers = Array.from(new Set(orders.map(o => o.customer_email)));
                    const filteredCustomers = uniqueCustomers.filter(email => 
                      email?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                      orders.find(o => o.customer_email === email)?.customer_name?.toLowerCase().includes(globalSearchQuery.toLowerCase())
                    );
                    return filteredCustomers.length > 0 ? (
                      <div className="p-2 border-t border-white/5">
                        <p className="px-3 py-2 text-xs uppercase tracking-wider text-white/40">Customers</p>
                        {filteredCustomers.slice(0, 5).map(email => {
                          const customer = orders.find(o => o.customer_email === email);
                          const orderCount = orders.filter(o => o.customer_email === email).length;
                          return (
                            <button
                              key={email}
                              onClick={() => {
                                setShowGlobalSearch(false);
                                setGlobalSearchQuery('');
                                setActiveView('customers');
                              }}
                              className="w-full text-left px-3 py-3 rounded-lg hover:bg-white/5 flex items-center gap-3"
                            >
                              <span className="text-2xl">👤</span>
                              <div className="flex-1">
                                <p className="font-medium">{customer?.customer_name || 'Unknown'}</p>
                                <p className="text-sm text-white/40">{email} • {orderCount} orders</p>
                              </div>
                              <span className="text-white/20 text-sm">View →</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null;
                  })()}
                  
                  {/* No Results */}
                  {products.filter(p => 
                    p.title?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                    p.slug?.toLowerCase().includes(globalSearchQuery.toLowerCase())
                  ).length === 0 &&
                  orders.filter(o => 
                    o.id?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                    o.customer_name?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                    o.customer_email?.toLowerCase().includes(globalSearchQuery.toLowerCase())
                  ).length === 0 &&
                  (() => {
                    const uniqueCustomers = Array.from(new Set(orders.map(o => o.customer_email)));
                    return uniqueCustomers.filter(email => 
                      email?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                      orders.find(o => o.customer_email === email)?.customer_name?.toLowerCase().includes(globalSearchQuery.toLowerCase())
                    ).length === 0;
                  })() && (
                    <div className="p-8 text-center text-white/40">
                      <p>No results found for "{globalSearchQuery}"</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bebas italic tracking-wider">Order #{viewingOrder.id.slice(-6).toUpperCase()}</h3>
                <p className="text-white/40 text-sm">
                  {viewingOrder.created_at ? new Date(viewingOrder.created_at).toLocaleString() : 'N/A'}
                </p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm uppercase font-medium ${
                viewingOrder.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                viewingOrder.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                viewingOrder.status === 'shipped' ? 'bg-purple-500/20 text-purple-400' :
                viewingOrder.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {viewingOrder.status}
              </span>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-xs uppercase tracking-wider text-white/40 mb-3">Customer</p>
                  <p className="font-medium text-lg">{viewingOrder.customer_name}</p>
                  <p className="text-white/60">{viewingOrder.customer_email}</p>
                  {(() => {
                    const customerOrders = orders.filter(o => o.customer_email === viewingOrder.customer_email);
                    const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
                    return (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-sm text-white/40">
                          {customerOrders.length} orders • ${totalSpent.toFixed(2)} lifetime
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-xs uppercase tracking-wider text-white/40 mb-3">Shipping Address</p>
                  {viewingOrder.shipping_address ? (
                    <div className="text-white/80 text-sm space-y-1">
                      <p>{viewingOrder.shipping_address.name}</p>
                      <p>{viewingOrder.shipping_address.line1}</p>
                      {viewingOrder.shipping_address.line2 && <p>{viewingOrder.shipping_address.line2}</p>}
                      <p>{viewingOrder.shipping_address.city}, {viewingOrder.shipping_address.state} {viewingOrder.shipping_address.postal_code}</p>
                      <p>{viewingOrder.shipping_address.country}</p>
                    </div>
                  ) : (
                    <p className="text-white/40">No shipping address on file</p>
                  )}
                </div>
              </div>

              {/* Line Items */}
              <div>
                <p className="text-xs uppercase tracking-wider text-white/40 mb-3">Order Items</p>
                <div className="bg-white/5 rounded-xl overflow-hidden">
                  {viewingOrder.items?.length > 0 ? (
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="text-left p-3 text-xs uppercase tracking-wider text-white/40">Product</th>
                          <th className="text-center p-3 text-xs uppercase tracking-wider text-white/40">Size</th>
                          <th className="text-center p-3 text-xs uppercase tracking-wider text-white/40">Color</th>
                          <th className="text-center p-3 text-xs uppercase tracking-wider text-white/40">Qty</th>
                          <th className="text-right p-3 text-xs uppercase tracking-wider text-white/40">Price</th>
                          <th className="text-right p-3 text-xs uppercase tracking-wider text-white/40">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingOrder.items.map((item: any, idx: number) => (
                          <tr key={idx} className="border-t border-white/5">
                            <td className="p-3">
                              <p className="font-medium">{item.title || item.name}</p>
                              {item.variant && <p className="text-xs text-white/40">{item.variant}</p>}
                            </td>
                            <td className="p-3 text-center text-white/60">{item.size || '-'}</td>
                            <td className="p-3 text-center text-white/60">{item.color || '-'}</td>
                            <td className="p-3 text-center">{item.quantity}</td>
                            <td className="p-3 text-right text-white/60">${item.price?.toFixed(2)}</td>
                            <td className="p-3 text-right font-medium">${(item.price * item.quantity)?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-white/40">
                      <p>Item details not available for this order</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-white/60">
                    <span>Subtotal</span>
                    <span>${((viewingOrder.total_amount || 0) * 0.85).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Tax (15%)</span>
                    <span>${((viewingOrder.total_amount || 0) * 0.15).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between text-xl font-bebas italic">
                    <span>Total</span>
                    <span className="text-green-400">${viewingOrder.total_amount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => setViewingOrder(null)}
                  className="flex-1 py-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setActiveView('customers');
                    setViewingOrder(null);
                  }}
                  className="flex-1 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-bold"
                >
                  View Customer History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Add Discount Modal */}
      {showAddDiscount && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 w-full max-w-lg">
            <h3 className="text-2xl font-bebas italic tracking-wider mb-6">Create Promo Code</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Code *</label>
                <input
                  type="text"
                  value={newDiscount.code}
                  onChange={(e) => setNewDiscount({...newDiscount, code: e.target.value.toUpperCase()})}
                  placeholder="SUMMER2025"
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Type</label>
                  <select
                    value={newDiscount.type}
                    onChange={(e) => setNewDiscount({...newDiscount, type: e.target.value as 'percentage' | 'fixed'})}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                  >
                    <option value="percentage">Percentage %</option>
                    <option value="fixed">Fixed Amount $</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Value</label>
                  <input
                    type="number"
                    value={newDiscount.value || ''}
                    onChange={(e) => setNewDiscount({...newDiscount, value: parseFloat(e.target.value) || 0})}
                    placeholder={newDiscount.type === 'percentage' ? '20' : '25'}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Minimum Order ($)</label>
                <input
                  type="number"
                  value={newDiscount.minOrder || ''}
                  onChange={(e) => setNewDiscount({...newDiscount, minOrder: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                />
                <p className="text-white/30 text-xs mt-1">Leave 0 for no minimum</p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Max Uses</label>
                <input
                  type="number"
                  value={newDiscount.maxUses || ''}
                  onChange={(e) => setNewDiscount({...newDiscount, maxUses: parseInt(e.target.value) || 0})}
                  placeholder="100"
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Expiration Date</label>
                <input
                  type="date"
                  value={newDiscount.expiresAt}
                  onChange={(e) => setNewDiscount({...newDiscount, expiresAt: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:border-white/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setShowAddDiscount(false);
                  setNewDiscount({
                    code: '',
                    type: 'percentage',
                    value: 0,
                    minOrder: 0,
                    maxUses: 100,
                    usedCount: 0,
                    expiresAt: '',
                    isActive: true,
                  });
                }}
                className="flex-1 py-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newDiscount.code || !newDiscount.value) return;
                  try {
                    const discountData = {
                      code: newDiscount.code.toUpperCase(),
                      type: newDiscount.type,
                      value: newDiscount.value,
                      minOrder: newDiscount.minOrder,
                      maxUses: newDiscount.maxUses,
                      usedCount: 0,
                      expiresAt: newDiscount.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                      isActive: true,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    };
                    const docRef = await addDoc(collection(db, 'discounts'), discountData);
                    setDiscounts([...discounts, { id: docRef.id, ...discountData }]);
                    setShowAddDiscount(false);
                    setNewDiscount({
                      code: '',
                      type: 'percentage',
                      value: 0,
                      minOrder: 0,
                      maxUses: 100,
                      usedCount: 0,
                      expiresAt: '',
                      isActive: true,
                    });
                  } catch (err) {
                    console.error('Error creating discount:', err);
                  }
                }}
                disabled={!newDiscount.code || !newDiscount.value}
                className="flex-1 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-bold disabled:opacity-50"
              >
                Create Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
