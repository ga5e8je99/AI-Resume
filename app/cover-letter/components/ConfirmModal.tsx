'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, Loader2, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Listen for Escape key to close modal safely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-400" />,
          iconBg: 'bg-red-500/15 border-red-500/30',
          confirmBtn:
            'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 focus:ring-red-500',
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-6 h-6 text-amber-400" />,
          iconBg: 'bg-amber-500/15 border-amber-500/30',
          confirmBtn:
            'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 focus:ring-amber-500',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-6 h-6 text-cyan-400" />,
          iconBg: 'bg-cyan-500/15 border-cyan-500/30',
          confirmBtn:
            'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/25 focus:ring-cyan-500',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Click outside backdrop */}
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isLoading) onCancel();
        }}
      />

      {/* Modal Content */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${styles.iconBg}`}
            >
              {styles.icon}
            </div>
            <div>
              <h3
                id="confirm-modal-title"
                className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug"
              >
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${styles.confirmBtn}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isLoading ? 'جاري التنفيذ...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
