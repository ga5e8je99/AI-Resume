'use client';

import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { CheckCircle2, Sparkles, LayoutDashboard, ArrowRight, FileText } from 'lucide-react';
import { trackPaymentSucceeded } from '@/lib/analytics';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  const { language, isRtl } = useLanguage();
  const isAr = language === 'ar';

  const provider = searchParams.get('provider') || 'stripe';
  const planId = searchParams.get('planId') || (user?.plan === 'pro' ? 'pro' : 'payg');
  const isMock = searchParams.get('mock') === 'true';

  useEffect(() => {
    refreshUser();
    trackPaymentSucceeded(planId, planId === 'pro' ? 9 : 3, provider === 'paymob' ? 'EGP' : 'USD');
  }, [refreshUser, planId, provider]);

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="relative w-full max-w-xl rounded-[10px] bg-surface border border-line-strong shadow-subtle p-6 sm:p-10 text-center">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 rounded-[8px] bg-success-soft border border-success/20 flex items-center justify-center text-success animate-in zoom-in duration-300">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        {/* Badge */}
        <div className="mt-6 inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold bg-success-soft text-success border border-success/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {provider === 'paymob'
              ? isAr
                ? 'تم الدفع بنجاح عبر Paymob'
                : 'Payment Confirmed via Paymob'
              : provider === 'binance_pay' || provider === 'manual_crypto'
              ? isAr
                ? 'تم الدفع بنجاح عبر Binance / Crypto (USDT)'
                : 'Payment Confirmed via Binance / Crypto (USDT)'
              : isAr
              ? 'تم الدفع بنجاح عبر Stripe'
              : 'Payment Confirmed via Stripe'}
          </span>
        </div>

        {/* Title & Description */}
        <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-ink mt-4 tracking-tight">
          {isAr ? 'تهانينا! تم تفعيل اشتراكك بنجاح' : 'Payment Successful!'}
        </h1>

        <p className="mt-3 text-sm text-ink-2 leading-relaxed max-w-md mx-auto">
          {planId === 'pro'
            ? isAr
              ? 'تم تفعيل مزايا باقة JobMatch Pro في حسابك. يمكنك الآن الاستمتاع بتوليد غير محدود لخطابات التقديم وتصدير السير الذاتية بدون علامة مائية.'
              : 'Your JobMatch Pro subscription is now active! Enjoy unlimited AI cover letters, all premium templates, and watermark-free exports.'
            : isAr
            ? 'تم إضافة رصيد الذكاء الاصطناعي (15 نقطة) إلى حسابك بنجاح. يمكنك استخدامه في أي وقت لتقديماتك الوظيفية.'
            : 'Your 15 AI generation credits have been added to your balance. Use them anytime to craft standout job applications.'}
        </p>

        {isMock && (
          <div className="mt-4 p-2.5 rounded-[6px] bg-warning-soft border border-warning/20 text-xs text-warning font-mono">
            ℹ️ {isAr ? 'بيئة تجريبية: تمت محاكاة المعاملة بنجاح.' : 'Test mode: transaction simulated successfully.'}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent font-medium text-sm transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{isAr ? 'الانتقال إلى لوحة التحكم' : 'Go to Dashboard'}</span>
            <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
          </Link>

          <Link
            href="/builder"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[6px] bg-surface hover:bg-surface-2 text-ink font-medium text-sm border border-line-strong transition-colors"
          >
            <FileText className="w-4 h-4 text-accent" />
            <span>{isAr ? 'إنشاء سيرة ذاتية' : 'Create Resume'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
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
        <PaymentSuccessContent />
      </Suspense>
      <Footer />
    </div>
  );
}
