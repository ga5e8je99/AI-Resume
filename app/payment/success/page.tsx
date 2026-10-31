'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Footer from '@/app/components/Footer';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import {
  CheckCircle2,
  Sparkles,
  LayoutDashboard,
  ArrowRight,
  FileText,
  RefreshCw,
  AlertCircle,
  LifeBuoy,
} from 'lucide-react';
import { trackPaymentSucceeded } from '@/lib/analytics';

type OrderPollStatus = 'paid' | 'awaiting_payment' | 'pending' | 'failed' | 'expired' | 'timeout';

interface OrderStatusResponse {
  status: 'paid' | 'awaiting_payment' | 'pending' | 'failed' | 'expired';
  planId: 'pro' | 'payg';
  provider: 'stripe' | 'paymob' | 'binance_pay' | 'manual_crypto';
  amount: number;
  currency: 'USD' | 'EGP' | 'USDT';
}

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60000;

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const { t, isRtl } = useLanguage();

  const reference =
    searchParams.get('reference')?.trim() ||
    searchParams.get('merchant_order_id')?.trim() ||
    searchParams.get('order_id')?.trim() ||
    '';
  const isMockQuery = searchParams.get('mock') === 'true';

  const [viewState, setViewState] = useState<OrderPollStatus>('awaiting_payment');
  const [orderData, setOrderData] = useState<OrderStatusResponse | null>(null);
  const [mockAllowed, setMockAllowed] = useState<boolean>(
    process.env.NEXT_PUBLIC_ALLOW_MOCK_PAYMENTS === 'true'
  );

  // Requirement 3: Strictly guard trackPaymentSucceeded so it fires at most once
  const hasTrackedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!reference) {
      return;
    }

    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const startTime = Date.now();

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const pollOrderStatus = async () => {
      if (!isMounted) return;

      // Check if 60s timeout has elapsed
      if (Date.now() - startTime >= POLL_TIMEOUT_MS) {
        stopPolling();
        setViewState((prev) => (prev === 'paid' ? 'paid' : 'timeout'));
        return;
      }

      try {
        const headers: Record<string, string> = {};
        if (typeof window !== 'undefined') {
          const savedToken = localStorage.getItem('jobmatch_token');
          if (savedToken) {
            headers.Authorization = `Bearer ${savedToken}`;
          }
        }

        const res = await fetch(
          `/api/orders/status?reference=${encodeURIComponent(reference)}`,
          {
            method: 'GET',
            headers,
            credentials: 'include',
            cache: 'no-store',
          }
        );

        if (!isMounted) return;

        const serverMockHeader = res.headers.get('x-mock-payments-allowed');
        if (serverMockHeader !== null) {
          setMockAllowed(serverMockHeader === 'true');
        }

        if (!res.ok) {
          if (res.status === 404 || res.status === 403 || res.status === 400) {
            stopPolling();
            setViewState('failed');
          }
          return;
        }

        const data: OrderStatusResponse = await res.json();
        if (!isMounted) return;

        setOrderData(data);

        if (data.status === 'paid') {
          stopPolling();
          setViewState('paid');
          refreshUser();

          if (!hasTrackedRef.current) {
            hasTrackedRef.current = true;
            trackPaymentSucceeded(data.planId, data.amount, data.currency);
          }
        } else if (data.status === 'failed' || data.status === 'expired') {
          stopPolling();
          setViewState(data.status);
        } else {
          setViewState(data.status);
        }
      } catch {
        // Transient network error: keep polling until timeout
      }
    };

    // Immediate first check, then poll every 2 seconds up to 60 seconds
    pollOrderStatus();
    intervalId = setInterval(pollOrderStatus, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      stopPolling();
    };
  }, [reference, refreshUser]);

  const effectiveState: OrderPollStatus = !reference ? 'failed' : viewState;
  const resolvedProvider = orderData?.provider || 'stripe';
  const resolvedPlanId = orderData?.planId || 'payg';
  const showMockBadge = isMockQuery && mockAllowed;

  const providerBadgeText =
    resolvedProvider === 'paymob'
      ? t('payment_confirmed_paymob')
      : resolvedProvider === 'binance_pay' || resolvedProvider === 'manual_crypto'
      ? t('payment_confirmed_crypto')
      : t('payment_confirmed_stripe');

  // 1. Awaiting Payment / Pending Spinner State
  if (effectiveState === 'awaiting_payment' || effectiveState === 'pending') {
    return (
      <div
        className="flex-1 flex items-center justify-center p-4 sm:p-6"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="relative w-full max-w-xl rounded-[10px] bg-surface border border-line-strong shadow-subtle p-6 sm:p-10 text-center">
          <div className="mx-auto w-16 h-16 rounded-[8px] bg-surface-2 border border-line-strong flex items-center justify-center text-accent">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-ink mt-6 tracking-tight">
            {t('payment_confirming_title')}
          </h1>

          <p className="mt-3 text-sm text-ink-2 leading-relaxed max-w-md mx-auto">
            {t('payment_confirming_desc')}
          </p>
        </div>
      </div>
    );
  }

  // 2. Timeout State (After 60 seconds of polling)
  if (effectiveState === 'timeout') {
    return (
      <div
        className="flex-1 flex items-center justify-center p-4 sm:p-6"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="relative w-full max-w-xl rounded-[10px] bg-surface border border-line-strong shadow-subtle p-6 sm:p-10 text-center">
          <div className="mx-auto w-16 h-16 rounded-[8px] bg-warning-soft border border-warning/20 flex items-center justify-center text-warning">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-ink mt-6 tracking-tight">
            {t('payment_timeout_title')}
          </h1>

          <p className="mt-3 text-sm text-ink-2 leading-relaxed max-w-md mx-auto">
            {t('payment_timeout_desc')}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="mailto:support@jobmatch.ai"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent font-medium text-sm transition-colors"
            >
              <LifeBuoy className="w-4 h-4" />
              <span>{t('payment_contact_support')}</span>
            </a>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[6px] bg-surface hover:bg-surface-2 text-ink font-medium text-sm border border-line-strong transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-accent" />
              <span>{t('payment_go_dashboard')}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Failed / Expired State
  if (effectiveState === 'failed' || effectiveState === 'expired') {
    return (
      <div
        className="flex-1 flex items-center justify-center p-4 sm:p-6"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="relative w-full max-w-xl rounded-[10px] bg-surface border border-line-strong shadow-subtle p-6 sm:p-10 text-center">
          <div className="mx-auto w-16 h-16 rounded-[8px] bg-warning-soft border border-warning/20 flex items-center justify-center text-warning">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-ink mt-6 tracking-tight">
            {t('payment_failed_title')}
          </h1>

          <p className="mt-3 text-sm text-ink-2 leading-relaxed max-w-md mx-auto">
            {t('payment_failed_desc')}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent font-medium text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t('payment_retry_btn')}</span>
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[6px] bg-surface hover:bg-surface-2 text-ink font-medium text-sm border border-line-strong transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-accent" />
              <span>{t('payment_go_dashboard')}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Paid / Confirmed Success State (planId & provider strictly from Order)
  return (
    <div
      className="flex-1 flex items-center justify-center p-4 sm:p-6"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-xl rounded-[10px] bg-surface border border-line-strong shadow-subtle p-6 sm:p-10 text-center">
        {/* Success Icon */}
        <div
          data-testid="payment-success-icon"
          className="mx-auto w-16 h-16 rounded-[8px] bg-success-soft border border-success/20 flex items-center justify-center text-success animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300"
        >
          <CheckCircle2 className="w-8 h-8" />
        </div>

        {/* Provider Badge */}
        <div className="mt-6 inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold bg-success-soft text-success border border-success/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{providerBadgeText}</span>
        </div>

        {/* Title & Description */}
        <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-ink mt-4 tracking-tight">
          {t('payment_success_title')}
        </h1>

        <p className="mt-3 text-sm text-ink-2 leading-relaxed max-w-md mx-auto">
          {resolvedPlanId === 'pro'
            ? t('payment_success_desc_pro')
            : t('payment_success_desc_payg')}
        </p>

        {/* Mock badge shown ONLY when ALLOW_MOCK_PAYMENTS is active */}
        {showMockBadge && (
          <div className="mt-4 p-2.5 rounded-[6px] bg-warning-soft border border-warning/20 text-xs text-warning font-mono">
            ℹ️ {t('payment_mock_notice')}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent font-medium text-sm transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{t('payment_go_dashboard')}</span>
            <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
          </Link>

          <Link
            href="/builder"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[6px] bg-surface hover:bg-surface-2 text-ink font-medium text-sm border border-line-strong transition-colors"
          >
            <FileText className="w-4 h-4 text-accent" />
            <span>{t('payment_create_resume')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function PaymentSuccessFallback() {
  const { t } = useLanguage();
  return (
    <div className="flex-1 flex items-center justify-center text-ink-2 text-sm">
      {t('common_loading')}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-[100dvh] bg-paper text-ink flex flex-col justify-between">
      <Suspense fallback={<PaymentSuccessFallback />}>
        <PaymentSuccessContent />
      </Suspense>
      <Footer />
    </div>
  );
}
