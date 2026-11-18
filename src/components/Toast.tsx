'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, Sparkles } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  createdAt: number;
}

export const showToast = (
  message: string,
  type: ToastType = 'success',
  duration = 4500
) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ayo_toast', {
        detail: {
          id: Math.random().toString(36).substring(2, 9),
          message,
          type,
          duration,
          createdAt: Date.now(),
        },
      })
    );
  }
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastMessage>;
      if (!customEvent.detail) return;
      const toast = customEvent.detail;
      setToasts((prev) => [...prev, toast]);

      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration || 4500);

      return () => clearTimeout(timer);
    };

    window.addEventListener('ayo_toast', handleToastEvent);
    return () => window.removeEventListener('ayo_toast', handleToastEvent);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[99999] flex flex-col space-y-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';
        const isWarning = t.type === 'warning';

        const badgeLabel = isSuccess
          ? 'SYSTEM SUCCESS'
          : isError
          ? 'ACTION FAILED'
          : isWarning
          ? 'ATTENTION REQUIRED'
          : 'AYO NOTIFICATION';

        const accentColor = isSuccess
          ? 'emerald'
          : isError
          ? 'rose'
          : isWarning
          ? 'amber'
          : 'sky';

        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto relative overflow-hidden flex flex-col p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl border transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-4 ${
              isSuccess
                ? 'bg-zinc-950/95 border-emerald-500/40 text-zinc-100 shadow-emerald-950/30 ring-1 ring-emerald-500/20'
                : isError
                ? 'bg-zinc-950/95 border-rose-500/40 text-zinc-100 shadow-rose-950/30 ring-1 ring-rose-500/20'
                : isWarning
                ? 'bg-zinc-950/95 border-amber-500/40 text-zinc-100 shadow-amber-950/30 ring-1 ring-amber-500/20'
                : 'bg-zinc-950/95 border-sky-500/40 text-zinc-100 shadow-sky-950/30 ring-1 ring-sky-500/20'
            }`}
          >
            {/* Header pill & Dismiss */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                    isSuccess
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : isError
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : isWarning
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  }`}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  {badgeLabel}
                </span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-zinc-400 hover:text-white transition p-1 rounded-lg hover:bg-zinc-800/80"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Body with Icon and Message */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {isSuccess && (
                  <div className="p-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                )}
                {isError && (
                  <div className="p-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  </div>
                )}
                {isWarning && (
                  <div className="p-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                )}
                {!isSuccess && !isError && !isWarning && (
                  <div className="p-1.5 rounded-xl bg-sky-500/20 border border-sky-500/30">
                    <Info className="w-4 h-4 text-sky-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs font-medium text-zinc-200 leading-relaxed whitespace-pre-line break-words">
                  {t.message}
                </p>
              </div>
            </div>

            {/* Glowing countdown line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-800/60 overflow-hidden">
              <div
                className={`h-full animate-shrink-width ${
                  isSuccess
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : isError
                    ? 'bg-gradient-to-r from-rose-500 to-red-400'
                    : isWarning
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-sky-500 to-blue-400'
                }`}
                style={{
                  animationDuration: `${t.duration || 4500}ms`,
                  animationTimingFunction: 'linear',
                  animationFillMode: 'forwards',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
