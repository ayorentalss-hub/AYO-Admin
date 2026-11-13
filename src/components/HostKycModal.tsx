import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  User,
  Calendar,
  MapPin,
  CreditCard,
  Car,
  ExternalLink,
  CheckCircle,
  XCircle,
  X,
  Loader2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import type { HostKycDetails } from '../types';
import { api } from '../api/client';

interface HostKycModalProps {
  hostId: string | null;
  onClose: () => void;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'error', title: string, message: string) => void;
}

export const HostKycModal: React.FC<HostKycModalProps> = ({
  hostId,
  onClose,
  onRefresh,
  onNotify,
}) => {
  const [data, setData] = useState<HostKycDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    if (!hostId) return;
    const fetchKyc = async () => {
      try {
        setLoading(true);
        const res = await api.getHostKyc(hostId);
        setData(res);
      } catch (err: any) {
        onNotify('error', 'Failed to load Host KYC', err.message);
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchKyc();
  }, [hostId]);

  if (!hostId) return null;

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await api.approveHostKyc(hostId);
      onNotify('success', 'Host Full KYC Verified', 'The host has been verified and their listing privileges unlocked.');
      onRefresh();
      onClose();
    } catch (err: any) {
      onNotify('error', 'Verification Failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveNpci = async () => {
    try {
      setActionLoading(true);
      await api.approveHostNpci(hostId);
      onNotify('success', 'Legal NPCI / Payout Verified', 'Host UPI / Bank payout details have been verified.');
      const res = await api.getHostKyc(hostId);
      setData(res);
      onRefresh();
    } catch (err: any) {
      onNotify('error', 'NPCI Verification Failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectNpci = async () => {
    if (!rejectReason.trim()) {
      onNotify('error', 'Reason Required', 'Please enter a rejection reason so the host can correct their payout details.');
      return;
    }
    try {
      setActionLoading(true);
      await api.rejectHostNpci(hostId, rejectReason.trim());
      onNotify('success', 'NPCI / Payout Rejected', `Payout details marked as rejected and notification sent to host: "${rejectReason.trim()}".`);
      setShowRejectInput(false);
      setRejectReason('');
      const res = await api.getHostKyc(hostId);
      setData(res);
      onRefresh();
    } catch (err: any) {
      onNotify('error', 'Rejection Failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      onNotify('error', 'Reason Required', 'Please enter a rejection reason before rejecting so the host knows why KYC was rejected.');
      return;
    }
    try {
      setActionLoading(true);
      await api.rejectHostKyc(hostId, rejectReason.trim());
      onNotify('success', 'Host KYC Rejected', `Host KYC has been marked as rejected and reason was sent to host: "${rejectReason.trim()}".`);
      onRefresh();
      onClose();
    } catch (err: any) {
      onNotify('error', 'Rejection Failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const calculateAge = (dobStr?: string) => {
    if (!dobStr) return null;
    const diff = Date.now() - new Date(dobStr).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-lg font-bold text-white tracking-tight">Host Verification & Document Inspection</h3>
                {data && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      data.kyc?.status === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : data.kyc?.status === 'FAILED'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {data.kyc?.status || 'PENDING'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect legal identity, bank/UPI verification, and vehicle documents
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Fetching host identity and verified documents...</p>
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-slate-500 text-xs">No host information found.</div>
          ) : (
            <>
              {/* Profile & Identity Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Host Basic & Profile Info */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                      <User className="w-4 h-4 text-purple-400" />
                      <span>Host Personal Details</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">User ID: {data.user.id.slice(0, 8)}</span>
                  </div>

                  <div className="flex items-start space-x-4">
                    {(data.profile?.avatar_url || data.profile?.avatarUrl || data.user?.avatar_url || data.user?.avatarUrl) ? (
                      <img
                        src={(data.profile?.avatar_url || data.profile?.avatarUrl || data.user?.avatar_url || data.user?.avatarUrl)!}
                        alt="Host Avatar"
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-700 shadow flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                          const fallback = (e.target as HTMLElement).nextElementSibling;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xl flex-shrink-0 ${
                        (data.profile?.avatar_url || data.profile?.avatarUrl || data.user?.avatar_url || data.user?.avatarUrl) ? 'hidden' : ''
                      }`}
                    >
                      {(data.user.name || data.profile?.first_name || 'H')[0].toUpperCase()}
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-white text-sm">
                        {data.user.name || `${data.profile?.first_name || ''} ${data.profile?.last_name || ''}`.trim() || 'No Name Provided'}
                      </p>
                      <p className="text-slate-400 font-mono text-[11px]">{data.user.phone}</p>
                      {(data.user.email || data.profile?.email) && (
                        <p className="text-slate-400 font-mono text-[11px]">{data.user.email || data.profile?.email}</p>
                      )}
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                        {data.profile?.city && (
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1 text-slate-500" />
                            {data.profile.city}
                          </span>
                        )}
                        {data.profile?.dob && (
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1 text-slate-500" />
                            {data.profile.dob} ({calculateAge(data.profile.dob)} yrs)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {data.profile?.bio && (
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 text-xs text-slate-300 italic">
                      "{data.profile.bio}"
                    </div>
                  )}

                  {/* Payout Details */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center space-x-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                      <span>Payout Preference: {data.profile?.payout_method || 'UPI'}</span>
                    </p>
                    {data.profile?.payout_method === 'BANK' && (
                      <div className="p-2.5 bg-slate-900 rounded-xl font-mono text-[11px] space-y-1 text-slate-300">
                        <p>Account: <span className="text-white font-bold">{data.profile.bank_account_number || 'N/A'}</span></p>
                        <p>IFSC: <span className="text-white">{data.profile.bank_ifsc || 'N/A'}</span></p>
                        <p>Name: <span className="text-white">{data.profile.bank_account_name || 'N/A'}</span></p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Host UPI Verification & Legal KYC */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Legal KYC & NPCI / Bank Verification</span>
                    </h4>
                    <span className="text-[10px] text-slate-500">DPDP Act Compliant</span>
                  </div>

                  {data.profile?.payout_method === 'BANK' || data.profile?.bank_account_number ? (
                    <div className="space-y-3.5 text-xs">
                      {/* Bank Details Verification Card */}
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Account Holder Name:</span>
                          <span className="font-bold text-white font-mono">
                            {data.profile.bank_account_name || data.user.name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Bank Account Number:</span>
                          <span className="font-bold text-emerald-400 font-mono">
                            {data.profile.bank_account_number || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Bank IFSC Code:</span>
                          <span className="font-bold text-white font-mono">
                            {data.profile.bank_ifsc || 'N/A'}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Payout Destination:</span>
                          <span className="text-blue-400 font-semibold">Direct Bank IMPS / NEFT</span>
                        </div>
                      </div>

                      {/* Verified At */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                        <span>Verification Timestamp:</span>
                        <span className="text-slate-300 font-mono">
                          {data.kyc?.verified_at ? new Date(data.kyc.verified_at).toLocaleString() : 'Pending Verification'}
                        </span>
                      </div>

                      {/* Dedicated Bank KYC Action Toolbar */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-slate-400">Bank KYC Status:</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            data.kyc?.status === 'VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : data.kyc?.status === 'FAILED'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {data.kyc?.status || 'PENDING'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setShowRejectInput(true)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 rounded-xl transition flex items-center space-x-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject & Send Reason</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleApproveNpci}
                            disabled={actionLoading}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition flex items-center space-x-1.5"
                          >
                            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            <span>Approve Bank Details</span>
                          </button>
                        </div>
                      </div>

                      {/* Reject Reason Input Box */}
                      {showRejectInput && (
                        <div className="p-4 bg-slate-950 rounded-2xl border border-rose-500/40 space-y-3 mt-2 animate-in fade-in zoom-in-95">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-rose-400" />
                              Specify Rejection Reason (Will be sent to Host):
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowRejectInput(false)}
                              className="text-slate-500 hover:text-white text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g. Account number does not match IFSC, invalid bank details..."
                            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-medium"
                            autoFocus
                          />
                          <p className="text-[10px] text-slate-500">
                            * Ye message Host ko app push notification me seedha milega taaki wo sahi details dubara submit karein.
                          </p>
                          <div className="flex justify-end space-x-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowRejectInput(false)}
                              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleRejectNpci}
                              disabled={actionLoading || !rejectReason.trim()}
                              className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition flex items-center space-x-1 disabled:opacity-50"
                            >
                              {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                              <span>Confirm Rejection & Notify Host</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : data.kyc ? (
                    <div className="space-y-3.5 text-xs">
                      {/* Name Matching Check Card */}
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Submitted Legal Name:</span>
                          <span className="font-bold text-white font-mono">{data.kyc.legal_name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">NPCI / Bank Registered Name:</span>
                          <span className="font-bold text-emerald-400 font-mono">
                            {data.kyc.registered_name || 'Pending verification'}
                          </span>
                        </div>

                        {data.kyc.registered_name && (
                          <div className="pt-2 border-t border-slate-800/80 flex items-center space-x-2 text-[11px]">
                            {data.kyc.legal_name?.toLowerCase().trim() === data.kyc.registered_name?.toLowerCase().trim() ? (
                              <span className="text-emerald-400 font-semibold flex items-center">
                                <Check className="w-3.5 h-3.5 mr-1" />
                                100% Name Match Verified by Bank
                              </span>
                            ) : (
                              <span className="text-amber-400 font-semibold flex items-center">
                                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                Partial / Fuzzy Name Match - Review Manually
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* UPI VPA */}
                      <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-400">Verified UPI ID (VPA):</span>
                        <span className="font-mono font-bold text-white">{data.kyc.upi_vpa || 'N/A'}</span>
                      </div>

                      {/* Verified At */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                        <span>Verification Timestamp:</span>
                        <span className="text-slate-300 font-mono">
                          {data.kyc.verified_at ? new Date(data.kyc.verified_at).toLocaleString() : 'Not Yet Verified'}
                        </span>
                      </div>

                      {/* Dedicated Legal KYC / NPCI Action Toolbar */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-slate-400">NPCI KYC Status:</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            data.kyc.status === 'VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : data.kyc.status === 'FAILED'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {data.kyc.status || 'PENDING'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setShowRejectInput(true)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 rounded-xl transition flex items-center space-x-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject & Send Reason</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleApproveNpci}
                            disabled={actionLoading}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition flex items-center space-x-1.5"
                          >
                            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            <span>Approve & Verify NPCI</span>
                          </button>
                        </div>
                      </div>

                      {/* Reject Reason Input Box */}
                      {showRejectInput && (
                        <div className="p-4 bg-slate-950 rounded-2xl border border-rose-500/40 space-y-3 mt-2 animate-in fade-in zoom-in-95">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-rose-400" />
                              Specify Rejection Reason (Will be sent to Host):
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowRejectInput(false)}
                              className="text-slate-500 hover:text-white text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g. NPCI name does not match Driving License, invalid UPI ID, blurry docs..."
                            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-medium"
                            autoFocus
                          />
                          <p className="text-[10px] text-slate-500">
                            * Ye message Host ko app push notification me seedha milega taaki wo sahi details dubara submit karein.
                          </p>
                          <div className="flex justify-end space-x-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowRejectInput(false)}
                              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleRejectNpci}
                              disabled={actionLoading || !rejectReason.trim()}
                              className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition flex items-center space-x-1 disabled:opacity-50"
                            >
                              {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                              <span>Confirm Rejection & Notify Host</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                      No UPI or Bank verification record found for this host.
                    </div>
                  )}
                </div>
              </div>

              {/* 2.5 Driving License & Identity Verification Documents */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Driving License & Identity Verification</span>
                  </h4>
                  {data.profile?.driving_licence_number && (
                    <span className="text-[11px] font-mono font-bold text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      DL: {data.profile.driving_licence_number}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* DL Front */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">DL Front Photo</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        data.profile?.driving_licence_front_url || data.profile?.documents?.dl_front?.url
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {data.profile?.driving_licence_front_url || data.profile?.documents?.dl_front?.url ? 'UPLOADED' : 'NOT UPLOADED'}
                      </span>
                    </div>

                    {(data.profile?.driving_licence_front_url || data.profile?.documents?.dl_front?.url) ? (
                      <div className="relative group">
                        <img
                          src={(data.profile?.driving_licence_front_url || data.profile?.documents?.dl_front?.url)!}
                          alt="Driving License Front"
                          className="w-full h-36 object-cover rounded-xl border border-slate-800"
                        />
                        <a
                          href={(data.profile?.driving_licence_front_url || data.profile?.documents?.dl_front?.url)!}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold rounded-xl transition"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" /> View Full Image
                        </a>
                      </div>
                    ) : (
                      <div className="w-full h-36 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-slate-600 text-xs">
                        No DL Front Uploaded
                      </div>
                    )}
                  </div>

                  {/* DL Back */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">DL Back Photo</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        data.profile?.driving_licence_back_url || data.profile?.documents?.dl_back?.url
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {data.profile?.driving_licence_back_url || data.profile?.documents?.dl_back?.url ? 'UPLOADED' : 'NOT UPLOADED'}
                      </span>
                    </div>

                    {(data.profile?.driving_licence_back_url || data.profile?.documents?.dl_back?.url) ? (
                      <div className="relative group">
                        <img
                          src={(data.profile?.driving_licence_back_url || data.profile?.documents?.dl_back?.url)!}
                          alt="Driving License Back"
                          className="w-full h-36 object-cover rounded-xl border border-slate-800"
                        />
                        <a
                          href={(data.profile?.driving_licence_back_url || data.profile?.documents?.dl_back?.url)!}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold rounded-xl transition"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" /> View Full Image
                        </a>
                      </div>
                    ) : (
                      <div className="w-full h-36 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-slate-600 text-xs">
                        No DL Back Uploaded
                      </div>
                    )}
                  </div>

                  {/* Selfie Verification */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Live Selfie</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        data.profile?.selfie_url || data.profile?.documents?.selfie?.url
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {data.profile?.selfie_url || data.profile?.documents?.selfie?.url ? 'UPLOADED' : 'NOT UPLOADED'}
                      </span>
                    </div>

                    {(data.profile?.selfie_url || data.profile?.documents?.selfie?.url) ? (
                      <div className="relative group">
                        <img
                          src={(data.profile?.selfie_url || data.profile?.documents?.selfie?.url)!}
                          alt="Host Live Selfie"
                          className="w-full h-36 object-cover rounded-xl border border-slate-800"
                        />
                        <a
                          href={(data.profile?.selfie_url || data.profile?.documents?.selfie?.url)!}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold rounded-xl transition"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" /> View Full Image
                        </a>
                      </div>
                    ) : (
                      <div className="w-full h-36 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-slate-600 text-xs">
                        No Selfie Uploaded
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Host's Listed Vehicles & Uploaded Legal Docs */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <Car className="w-4 h-4 text-red-500" />
                    <span>Host's Fleet Vehicles & Uploaded Documents ({data.vehicles.length})</span>
                  </h4>
                </div>

                {data.vehicles.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                    This host has not submitted any vehicles yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.vehicles.map((v) => (
                      <div key={v.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center space-x-3">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 text-white border border-slate-700">
                              {v.registration_number}
                            </span>
                            <span className="font-bold text-white text-sm">
                              {v.make} {v.model} {v.year && `(${v.year})`}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold self-start sm:self-auto ${
                              v.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : v.status === 'PENDING_REVIEW'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {v.status}
                          </span>
                        </div>

                        {/* Vehicle Photos Preview */}
                        {v.images && v.images.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Vehicle Photos</p>
                            <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                              {v.images.map((imgUrl, idx) => (
                                <a
                                  key={idx}
                                  href={imgUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-20 h-14 rounded-xl overflow-hidden border border-slate-800 hover:border-red-500 flex-shrink-0 transition"
                                >
                                  <img
                                    src={imgUrl}
                                    alt={`Car ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Vehicle Documents (RC, Insurance, Pollution) */}
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Inspection Documents ({v.documents.length})
                          </p>
                          {v.documents.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic">No legal documents uploaded for this vehicle.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {v.documents.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                                >
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-white text-[11px]">{doc.type}</span>
                                    {doc.expiry_date && (
                                      <p className="text-[10px] text-slate-400">Exp: {doc.expiry_date}</p>
                                    )}
                                  </div>
                                  {doc.url ? (
                                    <a
                                      href={doc.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1 transition"
                                    >
                                      <span>View</span>
                                      <ExternalLink className="w-3 h-3 ml-1" />
                                    </a>
                                  ) : (
                                    <span className="text-[10px] text-slate-500">No URL</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-850 hover:bg-zinc-800 rounded-xl transition"
          >
            Close
          </button>

          <div className="flex items-center space-x-3">
            {data && (data.kyc?.status === 'VERIFIED' || data.user?.kyc_status === 'VERIFIED') && (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>Status: Verified</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowRejectInput(true)}
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 rounded-xl transition flex items-center space-x-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject / Revoke KYC</span>
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950/40 transition flex items-center space-x-1.5"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle className="w-3.5 h-3.5" />}
              <span>{data?.kyc?.status === 'VERIFIED' ? 'Re-Approve & Verify KYC' : 'Approve & Verify KYC'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
