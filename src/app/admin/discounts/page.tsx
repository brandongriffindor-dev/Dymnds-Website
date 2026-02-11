'use client';

import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder: number;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [filteredDiscounts, setFilteredDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    minOrder: 0,
    maxUses: 0,
    expiresAt: '',
  });

  // Fetch discounts with real-time updates
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const q = query(collection(db, 'discounts'), orderBy('created_at', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const discountsData: Discount[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.is_deleted === true) return; // Skip soft-deleted
        discountsData.push({
          ...data,
          id: doc.id,
        } as Discount);
      });
      setDiscounts(discountsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter discounts based on search
  useEffect(() => {
    let filtered = discounts;

    if (searchTerm) {
      filtered = filtered.filter((discount) =>
        discount.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilteredDiscounts(filtered);
  }, [discounts, searchTerm]);

  // Handle create discount
  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.value) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code,
          type: formData.type,
          value: formData.value,
          minOrder: formData.minOrder,
          maxUses: formData.maxUses,
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to create discount');
        setUpdating(false);
        return;
      }

      // onSnapshot will pick up the new discount
      setFormData({ code: '', type: 'percentage', value: 0, minOrder: 0, maxUses: 0, expiresAt: '' });
      setShowCreateModal(false);
      setUpdating(false);
    } catch (error) {
      console.error('Error creating discount:', error);
      alert('Failed to create discount');
      setUpdating(false);
    }
  };

  // Handle toggle active
  const handleToggleActive = async (discount: Discount) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountId: discount.id, active: !discount.active }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update discount');
      }
      setUpdating(false);
    } catch (error) {
      console.error('Error updating discount:', error);
      setUpdating(false);
    }
  };

  // Handle delete
  const handleDelete = async (discountId: string) => {
    if (!window.confirm('Archive this discount code? It will be deactivated and hidden.')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/discounts?discountId=${discountId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete discount');
      }
      setDeleting(false);
    } catch (error) {
      console.error('Error deleting discount:', error);
      setDeleting(false);
    }
  };

  // Get stats
  const stats = {
    totalCodes: discounts.length,
    activeCodes: discounts.filter((d) => d.active).length,
    totalUses: discounts.reduce((sum, d) => sum + d.currentUses, 0),
    expiredCodes: discounts.filter((d) => new Date(d.expiresAt) < new Date()).length,
  };

  // Check if discount is expired
  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  // Check if discount is near max uses
  const isNearMaxUses = (discount: Discount) => {
    if (discount.maxUses === 0) return false;
    return discount.currentUses >= discount.maxUses;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/[0.08] px-6 py-8">
        <h1 className="font-bebas text-4xl tracking-wider">Discount Codes</h1>
        <p className="text-white/60 mt-2">Create and manage promotional discount codes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-6">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-white/60 text-sm">Total Codes</div>
          <div className="font-bebas text-3xl mt-2">{stats.totalCodes}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-emerald-300 text-sm">Active Codes</div>
          <div className="font-bebas text-3xl mt-2">{stats.activeCodes}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-blue-300 text-sm">Total Uses</div>
          <div className="font-bebas text-3xl mt-2">{stats.totalUses}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="text-red-300 text-sm">Expired</div>
          <div className="font-bebas text-3xl mt-2">{stats.expiredCodes}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-6 border-b border-white/[0.08]">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <input
            type="text"
            placeholder="Search discount codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-premium max-w-sm"
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-premium"
          >
            + New Discount
          </button>
        </div>
      </div>

      {/* Discounts Table */}
      <div className="px-6 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border border-white/20 border-t-white"></div>
          </div>
        ) : filteredDiscounts.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            {searchTerm ? 'No discounts found' : 'No discount codes yet. Create your first one!'}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
            <table className="w-full">
              <thead className="bg-white/[0.03] border-b border-white/[0.08]">
                <tr>
                  <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Code</th>
                  <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Type</th>
                  <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Value</th>
                  <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Min Order</th>
                  <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Uses</th>
                  <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Expires</th>
                  <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Status</th>
                  <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDiscounts.map((discount) => {
                  const expired = isExpired(discount.expiresAt);
                  const maxUses = isNearMaxUses(discount);

                  return (
                    <tr key={discount.id} className="border-b border-white/[0.08] hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <span className="font-mono font-semibold">{discount.code}</span>
                      </td>
                      <td className="px-6 py-4 text-sm capitalize">{discount.type}</td>
                      <td className="px-6 py-4 text-sm">
                        {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value.toFixed(2)}`}
                      </td>
                      <td className="px-6 py-4 text-sm">${discount.minOrder.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={maxUses ? 'text-red-300' : ''}>
                          {discount.currentUses}
                          {discount.maxUses > 0 && ` / ${discount.maxUses}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/60">
                        {new Date(discount.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {expired && (
                            <span className="inline-block px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-300 border border-red-500/50">
                              Expired
                            </span>
                          )}
                          {maxUses && (
                            <span className="inline-block px-3 py-1 rounded-full text-xs bg-orange-500/20 text-orange-300 border border-orange-500/50">
                              Max Reached
                            </span>
                          )}
                          {!expired && !maxUses && discount.active && (
                            <span className="inline-block px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                              Active
                            </span>
                          )}
                          {!expired && !maxUses && !discount.active && (
                            <span className="inline-block px-3 py-1 rounded-full text-xs bg-gray-500/20 text-gray-300 border border-gray-500/50">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        {!expired && (
                          <button
                            onClick={() => handleToggleActive(discount)}
                            disabled={updating}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            {discount.active ? 'Disable' : 'Enable'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(discount.id)}
                          disabled={deleting}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Discount Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="modal-panel max-w-md w-full">
            <div className="flex justify-between items-start mb-6">
              <h2 className="font-bebas text-2xl">Create Discount Code</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDiscount} className="space-y-4">
              {/* Code */}
              <div>
                <label className="text-white/60 text-sm block mb-2">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SUMMER20"
                  className="input-premium w-full"
                  required
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-white/60 text-sm block mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                  className="input-premium w-full"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="text-white/60 text-sm block mb-2">
                  {formData.type === 'percentage' ? 'Discount %' : 'Discount Amount ($)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                  placeholder="0"
                  className="input-premium w-full"
                  required
                />
              </div>

              {/* Min Order */}
              <div>
                <label className="text-white/60 text-sm block mb-2">Minimum Order ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minOrder}
                  onChange={(e) => setFormData({ ...formData, minOrder: parseFloat(e.target.value) })}
                  placeholder="0"
                  className="input-premium w-full"
                />
              </div>

              {/* Max Uses */}
              <div>
                <label className="text-white/60 text-sm block mb-2">Max Uses (0 = Unlimited)</label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="input-premium w-full"
                />
              </div>

              {/* Expires At */}
              <div>
                <label className="text-white/60 text-sm block mb-2">Expiration Date</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="input-premium w-full"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-premium flex-1"
                >
                  {updating ? 'Creating...' : 'Create Discount'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-premium flex-1 bg-white/[0.05] border-white/[0.08] hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
