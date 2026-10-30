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
          icon: <AlertTriangle className="w-5 h-5 text-danger" strokeWidth={1.5} />,
          iconBg: 'bg-red-50 border-red-200',
          confirmBtn: 'bg-danger hover:bg-red-700 text-white',
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-5 h-5 text-highlight" strokeWidth={1.5} />,
          iconBg: 'bg-amber-50 border-amber-200',
          confirmBtn: 'bg-highlight hover:bg-amber-700 text-white',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-accent" strokeWidth={1.5} />,
          iconBg: 'bg-accent-soft border-accent/20',
          confirmBtn: 'bg-accent hover:bg-accent-hover text-white',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/40 animate-in fade-in duration-150"
    >
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isLoading) onCancel();
        }}
      />

      <div className="relative bg-surface border border-line rounded-[10px] w-full max-w-md p-6 shadow-md z-10 animate-in zoom-in-95 duration-150 space-y-4 text-start">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-[6px] flex items-center justify-center border shrink-0 ${styles.iconBg}`}>
              {styles.icon}
            </div>
            <div>
              <h3
                id="confirm-modal-title"
                className="text-base font-serif font-semibold text-ink"
              >
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-7 h-7 rounded-[6px] hover:bg-surface-2 text-ink-3 hover:text-ink flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-ink-2 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-[6px] bg-surface hover:bg-surface-2 border border-line text-xs font-medium text-ink transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-[6px] text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 ${styles.confirmBtn}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isLoading ? 'جاري التنفيذ...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
