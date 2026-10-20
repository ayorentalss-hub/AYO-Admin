import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Clock,
  Eye,
  X,
  FileCheck2,
} from 'lucide-react';
import type { AuditLogItem } from '../types';
import { api } from '../api/client';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs(actionFilter, page, 30);
      setLogs(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, page]);

  const getActionBadge = (action: string) => {
    if (action.includes('APPROVE') || action.includes('ACTIVE') || action.includes('VERIFIED')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (action.includes('REJECT') || action.includes('BLOCK') || action.includes('FAILED')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
    if (action.includes('SUSPEND') || action.includes('CANCEL')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  };

  const totalPages = Math.ceil(total / 30) || 1;

  return (
    <div className="space-y-6">
      {/* Header & Immutable Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight">Security & Governance Audit Trail</h2>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock className="w-3 h-3" />
              <span>Immutable & Non-Deletable</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Permanent, tamper-proof record of every moderation action, approval, rejection, and fund payout.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Actions' },
            { id: 'VEHICLE', label: 'Fleet' },
            { id: 'USER', label: 'Users' },
            { id: 'KYC', label: 'KYC' },
            { id: 'PAYOUT', label: 'Payouts' },
            { id: 'TRIP', label: 'Trips' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setActionFilter(f.id);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-medium transition whitespace-nowrap ${
                actionFilter === f.id
                  ? 'bg-red-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Administrator</th>
                <th className="px-5 py-3.5">Action Executed</th>
                <th className="px-5 py-3.5">Target Entity</th>
                <th className="px-5 py-3.5 text-right">Details & Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    No audit records found matching selected filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    {/* Timestamp */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-slate-300 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Admin */}
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-200 font-bold flex items-center justify-center border border-slate-700 text-xs">
                          {log.admin_name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{log.admin_name}</p>
                          {log.admin_phone && <p className="text-[10px] text-slate-500 font-mono">{log.admin_phone}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border font-mono ${getActionBadge(
                          log.action,
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Target Entity */}
                    <td className="px-5 py-4">
                      {log.target_id ? (
                        <span className="font-mono text-[11px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {log.target_id.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono text-[11px]">Global Action</span>
                      )}
                    </td>

                    {/* Action Details */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition inline-flex items-center space-x-1.5 border border-slate-700"
                      >
                        <Eye className="w-3 h-3 text-blue-400" />
                        <span>Inspect Payload</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {logs.length > 0 ? (page - 1) * 30 + 1 : 0} to {Math.min(page * 30, total)} of {total} audit records
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-white px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Audit Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Audit Log Payload</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Record ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Action:</span>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold ${getActionBadge(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Admin:</span>
                  <span className="font-semibold text-white">{selectedLog.admin_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="font-mono text-slate-300">{new Date(selectedLog.created_at).toLocaleString()}</span>
                </div>
                {selectedLog.target_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Target ID:</span>
                    <span className="font-mono text-slate-300">{selectedLog.target_id}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Metadata & Parameters
                </label>
                <pre className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                  {selectedLog.details ? JSON.stringify(selectedLog.details, null, 2) : 'No additional metadata logged.'}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition"
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
