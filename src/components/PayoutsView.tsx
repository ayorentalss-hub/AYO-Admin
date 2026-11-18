import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Check,
  ShieldCheck,
  Building,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { type PayoutItem } from '../types';
import { api } from '../api/client';
import { showToast } from './Toast';

interface CompletedTrip {
  id: string;
  status: string;
  host_id?: string;
  vehicle_id?: string;
  vehicle_name?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_registration_number?: string;
  rent_paise?: number;
  platform_fee_paise?: number;
  split_type?: string;
  completed_at?: string;
  created_at?: string;
  start_date?: string;
  end_date?: string;
  customer_name?: string;
  customer_phone?: string;
  customer?: { name?: string; phone?: string };
  vehicle?: { make?: string; model?: string; name?: string; registration_number?: string };
  host_name?: string;
  host_phone?: string;
  host?: {
    id?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    payout_method?: string;
    upi_vpa?: string;
    bank_account_number?: string;
    bank_ifsc?: string;
    bank_account_name?: string;
    payout_status?: string;
    payout_verified?: boolean;
  };
}

export const PayoutsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PENDING_TRIPS' | 'LEDGER'>('PENDING_TRIPS');

  // Completed trips awaiting payout
  const [completedTrips, setCompletedTrips] = useState<CompletedTrip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [tripsSearch, setTripsSearch] = useState('');
  const [tripsPage, setTripsPage] = useState(1);

  // Payouts Ledger
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(1);
  const pageSize = 20;

  // Pay Host Confirmation & Settlement Modal
  const [payTargetTrip, setPayTargetTrip] = useState<CompletedTrip | null>(null);
  const [payoutReference, setPayoutReference] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Mark Paid for existing payout item
  const [targetPayout, setTargetPayout] = useState<PayoutItem | null>(null);
  const [markPaidRef, setMarkPaidRef] = useState('');

  const fetchPayouts = async () => {
    try {
      setPayoutsLoading(true);
      const res = await api.getPayouts();
      setPayouts(res || []);
    } catch (err: any) {
      console.error('Failed to fetch payouts:', err);
    } finally {
      setPayoutsLoading(false);
    }
  };

  const fetchCompletedTrips = async () => {
    try {
      setTripsLoading(true);
      const res = (await api.getTrips('COMPLETED')) as any;
      const items = res?.items || res?.data || (Array.isArray(res) ? res : []);
      setCompletedTrips(items);
    } catch (err: any) {
      console.error('Failed to fetch completed trips:', err);
    } finally {
      setTripsLoading(false);
    }
  };

  const refreshAll = () => {
    fetchCompletedTrips();
    fetchPayouts();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const formatPrice = (paise?: number) => {
    if (!paise) return '₹0';
    return (paise / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  };

  const hostShare = (trip: CompletedTrip) => {
    if (!trip.rent_paise || !trip.platform_fee_paise) return 0;
    return Math.max(0, trip.rent_paise - trip.platform_fee_paise);
  };

  // Map of payouts by booking ID (supports both snake_case and camelCase)
  const payoutsByBookingId = useMemo(() => {
    const map = new Map<string, PayoutItem>();
    payouts.forEach((p) => {
      const bId = p.booking_id || (p as any).bookingId;
      if (bId) map.set(bId, p);
    });
    return map;
  }, [payouts]);

  // Already settled (PAID) booking IDs - excluded from pending trips list
  const alreadyPaidBookingIds = new Set(
    payouts
      .filter((p) => p.status === 'PAID')
      .map((p) => p.booking_id || (p as any).bookingId)
      .filter(Boolean)
  );

  // Eligible completed trips (FULL payment split & not yet settled)
  const eligibleTrips = completedTrips.filter(
    (t) => t.split_type === 'FULL' && !alreadyPaidBookingIds.has(t.id)
  );

  const filteredTrips = eligibleTrips.filter((t) => {
    if (!tripsSearch.trim()) return true;
    const q = tripsSearch.toLowerCase().trim();
    const vName = (t.vehicle_name || t.vehicle?.name || `${t.vehicle_make || ''} ${t.vehicle_model || ''}`).toLowerCase();
    const vReg = (t.vehicle_registration_number || t.vehicle?.registration_number || '').toLowerCase();
    const hName = (t.host_name || t.host?.name || t.host?.first_name || '').toLowerCase();
    const hPhone = (t.host_phone || t.host?.phone || '').toLowerCase();
    return vName.includes(q) || vReg.includes(q) || hName.includes(q) || hPhone.includes(q);
  });

  const totalTripsPages = Math.ceil(filteredTrips.length / pageSize) || 1;
  const paginatedTrips = filteredTrips.slice((tripsPage - 1) * pageSize, tripsPage * pageSize);

  const totalLedgerPages = Math.ceil(payouts.length / pageSize) || 1;
  const paginatedLedger = payouts.slice((ledgerPage - 1) * pageSize, ledgerPage * pageSize);

  // Direct Pay Handler: Creates payout and marks it as PAID with reference
  const handleProcessDirectPay = async () => {
    if (!payTargetTrip) return;
    const hostId = payTargetTrip.host?.id || payTargetTrip.host_id;
    if (!hostId) {
      showToast('Host ID not found for this trip.', 'error');
      return;
    }

    try {
      setActionLoading(true);
      // 1. Check if payout was already created for this trip
      const existingPayout = payoutsByBookingId.get(payTargetTrip.id);
      let payoutId = existingPayout?.id;

      if (!payoutId) {
        // Create new Payout Record
        const created = await api.createPayout(hostId, payTargetTrip.id);
        payoutId = created?.id;
      }

      // 2. Mark as PAID immediately with entered UTR or auto manual reference
      const ref = payoutReference.trim() || `MANUAL-UPI-${Date.now().toString().slice(-6)}`;
      if (payoutId) {
        await api.markPayoutPaid(payoutId, ref);
      }

      showToast(`Host payout of ${formatPrice(hostShare(payTargetTrip))} marked as PAID!\nReference/UTR: ${ref}`, 'success');
      setPayTargetTrip(null);
      setPayoutReference('');
      refreshAll();
    } catch (err: any) {
      showToast(`Payout failed: ${err?.message || 'Server error'}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark Paid for existing payout record
  const handleMarkPaidExisting = async () => {
    if (!targetPayout || !markPaidRef.trim()) return;
    try {
      setActionLoading(true);
      await api.markPayoutPaid(targetPayout.id, markPaidRef.trim());
      showToast('Payout marked as PAID successfully! Host notified.', 'success');
      setTargetPayout(null);
      setMarkPaidRef('');
      fetchPayouts();
    } catch (err: any) {
      showToast(`Mark paid failed: ${err?.message || 'Server error'}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const totalPendingAmount = eligibleTrips.reduce((acc, t) => acc + hostShare(t), 0);
  const totalSettledAmount = payouts
    .filter((p) => p.status === 'PAID')
    .reduce((acc, p) => acc + (p.amount_paise || (p as any).amountPaise || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-500" />
            Host Payouts & Disbursements
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Review completed trips awaiting payment, verify host bank/UPI accounts, and disburse earnings with bank reference.
          </p>
        </div>
        <button
          onClick={refreshAll}
          disabled={tripsLoading || payoutsLoading}
          className="flex items-center space-x-1.5 py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${tripsLoading || payoutsLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Awaiting Payout</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{formatPrice(totalPendingAmount)}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">{eligibleTrips.length} completed trips</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Settled (Paid)</p>
            <p className="text-2xl font-bold text-white mt-1">{formatPrice(totalSettledAmount)}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">{payouts.filter((p) => p.status === 'PAID').length} settlements</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Payout Safety Guard</p>
            <p className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> 100% Locked & Verified
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Unverified hosts cannot be paid</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center space-x-2 border-b border-zinc-800 pb-1">
        <button
          onClick={() => setActiveTab('PENDING_TRIPS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'PENDING_TRIPS'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'text-zinc-400 hover:text-white bg-zinc-900/40 border border-zinc-800/40'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Completed Trips to Pay</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            {eligibleTrips.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'LEDGER'
              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-md'
              : 'text-zinc-400 hover:text-white bg-zinc-900/40 border border-zinc-800/40'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Settlement Ledger History</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700">
            {payouts.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PENDING COMPLETED TRIPS TO PAY */}
      {activeTab === 'PENDING_TRIPS' && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl space-y-4 p-5">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vehicle, plate number, host..."
                value={tripsSearch}
                onChange={(e) => {
                  setTripsSearch(e.target.value);
                  setTripsPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-xs text-zinc-400">
              Showing <strong className="text-white">{filteredTrips.length}</strong> trips ready for payout
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/90 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Vehicle & Completed Date</th>
                  <th className="py-3 px-4">Host Details</th>
                  <th className="py-3 px-4">Fare Split</th>
                  <th className="py-3 px-4">Host Due Amount</th>
                  <th className="py-3 px-4">Payout Destination</th>
                  <th className="py-3 px-4 text-center">Verification</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {tripsLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                      Loading completed trips...
                    </td>
                  </tr>
                ) : filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      {tripsSearch
                        ? 'No completed trips match your search.'
                        : 'No pending completed trips awaiting payout. All completed trips have been disbursed!'}
                    </td>
                  </tr>
                ) : (
                  paginatedTrips.map((trip) => {
                    const due = hostShare(trip);
                    const vehicleName =
                      trip.vehicle_name ||
                      trip.vehicle?.name ||
                      [trip.vehicle_make || trip.vehicle?.make, trip.vehicle_model || trip.vehicle?.model]
                        .filter(Boolean)
                        .join(' ') ||
                      'Vehicle';
                    const regNum = trip.vehicle_registration_number || trip.vehicle?.registration_number;
                    const hostName = trip.host_name || trip.host?.name || trip.host?.first_name || 'Host';
                    const hostPhone = trip.host_phone || trip.host?.phone || '';
                    const isVerified = trip.host?.payout_verified === true;
                    const payoutMethod = trip.host?.payout_method || 'UPI';
                    const upiVpa = trip.host?.upi_vpa;
                    const bankAcc = trip.host?.bank_account_number;
                    const bankIfsc = trip.host?.bank_ifsc;
                    const completedDate = trip.completed_at || trip.end_date || trip.created_at;

                    return (
                      <tr key={trip.id} className="hover:bg-zinc-800/30 transition">
                        {/* Vehicle & Date */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-sm">{vehicleName}</span>
                            {regNum && (
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300">
                                {regNum}
                              </span>
                            )}
                          </div>
                          <p className="text-zinc-500 text-[11px] font-mono mt-0.5">
                            {completedDate
                              ? new Date(completedDate).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Trip Completed'}
                          </p>
                        </td>

                        {/* Host */}
                        <td className="py-3 px-4">
                          <p className="font-semibold text-white">{hostName}</p>
                          <p className="text-zinc-400 text-[11px] font-mono">{hostPhone || 'No phone'}</p>
                        </td>

                        {/* Fare Split */}
                        <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                          <p>Total: <span className="text-zinc-200">{formatPrice(trip.rent_paise)}</span></p>
                          <p>Fee: <span className="text-zinc-400">{formatPrice(trip.platform_fee_paise)}</span></p>
                        </td>

                        {/* Host Due Amount */}
                        <td className="py-3 px-4 font-mono">
                          <p className="text-emerald-400 font-bold text-base">{formatPrice(due)}</p>
                          <span className="text-[10px] text-zinc-500 font-sans">Net Host Share</span>
                        </td>

                        {/* Payout Destination */}
                        <td className="py-3 px-4 text-xs font-mono">
                          {payoutMethod === 'BANK' ? (
                            <div>
                              <div className="flex items-center space-x-1 text-blue-400 font-sans font-semibold text-[11px]">
                                <Building className="w-3.5 h-3.5" />
                                <span>Bank Account</span>
                              </div>
                              <p className="text-white text-[11px] font-bold">A/C: {bankAcc || '••••'}</p>
                              <p className="text-zinc-400 text-[10px]">IFSC: {bankIfsc || 'N/A'}</p>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center space-x-1 text-emerald-400 font-sans font-semibold text-[11px]">
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>UPI (VPA)</span>
                              </div>
                              <p className="text-white text-[11px] font-bold truncate max-w-[180px]">{upiVpa || 'Not provided'}</p>
                            </div>
                          )}
                        </td>

                        {/* Verification Status */}
                        <td className="py-3 px-4 text-center">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <Check className="w-3 h-3" />
                              Verified
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30"
                              title="Host bank or UPI details are pending admin verification in Users & KYC Approvals"
                            >
                              <AlertCircle className="w-3 h-3" />
                              Unverified
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right">
                          {(() => {
                            const existingPayout = payoutsByBookingId.get(trip.id);
                            if (existingPayout && existingPayout.status === 'PENDING') {
                              return (
                                <button
                                  onClick={() => {
                                    setTargetPayout(existingPayout);
                                    setMarkPaidRef('');
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md transition inline-flex items-center gap-1.5"
                                  title="Payout record created but pending UTR. Click to record banking UTR reference and complete settlement."
                                >
                                  <span>Record UTR (Pending)</span>
                                  <span>→</span>
                                </button>
                              );
                            }
                            if (isVerified) {
                              return (
                                <button
                                  onClick={() => {
                                    setPayTargetTrip(trip);
                                    setPayoutReference('');
                                  }}
                                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 transition inline-flex items-center gap-1.5"
                                >
                                  <span>Pay {formatPrice(due)}</span>
                                  <span>→</span>
                                </button>
                              );
                            }
                            return (
                              <button
                                disabled
                                className="px-3.5 py-1.5 rounded-xl text-[11px] font-bold bg-zinc-800 text-zinc-500 border border-zinc-700/60 cursor-not-allowed"
                                title="Payout is locked because Host KYC / Bank details are unverified. Please verify in Users & KYC first."
                              >
                                Verify Bank First
                              </button>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredTrips.length > 0 && (
            <div className="px-2 py-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <div>
                Showing {(tripsPage - 1) * pageSize + 1} to {Math.min(tripsPage * pageSize, filteredTrips.length)} of {filteredTrips.length} pending trips
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setTripsPage((p) => Math.max(1, p - 1))}
                  disabled={tripsPage <= 1}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-white px-2">
                  Page {tripsPage} of {totalTripsPages}
                </span>
                <button
                  onClick={() => setTripsPage((p) => Math.min(totalTripsPages, p + 1))}
                  disabled={tripsPage >= totalTripsPages}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SETTLED PAYOUTS LEDGER */}
      {activeTab === 'LEDGER' && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl p-5 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/90 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Payout ID</th>
                  <th className="py-3 px-4">Host Name</th>
                  <th className="py-3 px-4">Disbursement Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Gateway / Bank UTR Ref</th>
                  <th className="py-3 px-4 text-right">Settlement Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {payoutsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                      Loading payout ledger...
                    </td>
                  </tr>
                ) : payouts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500">
                      No payout records generated yet. Pay a completed trip from the "Completed Trips to Pay" tab.
                    </td>
                  </tr>
                ) : (
                  paginatedLedger.map((p) => {
                    const amount = p.amount_paise || (p as any).amountPaise || 0;
                    return (
                      <tr key={p.id} className="hover:bg-zinc-800/30 transition">
                        <td className="py-3 px-4 font-mono text-zinc-400 text-[11px]">
                          {p.id.slice(0, 8)}...
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          {(p as any).host_name || (p as any).host?.name || p.host_id?.slice(0, 8) || 'Host'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-sm">
                          {formatPrice(amount)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : p.status === 'FAILED'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-300 text-[11px]">
                          {p.reference || p.pg_payout_id || <span className="text-zinc-600 italic">None recorded</span>}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {p.status === 'PENDING' ? (
                            <button
                              onClick={() => {
                                setTargetPayout(p);
                                setMarkPaidRef('');
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white transition"
                            >
                              Record UTR / Mark Paid
                            </button>
                          ) : (
                            <span className="text-emerald-400 text-[11px] font-semibold flex items-center justify-end gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {payouts.length > 0 && (
            <div className="px-2 py-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <div>
                Showing {(ledgerPage - 1) * pageSize + 1} to {Math.min(ledgerPage * pageSize, payouts.length)} of {payouts.length} payouts
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                  disabled={ledgerPage <= 1}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-white px-2">
                  Page {ledgerPage} of {totalLedgerPages}
                </span>
                <button
                  onClick={() => setLedgerPage((p) => Math.min(totalLedgerPages, p + 1))}
                  disabled={ledgerPage >= totalLedgerPages}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONFIRM PAY HOST MODAL */}
      {payTargetTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-400" />
                Disburse Host Earnings
              </h3>
              <button
                onClick={() => setPayTargetTrip(null)}
                className="text-zinc-500 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Trip & Destination Summary */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Host:</span>
                <span className="font-bold text-white">
                  {payTargetTrip.host_name || payTargetTrip.host?.name || 'Host'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Vehicle:</span>
                <span className="font-semibold text-zinc-200">
                  {payTargetTrip.vehicle_name || payTargetTrip.vehicle?.name || 'Vehicle'} (
                  {payTargetTrip.vehicle_registration_number || payTargetTrip.vehicle?.registration_number || 'N/A'})
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-800/80 pt-2">
                <span className="text-zinc-400">Payout Destination:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {payTargetTrip.host?.payout_method === 'BANK'
                    ? `A/C: ${payTargetTrip.host.bank_account_number || '••••'} (${payTargetTrip.host.bank_ifsc || 'N/A'})`
                    : `UPI: ${payTargetTrip.host?.upi_vpa || 'N/A'}`}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-800/80 pt-2 text-sm">
                <span className="font-bold text-white">Disbursement Amount:</span>
                <span className="font-mono font-bold text-emerald-400 text-lg">
                  {formatPrice(hostShare(payTargetTrip))}
                </span>
              </div>
            </div>

            {/* Instruction Notice */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-1">
              <p className="font-semibold text-blue-200">ℹ️ Direct Bank / UPI Transfer:</p>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Apne banking app ya UPI app se upar diye gaye host account me exact <span className="text-emerald-400 font-bold">{formatPrice(hostShare(payTargetTrip))}</span> transfer karein. Niche Bank UTR ya UPI Ref ID daal kar confirm karein taki payout turant <span className="text-emerald-400 font-bold">PAID</span> mark ho jaye aur host ko notification chala jaye.
              </p>
            </div>

            {/* UTR input */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Bank UTR / Transaction Reference (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. IMPS/UTR1234567890 or UPI Ref ID"
                value={payoutReference}
                onChange={(e) => setPayoutReference(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Aap UTR abhi daal sakte hain ya baad me Ledger tab se bhi "Record UTR" kar sakte hain.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setPayTargetTrip(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessDirectPay}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40"
              >
                {actionLoading ? 'Processing Payout...' : 'Confirm & Disburse Now →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MARK PAID MODAL (For existing ledger items) */}
      {targetPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Record Bank Settlement UTR
            </h3>
            <p className="text-xs text-zinc-400">
              Provide the IMPS/NEFT/UPI banking transaction reference ID to mark this payout as PAID.
            </p>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Banking Transaction UTR / Ref *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. UTR20261113009988"
                value={markPaidRef}
                onChange={(e) => setMarkPaidRef(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setTargetPayout(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaidExisting}
                disabled={actionLoading || !markPaidRef.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
              >
                {actionLoading ? 'Saving...' : 'Mark as PAID ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
