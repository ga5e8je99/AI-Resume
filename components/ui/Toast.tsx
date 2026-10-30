'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export { useToast, ToastProvider } from '@/app/context/ToastContext';

export interface ToastProps {
  type?: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Toast({
  type = 'info',
  message,
  onClose,
  duration = 4000,
  action,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" />,
    error: <AlertCircle className="w-4 h-4 text-danger shrink-0" aria-hidden="true" />,
    warning: <AlertTriangle className="w-4 h-4 text-warning shrink-0" aria-hidden="true" />,
    info: <Info className="w-4 h-4 text-info shrink-0" aria-hidden="true" />,
  };

  const borders = {
    success: 'border-success/30',
    error: 'border-danger/30',
    warning: 'border-warning/30',
    info: 'border-info/30',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-20 sm:bottom-6 end-4 start-4 sm:start-auto sm:end-6 z-toast flex items-center gap-3 p-3.5 sm:p-4 rounded-lg border ${borders[type]} bg-elevated text-text-primary text-sm shadow-elevated max-w-md animate-in fade-in duration-200`}
    >
      {icons[type]}
      <p className="flex-1 text-xs sm:text-sm font-medium leading-normal text-start">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-xs font-semibold text-brand underline hover:opacity-80 me-1 cursor-pointer"
        >
          {action.label}
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg cursor-pointer"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
