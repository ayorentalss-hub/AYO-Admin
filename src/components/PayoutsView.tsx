import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, ChevronLeft, ChevronRight, Plus, IndianRupee, Clock, AlertCircle } from 'lucide-react';
import { type PayoutItem } from '../types';
import { api } from '../api/client';

interface CompletedTrip {
  id: string;
  status: string;
  host_id?: string;
  vehicle_id?: string;
  rent_paise?: number;
  platform_fee_paise?: number;
  split_type?: string;
  completed_at?: string;
  customer?: { name?: string; phone?: string };
  vehicle?: { make?: string; model?: string; name?: string };
  host?: { first_name?: string; phone?: string; id?: string };
}

export const PayoutsView: React.FC = () => {
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  // Create payout modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [completedTrips, setCompletedTrips] = useState<CompletedTrip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<CompletedTrip | null>(null);
  const [creating, setCreating] = useState(false);

  // Mark paid modal
  const [targetPayout, setTargetPayout] = useState<PayoutItem | null>(null);
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const res = await api.getPayouts();
      setPayouts(res || []);
    } catch (err: any) {
      console.error('Failed to fetch payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchCompletedTrips = async () => {
    try {
      setTripsLoading(true);
      const res = await api.getTrips('COMPLETED') as any;
      const items = res?.items || res?.data || (Array.isArray(res) ? res : []);
      setCompletedTrips(items);
    } catch (err: any) {
      console.error('Failed to fetch completed trips:', err);
    } finally {
      setTripsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    setSelectedTrip(null);
    fetchCompletedTrips();
  };

  const handleCreatePayout = async () => {
    if (!selectedTrip) return;
    const hostId = selectedTrip.host?.id || selectedTrip.host_id;
    if (!hostId) {
      alert('Host ID not found for this trip');
      return;
    }
    try {
      setCreating(true);
      await api.createPayout(hostId, selectedTrip.id);
      alert('Payout created successfully! Now mark it as PAID after transferring money.');
      setShowCreateModal(false);
      setSelectedTrip(null);
      fetchPayouts();
    } catch (err: any) {
      const msg = err?.message || 'Failed to create payout';
      alert(`Error: ${msg}`);
    } finally {
      setCreating(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!targetPayout) return;
    if (!reference.trim()) {
      alert('Please provide a banking reference / UTR number.');
      return;
    }
    try {
      setSubmitting(true);
      await api.markPayoutPaid(targetPayout.id, reference.trim());
      alert('Payout marked as PAID successfully! Host will be notified.');
      setTargetPayout(null);
      setReference('');
      fetchPayouts();
    } catch (err: any) {
      alert(`Mark paid failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (paise?: number) => {
    if (!paise) return '₹0';
    return (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  };

  const hostShare = (trip: CompletedTrip) => {
    if (!trip.rent_paise || !trip.platform_fee_paise) return 0;
    return trip.rent_paise - trip.platform_fee_paise;
  };

  const totalPages = Math.ceil(payouts.length / pageSize) || 1;
  const paginatedPayouts = payouts.slice((page - 1) * pageSize, page * pageSize);

  // Already paid booking IDs
  const alreadyPaidBookingIds = new Set(payouts.map((p) => p.booking_id).filter(Boolean));

  // Only FULL split trips eligible for online payout
  const eligibleTrips = completedTrips.filter(
    (t) => t.split_type === 'FULL' && !alreadyPaidBookingIds.has(t.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Host Payouts Ledger</h2>
          <p className="text-xs text-slate-400 mt-1">
            Track and disburse host earnings. Create payouts for completed trips and record bank IMPS / NEFT / UPI settlement references.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition shadow-lg shadow-emerald-900/30"
        >
          <Plus className="w-4 h-4" />
          Create Payout
        </button>
      </div>

      {/* How it works info box */}
      <div className="rounded-xl bg-blue-900/20 border border-blue-800/40 px-5 py-4 text-xs text-blue-300 space-y-1">
        <p className="font-semibold text-blue-200 mb-2 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Payout Flow — Admin kaise kare</p>
        <p>1. 🏁 <strong>Trip COMPLETED</strong> hone ke baad "Create Payout" dabao</p>
        <p>2. 📋 Completed trip select karo — host ka due amount automatically calculate hoga</p>
        <p>3. 💸 Manually host ko <strong>UPI / IMPS / NEFT</strong> se paisa bhejo</p>
        <p>4. ✅ Table mein "Mark Paid" dabao aur <strong>UTR / Reference number</strong> dalo</p>
        <p>5. 🔔 Host ko automatic notification jayegi ki payout process ho gaya</p>
      </div>

      {/* Payouts Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Payout ID</th>
                <th className="px-5 py-3.5">Host</th>
                <th className="px-5 py-3.5">Disbursement Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Gateway / Bank Ref</th>
                <th className="px-5 py-3.5 text-right">Settlement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    Loading payouts...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <IndianRupee className="w-8 h-8 opacity-30" />
                      <p>No payout records yet.</p>
                      <button
                        onClick={handleOpenCreateModal}
                        className="px-4 py-2 rounded-xl bg-emerald-700/40 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-semibold transition"
                      >
                        + Create First Payout
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPayouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="font-semibold text-white font-mono text-[11px]">{p.id.slice(0, 12)}...</p>
                          <p className="text-[10px] text-slate-500 font-mono">Host ID: {p.host_id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{p.host?.first_name || 'Host'}</p>
                      <p className="text-slate-400 font-mono text-[11px]">{p.host?.phone || p.host_id}</p>
                    </td>

                    <td className="px-5 py-4 font-bold text-white font-mono text-sm">
                      {formatPrice(p.amount_paise)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          p.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : p.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                            : p.status === 'PROCESSING'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-400 text-[11px]">
                      {p.pg_payout_id || <span className="text-slate-600">Pending Ref</span>}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {p.status !== 'PAID' && (
                        <button
                          onClick={() => {
                            setTargetPayout(p);
                            setReference('');
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white transition flex items-center space-x-1.5 ml-auto"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mark Paid</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {payouts.length > 0 && (
          <div className="px-5 py-3.5 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, payouts.length)} of {payouts.length} payouts
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-white px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== CREATE PAYOUT MODAL ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <Plus className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Create Host Payout</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-white text-xl font-bold">×</button>
            </div>

            {/* Trips List */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-2">
              <p className="text-xs text-slate-400 mb-3">
                Select a completed trip to create payout. Only <strong>FULL payment</strong> trips are eligible (cash trips have no online payout).
              </p>

              {tripsLoading ? (
                <div className="text-center py-8 text-slate-500 text-sm">Loading completed trips...</div>
              ) : eligibleTrips.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm flex flex-col items-center gap-2">
                  <Clock className="w-8 h-8 opacity-30" />
                  <p>No eligible completed trips found.</p>
                  <p className="text-xs text-slate-600">Either all trips have payouts already, or no FULL-payment completed trips exist.</p>
                </div>
              ) : (
                eligibleTrips.map((trip) => {
                  const isSelected = selectedTrip?.id === trip.id;
                  const due = hostShare(trip);
                  const vehicleName = trip.vehicle?.name || `${trip.vehicle?.make || ''} ${trip.vehicle?.model || ''}`.trim() || 'Vehicle';
                  const hostName = trip.host?.first_name || 'Host';
                  const hostPhone = trip.host?.phone || '';

                  return (
                    <div
                      key={trip.id}
                      onClick={() => setSelectedTrip(isSelected ? null : trip)}
                      className={`rounded-xl border p-4 cursor-pointer transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${isSelected ? 'border-emerald-400 bg-emerald-400' : 'border-slate-600'}`} />
                          <div>
                            <p className="text-white font-semibold text-sm">{vehicleName}</p>
                            <p className="text-slate-400 text-[11px] font-mono">Trip: {trip.id.slice(0, 12)}...</p>
                            <p className="text-slate-400 text-[11px]">Host: {hostName} {hostPhone && `• ${hostPhone}`}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-emerald-400 font-bold text-base font-mono">{formatPrice(due)}</p>
                          <p className="text-slate-500 text-[10px]">Host's share</p>
                          <p className="text-slate-600 text-[10px]">Total: {formatPrice(trip.rent_paise)} | Fee: {formatPrice(trip.platform_fee_paise)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                {selectedTrip ? (
                  <span className="text-emerald-400 font-semibold">
                    ✓ Selected: {formatPrice(hostShare(selectedTrip))} payout
                  </span>
                ) : (
                  'Select a trip above to continue'
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePayout}
                  disabled={!selectedTrip || creating}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Payout →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MARK PAID MODAL ===== */}
      {targetPayout && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Record Settlement Reference</h3>
            </div>
            <p className="text-xs text-slate-400">
              Mark payout of <span className="font-bold text-white">{formatPrice(targetPayout.amount_paise)}</span> as PAID.
              <br />Host will get a push notification once marked.
            </p>

            <div className="bg-slate-950 rounded-xl p-3 text-xs text-slate-400 space-y-1">
              <p><span className="text-slate-500">Host:</span> <span className="text-white">{targetPayout.host?.first_name || 'Host'} — {targetPayout.host?.phone || targetPayout.host_id}</span></p>
              <p><span className="text-slate-500">Amount:</span> <span className="text-emerald-400 font-bold">{formatPrice(targetPayout.amount_paise)}</span></p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Bank UTR / UPI Transaction Reference #
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. UTR1234567890 or IMPS_REF_9988"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-600 mt-1">Ye reference host ke notification mein bhi jayega</p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setTargetPayout(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/30 disabled:opacity-50"
              >
                {submitting ? 'Recording...' : 'Confirm Paid ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
