'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { db, storage, getAuthClient } from '@/lib/firebase';
import {
  collection, getDocs, doc, updateDoc, addDoc, query, orderBy, type DocumentReference
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Product, ProductColor, StockRecord } from '@/lib/types';
import { safeParseProduct, type ValidatedProduct } from '@/lib/schemas';
import { SIZES, CATEGORIES, PRODUCT_TYPES } from '@/lib/constants';
import type { Size } from '@/lib/constants';
import { logAdminAction } from '@/lib/audit-log';

export default function ProductsPage() {
  const getAdminEmail = () => {
    const auth = getAuthClient();
    return auth?.currentUser?.email || 'unknown';
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addError, setAddError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const displayOrderTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Stock change modal
  const [showStockChangeModal, setShowStockChangeModal] = useState(false);
  const [stockChangeProduct, setStockChangeProduct] = useState<Product | null>(null);
  const [stockChangeSize, setStockChangeSize] = useState('');
  const [stockChangeAmount, setStockChangeAmount] = useState(0);
  const [stockChangeReason, setStockChangeReason] = useState('');
  const [stockChangeColor, setStockChangeColor] = useState<string | null>(null);

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
    newArrival: false,
    bestSeller: false,
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
    colors: [] as ProductColor[],
    imageUrl: '',
    images: [] as string[],
  });

  // Auto-generate slug from title
  useEffect(() => {
    if (newProduct.title && !newProduct.slug) {
      const slug = newProduct.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setNewProduct(prev => ({ ...prev, slug }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newProduct.title]);

  // Fetch all products on mount
  const fetchData = async () => {
    setLoading(true);
    try {
      let productsData: Product[] = [];
      try {
        const q = query(collection(db, 'products'), orderBy('displayOrder', 'asc'));
        const snap = await getDocs(q);
        productsData = snap.docs
          .map(d => safeParseProduct({ id: d.id, ...d.data() }))
          .filter((p): p is ValidatedProduct => p !== null) as Product[];
      } catch {
        const snap = await getDocs(collection(db, 'products'));
        productsData = snap.docs
          .map(d => safeParseProduct({ id: d.id, ...d.data() }))
          .filter((p): p is ValidatedProduct => p !== null) as Product[];
        productsData.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
      }
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update stock with inventory logging (server-side)
  const updateStock = async (
    productId: string,
    size: string,
    newStock: number,
    reason?: string,
    colorName?: string
  ) => {
    try {
      const res = await fetch('/api/admin/stock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          size,
          newStock,
          reason: reason || 'Manual adjustment',
          ...(colorName && { colorName }),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update stock');
        return;
      }

      // Refresh product data to reflect the change
      await fetchData();
    } catch (error: unknown) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Delete product (soft delete — preserves data for order history)
  const deleteProduct = async (productId: string) => {
    if (!confirm('Archive this product? It will be hidden but preserved for order history.')) {
      return;
    }

    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'products', productId), {
        is_deleted: true,
        deleted_at: now,
        is_active: false,
        updated_at: now,
      });
      setProducts(products.filter(p => p.id !== productId));
      logAdminAction('product_deleted', { productId, soft: true }, getAdminEmail());
    } catch (error) {
      console.error('Error archiving product:', error);
      alert('Failed to archive product');
    }
  };

  // Update display order
  const updateDisplayOrder = async (productId: string, newOrder: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentOrder = product.displayOrder || 1;
    if (newOrder === currentOrder) return;

    try {
      if (newOrder < currentOrder) {
        // Moving up - increment items between new and old position
        const toShift = products.filter(
          p => p.id !== productId && (p.displayOrder || 1) >= newOrder && (p.displayOrder || 1) < currentOrder
        );
        for (const p of toShift) {
          await updateDoc(doc(db, 'products', p.id), {
            displayOrder: (p.displayOrder || 1) + 1,
            updated_at: new Date().toISOString()
          });
        }
      } else {
        // Moving down - decrement items between old and new position
        const toShift = products.filter(
          p => p.id !== productId && (p.displayOrder || 1) <= newOrder && (p.displayOrder || 1) > currentOrder
        );
        for (const p of toShift) {
          await updateDoc(doc(db, 'products', p.id), {
            displayOrder: (p.displayOrder || 1) - 1,
            updated_at: new Date().toISOString()
          });
        }
      }

      await updateDoc(doc(db, 'products', productId), {
        displayOrder: newOrder,
        updated_at: new Date().toISOString()
      });

      await fetchData();
    } catch (error) {
      console.error('Error updating display order:', error);
    }
  };

  // Toggle featured
  const toggleFeatured = async (product: Product) => {
    const newState = !product.featured;
    try {
      if (newState) {
        // Limit to 3 featured per category
        const catFeatured = products.filter(
          p => p.category === product.category && p.featured && p.id !== product.id
        );
        if (catFeatured.length >= 3) {
          const oldest = catFeatured.sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )[0];
          await updateDoc(doc(db, 'products', oldest.id), {
            featured: false,
            updated_at: new Date().toISOString()
          });
          setProducts(prev => prev.map(p => p.id === oldest.id ? { ...p, featured: false } : p));
        }
      }
      await updateDoc(doc(db, 'products', product.id), {
        featured: newState,
        updated_at: new Date().toISOString()
      });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, featured: newState } : p));
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  // Toggle new arrival
  const toggleNewArrival = async (product: Product) => {
    const newState = !product.newArrival;
    try {
      await updateDoc(doc(db, 'products', product.id), {
        newArrival: newState,
        updated_at: new Date().toISOString()
      });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, newArrival: newState } : p));
    } catch (error) {
      console.error('Error toggling new arrival:', error);
    }
  };

  // Toggle best seller
  const toggleBestSeller = async (product: Product) => {
    const newState = !product.bestSeller;
    try {
      await updateDoc(doc(db, 'products', product.id), {
        bestSeller: newState,
        updated_at: new Date().toISOString()
      });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, bestSeller: newState } : p));
    } catch (error) {
      console.error('Error toggling best seller:', error);
    }
  };

  // Update product details
  const updateProductDetails = async (product: Product) => {
    try {
      const updateData: Partial<Product> & { updated_at: string } = {
        title: product.title,
        subtitle: product.subtitle,
        price: product.price,
        category: product.category,
        description: product.description || '',
        features: product.features || [],
        modelSize: product.modelSize || '',
        modelHeight: product.modelHeight || '',
        deliveryInfo: product.deliveryInfo || '',
        returnsInfo: product.returnsInfo || '',
        matchingSetSlug: product.matchingSetSlug || '',
        updated_at: new Date().toISOString()
      };

      if (product.productType) {
        updateData.productType = product.productType;
      }

      await updateDoc(doc(db, 'products', product.id), updateData);

      // Log admin action
      logAdminAction('product_updated', {
        productId: product.id,
        title: product.title,
        price: product.price,
        category: product.category,
      }, getAdminEmail());

      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, ...updateData } : p));
      setEditingProduct(null);
      alert('Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    }
  };

  // Handle drag events for image upload
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop events for image upload
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.length > 0) {
      await uploadImages(e.dataTransfer.files);
    }
  }, []);

  // Upload images to Firebase Storage
  const uploadImages = async (files: FileList) => {
    setUploadingImages(true);
    const urls: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      try {
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        urls.push(url);
      } catch (error) {
        console.error('Error uploading:', error);
      }
    }

    setNewProduct(prev => ({
      ...prev,
      images: [...prev.images, ...urls]
    }));
    setUploadingImages(false);
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await uploadImages(e.target.files);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Add new product
  const addProduct = async () => {
    setAddError('');
    setIsAdding(true);

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

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), 10000)
    );

    try {
      const targetOrder = newProduct.displayOrder || 1;

      // Shift display orders
      const toShift = products.filter(p => p.displayOrder >= targetOrder);
      for (const p of toShift) {
        await updateDoc(doc(db, 'products', p.id), {
          displayOrder: p.displayOrder + 1,
          updated_at: new Date().toISOString()
        });
      }

      // Prepare colors data
      const colorsData = newProduct.colors.length > 0
        ? newProduct.colors.map(c => ({
            name: c.name,
            hex: c.hex,
            images: c.images.length > 0 ? c.images : newProduct.images,
            stock: c.stock
          }))
        : undefined;

      const normalizedSlug = newProduct.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const productData: Omit<Product, 'id'> = {
        slug: normalizedSlug,
        title: newProduct.title.trim(),
        subtitle: newProduct.subtitle.trim(),
        price: newProduct.price,
        stock: newProduct.stock,
        images: newProduct.images,
        category: newProduct.category,
        productType: newProduct.productType,
        displayOrder: targetOrder,
        featured: newProduct.featured,
        newArrival: newProduct.newArrival,
        bestSeller: newProduct.bestSeller,
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

      if (colorsData) {
        productData.colors = colorsData;
        const totalStock: StockRecord = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 };

        colorsData.forEach((c: ProductColor) => {
          SIZES.forEach(s => {
            totalStock[s] += (c.stock[s] || 0);
          });
        });
        productData.stock = totalStock;
      } else {
        productData.stock = newProduct.stock;
        productData.images = newProduct.images.length > 0
          ? newProduct.images
          : (newProduct.imageUrl ? [newProduct.imageUrl] : []);
      }

      const productRef = await Promise.race([
        addDoc(collection(db, 'products'), productData),
        timeoutPromise
      ]) as DocumentReference;

      // Log admin action
      logAdminAction('product_created', {
        productId: productRef.id,
        title: newProduct.title,
        slug: productData.slug,
        price: newProduct.price,
        category: newProduct.category,
      }, getAdminEmail());

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
        newArrival: false,
        bestSeller: false,
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
     
    } catch (error: unknown) {
      setAddError(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/30 text-sm">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-bebas tracking-wider">Inventory Commander</h2>
          <p className="text-white/25 text-sm mt-1">{products.length} products</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 text-sm">⌕</span>
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search products..."
              className="input-premium pl-9 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm focus:outline-none w-56"
            />
          </div>
          <button
            onClick={() => {
              setShowAddProduct(true);
              setAddError('');
            }}
            className="btn-premium px-5 py-2.5 bg-white text-black text-sm font-bold tracking-wider uppercase rounded-xl hover:bg-white/90 transition-colors"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <div className="mb-4 p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl flex items-center justify-between">
          <span className="text-white/50 text-sm">{selectedProducts.length} selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedProducts([])}
              className="px-4 py-2 bg-white/[0.06] text-white/50 rounded-lg hover:bg-white/[0.1] transition-colors text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-white/[0.03] border-b border-white/[0.06]">
            <tr>
              <th className="text-center p-4 text-[10px] uppercase tracking-widest text-white/25">Sel</th>
              <th className="text-center p-4 text-[10px] uppercase tracking-widest text-white/25">#</th>
              <th className="text-center p-4 text-[10px] uppercase tracking-widest text-white/25">★</th>
              <th className="text-center p-4 text-[10px] uppercase tracking-widest text-white/25">New</th>
              <th className="text-center p-4 text-[10px] uppercase tracking-widest text-white/25">Top</th>
              <th className="text-left p-4 text-[10px] uppercase tracking-widest text-white/25">Product</th>
              <th className="text-center p-4 text-[10px] uppercase tracking-widest text-white/25">Type</th>
              {[...SIZES].map(s => (
                <th key={s} className="text-center p-4 text-[10px] uppercase tracking-widest text-white/25">
                  {s}
                </th>
              ))}
              <th className="text-center p-4 text-[10px] uppercase tracking-widest text-white/25">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const rows: React.ReactElement[] = [];

              products
                .filter(p =>
                  !productSearch ||
                  p.title?.toLowerCase().includes(productSearch.toLowerCase()) ||
                  p.slug?.toLowerCase().includes(productSearch.toLowerCase()) ||
                  p.category?.toLowerCase().includes(productSearch.toLowerCase())
                )
                .forEach(product => {
                  const colors = product.colors || [];
                  const hasColors = colors.length > 0;
                  const isExpanded = expandedProducts.has(product.id);

                  const getTotalStock = (size: string) => {
                    if (hasColors) {
                       
                      return colors.reduce((sum: number, c: ProductColor) => sum + (c.stock?.[size as Size] || 0), 0);
                    }
                    return (product.stock as Record<string, number>)?.[size] || 0;
                  };

                  // Main product row
                  rows.push(
                    <tr key={product.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) =>
                            e.target.checked
                              ? setSelectedProducts([...selectedProducts, product.id])
                              : setSelectedProducts(selectedProducts.filter(id => id !== product.id))
                          }
                          className="w-4 h-4 rounded border-white/20 bg-black accent-white"
                        />
                      </td>

                      <td className="p-4 text-center">
                        <input
                          type="number"
                          min={1}
                          defaultValue={product.displayOrder || 1}
                          onChange={(e) => {
                            const v = parseInt(e.target.value) || 1;
                            const pid = product.id;
                            if (displayOrderTimers.current[pid]) clearTimeout(displayOrderTimers.current[pid]);
                            displayOrderTimers.current[pid] = setTimeout(() => updateDisplayOrder(pid, v), 800);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const pid = product.id;
                              if (displayOrderTimers.current[pid]) clearTimeout(displayOrderTimers.current[pid]);
                              updateDisplayOrder(pid, parseInt((e.target as HTMLInputElement).value) || 1);
                            }
                          }}
                          className="w-12 text-center bg-black/50 border border-white/[0.1] rounded-lg px-2 py-1 text-sm focus:border-white/30 focus:outline-none"
                        />
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleFeatured(product)}
                          className={`transition-colors ${
                            product.featured ? 'text-amber-400 hover:text-amber-300' : 'text-white/15 hover:text-white/30'
                          }`}
                        >
                          {product.featured ? '★' : '☆'}
                        </button>
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleNewArrival(product)}
                          className={`text-xs font-bold transition-colors ${
                            product.newArrival ? 'text-emerald-400' : 'text-white/15 hover:text-white/30'
                          }`}
                        >
                          {product.newArrival ? 'NEW' : '—'}
                        </button>
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleBestSeller(product)}
                          className={`text-xs font-bold transition-colors ${
                            product.bestSeller ? 'text-amber-400' : 'text-white/15 hover:text-white/30'
                          }`}
                        >
                          {product.bestSeller ? 'TOP' : '—'}
                        </button>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-left hover:text-white/70 transition-colors"
                        >
                          <p className="font-medium">{product.title}</p>
                          <p className="text-white/30 text-xs">
                            ${product.price} · {product.category}
                            {hasColors ? ` · ${colors.length} colors` : ''}
                          </p>
                        </button>
                      </td>

                      <td className="p-4 text-center">
                        <span className="text-white/40 text-xs">{product.productType || '—'}</span>
                      </td>

                      {[...SIZES].map(size => {
                        const stock = getTotalStock(size);
                        return (
                          <td key={size} className="p-4">
                            <button
                              onClick={() => {
                                setStockChangeProduct(product);
                                setStockChangeSize(size);
                                setStockChangeAmount(stock);
                                setStockChangeColor(null);
                                setStockChangeReason('');
                                setShowStockChangeModal(true);
                              }}
                              className={`w-14 text-center bg-black/50 border rounded-lg px-2 py-1 text-sm hover:border-white/30 transition-colors ${
                                stock === 0
                                  ? 'text-red-400 border-red-500/40'
                                  : stock < 5
                                  ? 'text-amber-400 border-amber-500/30'
                                  : 'border-white/[0.1]'
                              }`}
                            >
                              {stock}
                            </button>
                          </td>
                        );
                      })}

                      <td className="p-4 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          {hasColors && (
                            <button
                              onClick={() => {
                                const n = new Set(expandedProducts);
                                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                                isExpanded ? n.delete(product.id) : n.add(product.id);
                                setExpandedProducts(n);
                              }}
                              className="p-2 bg-white/[0.06] rounded-lg hover:bg-white/[0.1] transition-colors text-xs"
                            >
                              {isExpanded ? '▲' : '▼'}
                            </button>
                          )}
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="px-3 py-1.5 bg-red-500/15 text-red-400 text-xs rounded-lg hover:bg-red-500/25 transition-colors"
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  );

                  // Color variant rows
                  if (isExpanded && hasColors) {
                     
                    colors.forEach((color: ProductColor) => {
                      rows.push(
                        <tr
                          key={`${product.id}-${color.name}`}
                          className="border-b border-white/[0.03] bg-white/[0.01]"
                        >
                          <td className="p-4 text-center">
                            <div
                              className="w-4 h-4 rounded-full border border-white/20 mx-auto"
                              style={{ backgroundColor: color.hex }}
                            />
                          </td>
                          <td className="p-4" colSpan={4}>
                            <span className="text-white/40 text-sm ml-4">↳ {color.name}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-white/20 text-xs">Variant</span>
                          </td>
                          <td className="p-4 text-center" />
                          {[...SIZES].map(size => {
                            const stock = color.stock?.[size] || 0;
                            return (
                              <td key={size} className="p-4">
                                <button
                                  onClick={() => {
                                    setStockChangeProduct(product);
                                    setStockChangeSize(size);
                                    setStockChangeAmount(stock);
                                    setStockChangeColor(color.name);
                                    setStockChangeReason(`Updating ${color.name}`);
                                    setShowStockChangeModal(true);
                                  }}
                                  className={`w-14 text-center bg-black/30 border rounded-lg px-2 py-1 text-sm hover:border-white/30 transition-colors ${
                                    stock === 0
                                      ? 'text-red-400 border-red-500/40'
                                      : stock < 5
                                      ? 'text-amber-400 border-amber-500/30'
                                      : 'border-white/[0.06]'
                                  }`}
                                >
                                  {stock}
                                </button>
                              </td>
                            );
                          })}
                          <td className="p-4 text-center">
                            <span className="text-white/15 text-xs">—</span>
                          </td>
                        </tr>
                      );
                    });
                  }
                });

              return rows;
            })()}
          </tbody>
        </table>
      </div>

      {/* Stock Change Modal */}
      {showStockChangeModal && stockChangeProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="modal-panel bg-neutral-950 border border-white/[0.08] rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bebas tracking-wider mb-6">Update Stock</h3>

            <div className="space-y-4">
              <div className="p-4 bg-white/[0.03] rounded-xl">
                <p className="text-white/30 text-sm">Product</p>
                <p className="font-medium">{stockChangeProduct.title}</p>
                {stockChangeColor && <p className="text-sm text-amber-400 mt-1">Color: {stockChangeColor}</p>}
              </div>

              <div className="p-4 bg-white/[0.03] rounded-xl">
                <p className="text-white/30 text-sm">Size</p>
                <p className="font-medium text-xl">{stockChangeSize}</p>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">
                  New Stock Amount
                </label>
                <input
                  type="number"
                  min={0}
                  value={stockChangeAmount}
                  onChange={(e) => setStockChangeAmount(parseInt(e.target.value) || 0)}
                  className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 text-lg text-center focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={stockChangeReason}
                  onChange={(e) => setStockChangeReason(e.target.value)}
                  placeholder="e.g., New shipment arrived"
                  className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setShowStockChangeModal(false);
                  setStockChangeProduct(null);
                  setStockChangeColor(null);
                }}
                className="flex-1 py-3 border border-white/[0.1] rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await updateStock(
                    stockChangeProduct.id,
                    stockChangeSize,
                    stockChangeAmount,
                    stockChangeReason,
                    stockChangeColor || undefined
                  );
                  setShowStockChangeModal(false);
                  setStockChangeProduct(null);
                  setStockChangeColor(null);
                }}
                className="btn-premium flex-1 py-3 bg-white text-black rounded-xl hover:bg-white/90 transition-colors font-bold"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="modal-panel bg-neutral-950 border border-white/[0.08] rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bebas tracking-wider mb-6">Edit Product</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">Title</label>
                <input
                  type="text"
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">Subtitle</label>
                <input
                  type="text"
                  value={editingProduct.subtitle}
                  onChange={(e) => setEditingProduct({ ...editingProduct, subtitle: e.target.value })}
                  className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">Price</label>
                <input
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                  className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">Category</label>
                <select
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">Description</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct,description: e.target.value })}
                  rows={3}
                  className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">Model Size</label>
                <input
                  type="text"
                  value={editingProduct.modelSize || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct,modelSize: e.target.value })}
                  className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">Model Height</label>
                <input
                  type="text"
                  value={editingProduct.modelHeight || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct,modelHeight: e.target.value })}
                  className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">Delivery Info</label>
                <input
                  type="text"
                  value={editingProduct.deliveryInfo || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct,deliveryInfo: e.target.value })}
                  className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">Returns Info</label>
                <input
                  type="text"
                  value={editingProduct.returnsInfo || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct,returnsInfo: e.target.value })}
                  className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">Matching Set Slug</label>
                <input
                  type="text"
                  value={editingProduct.matchingSetSlug || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct,matchingSetSlug: e.target.value })}
                  className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 py-3 border border-white/[0.1] rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateProductDetails(editingProduct)}
                className="btn-premium flex-1 py-3 bg-white text-black rounded-xl hover:bg-white/90 transition-colors font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="modal-panel bg-neutral-950 border border-white/[0.08] rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bebas tracking-wider mb-4 text-red-400">
              Archive {selectedProducts.length} Products?
            </h3>
            <p className="text-white/40 mb-6">Products will be hidden but preserved for order history.</p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 py-3 border border-white/[0.1] rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const now = new Date().toISOString();
                  for (const id of selectedProducts) {
                    try {
                      await updateDoc(doc(db, 'products', id), {
                        is_deleted: true,
                        deleted_at: now,
                        is_active: false,
                        updated_at: now,
                      });
                    } catch (err) {
                      console.error(err);
                    }
                  }
                  logAdminAction('bulk_delete', { type: 'products', count: selectedProducts.length, soft: true }, getAdminEmail());
                  setProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)));
                  setSelectedProducts([]);
                  setShowBulkDeleteConfirm(false);
                }}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-bold"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="modal-panel bg-neutral-950 border border-white/[0.08] rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bebas tracking-wider mb-6">Add New Product</h3>

            {addError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {addError}
              </div>
            )}

            <div className="space-y-4">
              {/* Category & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">Type</label>
                  <select
                    value={newProduct.productType}
                    onChange={(e) => setNewProduct({ ...newProduct, productType: e.target.value })}
                    className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                  >
                    {PRODUCT_TYPES.map(pt => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Slug */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">Slug *</label>
                <input
                  type="text"
                  value={newProduct.slug}
                  onChange={(e) => setNewProduct({ ...newProduct, slug: e.target.value })}
                  placeholder="heavy-hoodie"
                  className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                />
                <p className="text-white/20 text-xs mt-1">/products/your-slug</p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">Title *</label>
                <input
                  type="text"
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  placeholder="Heavy Hoodie"
                  className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">Subtitle</label>
                <input
                  type="text"
                  value={newProduct.subtitle}
                  onChange={(e) => setNewProduct({ ...newProduct, subtitle: e.target.value })}
                  className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                />
              </div>

              {/* Price & Display Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">Price *</label>
                  <input
                    type="number"
                    value={newProduct.price || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                    className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">
                    Display Position
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newProduct.displayOrder || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, displayOrder: parseInt(e.target.value) || 1 })}
                    className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                  />
                </div>
              </div>

              {/* Details Section */}
              <div className="border-t border-white/[0.06] pt-4 mt-4">
                <h4 className="text-sm font-medium text-white/40 mb-4">Details</h4>

                <div className="space-y-4">
                  {/* Description */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">Description</label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      rows={3}
                      className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Features */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">
                      Features (one per line)
                    </label>
                    <textarea
                      value={newProduct.features.join('\n')}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          features: e.target.value.split('\n').filter(f => f.trim())
                        })
                      }
                      rows={3}
                      className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Model Size & Height */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">
                        Model Size
                      </label>
                      <input
                        type="text"
                        value={newProduct.modelSize}
                        onChange={(e) => setNewProduct({ ...newProduct, modelSize: e.target.value })}
                        className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">
                        Model Height
                      </label>
                      <input
                        type="text"
                        value={newProduct.modelHeight}
                        onChange={(e) => setNewProduct({ ...newProduct, modelHeight: e.target.value })}
                        className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Matching Set Slug */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">
                      Matching Set Slug
                    </label>
                    <input
                      type="text"
                      value={newProduct.matchingSetSlug}
                      onChange={(e) => setNewProduct({ ...newProduct, matchingSetSlug: e.target.value })}
                      className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                    />
                  </div>

                  {/* Delivery Info */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">
                      Delivery Info
                    </label>
                    <input
                      type="text"
                      value={newProduct.deliveryInfo}
                      onChange={(e) => setNewProduct({ ...newProduct, deliveryInfo: e.target.value })}
                      className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                    />
                  </div>

                  {/* Returns Info */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">
                      Returns Info
                    </label>
                    <input
                      type="text"
                      value={newProduct.returnsInfo}
                      onChange={(e) => setNewProduct({ ...newProduct, returnsInfo: e.target.value })}
                      className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Stock by Size (No Colors) */}
              {newProduct.colors.length === 0 && (
                <div className="border-t border-white/[0.06] pt-4">
                  <h4 className="text-sm font-medium text-white/40 mb-4">Stock by Size</h4>
                  <div className="grid grid-cols-6 gap-3">
                    {[...SIZES].map(size => (
                      <div key={size}>
                        <label className="block text-[10px] text-white/25 text-center mb-1">{size}</label>
                        <input
                          type="number"
                          min={0}
                          value={newProduct.stock[size as keyof typeof newProduct.stock] || 0}
                          onChange={(e) => {
                            const s = { ...newProduct.stock };
                            s[size as keyof typeof s] = parseInt(e.target.value) || 0;
                            setNewProduct({ ...newProduct, stock: s });
                          }}
                          className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-lg px-2 py-2 text-center text-sm focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors Section */}
              <div className="border-t border-white/[0.06] pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-white/40">Colors</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const names = ['Black', 'White', 'Navy', 'Gray', 'Red', 'Blue', 'Green'];
                      setNewProduct({
                        ...newProduct,
                        colors: [
                          ...newProduct.colors,
                          {
                            name: names[newProduct.colors.length] || `Color ${newProduct.colors.length + 1}`,
                            hex: '#000000',
                            images: [],
                            stock: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }
                          }
                        ]
                      });
                      setActiveColorIndex(newProduct.colors.length);
                    }}
                    className="px-3 py-1 bg-white/[0.06] text-xs rounded-lg hover:bg-white/[0.1] transition-colors"
                  >
                    + Add Color
                  </button>
                </div>

                {newProduct.colors.length === 0 ? (
                  <p className="text-white/25 text-sm">No colors. Add to manage variants.</p>
                ) : (
                  <>
                    {/* Color Tabs */}
                    <div className="flex gap-2 flex-wrap mb-4">
                      {newProduct.colors.map((c, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveColorIndex(idx)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            activeColorIndex === idx
                              ? 'bg-white/[0.12] border border-white/30'
                              : 'bg-white/[0.04] border border-transparent hover:bg-white/[0.08]'
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span>{c.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Active Color Editor */}
                    {newProduct.colors[activeColorIndex] && (
                      <div className="p-4 bg-white/[0.03] rounded-xl space-y-4">
                        {/* Color Name & Hex */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">
                              Name
                            </label>
                            <input
                              type="text"
                              value={newProduct.colors[activeColorIndex].name}
                              onChange={(e) => {
                                const c = [...newProduct.colors];
                                c[activeColorIndex].name = e.target.value;
                                setNewProduct({ ...newProduct, colors: c });
                              }}
                              className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">
                              Hex
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={newProduct.colors[activeColorIndex].hex}
                                onChange={(e) => {
                                  const c = [...newProduct.colors];
                                  c[activeColorIndex].hex = e.target.value;
                                  setNewProduct({ ...newProduct, colors: c });
                                }}
                                className="w-12 h-12 bg-transparent border border-white/20 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={newProduct.colors[activeColorIndex].hex}
                                onChange={(e) => {
                                  const c = [...newProduct.colors];
                                  c[activeColorIndex].hex = e.target.value;
                                  setNewProduct({ ...newProduct, colors: c });
                                }}
                                className="input-premium flex-1 bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none uppercase"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Color Images */}
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">
                            Images
                          </label>
                          <div className="flex gap-2 flex-wrap mb-2">
                            {newProduct.colors[activeColorIndex].images.map((img, i) => (
                              <div key={i} className="relative w-16 h-16">
                                <Image
                                  src={img}
                                  alt=""
                                  fill
                                  className="object-cover rounded-lg"
                                  sizes="64px"
                                />
                                <button
                                  onClick={() => {
                                    const c = [...newProduct.colors];
                                    c[activeColorIndex].images = c[activeColorIndex].images.filter(
                                      (_, idx) => idx !== i
                                    );
                                    setNewProduct({ ...newProduct, colors: c });
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
                              const urls: string[] = [];

                              for (const f of Array.from(e.target.files)) {
                                try {
                                  const sr = ref(storage, `products/${Date.now()}_${f.name}`);
                                  await uploadBytes(sr, f);
                                  urls.push(await getDownloadURL(sr));
                                } catch (err) {
                                  console.error(err);
                                }
                              }

                              const c = [...newProduct.colors];
                              c[activeColorIndex].images = [
                                ...c[activeColorIndex].images,
                                ...urls
                              ];
                              setNewProduct({ ...newProduct, colors: c });
                              setUploadingImages(false);
                            }}
                            className="text-sm text-white/40"
                          />
                        </div>

                        {/* Color Stock */}
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">
                            Stock
                          </label>
                          <div className="grid grid-cols-6 gap-2">
                            {[...SIZES].map(size => (
                              <div key={size}>
                                <label className="block text-[10px] text-white/25 text-center mb-1">{size}</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={
                                    newProduct.colors[activeColorIndex].stock[
                                      size as keyof typeof newProduct.colors[0]['stock']
                                    ]
                                  }
                                  onChange={(e) => {
                                    const c = [...newProduct.colors];
                                    c[activeColorIndex].stock[
                                      size as keyof typeof newProduct.colors[0]['stock']
                                    ] = parseInt(e.target.value) || 0;
                                    setNewProduct({ ...newProduct, colors: c });
                                  }}
                                  className="w-full bg-black/50 border border-white/[0.1] rounded-lg px-2 py-2 text-center text-sm focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Remove Color Button */}
                        <button
                          onClick={() => {
                            setNewProduct({
                              ...newProduct,
                              colors: newProduct.colors.filter((_, i) => i !== activeColorIndex)
                            });
                            setActiveColorIndex(Math.max(0, activeColorIndex - 1));
                          }}
                          className="text-red-400 text-xs hover:text-red-300"
                        >
                          Remove color
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Image Upload (Disabled if colors) */}
              <div className={newProduct.colors.length > 0 ? 'opacity-30 pointer-events-none' : ''}>
                <label className="block text-[10px] uppercase tracking-widest text-white/25 mb-2">
                  Images {newProduct.colors.length > 0 && '(use color images)'}
                </label>

                {/* Drag & Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    dragActive ? 'border-white bg-white/[0.03]' : 'border-white/[0.1] hover:border-white/20'
                  }`}
                >
                  <p className="text-white/30 text-sm mb-2">Drag & drop images here</p>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="img-upload"
                  />
                  <label
                    htmlFor="img-upload"
                    className="inline-block px-4 py-2 bg-white/[0.06] rounded-lg text-sm cursor-pointer hover:bg-white/[0.1] transition-colors"
                  >
                    Select Images
                  </label>
                </div>

                {/* Uploading State */}
                {uploadingImages && (
                  <div className="mt-3 flex items-center gap-2 text-white/40 text-sm">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </div>
                )}

                {/* Uploaded Images Preview */}
                {newProduct.images.length > 0 && (
                  <div className="mt-4 flex gap-3 flex-wrap">
                    {newProduct.images.map((url, i) => (
                      <div key={i} className="relative group w-20 h-20">
                        <Image
                          src={url}
                          alt=""
                          fill
                          className="object-cover rounded-lg border border-white/[0.1]"
                          sizes="80px"
                        />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* URL Paste Option */}
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <p className="text-white/20 text-xs mb-2">Or paste URL:</p>
                  <input
                    type="text"
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                    className="input-premium w-full bg-black/50 border border-white/[0.1] rounded-xl px-4 py-3 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setShowAddProduct(false);
                  setAddError('');
                }}
                disabled={isAdding}
                className="flex-1 py-3 border border-white/[0.1] rounded-xl hover:bg-white/[0.03] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={addProduct}
                disabled={isAdding}
                className="btn-premium flex-1 py-3 bg-white text-black rounded-xl hover:bg-white/90 transition-colors font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAdding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
    </div>
  );
}
