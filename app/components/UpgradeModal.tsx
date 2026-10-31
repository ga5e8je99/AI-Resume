'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Crown, CheckCircle2, X, ArrowRight, Zap } from 'lucide-react';
import { trackCreditsExhausted } from '@/lib/analytics';
import { useLanguage } from '../context/LanguageContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(isOpen);
  const { isRtl, t } = useLanguage();

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
    if (isOpen) {
      trackCreditsExhausted();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
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

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    setTimeout(() => {
      if (modalRef.current) {
        const firstBtn = modalRef.current.querySelector<HTMLElement>('button, [href]');
        firstBtn?.focus();
      }
    }, 50);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const shouldShow = isOpen || isRendered;
  if (!shouldShow) return null;

  const isClosing = !isOpen && isRendered;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      data-state={isClosing ? 'closed' : 'open'}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs ${
        isClosing ? 'modal-backdrop-exit pointer-events-none' : 'modal-backdrop-animate modal-backdrop-enter'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div
        onAnimationEnd={() => {
          if (!isOpen) setIsRendered(false);
        }}
        className={`relative w-full max-w-lg rounded-[10px] bg-surface border border-line-strong shadow-elevated overflow-hidden text-start ${
          isClosing ? 'modal-card-exit' : 'modal-card-animate modal-card-enter'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common_close')}
          className="btn absolute top-4 end-4 z-10 p-2 rounded-[6px] text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors active:scale-[0.98] focus-visible:outline-2 outline-offset-2 outline-[var(--focus)]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header Icon & Tag */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[8px] bg-accent-soft text-accent border border-accent/20 flex items-center justify-center">
              <Crown className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-accent-soft text-accent border border-accent/20">
                <Zap className="w-3 h-3" />
                <span>{t('upgrade_modal_tag')}</span>
              </div>
              <h2 id="upgrade-modal-title" className="text-xl font-serif font-semibold text-ink mt-1">
                {t('upgrade_modal_title')}
              </h2>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-ink-2 leading-relaxed">
            {t('upgrade_modal_desc')}
          </p>

          {/* Pro Benefits List */}
          <div className="space-y-2.5 bg-surface-2 border border-line-strong rounded-[8px] p-4">
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-ink-2">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>{t('upgrade_modal_benefit1')}</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-ink-2">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>{t('upgrade_modal_benefit2')}</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-ink-2">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>{t('upgrade_modal_benefit3')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              href="/pricing"
              onClick={onClose}
              className="btn w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent font-medium text-sm transition-colors active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('upgrade_modal_view_plans')}</span>
              <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="btn w-full sm:w-auto px-4 py-2.5 rounded-[6px] text-ink-2 hover:text-ink hover:bg-surface-2 border border-line-strong text-xs sm:text-sm font-medium transition-colors text-center cursor-pointer active:scale-[0.98]"
            >
              {t('upgrade_modal_maybe_later')}
            </button>
          </div>

          <div className="text-center pt-1">
            <Link
              href="/pricing?currency=USDT"
              onClick={onClose}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-3 hover:text-accent transition-colors"
            >
              <span>{isRtl ? 'أو الدفع عبر Binance / Crypto (USDT) ←' : 'Or pay with Binance / Crypto (USDT) →'}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
