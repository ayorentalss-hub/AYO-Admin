import React, { useState, useEffect } from 'react';
import {
  Car,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Calendar,
  X,
  Loader2,
  Image as ImageIcon,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  UserCheck,
} from 'lucide-react';
import type { VehicleDocument, VehicleItem, VehicleInspectDetails } from '../types';
import { api } from '../api/client';
import { ConfirmModal, NotificationModal, type ToastNotification } from './Modal';

interface VehiclesViewProps {
  onRefreshStats?: () => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({ onRefreshStats }) => {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'DRAFT' | 'ALL'>('PENDING_REVIEW');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Document Inspection State
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleItem | null>(null);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [vehicleImages, setVehicleImages] = useState<string[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [inspectDetails, setInspectDetails] = useState<VehicleInspectDetails | null>(null);

  // Action Modals State
  const [rejectingVehicle, setRejectingVehicle] = useState<VehicleItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'success' | 'primary';
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'primary',
    action: async () => {},
  });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  const notify = (type: 'success' | 'error', title: string, message: string) => {
    setToast({ isOpen: true, type, title, message });
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.getAllVehicles(statusFilter, page, 20);
      setVehicles(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [statusFilter, page]);

  const handleInspectDocs = async (v: VehicleItem) => {
    setSelectedVehicle(v);
    setLoadingDocs(true);
    setInspectDetails(null);
    try {
      const res: any = await api.getVehicleDocuments(v.id);
      const docs = Array.isArray(res) ? res : res?.documents || [];
      const images = Array.isArray(res?.images) ? res.images : [];
      setDocuments(docs);
      setVehicleImages(images);
      setInspectDetails({
        host: res?.host || (v.host ? { ...v.host, name: v.host_name || v.host.name } : null),
        customer: res?.customer || null,
        vehicle: res?.vehicle || null,
        documents: docs,
        images,
      });
    } catch (err: any) {
      notify('error', 'Failed to load documents', err.message);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleApprove = (v: VehicleItem) => {
    setConfirmState({
      isOpen: true,
      title: 'Approve Vehicle Listing',
      message: `Are you sure you want to approve ${v.make} ${v.model} (${v.id.slice(0, 8)})? This will publish the listing as ACTIVE for all customers.`,
      confirmText: 'Approve & Activate',
      variant: 'success',
      action: async () => {
        try {
          setConfirmLoading(true);
          await api.approveVehicle(v.id);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          notify('success', 'Vehicle Listing Approved', `${v.make} ${v.model} is now ACTIVE.`);
          fetchVehicles();
          if (selectedVehicle?.id === v.id) setSelectedVehicle(null);
          if (onRefreshStats) onRefreshStats();
        } catch (err: any) {
          notify('error', 'Approval Failed', err.message);
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  };

  const handleReject = async () => {
    if (!rejectingVehicle) return;
    if (!rejectReason.trim()) {
      notify('error', 'Missing Reason', 'Please provide a clear reason for rejecting this vehicle listing.');
      return;
    }
    try {
      setSubmittingAction(true);
      await api.rejectVehicle(rejectingVehicle.id, rejectReason.trim());
      notify('success', 'Vehicle Rejected', `Listing was rejected and feedback was sent to the host.`);
      setRejectingVehicle(null);
      setRejectReason('');
      fetchVehicles();
      if (selectedVehicle?.id === rejectingVehicle.id) setSelectedVehicle(null);
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      notify('error', 'Rejection Failed', err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const formatRate = (rate?: number) => {
    if (!rate) return '₹0';
    return (rate / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  };

  const totalPages = Math.ceil(total / 20) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Fleet Approvals & Moderation</h2>
          <p className="text-xs text-slate-400 mt-1">
            Review host vehicle listings, inspect verified RC & insurance documents, approve or reject listings.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          {(['PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'DRAFT', 'ALL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                statusFilter === st
                  ? st === 'PENDING_REVIEW'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-900/30'
                    : 'bg-red-600 text-white shadow-md shadow-red-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {st === 'PENDING_REVIEW'
                ? 'Pending Review'
                : st === 'ACTIVE'
                ? 'Active Fleet'
                : st === 'REJECTED'
                ? 'Rejected'
                : st === 'DRAFT'
                ? 'Drafts'
                : 'All Fleet'}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicles Grid / Cards */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-red-500" />
          <span>Loading vehicles...</span>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-800 rounded-3xl text-slate-500 text-xs">
          No vehicles found matching status: <span className="text-slate-300 font-semibold">{statusFilter}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map((v) => {
            const coverUrl = v.cover_photo_url || v.photos?.[0] || v.photo_categories?.cover;
            return (
              <div
                key={v.id}
                className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between hover:border-slate-700 transition group"
              >
                <div>
                  {/* Photo Preview Header */}
                  <div className="h-44 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={`${v.make} ${v.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-slate-600 text-xs flex flex-col items-center space-y-1">
                        <Car className="w-8 h-8 text-slate-700" />
                        <span>No Photo Uploaded</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md uppercase tracking-wider ${
                          v.status === 'ACTIVE'
                            ? 'bg-emerald-500 text-slate-950'
                            : v.status === 'PENDING_REVIEW'
                            ? 'bg-amber-400 text-slate-950 animate-pulse'
                            : v.status === 'REJECTED'
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>

                    <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[11px] font-mono font-bold text-white border border-white/10">
                      {formatRate(v.daily_rate)}/day
                    </div>
                  </div>

                  {/* Vehicle Details */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {v.make} {v.model} {v.year && <span className="text-slate-400 font-normal">({v.year})</span>}
                      </h3>
                      {v.address && <p className="text-xs text-slate-400 truncate mt-0.5">{v.address}</p>}
                    </div>

                    {/* Host Info */}
                    <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Listed By Host</p>
                        <p className="font-semibold text-slate-200">
                          {v.host?.first_name ? `${v.host.first_name} ${v.host.last_name || ''}` : v.host?.phone || 'Host Account'}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                        {v.host?.kyc_status || 'KYC Check'}
                      </span>
                    </div>

                    {v.rejection_reason && (
                      <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                        <span className="font-bold">Rejection note:</span> {v.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleInspectDocs(v)}
                    className="flex-1 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition flex items-center justify-center space-x-1.5 border border-slate-700 shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>Inspect Docs</span>
                  </button>

                  {v.status !== 'ACTIVE' && (
                    <>
                      <button
                        onClick={() => handleApprove(v)}
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-950/30 transition"
                        title="Approve Listing"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setRejectingVehicle(v);
                          setRejectReason('');
                        }}
                        className="p-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded-xl transition"
                        title="Reject Listing"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} vehicles
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
      )}

      {/* Vehicle Documents & Images Inspection Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div
            className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Vehicle Documents & Photos: {selectedVehicle.make} {selectedVehicle.model}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Inspect registration certificates, insurance status, and vehicle gallery photos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingDocs ? (
                <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-7 h-7 text-red-500 animate-spin" />
                  <span>Loading vehicle documents and photos...</span>
                </div>
              ) : (
                <>
                  {/* Host / Owner Details & Renter / Customer Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Host Profile Card */}
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-2xl pointer-events-none rounded-full" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Host / Fleet Owner</span>
                            <h4 className="text-sm font-bold text-white leading-tight">
                              {inspectDetails?.host?.name || selectedVehicle.host?.name || (selectedVehicle as any).host_name || 'Registered Host'}
                            </h4>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            (inspectDetails?.host?.kyc_status || selectedVehicle.host?.kyc_status) === 'VERIFIED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          KYC {inspectDetails?.host?.kyc_status || selectedVehicle.host?.kyc_status || 'PENDING'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300 pt-1">
                        <div className="flex items-center space-x-1.5 text-zinc-400">
                          <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate text-white">{inspectDetails?.host?.phone || selectedVehicle.host?.phone || (selectedVehicle as any).host_phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-zinc-400">
                          <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate text-white">{inspectDetails?.host?.email || selectedVehicle.host?.email || 'No Email'}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-zinc-400">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate text-white">{inspectDetails?.host?.city || selectedVehicle.address || 'Location on map'}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-zinc-400">
                          <ShieldCheck className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate text-white">{inspectDetails?.host?.payout_method || 'UPI / Bank Payout'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer / Active Renter Card */}
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Customer / Renter</span>
                            <h4 className="text-sm font-bold text-white leading-tight">
                              {inspectDetails?.customer?.name || 'Available / Not Booked'}
                            </h4>
                          </div>
                        </div>
                        {inspectDetails?.customer ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {inspectDetails.customer.booking_status}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Idle Fleet</span>
                          </span>
                        )}
                      </div>

                      {inspectDetails?.customer ? (
                        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300 pt-1">
                          <div className="flex items-center space-x-1.5 text-zinc-400">
                            <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate text-white">{inspectDetails.customer.phone}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-zinc-400">
                            <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate text-white">{inspectDetails.customer.email || 'N/A'}</span>
                          </div>
                          <div className="col-span-2 flex items-center space-x-1.5 text-zinc-400">
                            <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate text-white">
                              Trip: {new Date(inspectDetails.customer.start_time).toLocaleDateString()} &rarr; {new Date(inspectDetails.customer.end_time).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400 italic pt-2">
                          This vehicle is currently not assigned to any active trip and is available on the consumer marketplace.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Gallery Photos */}
                  {vehicleImages && vehicleImages.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <ImageIcon className="w-4 h-4 text-purple-400" />
                        <span>Vehicle Gallery Photos ({vehicleImages.length})</span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {vehicleImages.map((imgUrl, idx) => (
                          <a
                            key={idx}
                            href={imgUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="aspect-video rounded-2xl overflow-hidden border border-slate-800 hover:border-red-500 bg-slate-950 transition group relative"
                          >
                            <img
                              src={imgUrl}
                              alt={`Car photo ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-semibold">
                              Open Full
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents Section */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span>Legal Verification Documents ({documents.length})</span>
                    </h4>

                    {documents.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                        No legal documents (RC, Insurance, Pollution) recorded for this vehicle.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {documents.map((doc) => (
                          <div
                            key={doc.id || doc.type}
                            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  {doc.type}
                                </span>
                                <span className="text-xs font-semibold text-white">
                                  {doc.type === 'RC'
                                    ? 'Registration Certificate'
                                    : doc.type === 'INSURANCE'
                                    ? 'Commercial Insurance'
                                    : doc.type === 'POLLUTION'
                                    ? 'Pollution / Smog Check'
                                    : doc.type}
                                </span>
                              </div>
                              {doc.expiry_date && (
                                <p className="text-xs text-slate-400 flex items-center">
                                  <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
                                  <span>Valid / Expiry: {doc.expiry_date}</span>
                                </p>
                              )}
                              {doc.file_name && <p className="text-[11px] text-slate-500">File: {doc.file_name}</p>}
                            </div>

                            <div>
                              {doc.url ? (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center space-x-1.5"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>View Document</span>
                                </a>
                              ) : (
                                <span className="text-xs text-slate-500">No URL link</span>
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

            {/* Modal Actions */}
            <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              >
                Close
              </button>
              {selectedVehicle.status !== 'ACTIVE' ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setRejectingVehicle(selectedVehicle);
                      setRejectReason('');
                    }}
                    className="px-4 py-2 text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 rounded-xl transition"
                  >
                    Reject Listing
                  </button>
                  <button
                    onClick={() => handleApprove(selectedVehicle)}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950/40 transition flex items-center space-x-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve Listing</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Listing Active</span>
                  </span>
                  <button
                    onClick={() => {
                      setRejectingVehicle(selectedVehicle);
                      setRejectReason('');
                    }}
                    className="px-4 py-2 text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 rounded-xl transition"
                  >
                    Revoke Listing
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Listing Modal */}
      {rejectingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Reject Vehicle Listing</h3>
                <p className="text-xs text-slate-400">
                  {rejectingVehicle.make} {rejectingVehicle.model}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Provide a clear reason for rejecting this listing. This will be sent directly to the host so they can rectify the issue.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. RC front page is blurry, Insurance policy has expired, or Car photos do not meet platform standards."
              rows={4}
              className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-red-500 font-sans"
            />

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingVehicle(null)}
                disabled={submittingAction}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={submittingAction || !rejectReason.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl shadow-lg shadow-rose-950/40 transition flex items-center space-x-1.5"
              >
                {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                <span>Reject & Send Feedback</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
        loading={confirmLoading}
        onConfirm={confirmState.action}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Notification Modal */}
      <NotificationModal toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
