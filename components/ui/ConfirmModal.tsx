'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  confirmLabel,
  cancelText,
  cancelLabel,
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
  onClose,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(isOpen);
  const effectiveConfirm = confirmLabel || confirmText || 'Confirm';
  const effectiveCancel = cancelLabel || cancelText || 'Cancel';
  const handleDismiss = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  }, [onCancel, onClose]);

  useEffect(() => {
    if (isOpen) {
      const raf = requestAnimationFrame(() => setIsRendered(true));
      return () => cancelAnimationFrame(raf);
    }

    if (isRendered) {
      const timer = setTimeout(() => setIsRendered(false), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        handleDismiss();
        return;
      }

      if (e.key === 'Tab' && isOpen && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      setTimeout(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>('button');
          if (focusable.length > 0) focusable[0].focus();
        }
      }, 50);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, handleDismiss]);

  const shouldShow = isOpen || isRendered;
  if (!shouldShow) return null;

  const isClosing = !isOpen && isRendered;

  const variantIcons = {
    danger: (
      <div className="w-10 h-10 rounded-full bg-danger-soft border border-danger/25 text-danger flex items-center justify-center shrink-0">
        <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
      </div>
    ),
    warning: (
      <div className="w-10 h-10 rounded-full bg-warning-soft border border-warning/25 text-warning flex items-center justify-center shrink-0">
        <AlertCircle className="w-5 h-5" strokeWidth={1.75} />
      </div>
    ),
    info: (
      <div className="w-10 h-10 rounded-full bg-info-soft border border-info/25 text-info flex items-center justify-center shrink-0">
        <Info className="w-5 h-5" strokeWidth={1.75} />
      </div>
    ),
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      data-state={isClosing ? 'closed' : 'open'}
      className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/40 backdrop-blur-xs ${
        isClosing ? 'modal-backdrop-exit pointer-events-none' : 'modal-backdrop-animate modal-backdrop-enter'
      }`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isLoading) handleDismiss();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        onAnimationEnd={() => {
          if (!isOpen) setIsRendered(false);
        }}
        className={`relative bg-elevated border border-line-strong rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 shadow-elevated z-10 space-y-4 text-start pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6 ${
          isClosing ? 'modal-card-exit' : 'modal-card-animate modal-card-enter'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {variantIcons[variant]}
            <h3
              id="confirm-modal-title"
              className="text-base sm:text-lg font-serif font-semibold text-ink tracking-tight"
            >
              {title}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            disabled={isLoading}
            className="btn p-1.5 rounded-md text-ink-2 hover:text-ink hover:bg-surface-2 transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-50 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p id="confirm-modal-desc" className="text-xs sm:text-sm text-ink-2 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line-strong">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDismiss}
            disabled={isLoading}
          >
            {effectiveCancel}
          </Button>

          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {effectiveConfirm}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
