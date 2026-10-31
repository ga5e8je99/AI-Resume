'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: ToastAction;
}

export interface ToastContextType {
  toasts: ToastItem[];
  showToast: (
    message: string,
    type?: ToastType,
    options?: { duration?: number; action?: ToastAction }
  ) => string;
  hideToast: (id: string) => void;
  success: (message: string, options?: { duration?: number; action?: ToastAction }) => string;
  error: (message: string, options?: { duration?: number; action?: ToastAction }) => string;
  warning: (message: string, options?: { duration?: number; action?: ToastAction }) => string;
  info: (message: string, options?: { duration?: number; action?: ToastAction }) => string;
  toast: {
    success: (message: string, options?: { duration?: number; action?: ToastAction }) => string;
    error: (message: string, options?: { duration?: number; action?: ToastAction }) => string;
    warning: (message: string, options?: { duration?: number; action?: ToastAction }) => string;
    info: (message: string, options?: { duration?: number; action?: ToastAction }) => string;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      options?: { duration?: number; action?: ToastAction }
    ) => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      const duration = options?.duration ?? (type === 'error' ? 5000 : 4000);

      const newItem: ToastItem = {
        id,
        type,
        message,
        duration,
        action: options?.action,
      };

      setToasts((prev) => {
        // Keep at most 4 simultaneous toasts to avoid clutter
        const filtered = prev.slice(-3);
        return [...filtered, newItem];
      });

      if (duration > 0) {
        setTimeout(() => {
          hideToast(id);
        }, duration);
      }

      return id;
    },
    [hideToast]
  );

  const toastHelpers = useMemo(
    () => ({
      success: (msg: string, opts?: { duration?: number; action?: ToastAction }) =>
        showToast(msg, 'success', opts),
      error: (msg: string, opts?: { duration?: number; action?: ToastAction }) =>
        showToast(msg, 'error', opts),
      warning: (msg: string, opts?: { duration?: number; action?: ToastAction }) =>
        showToast(msg, 'warning', opts),
      info: (msg: string, opts?: { duration?: number; action?: ToastAction }) =>
        showToast(msg, 'info', opts),
    }),
    [showToast]
  );

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-danger shrink-0" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning shrink-0" aria-hidden="true" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-info shrink-0" aria-hidden="true" />;
    }
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-success/30 bg-surface shadow-md ring-1 ring-success/10';
      case 'error':
        return 'border-danger/30 bg-surface shadow-md ring-1 ring-danger/10';
      case 'warning':
        return 'border-warning/30 bg-surface shadow-md ring-1 ring-warning/10';
      case 'info':
      default:
        return 'border-info/30 bg-surface shadow-md ring-1 ring-info/10';
    }
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        hideToast,
        success: toastHelpers.success,
        error: toastHelpers.error,
        warning: toastHelpers.warning,
        info: toastHelpers.info,
        toast: toastHelpers,
      }}
    >
      {children}

      {/* Floating Global Toast Container */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-5 end-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-[10px] border text-xs sm:text-sm text-ink backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ${getToastStyles(
              item.type
            )}`}
          >
            <div className="mt-0.5">{getToastIcon(item.type)}</div>

            <p className="flex-1 font-medium leading-relaxed text-start">{item.message}</p>

            {item.action && (
              <button
                type="button"
                onClick={() => {
                  item.action?.onClick();
                  hideToast(item.id);
                }}
                className="text-xs font-semibold text-accent underline hover:opacity-80 shrink-0 cursor-pointer"
              >
                {item.action.label}
              </button>
            )}

            <button
              type="button"
              onClick={() => hideToast(item.id)}
              aria-label="Dismiss notification"
              className="p-1 rounded-[4px] text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
