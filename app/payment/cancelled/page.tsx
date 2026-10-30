'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { useLanguage } from '@/app/context/LanguageContext';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

function PaymentCancelledContent() {
  const { language, isRtl } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="relative w-full max-w-xl rounded-[10px] bg-surface border border-line-strong shadow-subtle p-6 sm:p-10 text-center">
        {/* Warning Icon */}
        <div className="mx-auto w-16 h-16 rounded-[8px] bg-warning-soft border border-warning/20 flex items-center justify-center text-warning">
          <AlertCircle className="w-8 h-8" />
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-ink mt-6 tracking-tight">
          {isAr ? 'تم إلغاء عملية الدفع' : 'Payment Cancelled'}
        </h1>

        <p className="mt-3 text-sm text-ink-2 leading-relaxed max-w-md mx-auto">
          {isAr
            ? 'لم يتم خصم أي مبالغ من بطاقتك أو حسابك. يمكنك تجربة الدفع مجدداً في أي وقت أو اختيار طريقة دفع أخرى.'
            : 'No charges were made to your card or account. You can review our plans and try again whenever you are ready.'}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/pricing"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent font-medium text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isAr ? 'عرض الباقات وإعادة المحاولة' : 'Review Plans & Try Again'}</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[6px] bg-surface hover:bg-surface-2 text-ink font-medium text-sm border border-line-strong transition-colors"
          >
            <Home className="w-4 h-4 text-ink-3" />
            <span>{isAr ? 'العودة للصفحة الرئيسية' : 'Return Home'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-[100dvh] bg-paper text-ink flex flex-col justify-between">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center text-ink-3 text-sm">
            Loading...
          </div>
        }
      >
        <PaymentCancelledContent />
      </Suspense>
      <Footer />
    </div>
  );
}
