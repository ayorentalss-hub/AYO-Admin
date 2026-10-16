import React, { useState } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, RefreshCcw, CreditCard, Layers } from 'lucide-react';
import type { LedgerSummary } from '../types';
import { api } from '../api/client';

interface DashboardViewProps {
  ledger: LedgerSummary | null;
  alerts: any[];
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ ledger, alerts, onRefresh }) => {
  const [retrying, setRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<string | null>(null);

  const formatRupees = (paise?: number) => {
    if (paise === undefined || paise === null) return '₹0.00';
    return (paise / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    });
  };

  const handleRetryRefunds = async () => {
    try {
      setRetrying(true);
      const res = await api.retryRefunds();
      setRetryResult(`Attempted: ${res.attempted}, Still Pending: ${res.still_pending}`);
      onRefresh();
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setRetrying(false);
    }
  };

  const safeAlerts = Array.isArray(alerts) ? alerts : (alerts as any)?.alerts || (alerts as any)?.items || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Platform Financial Ledger</h2>
        <p className="text-xs text-slate-400 mt-1">
          Real-time double-entry aggregate balances from captured payments and payouts.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Platform Earnings */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Platform Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3 tracking-tight">
            {formatRupees(ledger?.platform_earnings_paise)}
          </p>
          <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            Platform Cut + Vehicle Listing Fees
          </p>
        </div>

        {/* Booking Fees */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Booking Commissions
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3 tracking-tight">
            {formatRupees(ledger?.booking_fees_paise)}
          </p>
          <p className="text-xs text-slate-400 mt-1">From guest completed & confirmed trips</p>
        </div>

        {/* Vehicle Listing Fees */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Vehicle Listing Fees
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3 tracking-tight">
            {formatRupees(ledger?.listing_fees_paise)}
          </p>
          <p className="text-xs text-slate-400 mt-1">₹499 per vehicle listing submitted</p>
        </div>

        {/* Pending Payouts */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Host Payouts
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-3 tracking-tight">
            {formatRupees(ledger?.pending_payouts_paise)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Awaiting batch transfer to host bank accounts</p>
        </div>

        {/* Completed Payouts */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Completed Payouts
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3 tracking-tight">
            {formatRupees(ledger?.completed_payouts_paise)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Disbursed to hosts via RazorpayX / UPI</p>
        </div>

        {/* Total Transactions */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Ledger Transactions
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3 tracking-tight">
            {ledger?.total_transactions ?? 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">Audited payment & refund entries</p>
        </div>
      </div>

      {/* Refunds & System Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>System & Fleet Alerts ({safeAlerts.length})</span>
            </h3>
          </div>

          {safeAlerts.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
              All systems nominal. No overstays or critical alerts active.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {safeAlerts.map((alert: any, i: number) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200 flex items-start space-x-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{alert.title || alert.type || 'Alert'}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{alert.message || JSON.stringify(alert)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Retry Refunds */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-2">
              <RefreshCcw className="w-4 h-4 text-blue-400" />
              <span>Automated Refund Queue Operations</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              If Razorpay API timeouts or bank connectivity issues caused trip refund attempts to
              linger in <code className="text-slate-300">REFUND_PENDING</code>, trigger an immediate
              retry batch.
            </p>

            {retryResult && (
              <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 font-mono">
                {retryResult}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Idempotent queue execution</span>
            <button
              onClick={handleRetryRefunds}
              disabled={retrying}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
              <span>{retrying ? 'Retrying Refunds...' : 'Retry Pending Refunds'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
