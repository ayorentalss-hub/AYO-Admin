import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X, Loader2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'success' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <XCircle className="w-6 h-6 text-rose-500" />,
          button: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40',
          badgeBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
          button: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/40',
          badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-6 h-6 text-emerald-500" />,
          button: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40',
          badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        };
      default:
        return {
          icon: <Info className="w-6 h-6 text-red-500" />,
          button: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/40',
          badgeBg: 'bg-red-500/10 border-red-500/20 text-red-400',
        };
    }
  };

  const v = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl border ${v.badgeBg}`}>
              {v.icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">AYO Platform Moderation</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
          {message}
        </p>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-2 ${v.button}`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export interface ToastNotification {
  isOpen: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export const NotificationModal: React.FC<{
  toast: ToastNotification | null;
  onClose: () => void;
}> = ({ toast, onClose }) => {
  if (!toast || !toast.isOpen) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
        <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner">
          {isSuccess && (
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
          )}
          {isError && (
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border-rose-500/30 flex items-center justify-center text-rose-400">
              <XCircle className="w-6 h-6" />
            </div>
          )}
          {!isSuccess && !isError && (
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border-blue-500/30 flex items-center justify-center text-blue-400">
              <Info className="w-6 h-6" />
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-bold text-white tracking-tight">{toast.title}</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{toast.message}</p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition border border-slate-700"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
