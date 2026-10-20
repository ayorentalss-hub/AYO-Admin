import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';
import { type PayoutItem } from '../types';
import { api } from '../api/client';

export const PayoutsView: React.FC = () => {
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleMarkPaid = async () => {
    if (!targetPayout) return;
    if (!reference.trim()) {
      alert('Please provide a banking reference / UTR number.');
      return;
    }
    try {
      setSubmitting(true);
      await api.markPayoutPaid(targetPayout.id, reference.trim());
      alert('Payout marked as PAID successfully!');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Host Payouts Ledger</h2>
          <p className="text-xs text-slate-400 mt-1">
            Track automated host earnings disbursements and manually record offline bank IMPS / NEFT settlement references.
          </p>
        </div>
      </div>

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
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No payout records generated yet.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
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
      </div>

      {/* Mark Paid Modal */}
      {targetPayout && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Record Settlement Reference</h3>
            </div>
            <p className="text-xs text-slate-400">
              Mark payout of <span className="font-bold text-white">{formatPrice(targetPayout.amount_paise)}</span> as
              PAID:
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Bank UTR / Transaction Reference #
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. UTR1234567890 or IMPS_REF_9988"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
              />
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
                {submitting ? 'Recording...' : 'Confirm Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
