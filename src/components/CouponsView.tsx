import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  RefreshCw,
  Search,
  Check,
  Copy,
  Trash2,
  Users,
  Calendar,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  X,
  Percent,
  IndianRupee,
  ShieldCheck,
  Ticket,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { CouponItem, CouponUsageItem, CreateCouponInput } from '../types';
import { api } from '../api/client';

export const CouponsView: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCouponInput>({
    code: '',
    title: '',
    description: '',
    discount_type: 'FLAT',
    discount_value: 100,
    max_discount_inr: undefined,
    min_trip_amount_inr: 0,
    usage_limit: undefined,
    valid_until: '',
    is_active: true,
  });

  // Usages Modal State
  const [selectedCoupon, setSelectedCoupon] = useState<CouponItem | null>(null);
  const [usages, setUsages] = useState<CouponUsageItem[]>([]);
  const [loadingUsages, setLoadingUsages] = useState<boolean>(false);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const data = await api.getCoupons();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggle = async (id: string) => {
    try {
      await api.toggleCoupon(id);
      setCoupons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c))
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to toggle coupon status');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    try {
      await api.deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete coupon');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const code = formData.code.trim().toUpperCase();
    if (!code) {
      setFormError('Coupon code is required.');
      return;
    }
    if (!formData.title.trim()) {
      setFormError('Coupon title is required.');
      return;
    }
    if (Number(formData.discount_value) <= 0) {
      setFormError('Discount value must be greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateCouponInput = {
        code,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        max_discount_inr: formData.max_discount_inr ? Number(formData.max_discount_inr) : undefined,
        min_trip_amount_inr: formData.min_trip_amount_inr ? Number(formData.min_trip_amount_inr) : 0,
        usage_limit: formData.usage_limit ? Number(formData.usage_limit) : undefined,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : undefined,
        is_active: formData.is_active,
      };

      await api.createCoupon(payload);
      setIsCreateOpen(false);
      setFormData({
        code: '',
        title: '',
        description: '',
        discount_type: 'FLAT',
        discount_value: 100,
        max_discount_inr: undefined,
        min_trip_amount_inr: 0,
        usage_limit: undefined,
        valid_until: '',
        is_active: true,
      });
      await fetchCoupons();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create coupon.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenUsages = async (coupon: CouponItem) => {
    setSelectedCoupon(coupon);
    setLoadingUsages(true);
    try {
      const data = await api.getCouponUsages(coupon.id);
      setUsages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load usages:', err);
      setUsages([]);
    } finally {
      setLoadingUsages(false);
    }
  };

  const filteredCoupons = coupons.filter((c) => {
    if (statusFilter === 'ACTIVE' && !c.is_active) return false;
    if (statusFilter === 'INACTIVE' && c.is_active) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filteredCoupons.length / pageSize) || 1;
  const paginatedCoupons = filteredCoupons.slice((page - 1) * pageSize, page * pageSize);

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.is_active).length;
  const totalRedeemed = coupons.reduce((acc, c) => acc + (c.used_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-red-500" />
            Coupons & Promo Offers
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Create and manage customer discounts, limit per-user redemptions, and view usage audits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCoupons}
            disabled={loading}
            className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition shadow-lg shadow-red-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Coupons</p>
            <p className="text-2xl font-bold text-white mt-1">{totalCoupons}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300">
            <Ticket className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Active Offers</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{activeCoupons}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Redemptions</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{totalRedeemed}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition ${
                statusFilter === filter
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/40 border border-zinc-800/40'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/90 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Offer Title</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Min Trip</th>
                <th className="py-3 px-4">Redeemed</th>
                <th className="py-3 px-4">Valid Until</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-400" />
                    Loading coupons...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    No coupons found.
                  </td>
                </tr>
              ) : (
                paginatedCoupons.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm text-red-400 bg-red-950/40 border border-red-800/30 px-2 py-0.5 rounded-lg">
                          {c.code}
                        </span>
                        <button
                          onClick={() => handleCopy(c.code)}
                          className="text-zinc-500 hover:text-white transition"
                          title="Copy Code"
                        >
                          {copiedId === c.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{c.title}</p>
                      {c.description && (
                        <p className="text-[11px] text-zinc-400 truncate max-w-xs">{c.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-zinc-200">
                        {c.discount_type === 'PERCENT' ? (
                          <>
                            <Percent className="w-3.5 h-3.5 text-amber-400" />
                            {c.discount_value}% OFF
                            {c.max_discount_inr && (
                              <span className="text-[10px] text-zinc-400 font-normal">
                                (Max ₹{c.max_discount_inr.toLocaleString('en-IN')})
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                            Flat ₹{c.discount_value.toLocaleString('en-IN')} OFF
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-300">
                      ₹{c.min_trip_amount_inr.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-zinc-200">{c.used_count}</span>
                      {c.usage_limit ? (
                        <span className="text-zinc-500"> / {c.usage_limit}</span>
                      ) : (
                        <span className="text-zinc-500"> (Unlimited)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      {c.valid_until ? new Date(c.valid_until).toLocaleDateString() : 'No expiry'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggle(c.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                          c.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                        }`}
                        title="Click to toggle status"
                      >
                        {c.is_active ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-400" /> Active
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-zinc-500" /> Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleOpenUsages(c)}
                          className="py-1 px-2.5 rounded-lg text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition flex items-center space-x-1"
                          title="View users who redeemed this coupon"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Who Used ({c.used_count})</span>
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredCoupons.length > 0 && (
          <div className="px-5 py-3.5 bg-zinc-950/70 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <div>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredCoupons.length)} of {filteredCoupons.length} coupons
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-white px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE COUPON MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-500" />
                Create New Coupon
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DIWALI500"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })
                    }
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Discount Type *</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_type: e.target.value as 'FLAT' | 'PERCENT' })
                    }
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="FLAT">FLAT (Fixed ₹ Discount)</option>
                    <option value="PERCENT">PERCENT (% Off Trip)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Offer Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat ₹500 Off on First Rental"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Short details shown to the customer..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    {formData.discount_type === 'PERCENT' ? 'Discount Percentage (%) *' : 'Discount Amount (₹) *'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={formData.discount_type === 'PERCENT' ? 100 : 100000}
                    required
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                {formData.discount_type === 'PERCENT' && (
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Max Cap (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1000"
                      value={formData.max_discount_inr || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_discount_inr: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Min Trip Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0 for no minimum"
                    value={formData.min_trip_amount_inr}
                    onChange={(e) =>
                      setFormData({ ...formData, min_trip_amount_inr: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Leave blank for unlimited"
                    value={formData.usage_limit || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usage_limit: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Valid Until (Expiry Date)</label>
                <input
                  type="date"
                  value={formData.valid_until || ''}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-5 rounded-xl text-white font-bold bg-red-600 hover:bg-red-500 transition shadow-lg shadow-red-950/40"
                >
                  {submitting ? 'Creating...' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW USAGES AUDIT MODAL */}
      {selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-500" />
                  Redemption History: <span className="font-mono text-red-400">{selectedCoupon.code}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Every user who applied and completed a booking with this coupon
                </p>
              </div>
              <button
                onClick={() => setSelectedCoupon(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingUsages ? (
                <div className="py-12 text-center text-zinc-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-400" />
                  Loading redemptions...
                </div>
              ) : usages.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  No users have redeemed coupon <span className="font-mono text-zinc-400">{selectedCoupon.code}</span> yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-3">User ID</th>
                      <th className="py-2.5 px-3">Booking ID</th>
                      <th className="py-2.5 px-3">Discount</th>
                      <th className="py-2.5 px-3">Final Amount</th>
                      <th className="py-2.5 px-3 text-right">Used At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {usages.map((u) => (
                      <tr key={u.usage_id} className="hover:bg-zinc-800/20">
                        <td className="py-2.5 px-3 text-zinc-300">
                          <span className="truncate max-w-[120px] inline-block" title={u.user_id}>
                            {u.user_id}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400">
                          <span className="truncate max-w-[120px] inline-block" title={u.booking_id || ''}>
                            {u.booking_id || 'N/A'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-emerald-400 font-semibold font-sans">
                          -₹{u.discount_inr.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-white font-sans">
                          ₹{u.discounted_amount_inr.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right text-zinc-500 font-sans">
                          {new Date(u.used_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedCoupon(null)}
                className="py-2 px-4 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

