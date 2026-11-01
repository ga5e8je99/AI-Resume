'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  DisplayCurrencyCode,
  DISPLAY_CURRENCIES,
  BillingCycle,
  detectUserDisplayCurrency,
  getPlanComparisonRows,
  getPlanById,
  getLocalized,
} from '@/lib/plans';
import {
  startCheckout,
  toInternalPath,
  type CheckoutErrorCode,
} from '@/lib/checkout-client';
import { trackPricingViewed, trackCheckoutStarted } from '@/lib/analytics';
import { Button } from '../components/ui/Button';
import { Accordion } from '../components/ui/Accordion';
import { Toast } from '../components/ui/Toast';
import { PlanCard } from './components/PlanCard';
import { PaymentMethodPicker } from './components/PaymentMethodPicker';
import { BillingToggle } from './components/BillingToggle';
import { ScrollReveal, Stagger } from '../components/landing/ScrollReveal';
import {
  Shield,
  Lock,
  Zap,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Globe,
} from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language, isRtl, t } = useLanguage();
  const isAr = language === 'ar';

  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrencyCode>('USD');
  const [enabledCurrencies, setEnabledCurrencies] = useState<CurrencyCode[]>(['USD']);
  const [enabledProviders, setEnabledProviders] = useState<string[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [activeAction, setActiveAction] = useState<{
    planId: string;
    mode: 'main' | 'portal';
  } | null>(null);
  const [checkoutError, setCheckoutError] = useState<{
    code: CheckoutErrorCode;
    message: string;
    plan?: PlanConfig;
    overrideCurrency?: CurrencyCode;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'info' | 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    trackPricingViewed();
    let requestedCurr: CurrencyCode | null = null;
    let requestedDisplayCurr: DisplayCurrencyCode | null = null;

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const curr = params.get('currency')?.toUpperCase();
      if (curr === 'EGP' || curr === 'USD') {
        requestedCurr = curr;
        setCurrency(curr);
      }
      if (
        curr &&
        DISPLAY_CURRENCIES.some((dc) => dc.code === (curr as DisplayCurrencyCode))
      ) {
        requestedDisplayCurr = curr as DisplayCurrencyCode;
        setDisplayCurrency(curr as DisplayCurrencyCode);
      } else {
        const autoLocal = detectUserDisplayCurrency(language);
        setDisplayCurrency(autoLocal);
      }
    }

    // Fetch enabled payment providers from /api/payments/providers so UI only bills in active provider currencies
    fetch('/api/payments/providers', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (Array.isArray(data.enabledProviders)) {
          setEnabledProviders(data.enabledProviders);
        }
        if (Array.isArray(data.currencies) && data.currencies.length > 0) {
          const validCurrencies = data.currencies.filter(
            (c: string): c is CurrencyCode => c === 'USD' || c === 'EGP'
          );
          if (validCurrencies.length > 0) {
            setEnabledCurrencies(validCurrencies);
            setCurrency((prev) => {
              const target = requestedCurr || prev;
              const resolved = validCurrencies.includes(target)
                ? target
                : validCurrencies[0];
              if (!requestedDisplayCurr && requestedCurr) {
                setDisplayCurrency(resolved);
              }
              return resolved;
            });
          }
        }
      })
      .catch(() => {
        // Keep default fallback on network error
      });
  }, [language]);

  const handleSettlementCurrencyChange = (nextCurrency: CurrencyCode) => {
    setCurrency(nextCurrency);
    setDisplayCurrency(nextCurrency);
  };

  const entitlements = getUserEntitlements(user);
  const userPlan = (user?.plan || 'free').toLowerCase();
  const isProUser = entitlements.isPro;
  const hasBillingPortal = Boolean(
    user?.lemonSubscriptionId ||
      user?.lemonCustomerId ||
      user?.paymentProvider === 'lemonsqueezy' ||
      user?.stripeCustomerId ||
      user?.paymentProvider === 'stripe'
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
    const preferredProvider =
      activeCurrency === 'EGP'
        ? 'paymob'
        : enabledProviders.includes('lemonsqueezy')
        ? 'lemonsqueezy'
        : enabledProviders.includes('stripe')
        ? 'stripe'
        : undefined;

    trackCheckoutStarted(
      plan.id,
      preferredProvider || (activeCurrency === 'EGP' ? 'paymob' : 'lemonsqueezy'),
      activeCurrency
    );

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

    setCheckoutError(null);
    setActiveAction({
      planId: plan.id,
      mode: 'main',
    });

    try {
      const res = await startCheckout(plan.id, {
        currency: activeCurrency,
        billingCycle,
        provider: preferredProvider,
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

      if (res.errorCode === 'EMAIL_NOT_VERIFIED' || res.status === 403) {
        const msg = t('pricing_err_email_not_verified');
        setCheckoutError({
          code: 'EMAIL_NOT_VERIFIED',
          message: msg,
          plan,
          overrideCurrency,
        });
        showToast(msg, 'error');
        return;
      }

      if (res.errorCode === 'RATE_LIMITED' || res.status === 429) {
        const msg = t('pricing_err_rate_limited');
        setCheckoutError({
          code: 'RATE_LIMITED',
          message: msg,
          plan,
          overrideCurrency,
        });
        showToast(msg, 'error');
        return;
      }

      if (res.errorCode === 'PROVIDER_NOT_CONFIGURED' || res.status === 503) {
        const msg = t('pricing_err_provider_not_configured');
        setCheckoutError({
          code: 'PROVIDER_NOT_CONFIGURED',
          message: msg,
          plan,
          overrideCurrency,
        });
        showToast(msg, 'error');
        return;
      }

      if (res.errorCode === 'NETWORK_ERROR') {
        const msg = t('pricing_err_network');
        setCheckoutError({
          code: 'NETWORK_ERROR',
          message: msg,
          plan,
          overrideCurrency,
        });
        showToast(msg, 'error');
        return;
      }

      const genericMsg = t('pricing_err_generic');
      setCheckoutError({
        code: 'CHECKOUT_FAILED',
        message: genericMsg,
        plan,
        overrideCurrency,
      });
      showToast(genericMsg, 'error');
    } catch (err) {
      Sentry.captureException(err);
      const genericMsg = t('pricing_err_generic');
      setCheckoutError({
        code: 'CHECKOUT_FAILED',
        message: genericMsg,
        plan,
        overrideCurrency,
      });
      showToast(genericMsg, 'error');
    } finally {
      setActiveAction(null);
    }
  };

  // FAQs covering Cancellation, Refund, Data & Privacy, Payment & Card Security, Billing & Credits
  const faqs = [
    {
      id: 'cancellation',
      title: t('pricing_faq_q_cancellation'),
      content: t('pricing_faq_a_cancellation'),
    },
    {
      id: 'refund',
      title: t('pricing_faq_q_refund'),
      content: t('pricing_faq_a_refund'),
    },
    {
      id: 'data',
      title: t('pricing_faq_q_data'),
      content: t('pricing_faq_a_data'),
    },
    {
      id: 'payment_security',
      title: t('pricing_faq_q_payment_security'),
      content: t('pricing_faq_a_payment_security'),
    },
    {
      id: 'credits',
      title: t('pricing_faq_q_credits'),
      content: t('pricing_faq_a_credits'),
    },
    {
      id: 'billing',
      title: t('pricing_faq_q_billing'),
      content: t('pricing_faq_a_billing'),
    },
    {
      id: 'methods',
      title: t('pricing_faq_q_methods'),
      content: t('pricing_faq_a_methods'),
    },
    {
      id: 'expiry',
      title: t('pricing_faq_q_expiry'),
      content: t('pricing_faq_a_expiry'),
    },
  ];

  // Dynamic Free / PAYG / Pro comparison rows sourced from real constants in lib/plans.ts
  const compareFeatures = getPlanComparisonRows(language);
  const freePlan = getPlanById('free') || PLANS[0];
  const paygPlan = getPlanById('payg') || PLANS[2];
  const proPlan = getPlanById('pro') || PLANS[1];

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

            {/* Toggles: Settlement Currency, Local Display Currency & Billing Cycle */}
            <div className="flex flex-wrap items-start justify-center gap-3 pt-4">
              <PaymentMethodPicker
                value={currency}
                onChange={handleSettlementCurrencyChange}
                disabled={isAnyBusy}
                enabledCurrencies={enabledCurrencies}
              />

              {/* Local Currency Display Selector (Display Only, Billed in Provider Currency) */}
              <div className="inline-flex items-center gap-2 rounded-[8px] border border-line-strong bg-surface px-3 py-1.5 text-xs">
                <Globe className="w-3.5 h-3.5 text-accent shrink-0" />
                <label
                  htmlFor="display-currency-select"
                  className="text-ink-2 font-medium"
                >
                  {t('pricing_display_currency_label')}:
                </label>
                <select
                  id="display-currency-select"
                  value={displayCurrency}
                  disabled={isAnyBusy}
                  onChange={(e) => {
                    const selected = e.target.value as DisplayCurrencyCode;
                    setDisplayCurrency(selected);
                    if (
                      (selected === 'USD' || selected === 'EGP') &&
                      enabledCurrencies.includes(selected)
                    ) {
                      setCurrency(selected);
                    }
                  }}
                  className="bg-transparent font-mono font-semibold text-ink focus:outline-none cursor-pointer"
                >
                  {DISPLAY_CURRENCIES.map((dc) => (
                    <option key={dc.code} value={dc.code} className="bg-surface text-ink">
                      {isAr ? dc.labelAr : dc.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <BillingToggle
                value={billingCycle}
                onChange={setBillingCycle}
                disabled={isAnyBusy}
              />
            </div>

            {/* Display-Only Currency Conversion Notice */}
            {displayCurrency !== currency && (
              <div
                data-testid="display-currency-notice"
                className="mt-3 max-w-xl mx-auto rounded-[8px] border border-accent/30 bg-surface px-3.5 py-2 text-[11px] text-ink-2 leading-relaxed"
              >
                {t('pricing_display_currency_notice')
                  .replace('{localCurrency}', displayCurrency)
                  .replace('{providerCurrency}', currency)}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Clear Checkout Error Alert Banner */}
        {checkoutError && (
          <div
            role="alert"
            data-testid="checkout-error-banner"
            className="mb-8 rounded-[8px] border border-danger/40 bg-surface p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-2.5 text-sm text-ink">
              <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-xs sm:text-sm text-ink">
                  {t('pricing_err_banner_title')}
                </p>
                <p className="text-xs text-ink-2">{checkoutError.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {checkoutError.code === 'EMAIL_NOT_VERIFIED' ? (
                <Link href="/dashboard">
                  <Button variant="primary" size="sm">
                    {t('pricing_verify_email_btn')}
                  </Button>
                </Link>
              ) : (
                checkoutError.plan && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={isAnyBusy}
                    loadingText={t('pricing_checkout_loading')}
                    disabled={isAnyBusy}
                    aria-busy={isAnyBusy}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    onClick={() =>
                      checkoutError.plan &&
                      handleCtaClick(checkoutError.plan, checkoutError.overrideCurrency)
                    }
                  >
                    {t('pricing_retry_btn')}
                  </Button>
                )
              )}
            </div>
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
                displayCurrency={displayCurrency}
                billingCycle={billingCycle}
                isCurrentPlan={isCurrentPlan}
                isProUser={isProUser}
                isExpiringSoon={Boolean(entitlements.isExpiringSoon)}
                hasStripeBilling={hasBillingPortal}
                isMainLoading={
                  activeAction?.planId === plan.id && activeAction.mode === 'main'
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

        {/* Trust Badges Strip (Lemon Squeezy Merchant of Record, Zero Card Storage, 256-bit SSL, 14-Day Refund) */}
        <ScrollReveal direction="up">
          <div
            data-testid="pricing-trust-badges"
            className="rounded-[10px] border border-line-strong bg-surface p-5 sm:p-6 space-y-4 text-xs text-ink-2 mb-16"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-[8px] border border-line bg-surface-2 space-y-1.5">
                <div className="flex items-center gap-2 text-ink font-semibold">
                  <Shield className="w-4 h-4 text-accent shrink-0" />
                  <span>{t('pricing_trust_lemonsqueezy_title')}</span>
                </div>
                <p className="text-[11px] text-ink-2 leading-relaxed">
                  {t('pricing_trust_lemonsqueezy_desc')}
                </p>
              </div>

              <div className="p-3.5 rounded-[8px] border border-line bg-surface-2 space-y-1.5">
                <div className="flex items-center gap-2 text-ink font-semibold">
                  <CreditCard className="w-4 h-4 text-accent shrink-0" />
                  <span>{t('pricing_trust_no_card_storage_title')}</span>
                </div>
                <p className="text-[11px] text-ink-2 leading-relaxed">
                  {t('pricing_trust_no_card_storage_desc')}
                </p>
              </div>

              <div className="p-3.5 rounded-[8px] border border-line bg-surface-2 space-y-1.5">
                <div className="flex items-center gap-2 text-ink font-semibold">
                  <Lock className="w-4 h-4 text-accent shrink-0" />
                  <span>{t('pricing_trust_ssl_title')}</span>
                </div>
                <p className="text-[11px] text-ink-2 leading-relaxed">
                  {t('pricing_trust_ssl_desc')}
                </p>
              </div>

              <div className="p-3.5 rounded-[8px] border border-line bg-surface-2 space-y-1.5">
                <div className="flex items-center gap-2 text-ink font-semibold">
                  <Zap className="w-4 h-4 text-accent shrink-0" />
                  <span>{t('pricing_trust_refund_cancel_title')}</span>
                </div>
                <p className="text-[11px] text-ink-2 leading-relaxed">
                  {t('pricing_trust_refund_cancel_desc')}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-3">
              <span>
                {t('pricing_legal_links_prefix')}{' '}
                <Link href="/terms" className="text-accent underline underline-offset-4 hover:opacity-80">
                  {t('footer_terms')}
                </Link>
                {', '}
                <Link href="/privacy" className="text-accent underline underline-offset-4 hover:opacity-80">
                  {t('footer_privacy')}
                </Link>
                {', & '}
                <Link href="/refund" className="text-accent underline underline-offset-4 hover:opacity-80">
                  {t('footer_refund')}
                </Link>
                .
              </span>
              <div className="flex items-center gap-3">
                <Link href="/refund" className="hover:text-ink underline underline-offset-4 transition-colors">
                  {t('footer_refund')}
                </Link>
                <span>•</span>
                <Link href="/contact" className="hover:text-ink underline underline-offset-4 transition-colors">
                  {t('footer_contact')}
                </Link>
                <span>•</span>
                <Link href="/about" className="hover:text-ink underline underline-offset-4 transition-colors">
                  {t('footer_about')}
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Plan Comparison Section: Free / PAYG / Pro with Real Limits from plans.ts */}
        <div className="mb-16">
          <div className="text-center md:text-start mb-6">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              {t('pricing_compare_title')}
            </h2>
            <p className="text-xs text-ink-2 mt-1 font-mono">
              {t('pricing_compare_subtitle')}
            </p>
          </div>

          {/* Desktop Table (>=768px): Free / PAYG / Pro */}
          <div className="hidden md:block overflow-x-auto rounded-[8px] border border-line-strong bg-surface">
            <table
              data-testid="pricing-comparison-table"
              className="w-full min-w-[600px] text-start text-xs border-collapse"
            >
              <thead>
                <tr className="bg-surface-2 border-b border-line-strong text-ink">
                  <th className="py-3.5 px-4 text-start font-semibold">
                    {t('pricing_compare_col_feature')}
                  </th>
                  <th className="py-3.5 px-4 text-start font-semibold">
                    {getLocalized(freePlan.name, language)} (Free)
                  </th>
                  <th className="py-3.5 px-4 text-start font-semibold">
                    {getLocalized(paygPlan.name, language)} (PAYG)
                  </th>
                  <th className="py-3.5 px-4 text-start font-semibold text-accent">
                    {getLocalized(proPlan.name, language)} (Pro)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-strong">
                {compareFeatures.map((row, i) => (
                  <tr
                    key={row.id}
                    className={
                      i % 2 === 1
                        ? 'bg-surface-2 hover:bg-surface-2 transition-colors'
                        : 'hover:bg-surface-2 transition-colors'
                    }
                  >
                    <td className="py-3 px-4 font-medium text-ink">{row.feature}</td>
                    <td className="py-3 px-4 text-ink-2">{row.free}</td>
                    <td className="py-3 px-4 text-ink-2">{row.payg}</td>
                    <td className="py-3 px-4 text-accent font-semibold">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Definition Lists (<768px): Free / PAYG / Pro */}
          <div className="block md:hidden space-y-4">
            {[
              {
                id: 'free',
                name: `${getLocalized(freePlan.name, language)} (Free)`,
                key: 'free' as const,
                isPopular: false,
              },
              {
                id: 'payg',
                name: `${getLocalized(paygPlan.name, language)} (PAYG)`,
                key: 'payg' as const,
                isPopular: false,
              },
              {
                id: 'pro',
                name: `${getLocalized(proPlan.name, language)} (Pro)`,
                key: 'pro' as const,
                isPopular: true,
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
                  {compareFeatures.map((f) => (
                    <div key={f.id} className="py-2 flex flex-col gap-0.5">
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
