import React, { useState, useEffect } from 'react';
import { Navigation, CheckSquare, XSquare, AlertCircle } from 'lucide-react';
import { type TripItem } from '../types';
import { api } from '../api/client';

export const TripsView: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Force modal state
  const [forceTarget, setForceTarget] = useState<{ id: string; action: 'complete' | 'cancel' } | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await api.getTrips(statusFilter);
      setTrips(res || []);
    } catch (err: any) {
      console.error('Failed to fetch trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [statusFilter]);

  const handleForceTrip = async () => {
    if (!forceTarget) return;
    if (!reason.trim()) {
      alert('Please specify an administrative reason.');
      return;
    }
    try {
      setSubmitting(true);
      await api.forceTrip(forceTarget.id, forceTarget.action, reason.trim());
      alert(`Trip forced to ${forceTarget.action === 'complete' ? 'COMPLETED' : 'CANCELLED'}!`);
      setForceTarget(null);
      setReason('');
      fetchTrips();
    } catch (err: any) {
      alert(`Force action failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (paise?: number) => {
    if (!paise) return '₹0';
    return (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Trips & Live Bookings</h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitor real-time rental reservations, pickup handovers, overstay alerts, and administrative override actions.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          {[
            { id: '', label: 'All Trips' },
            { id: 'CONFIRMED', label: 'Confirmed' },
            { id: 'ONGOING', label: 'Ongoing' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === item.id ? 'bg-red-600 text-white font-bold shadow-md shadow-red-900/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trips Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Booking</th>
                <th className="px-5 py-3.5">Vehicle</th>
                <th className="px-5 py-3.5">Customer & Host</th>
                <th className="px-5 py-3.5">Rental Duration</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    Loading trips...
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No trips found matching filter.
                  </td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-2">
                        <Navigation className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="font-semibold text-white">{t.booking_code || t.id.slice(0, 8)}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{t.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">
                        {t.vehicle?.make} {t.vehicle?.model}
                      </p>
                      <p className="text-[11px] text-slate-400">{t.vehicle?.name}</p>
                    </td>

                    <td className="px-5 py-4 space-y-0.5">
                      <p className="text-slate-300">
                        <span className="text-slate-500">Guest:</span> {t.customer?.first_name || 'Guest'} (
                        <span className="font-mono text-[11px]">{t.customer?.phone}</span>)
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        <span className="text-slate-500">Host:</span> {t.host?.first_name || 'Host'} (
                        <span className="font-mono text-[10px]">{t.host?.phone}</span>)
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      <p>{formatDate(t.start_time)}</p>
                      <p className="text-slate-500 text-[11px]">➔ {formatDate(t.end_time)}</p>
                    </td>

                    <td className="px-5 py-4 font-bold text-white font-mono">{formatPrice(t.total_price_paise)}</td>

                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          t.status === 'CONFIRMED'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : t.status === 'ONGOING'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                            : t.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      {t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setForceTarget({ id: t.id, action: 'complete' });
                              setReason('');
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white transition flex items-center space-x-1"
                            title="Force complete trip"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Complete</span>
                          </button>

                          <button
                            onClick={() => {
                              setForceTarget({ id: t.id, action: 'cancel' });
                              setReason('');
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white transition flex items-center space-x-1"
                            title="Force cancel trip"
                          >
                            <XSquare className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Force Trip Modal */}
      {forceTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-amber-400">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">
                Admin Force {forceTarget.action === 'complete' ? 'Completion' : 'Cancellation'}
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              State machine override: provide an administrative justification for this action.
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Mutual host-guest agreement offline, or emergency vehicle breakdown."
              rows={4}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red-500 resize-none"
            />

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setForceTarget(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleForceTrip}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-900/30 disabled:opacity-50"
              >
                {submitting ? 'Executing Override...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
