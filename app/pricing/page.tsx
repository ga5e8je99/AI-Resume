'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sentry } from '@/lib/sentry';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getUserEntitlements } from '@/lib/credits';
import {
  PLANS,
  PlanConfig,
  CurrencyCode,
  BillingCycle,
  getLocalized,
} from '@/lib/plans';
import { startCheckout, toInternalPath } from '@/lib/checkout-client';
import { trackPricingViewed, trackCheckoutStarted } from '@/lib/analytics';
import { Button } from '../components/ui/Button';
import { Accordion } from '../components/ui/Accordion';
import { Toast } from '../components/ui/Toast';
import { PlanCard } from './components/PlanCard';
import { PaymentMethodPicker } from './components/PaymentMethodPicker';
import { BillingToggle } from './components/BillingToggle';
import { ScrollReveal, Stagger } from '../components/landing/ScrollReveal';
import { Shield, Lock, Zap, AlertCircle, RefreshCw } from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language, isRtl, t } = useLanguage();

  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [activeAction, setActiveAction] = useState<{
    planId: string;
    mode: 'main' | 'crypto' | 'portal';
  } | null>(null);
  const [retryTarget, setRetryTarget] = useState<{
    plan: PlanConfig;
    overrideCurrency?: CurrencyCode;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'info' | 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    trackPricingViewed();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const curr = params.get('currency');
      if (curr === 'USDT' || curr === 'EGP' || curr === 'USD') {
        setCurrency(curr as CurrencyCode);
      }
    }
  }, []);

  const entitlements = getUserEntitlements(user);
  const userPlan = (user?.plan || 'free').toLowerCase();
  const isProUser = entitlements.isPro;
  const hasStripeBilling = Boolean(
    user?.stripeCustomerId || user?.paymentProvider === 'stripe'
  );
  const isAnyBusy = activeAction !== null;

  const showToast = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 6000);
  };

  const navigateUrl = (url: string) => {
    const internalPath = toInternalPath(url);
    if (internalPath) {
      router.push(internalPath);
    } else if (typeof window !== 'undefined') {
      window.location.assign(url);
    }
  };

  const handleManageSubscription = async () => {
    if (isAnyBusy) return;
    try {
      setActiveAction({ planId: 'pro', mode: 'portal' });
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: typeof window !== 'undefined' ? window.location.href : '/pricing',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent('/pricing')}`);
        return;
      }
      if (res.ok && data.url) {
        navigateUrl(data.url);
        return;
      }
      showToast(data.message || t('billing_portal_error'), 'error');
    } catch (err) {
      Sentry.captureException(err);
      showToast(t('billing_portal_error'), 'error');
    } finally {
      setActiveAction(null);
    }
  };

  const handleCtaClick = async (plan: PlanConfig, overrideCurrency?: CurrencyCode) => {
    if (isAnyBusy) return;

    const activeCurrency = overrideCurrency || currency;
    trackCheckoutStarted(plan.id, activeCurrency);

    if (plan.id === 'free') {
      if (!user) {
        router.push('/register');
      } else {
        router.push('/dashboard');
      }
      return;
    }

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }

    setRetryTarget(null);
    setActiveAction({
      planId: plan.id,
      mode: overrideCurrency === 'USDT' ? 'crypto' : 'main',
    });

    try {
      const res = await startCheckout(plan.id, {
        currency: activeCurrency,
        billingCycle,
        language,
        onNavigate: (path) => router.push(path),
      });

      if (res.success) {
        return;
      }

      if (res.errorCode === 'UNAUTHENTICATED' || res.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent('/pricing')}`);
        return;
      }

      if (res.errorCode === 'PROVIDER_NOT_CONFIGURED' || res.status === 503) {
        showToast(t('pricing_err_provider_not_configured'), 'error');
        return;
      }

      if (res.errorCode === 'NETWORK_ERROR') {
        setRetryTarget({ plan, overrideCurrency });
        showToast(t('pricing_err_network'), 'error');
        return;
      }

      showToast(t('pricing_err_generic'), 'error');
    } catch (err) {
      Sentry.captureException(err);
      showToast(t('pricing_err_generic'), 'error');
    } finally {
      setActiveAction(null);
    }
  };

  const faqs = [
    { id: 'credits', title: t('pricing_faq_q_credits'), content: t('pricing_faq_a_credits') },
    { id: 'billing', title: t('pricing_faq_q_billing'), content: t('pricing_faq_a_billing') },
    { id: 'methods', title: t('pricing_faq_q_methods'), content: t('pricing_faq_a_methods') },
    { id: 'expiry', title: t('pricing_faq_q_expiry'), content: t('pricing_faq_a_expiry') },
    { id: 'cancellation', title: t('pricing_faq_q_cancellation'), content: t('pricing_faq_a_cancellation') },
  ];

  const compareFeatures = [
    {
      feature: t('pricing_feature_scans'),
      free: t('pricing_val_unlimited'),
      pro: t('pricing_val_unlimited_deep'),
      payg: t('pricing_val_unlimited'),
    },
    {
      feature: t('pricing_feature_templates'),
      free: t('pricing_val_2_templates'),
      pro: t('pricing_val_all_templates'),
      payg: t('pricing_val_all_templates'),
    },
    {
      feature: t('pricing_feature_ai_resume'),
      free: t('pricing_val_1_taste'),
      pro: t('pricing_val_unlimited_gen'),
      payg: t('pricing_val_2_credits_gen'),
    },
    {
      feature: t('pricing_feature_job_match'),
      free: t('pricing_val_3_searches'),
      pro: t('pricing_val_unlimited_searches'),
      payg: t('pricing_val_1_credit_search'),
    },
    {
      feature: t('pricing_feature_letters'),
      free: t('pricing_val_3_drafts'),
      pro: t('pricing_val_unlimited'),
      payg: t('pricing_val_15_credits'),
    },
    {
      feature: t('pricing_feature_export'),
      free: t('pricing_val_pdf_txt'),
      pro: t('pricing_val_vector_docx'),
      payg: t('pricing_val_vector_docx'),
    },
    {
      feature: t('pricing_feature_cloud_storage'),
      free: t('pricing_val_1_resume'),
      pro: t('pricing_val_unlimited'),
      payg: t('pricing_val_unlimited'),
    },
    {
      feature: t('cover_tone_label'),
      free: t('pricing_val_standard_tone'),
      pro: t('pricing_val_4_tones'),
      payg: t('pricing_val_4_tones'),
    },
    {
      feature: t('footer_direct_support'),
      free: t('pricing_val_self_serve_docs'),
      pro: t('pricing_val_priority_email'),
      payg: t('pricing_val_email_support'),
    },
  ];

  return (
    <div
      className="min-h-[100dvh] bg-paper text-ink flex flex-col justify-between selection:bg-accent-soft selection:text-ink overflow-x-clip"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.text}
          onClose={() => setToastMessage(null)}
        />
      )}

      <main
        id="main-content"
        aria-busy={isAnyBusy}
        className="max-w-[1160px] mx-auto px-4 sm:px-6 py-12 md:py-20 w-full text-start"
      >
        {/* Header */}
        <ScrollReveal direction="up">
          <div className="max-w-2xl mx-auto text-center mb-10 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
              {t('pricing_teaser_tag')}
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-ink tracking-tight">
              {t('pricing_page_title')}
            </h1>
            <p className="text-sm sm:text-base text-ink-2 max-w-lg mx-auto leading-relaxed">
              {t('pricing_page_subtitle')}
            </p>

            {/* Toggles */}
            <div className="flex flex-wrap items-start justify-center gap-3 pt-4">
              <PaymentMethodPicker
                value={currency}
                onChange={setCurrency}
                disabled={isAnyBusy}
              />
              <BillingToggle
                value={billingCycle}
                onChange={setBillingCycle}
                disabled={isAnyBusy}
              />
            </div>
          </div>
        </ScrollReveal>

        {/* Network Error Banner with Retry Button */}
        {retryTarget && (
          <div
            role="alert"
            className="mb-8 rounded-[8px] border border-warning/40 bg-surface p-4 flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 text-sm text-ink">
              <AlertCircle className="w-5 h-5 text-warning shrink-0" />
              <span>{t('pricing_err_network')}</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              loading={isAnyBusy}
              loadingText={t('common_loading')}
              disabled={isAnyBusy}
              aria-busy={isAnyBusy}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() =>
                handleCtaClick(retryTarget.plan, retryTarget.overrideCurrency)
              }
            >
              {t('pricing_retry_btn')}
            </Button>
          </div>
        )}

        {/* 3 Pricing Cards */}
        <Stagger
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-16"
          itemClassName="h-full"
          direction="up"
        >
          {PLANS.map((plan) => {
            const isFree = plan.id === 'free';
            const isPro = plan.id === 'pro';
            const isCurrentPlan = Boolean(
              user &&
                ((isFree && (!userPlan || userPlan === 'free') && !isProUser) ||
                  (isPro && isProUser))
            );

            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                currency={currency}
                billingCycle={billingCycle}
                isCurrentPlan={isCurrentPlan}
                isProUser={isProUser}
                isExpiringSoon={Boolean(entitlements.isExpiringSoon)}
                hasStripeBilling={hasStripeBilling}
                isMainLoading={
                  activeAction?.planId === plan.id && activeAction.mode === 'main'
                }
                isCryptoLoading={
                  activeAction?.planId === plan.id && activeAction.mode === 'crypto'
                }
                isPortalLoading={
                  activeAction?.planId === plan.id && activeAction.mode === 'portal'
                }
                isAnyBusy={isAnyBusy}
                onSelectPlan={handleCtaClick}
                onManageSubscription={handleManageSubscription}
              />
            );
          })}
        </Stagger>

        {/* Security & Guarantees Strip */}
        <ScrollReveal direction="up">
          <div className="rounded-[8px] border border-line-strong bg-surface p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-ink-2 mb-16">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-accent shrink-0" />
              <span>{t('pricing_trust_encryption')}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-accent shrink-0" />
              <span>{t('pricing_trust_instant')}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-accent shrink-0" />
              <span>{t('pricing_trust_cancel')}</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Plan Comparison Section */}
        <div className="mb-16">
          <div className="text-center md:text-start mb-6">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              {t('pricing_compare_title')}
            </h2>
            <p className="text-xs text-ink-2 mt-1 font-mono">
              {t('pricing_compare_subtitle')}
            </p>
          </div>

          {/* Desktop Table (>=768px) */}
          <div className="hidden md:block overflow-x-auto rounded-[8px] border border-line-strong bg-surface">
            <table className="w-full min-w-[600px] text-start text-xs border-collapse">
              <thead>
                <tr className="bg-surface-2 border-b border-line-strong text-ink">
                  <th className="py-3 px-4 text-start font-semibold">
                    {t('pricing_compare_col_feature')}
                  </th>
                  <th className="py-3 px-4 text-start font-semibold">
                    {getLocalized(PLANS[0].name, language)}
                  </th>
                  <th className="py-3 px-4 text-start font-semibold text-accent">
                    {getLocalized(PLANS[1].name, language)}
                  </th>
                  <th className="py-3 px-4 text-start font-semibold">
                    {getLocalized(PLANS[2].name, language)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-strong">
                {compareFeatures.map((row, i) => (
                  <tr
                    key={i}
                    className={
                      i % 2 === 1
                        ? 'bg-surface-2 hover:bg-surface-2 transition-colors'
                        : 'hover:bg-surface-2 transition-colors'
                    }
                  >
                    <td className="py-3 px-4 font-medium text-ink">{row.feature}</td>
                    <td className="py-3 px-4 text-ink-2">{row.free}</td>
                    <td className="py-3 px-4 text-accent font-semibold">{row.pro}</td>
                    <td className="py-3 px-4 text-ink-2">{row.payg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Definition Lists (<768px) */}
          <div className="block md:hidden space-y-4">
            {[
              {
                id: 'free',
                name: getLocalized(PLANS[0].name, language),
                key: 'free' as const,
                isPopular: false,
              },
              {
                id: 'pro',
                name: getLocalized(PLANS[1].name, language),
                key: 'pro' as const,
                isPopular: true,
              },
              {
                id: 'payg',
                name: getLocalized(PLANS[2].name, language),
                key: 'payg' as const,
                isPopular: false,
              },
            ].map((p) => (
              <div
                key={p.id}
                className={`rounded-[8px] p-4 bg-surface ${
                  p.isPopular ? 'border-2 border-accent' : 'border border-line-strong'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-line-strong mb-3">
                  <h3 className="font-serif text-base font-semibold text-ink">
                    {p.name}
                  </h3>
                  {p.isPopular && (
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-surface-2 text-accent">
                      {t('pricing_popular_badge')}
                    </span>
                  )}
                </div>
                <dl className="divide-y divide-line-strong text-xs">
                  {compareFeatures.map((f, idx) => (
                    <div key={idx} className="py-2 flex flex-col gap-0.5">
                      <dt className="text-ink-2 font-mono text-[11px]">{f.feature}</dt>
                      <dd
                        className={`font-medium ${
                          p.isPopular ? 'text-accent' : 'text-ink'
                        }`}
                      >
                        {f[p.key]}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing FAQs */}
        <div className="max-w-[760px] mx-auto text-start">
          <div className="mb-6">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              {t('pricing_faq_title')}
            </h2>
          </div>
          <Accordion items={faqs} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
