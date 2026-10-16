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
      onNotify('success', 'Host KYC Verified', 'The host has been verified and their listing privileges unlocked.');
      onRefresh();
      onClose();
    } catch (err: any) {
      onNotify('error', 'Verification Failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      await api.rejectHostKyc(hostId);
      onNotify('success', 'Host KYC Rejected', 'The host KYC status has been marked as failed/rejected.');
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
                    {data.profile?.avatar_url ? (
                      <img
                        src={data.profile.avatar_url}
                        alt="Host Avatar"
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-700 shadow"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold text-xl">
                        {(data.user.name || data.profile?.first_name || 'H')[0].toUpperCase()}
                      </div>
                    )}

                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-white text-sm">
                        {data.user.name || `${data.profile?.first_name || ''} ${data.profile?.last_name || ''}`.trim() || 'No Name Provided'}
                      </p>
                      <p className="text-slate-400 font-mono text-[11px]">{data.user.phone}</p>
                      {data.user.email && <p className="text-slate-400">{data.user.email}</p>}
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
                      <span>Legal KYC & NPCI Verification</span>
                    </h4>
                    <span className="text-[10px] text-slate-500">DPDP Act Compliant</span>
                  </div>

                  {data.kyc ? (
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
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                      No UPI verification record found for this host.
                    </div>
                  )}
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
            {data && (data.kyc?.status === 'VERIFIED' || data.user?.kyc_status === 'VERIFIED') ? (
              <>
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Host KYC is Verified</span>
                </div>

                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 rounded-xl transition flex items-center space-x-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Revoke / Reject KYC</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 rounded-xl transition flex items-center space-x-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject KYC</span>
                </button>

                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950/40 transition flex items-center space-x-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  <span>{data?.kyc?.status === 'FAILED' ? 'Re-Approve & Verify KYC' : 'Approve & Verify KYC'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
