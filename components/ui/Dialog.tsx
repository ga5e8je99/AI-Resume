'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(isOpen);

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
      if (e.key === 'Escape' && isOpen) {
        onClose();
        return;
      }

      if (e.key === 'Tab' && isOpen && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
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

      // Focus first focusable element
      setTimeout(() => {
        if (dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) focusable[0].focus();
        }
      }, 50);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const shouldShow = isOpen || isRendered;
  if (!shouldShow) return null;

  const isClosing = !isOpen && isRendered;

  const maxWidths = {
    sm: 'md:max-w-sm',
    md: 'md:max-w-lg',
    lg: 'md:max-w-2xl',
    xl: 'md:max-w-4xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-description' : undefined}
      data-state={isClosing ? 'closed' : 'open'}
      className={`fixed inset-0 z-modal flex items-end md:items-center justify-center p-0 md:p-6 ${
        isClosing ? 'modal-backdrop-exit pointer-events-none' : 'modal-backdrop-animate modal-backdrop-enter'
      }`}
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet on mobile, centered dialog on desktop */}
      <div
        ref={dialogRef}
        onAnimationEnd={() => {
          if (!isOpen) setIsRendered(false);
        }}
        className={`relative w-full ${maxWidths[maxWidth]} max-h-[90dvh] overflow-y-auto rounded-t-2xl md:rounded-2xl border-t md:border border-line-strong bg-elevated p-6 sm:p-8 shadow-elevated z-10 text-start pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:pb-8 ${
          isClosing ? 'modal-card-exit' : 'modal-card-animate modal-card-enter'
        }`}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-line-strong mb-5">
          <div>
            <h2 id="dialog-title" className="font-serif text-xl font-semibold text-ink tracking-tight">
              {title}
            </h2>
            {description && (
              <p id="dialog-description" className="text-xs text-ink-2 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="btn p-1.5 rounded-md text-ink-2 hover:text-ink hover:bg-surface-2 transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="text-ink">{children}</div>
      </div>
    </div>
  );
}

export const Modal = Dialog;
