import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  User,
  Calendar,
  ExternalLink,
  CheckCircle,
  XCircle,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../api/client';

interface CustomerKycModalProps {
  customerId: string | null;
  onClose: () => void;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'error', title: string, message: string) => void;
}

export const CustomerKycModal: React.FC<CustomerKycModalProps> = ({
  customerId,
  onClose,
  onRefresh,
  onNotify,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    if (!customerId) return;
    const fetchKyc = async () => {
      try {
        setLoading(true);
        const res = await api.getCustomerKyc(customerId);
        setData(res);
      } catch (err: any) {
        onNotify('error', 'Failed to load Customer KYC', err.message);
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchKyc();
  }, [customerId]);

  if (!customerId) return null;

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await api.approveCustomerKyc(customerId);
      onNotify('success', 'Customer Driving License Approved', 'Customer is now verified and enabled to book vehicles.');
      onRefresh();
      onClose();
    } catch (err: any) {
      onNotify('error', 'Approval Failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      onNotify('error', 'Reason Required', 'Please enter a rejection reason before rejecting.');
      return;
    }
    try {
      setActionLoading(true);
      await api.rejectCustomerKyc(customerId, rejectReason);
      onNotify('success', 'Customer Driving License Rejected', 'Customer KYC has been marked as rejected.');
      onRefresh();
      onClose();
    } catch (err: any) {
      onNotify('error', 'Rejection Failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const user = data?.user;
  const kyc = data?.kyc;
  const avatarUrl = user?.avatar_url || user?.avatarUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-lg font-bold text-white tracking-tight">Customer Driving License Verification</h3>
                {user && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      user.kyc_status === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : user.kyc_status === 'FAILED' || user.kyc_status === 'REJECTED'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {user.kyc_status || 'NOT_STARTED'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect customer identity, driving licence photos, and selfie verification
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
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Fetching customer documents...</p>
            </div>
          ) : !user ? (
            <div className="p-8 text-center text-slate-500 text-xs">Customer details not found.</div>
          ) : (
            <>
              {/* 1. Customer Personal Details */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span>Customer Personal Details</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">User ID: {user.id.slice(0, 8)}</span>
                </div>

                <div className="flex items-start space-x-4">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Customer Avatar"
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
                      avatarUrl ? 'hidden' : ''
                    }`}
                  >
                    {(user.name || 'C')[0].toUpperCase()}
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-white text-sm">{user.name || 'No Name Provided'}</p>
                    <p className="text-slate-400 font-mono text-[11px]">{user.phone}</p>
                    {user.email && <p className="text-slate-400 font-mono text-[11px]">{user.email}</p>}
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-slate-500" />
                        Joined: {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        Role: {user.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Driving License & Photos */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Driving License Documents</span>
                  </h4>
                  {kyc?.driving_licence_number && (
                    <span className="text-[11px] font-mono font-bold text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      DL: {kyc.driving_licence_number}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* DL Front */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">DL Front Photo</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        kyc?.driving_licence_front_url || kyc?.documents?.dl_front?.url
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {kyc?.driving_licence_front_url || kyc?.documents?.dl_front?.url ? 'UPLOADED' : 'PENDING'}
                      </span>
                    </div>

                    {(kyc?.driving_licence_front_url || kyc?.documents?.dl_front?.url) ? (
                      <div className="relative group">
                        <img
                          src={(kyc?.driving_licence_front_url || kyc?.documents?.dl_front?.url)!}
                          alt="Driving License Front"
                          className="w-full h-36 object-cover rounded-xl border border-slate-800"
                        />
                        <a
                          href={(kyc?.driving_licence_front_url || kyc?.documents?.dl_front?.url)!}
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
                        kyc?.driving_licence_back_url || kyc?.documents?.dl_back?.url
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {kyc?.driving_licence_back_url || kyc?.documents?.dl_back?.url ? 'UPLOADED' : 'PENDING'}
                      </span>
                    </div>

                    {(kyc?.driving_licence_back_url || kyc?.documents?.dl_back?.url) ? (
                      <div className="relative group">
                        <img
                          src={(kyc?.driving_licence_back_url || kyc?.documents?.dl_back?.url)!}
                          alt="Driving License Back"
                          className="w-full h-36 object-cover rounded-xl border border-slate-800"
                        />
                        <a
                          href={(kyc?.driving_licence_back_url || kyc?.documents?.dl_back?.url)!}
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
                        kyc?.selfie_url || kyc?.documents?.selfie?.url
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {kyc?.selfie_url || kyc?.documents?.selfie?.url ? 'UPLOADED' : 'PENDING'}
                      </span>
                    </div>

                    {(kyc?.selfie_url || kyc?.documents?.selfie?.url) ? (
                      <div className="relative group">
                        <img
                          src={(kyc?.selfie_url || kyc?.documents?.selfie?.url)!}
                          alt="Customer Live Selfie"
                          className="w-full h-36 object-cover rounded-xl border border-slate-800"
                        />
                        <a
                          href={(kyc?.selfie_url || kyc?.documents?.selfie?.url)!}
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

                {kyc?.rejection_reason && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>Previous Rejection Reason: {kyc.rejection_reason}</span>
                  </div>
                )}
              </div>

              {/* Reject Reason Input */}
              {showRejectInput && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-rose-500/30 space-y-3">
                  <p className="text-xs font-bold text-rose-400">Specify reason for rejecting customer KYC:</p>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Expired driving license, blurry photo, name mismatch..."
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowRejectInput(false)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition flex items-center space-x-1"
                    >
                      {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                      <span>Confirm Rejection</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 rounded-xl transition"
          >
            Close
          </button>

          <div className="flex items-center space-x-3">
            {user && user.kyc_status === 'VERIFIED' ? (
              <>
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Customer DL is Verified</span>
                </div>

                {!showRejectInput && (
                  <button
                    onClick={() => setShowRejectInput(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 rounded-xl transition flex items-center space-x-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Revoke / Reject KYC</span>
                  </button>
                )}
              </>
            ) : (
              <>
                {!showRejectInput && (
                  <button
                    onClick={() => setShowRejectInput(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 rounded-xl transition flex items-center space-x-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Documents</span>
                  </button>
                )}

                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center space-x-1.5"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  <span>Approve & Verify DL</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
