'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import Footer from '@/app/components/Footer';
import { useLanguage } from '@/app/context/LanguageContext';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

function PaymentCancelledContent() {
  const { t, isRtl } = useLanguage();

  return (
    <div
      className="flex-1 flex items-center justify-center p-4 sm:p-6"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-xl rounded-[10px] bg-surface border border-line-strong shadow-subtle p-6 sm:p-10 text-center">
        {/* Warning Icon */}
        <div className="mx-auto w-16 h-16 rounded-[8px] bg-warning-soft border border-warning/20 flex items-center justify-center text-warning">
          <AlertCircle className="w-8 h-8" />
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-ink mt-6 tracking-tight">
          {t('payment_cancelled_title')}
        </h1>

        <p className="mt-3 text-sm text-ink-2 leading-relaxed max-w-md mx-auto">
          {t('payment_cancelled_desc')}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/pricing"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent font-medium text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('payment_cancelled_retry')}</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[6px] bg-surface hover:bg-surface-2 text-ink font-medium text-sm border border-line-strong transition-colors"
          >
            <Home className="w-4 h-4 text-ink-2" />
            <span>{t('payment_return_home')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function PaymentCancelledFallback() {
  const { t } = useLanguage();
  return (
    <div className="flex-1 flex items-center justify-center text-ink-2 text-sm">
      {t('common_loading')}
    </div>
  );
}

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-[100dvh] bg-paper text-ink flex flex-col justify-between">
      <Suspense fallback={<PaymentCancelledFallback />}>
        <PaymentCancelledContent />
      </Suspense>
      <Footer />
    </div>
  );
}
