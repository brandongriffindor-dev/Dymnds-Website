'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SIZES } from '@/lib/constants';
import type { StockRecord } from '@/lib/types';

interface ProductColor {
  name: string;
  hex: string;
  images: string[];
  stock: StockRecord;
}

interface Product {
  id: string;
  title: string;
  category: string;
  stock: StockRecord;
  colors?: ProductColor[];
  is_active: boolean;
  is_deleted?: boolean;
}

interface LowStockItem {
  productId: string;
  productName: string;
  category: string;
  color: string | null;
  colorHex: string | null;
  size: string;
  stock: number;
}

export default function AlertsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LowStockItem | null>(null);
  const [restockData, setRestockData] = useState({
    amount: 0,
    reason: '',
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData = productsSnapshot.docs
          .map(
            (d) =>
              ({
                id: d.id,
                ...d.data(),
              }) as Product
          )
          .filter((p) => p.is_active !== false && p.is_deleted !== true);
        setProducts(productsData);

        const lowStock: LowStockItem[] = [];
        productsData.forEach((product) => {
          if (product.colors && product.colors.length > 0) {
            // Color-variant products: check each color's stock per size
            product.colors.forEach((color) => {
              SIZES.forEach((size) => {
                const qty = color.stock?.[size] ?? 0;
                if (qty < 5) {
                  lowStock.push({
                    productId: product.id,
                    productName: product.title,
                    category: product.category,
                    color: color.name,
                    colorHex: color.hex || null,
                    size,
                    stock: qty,
                  });
                }
              });
            });
          } else if (product.stock) {
            // Simple products: check root stock per size
            SIZES.forEach((size) => {
              const qty = product.stock[size] ?? 0;
              if (qty < 5) {
                lowStock.push({
                  productId: product.id,
                  productName: product.title,
                  category: product.category,
                  color: null,
                  colorHex: null,
                  size,
                  stock: qty,
                });
              }
            });
          }
        });

        setLowStockItems(lowStock.sort((a, b) => a.stock - b.stock));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const lowStockCount = lowStockItems.filter((item) => item.stock > 0).length;
  const outOfStockCount = lowStockItems.filter((item) => item.stock === 0).length;
  const productsAffected = new Set(lowStockItems.map((item) => item.productId)).size;

  const handleRestockClick = (item: LowStockItem) => {
    setSelectedItem(item);
    setRestockData({ amount: 0, reason: '' });
    setShowRestockModal(true);
  };

  const handleRestockSubmit = async () => {
    if (!selectedItem || restockData.amount <= 0 || !restockData.reason) return;

    try {
      const product = products.find((p) => p.id === selectedItem.productId);
      if (!product) return;

      const oldStock = selectedItem.stock;
      const newStock = oldStock + restockData.amount;

      if (selectedItem.color && product.colors) {
        // Color-variant product: update the specific color's stock
        const colorIndex = product.colors.findIndex(
          (c) => c.name === selectedItem.color
        );
        if (colorIndex === -1) return;

        const updatedColors = [...product.colors];
        updatedColors[colorIndex] = {
          ...updatedColors[colorIndex],
          stock: {
            ...updatedColors[colorIndex].stock,
            [selectedItem.size]: newStock,
          },
        };

        // Recalculate root stock totals across all colors
        const totalStock: StockRecord = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
        for (const color of updatedColors) {
          for (const size of SIZES) {
            totalStock[size] += color.stock[size] ?? 0;
          }
        }

        await updateDoc(doc(db, 'products', selectedItem.productId), {
          colors: updatedColors,
          stock: totalStock,
          updated_at: new Date().toISOString(),
        });

        setProducts(
          products.map((p) =>
            p.id === selectedItem.productId
              ? { ...p, colors: updatedColors, stock: totalStock }
              : p
          )
        );
      } else {
        // Simple product: update root stock directly
        const updatedStock = {
          ...product.stock,
          [selectedItem.size]: newStock,
        };

        await updateDoc(doc(db, 'products', selectedItem.productId), {
          stock: updatedStock,
          updated_at: new Date().toISOString(),
        });

        setProducts(
          products.map((p) =>
            p.id === selectedItem.productId ? { ...p, stock: updatedStock } : p
          )
        );
      }

      // Log the inventory change
      await addDoc(collection(db, 'inventory_logs'), {
        product_id: selectedItem.productId,
        product_name: selectedItem.productName,
        size: selectedItem.size,
        color: selectedItem.color || null,
        old_stock: oldStock,
        new_stock: newStock,
        change: restockData.amount,
        reason: restockData.reason,
        user: 'admin',
        created_at: new Date().toISOString(),
      });

      setLowStockItems(
        lowStockItems
          .map((item) =>
            item.productId === selectedItem.productId &&
            item.size === selectedItem.size &&
            item.color === selectedItem.color
              ? { ...item, stock: newStock }
              : item
          )
          .filter((item) => item.stock < 5)
          .sort((a, b) => a.stock - b.stock)
      );

      setShowRestockModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error restocking:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bebas text-white mb-8">Low Stock Alerts</h1>

        {/* Alert Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <p className="text-white/60 text-sm mb-2">Low Stock Items (&lt;5)</p>
            <p className="text-4xl font-bebas text-white">{lowStockCount}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <p className="text-white/60 text-sm mb-2">Out of Stock (=0)</p>
            <p className="text-4xl font-bebas text-white">{outOfStockCount}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <p className="text-white/60 text-sm mb-2">Products Affected</p>
            <p className="text-4xl font-bebas text-white">{productsAffected}</p>
          </div>
        </div>

        {/* Restock Modal */}
        {showRestockModal && selectedItem && (
          <div className="modal-panel bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bebas text-white mb-4">Restock Item</h2>
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-white/[0.05] border border-white/[0.08] rounded-xl">
                <p className="text-white/60 text-sm">Product</p>
                <p className="text-white font-medium">{selectedItem.productName}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white/[0.05] border border-white/[0.08] rounded-xl">
                  <p className="text-white/60 text-sm">Color</p>
                  <p className="text-white font-medium">{selectedItem.color || 'Default'}</p>
                </div>
                <div className="p-4 bg-white/[0.05] border border-white/[0.08] rounded-xl">
                  <p className="text-white/60 text-sm">Size</p>
                  <p className="text-white font-medium">{selectedItem.size}</p>
                </div>
                <div className="p-4 bg-white/[0.05] border border-white/[0.08] rounded-xl">
                  <p className="text-white/60 text-sm">Current Stock</p>
                  <p className="text-white font-medium">{selectedItem.stock}</p>
                </div>
              </div>
              <div>
                <label className="text-white text-sm mb-2 block">Amount to Add</label>
                <input
                  type="number"
                  min="1"
                  value={restockData.amount}
                  onChange={(e) =>
                    setRestockData({ ...restockData, amount: parseInt(e.target.value) || 0 })
                  }
                  className="input-premium w-full bg-white/[0.05] border border-white/[0.08] text-white"
                  placeholder="Enter quantity"
                />
                {restockData.amount > 0 && (
                  <p className="text-white/60 text-sm mt-2">
                    New stock will be: {selectedItem.stock + restockData.amount}
                  </p>
                )}
              </div>
              <div>
                <label className="text-white text-sm mb-2 block">Reason</label>
                <input
                  type="text"
                  value={restockData.reason}
                  onChange={(e) =>
                    setRestockData({ ...restockData, reason: e.target.value })
                  }
                  className="input-premium w-full bg-white/[0.05] border border-white/[0.08] text-white"
                  placeholder="e.g., Supplier delivery, Warehouse transfer"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRestockSubmit}
                disabled={restockData.amount <= 0 || !restockData.reason}
                className="btn-premium flex-1 bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Restock
              </button>
              <button
                onClick={() => setShowRestockModal(false)}
                className="btn-premium flex-1 bg-white/[0.1] text-white hover:bg-white/15"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Low Stock Items List */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
          <h2 className="text-2xl font-bebas text-white mb-6">Low Stock Items</h2>

          {lowStockItems.length === 0 ? (
            <p className="text-white/60 text-center py-8">All items are well stocked!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-white text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left py-3 px-4 text-white/60">Product</th>
                    <th className="text-left py-3 px-4 text-white/60">Color</th>
                    <th className="text-left py-3 px-4 text-white/60">Size</th>
                    <th className="text-center py-3 px-4 text-white/60">Stock</th>
                    <th className="text-center py-3 px-4 text-white/60">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-white/[0.08] hover:bg-white/[0.02]">
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-white">{item.productName}</p>
                          <p className="text-white/50 text-xs">{item.category}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {item.color ? (
                          <div className="flex items-center gap-2">
                            {item.colorHex && (
                              <div
                                className="w-4 h-4 rounded-full border border-white/20"
                                style={{ backgroundColor: item.colorHex }}
                              />
                            )}
                            {item.color}
                          </div>
                        ) : (
                          <span className="text-white/40">&mdash;</span>
                        )}
                      </td>
                      <td className="py-4 px-4">{item.size}</td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium ${
                            item.stock === 0
                              ? 'bg-red-500/20 text-red-300'
                              : item.stock <= 2
                                ? 'bg-yellow-500/20 text-yellow-300'
                                : 'bg-orange-500/20 text-orange-300'
                          }`}
                        >
                          {item.stock}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleRestockClick(item)}
                          className="btn-premium px-4 py-2 bg-white/[0.1] text-white hover:bg-white/15 text-sm"
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
