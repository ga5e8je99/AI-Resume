'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from './context/LanguageContext';
import Logo from './components/Logo';
import LanguageSelector from './components/LanguageSelector';
import ThemeToggle from './components/ThemeToggle';
import { RotateCcw, Home, AlertTriangle, ShieldAlert } from 'lucide-react';
import { captureException } from '@/lib/sentry';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  const { t, isRtl } = useLanguage();

  useEffect(() => {
    console.error('JobMatch Application Error boundary caught:', error);
    captureException(error, { digest: error.digest, boundary: 'app/error' });
  }, [error]);

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-[100dvh] bg-paper text-ink flex flex-col justify-center items-center px-4 py-12 relative selection:bg-accent-soft selection:text-ink"
    >
      {/* Top Utility Bar with Language and Theme Switcher */}
      <div className="absolute top-6 end-6 z-20 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSelector variant="compact" />
      </div>

      <main id="main-content" className="w-full max-w-lg relative z-10 text-center">
        {/* Brand Header */}
        <div className="inline-block mb-6">
          <Logo size="lg" />
        </div>

        {/* Error Card */}
        <div className="bg-surface border border-line-strong rounded-[10px] p-8 sm:p-10 shadow-subtle text-center">
          {/* Error Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-danger-soft text-danger text-xs font-mono font-semibold mb-6">
            <ShieldAlert className="w-3.5 h-3.5 text-danger" />
            <span>{t('error_badge')}</span>
          </div>

          {/* Warning Icon */}
          <div className="mb-6 flex items-center justify-center">
            <div className="w-16 h-16 rounded-[8px] bg-danger-soft text-danger flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-danger" />
            </div>
          </div>

          {/* Heading & Subtitle */}
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-ink tracking-tight mb-2.5">
            {t('error_title')}
          </h1>
          <p className="text-base text-ink-2 font-medium mb-3">
            {t('error_subtitle')}
          </p>
          <p className="text-xs sm:text-sm text-ink-3 leading-relaxed max-w-md mx-auto mb-8">
            {t('error_desc')}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              id="error-try-again-btn"
              onClick={() => reset()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent font-medium text-sm transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>{t('error_try_again')}</span>
            </button>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-[6px] border border-line-strong bg-surface hover:bg-surface-2 text-ink font-medium text-sm transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4 shrink-0 text-ink-3" />
              <span>{t('error_go_home')}</span>
            </Link>
          </div>

          {/* Digest ID */}
          {error.digest && (
            <p className="mt-8 pt-4 border-t border-line text-[11px] text-ink-3 font-mono">
              Reference ID: {error.digest}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
