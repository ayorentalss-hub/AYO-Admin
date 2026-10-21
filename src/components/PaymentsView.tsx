import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Copy,
  Check,
  CreditCard,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Car,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowDownLeft,
} from 'lucide-react';
import type { PaymentItem } from '../types';
import { api } from '../api/client';

export const PaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [purposeFilter, setPurposeFilter] = useState<'ALL' | 'LISTING_FEE' | 'BOOKING'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CAPTURED' | 'FAILED' | 'REFUNDED'>('ALL');
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.getPayments(page, 20, purposeFilter, statusFilter);
      setPayments(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, purposeFilter, statusFilter]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const payId = (p.payment_id || '').toLowerCase();
    const orderId = (p.order_id || '').toLowerCase();
    const userName = (p.user?.name || '').toLowerCase();
    const userPhone = (p.user?.phone || '').toLowerCase();
    const userEmail = (p.user?.email || '').toLowerCase();
    const carModel = `${p.vehicle?.make || ''} ${p.vehicle?.model || ''}`.toLowerCase();
    const carReg = (p.vehicle?.registration_number || '').toLowerCase();

    return (
      payId.includes(q) ||
      orderId.includes(q) ||
      userName.includes(q) ||
      userPhone.includes(q) ||
      userEmail.includes(q) ||
      carModel.includes(q) ||
      carReg.includes(q)
    );
  });

  const totalPages = Math.ceil(total / 20) || 1;

  // Aggregate stats from current view
  const listingFeeTotal = payments
    .filter((p) => p.purpose === 'LISTING_FEE' && p.status === 'CAPTURED')
    .reduce((sum, p) => sum + p.amount_rupees, 0);

  const bookingFeeTotal = payments
    .filter((p) => p.purpose === 'BOOKING' && p.status === 'CAPTURED')
    .reduce((sum, p) => sum + p.amount_rupees, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-red-500" />
            <span>Payments & Webhook Transactions</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time live Razorpay captured webhooks, listing fees (₹499), and customer rental booking payments.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          disabled={loading}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white flex items-center space-x-2 transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-400' : ''}`} />
          <span>Refresh Live Feed</span>
        </button>
      </div>

      {/* Mini KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Logged Payments</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-white mt-2">{total} Transactions</p>
          <p className="text-[11px] text-emerald-400 mt-0.5">Captured via Razorpay Webhook</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Listing Fees (₹499)</span>
            <Car className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-white mt-2">
            ₹{listingFeeTotal.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">From Host Vehicle Submissions</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Trip Bookings</span>
            <ArrowDownLeft className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-bold text-white mt-2">
            ₹{bookingFeeTotal.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Customer Rental Payments</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Payment ID (pay_...), Order ID, Name, Phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          {/* Purpose Filter */}
          <div className="flex items-center space-x-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            {(['ALL', 'LISTING_FEE', 'BOOKING'] as const).map((pur) => (
              <button
                key={pur}
                onClick={() => {
                  setPurposeFilter(pur);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition text-[11px] ${
                  purposeFilter === pur
                    ? 'bg-red-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {pur === 'ALL' ? 'All Purposes' : pur === 'LISTING_FEE' ? 'Listing Fees (₹499)' : 'Bookings'}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            {(['ALL', 'CAPTURED', 'FAILED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition text-[11px] ${
                  statusFilter === st
                    ? 'bg-slate-700 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {st === 'ALL' ? 'All Status' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Razorpay Payment & Order ID</th>
                <th className="px-5 py-3.5">Payer Details</th>
                <th className="px-5 py-3.5">Purpose & Vehicle</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-red-500 mb-2" />
                    Loading payment records...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No payment transactions found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isListing = p.purpose === 'LISTING_FEE';
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      {/* Payment & Order IDs */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          {p.payment_id ? (
                            <div className="flex items-center space-x-1.5 font-mono text-[11px] text-emerald-400 font-bold">
                              <span>{p.payment_id}</span>
                              <button
                                onClick={() => handleCopy(p.payment_id!)}
                                className="text-slate-500 hover:text-slate-300 p-0.5"
                                title="Copy Payment ID"
                              >
                                {copiedId === p.payment_id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">No PG Payment ID</span>
                          )}

                          {p.order_id && (
                            <div className="flex items-center space-x-1.5 font-mono text-[10px] text-slate-500">
                              <span>{p.order_id}</span>
                              <button
                                onClick={() => handleCopy(p.order_id!)}
                                className="hover:text-slate-400 p-0.5"
                                title="Copy Order ID"
                              >
                                {copiedId === p.order_id ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Payer Details */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white text-[12px]">
                            {p.user?.name || 'Registered User'}
                          </p>
                          {p.user?.phone && (
                            <p className="text-slate-400 font-mono text-[11px]">{p.user.phone}</p>
                          )}
                          {p.user?.email && (
                            <p className="text-slate-500 text-[10px]">{p.user.email}</p>
                          )}
                        </div>
                      </td>

                      {/* Purpose & Vehicle / Booking */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isListing
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}
                          >
                            {isListing ? 'Vehicle Listing Fee' : 'Trip Rental Booking'}
                          </span>

                          {p.vehicle && (
                            <p className="text-slate-400 text-[11px] font-medium flex items-center space-x-1">
                              <Car className="w-3 h-3 text-slate-500 mr-1 inline" />
                              <span>
                                {p.vehicle.make} {p.vehicle.model}
                              </span>
                              {p.vehicle.registration_number && (
                                <span className="text-slate-500 font-mono text-[10px]">
                                  ({p.vehicle.registration_number})
                                </span>
                              )}
                            </p>
                          )}

                          {p.booking_id && (
                            <p className="text-slate-500 font-mono text-[10px]">
                              Trip #{p.booking_id.substring(0, 8)}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-white text-sm tracking-tight">
                          ₹{p.amount_rupees.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            p.status === 'CAPTURED'
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              : p.status === 'CREATED'
                              ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                              : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                          }`}
                        >
                          {p.status === 'CAPTURED' ? (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          ) : p.status === 'CREATED' ? (
                            <Clock className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          <span>{p.status}</span>
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                        {new Date(p.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="px-5 py-3 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {payments.length} of {total} payments
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
