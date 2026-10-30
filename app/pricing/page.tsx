'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getUserEntitlements } from '@/lib/credits';
import { PLANS, PlanConfig, CurrencyCode, BillingCycle, formatPrice, getLocalized } from '@/lib/plans';
import { startCheckout } from '@/lib/checkout-client';
import { trackPricingViewed, trackCheckoutStarted } from '@/lib/analytics';
import { Button } from '../components/ui/Button';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Accordion } from '../components/ui/Accordion';
import { Toast } from '../components/ui/Toast';
import Footer from '../components/Footer';
import { Check, X, Shield, Lock, Zap, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  const { user } = useAuth();
  const { language, isRtl, t } = useLanguage();
  const isAr = language === 'ar';

  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
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

  const showToast = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 6000);
  };

  const handleCtaClick = async (plan: PlanConfig, overrideCurrency?: CurrencyCode) => {
    const activeCurrency = overrideCurrency || currency;
    trackCheckoutStarted(plan.id, activeCurrency);

    if (plan.id === 'free') {
      if (!user) {
        window.location.href = '/register';
      }
      return;
    }

    if (!user) {
      window.location.href = `/login?redirect=${encodeURIComponent('/pricing')}`;
      return;
    }

    setLoadingPlanId(plan.id);
    try {
      const res = await startCheckout(plan.id, { currency: activeCurrency, billingCycle });

      if (res.comingSoon || res.status === 501) {
        showToast(
          t('pricing_checkout_gate_soon'),
          'info'
        );
      } else if (res.success && res.url) {
        window.location.href = res.url;
      } else if (!res.success) {
        showToast(res.message || t('pricing_checkout_failed'), 'error');
      }
    } catch (err: any) {
      showToast(
        t('pricing_checkout_gate_soon'),
        'info'
      );
    } finally {
      setLoadingPlanId(null);
    }
  };

  const faqs = [
    {
      id: 'credits',
      title: isAr ? 'كيف يعمل رصيد الذكاء الاصطناعي؟' : 'How do AI generation credits work?',
      content: isAr
        ? 'تتيح لك كل نقطة توليد خطاب تقديم مخصص بالكامل ومتوافق مع شروط الوظيفة. تبدأ الحسابات المجانية بـ 3 نقاط مجانية، بينما يتمتع أعضاء باقة برو بتوليد غير محدود بدون خصم نقاط.'
        : 'Each credit allows you to generate a fully tailored cover letter aligned with a target job specification. Free accounts start with 3 credits. Pro subscribers generate unlimited letters with zero deduction.',
    },
    {
      id: 'billing',
      title: isAr ? 'هل يمكنني التبديل بين الدفع الشهري والسنوي؟' : 'Can I switch between monthly and annual billing?',
      content: isAr
        ? 'نعم. يمكنك التبديل بين الفوترة الشهرية والسنوية في أي وقت من لوحة التحكم، مع الاستفادة الفورية من خصم 22% عند الاشتراك السنوي.'
        : 'Yes. You can switch your billing frequency at any time from your account settings. Annual billing immediately applies our 22% rate discount.',
    },
    {
      id: 'methods',
      title: isAr ? 'ما هي طرق الدفع المتاحة محلياً ودولياً؟' : 'What payment methods are supported globally and locally?',
      content: isAr
        ? 'نقبل بطاقات الائتمان والخصم الدولية (Visa، MasterCard، Amex) عبر Stripe. ولمستخدمينا في مصر، نوفر الدفع بالجنيه المصري عبر فوري، ميزة، والمحافظ الإلكترونية عبر Paymob.'
        : 'We accept major credit and debit cards globally through Stripe. In Egypt, we support local payment channels including Fawry, Meeza cards, and mobile wallets via Paymob.',
    },
    {
      id: 'expiry',
      title: isAr ? 'هل تنتهي صلاحية نقاط باقة الدفع حسب الاستخدام؟' : 'Do Pay-As-You-Go credits ever expire?',
      content: isAr
        ? 'لا. نقاط باقة الدفع حسب الاستخدام صالحة مدى الحياة وتظل محفوظة في حسابك حتى تستهلكها.'
        : 'No. Pay-As-You-Go credits have lifetime validity and will remain available in your account until used.',
    },
    {
      id: 'cancellation',
      title: isAr ? 'هل يمكنني إلغاء اشتراكي في باقة برو في أي وقت؟' : 'Can I cancel my Pro subscription at any time?',
      content: isAr
        ? 'نعم، يمكنك إلغاء اشتراكك بنقرة واحدة من لوحة التحكم في أي وقت. وستستمر في الاستفادة من مزايا باقة برو حتى نهاية فترة الفوترة المدفوعة.'
        : 'Yes, you can cancel your subscription with a single click from your account dashboard. You will continue to have full access until the end of your paid billing period.',
    },
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
      feature: isAr ? 'مُولّد السير الذاتية وCV بالذكاء الاصطناعي' : 'AI Resume & CV Generator',
      free: isAr ? 'توليد تجريبي واحد (Taste)' : '1 Generation (Taste)',
      pro: isAr ? 'توليد غير محدود' : 'Unlimited Generations',
      payg: isAr ? 'نقطتان لكل سيرة (2 Credits)' : '2 Credits / Generation',
    },
    {
      feature: isAr ? 'مطابقة الوظائف الذكية (Job Match)' : 'AI Job Match & Aggregator',
      free: isAr ? '3 عمليات بحث مجانية' : '3 Free Searches',
      pro: isAr ? 'بحث غير محدود' : 'Unlimited Searches',
      payg: isAr ? 'نقطة واحدة لكل بحث (1 Credit)' : '1 Credit / Search',
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
      feature: isAr ? 'الحفظ السحابي للسير' : 'Cloud Resume Storage',
      free: isAr ? 'سيرة واحدة' : '1 Resume',
      pro: t('pricing_val_unlimited'),
      payg: t('pricing_val_unlimited'),
    },
    {
      feature: t('cover_tone_label'),
      free: isAr ? 'قياسي' : 'Standard',
      pro: isAr ? '4 نبرات احترافية' : '4 Professional Tones',
      payg: isAr ? '4 نبرات احترافية' : '4 Professional Tones',
    },
    {
      feature: t('footer_direct_support'),
      free: isAr ? 'دليل الاستخدام' : 'Self-Serve Docs',
      pro: isAr ? 'أولوية عبر البريد الإلكتروني' : 'Priority Email',
      payg: isAr ? 'دعم عبر البريد الإلكتروني' : 'Email Support',
    },
  ];

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-between selection:bg-accent-soft selection:text-ink" dir={isRtl ? 'rtl' : 'ltr'}>
      <Navbar />

      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.text}
          onClose={() => setToastMessage(null)}
        />
      )}

      <main id="main-content" className="max-w-[1160px] mx-auto px-4 sm:px-6 py-12 md:py-20 w-full text-start">
        {/* Header */}
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
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            {/* Currency toggle */}
            <SegmentedControl
              size="sm"
              value={currency}
              onChange={(val) => setCurrency(val as CurrencyCode)}
              options={[
                { value: 'USD', label: t('pricing_curr_usd') },
                { value: 'EGP', label: t('pricing_curr_egp') },
                { value: 'USDT', label: 'USDT (Binance)' },
              ]}
            />

            {/* Billing Cycle toggle */}
            <SegmentedControl
              size="sm"
              value={billingCycle}
              onChange={(val) => setBillingCycle(val as BillingCycle)}
              options={[
                { value: 'monthly', label: t('pricing_period_monthly') },
                {
                  value: 'annual',
                  label: t('pricing_period_yearly'),
                  badge: isAr ? 'وفر 22%' : 'Save 22%',
                },
              ]}
            />
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-16">
          {PLANS.map((plan) => {
            const isFree = plan.id === 'free';
            const isPro = plan.id === 'pro';
            const isPayg = plan.id === 'payg';

            const isCurrentPlan =
              user &&
              ((isFree && (!userPlan || userPlan === 'free') && !isProUser) ||
                (isPro && isProUser));

            let displayPrice = '$0';
            let priceSubtext = '';
            let annualNote = '';

            if (isFree) {
              displayPrice = formatPrice(0, currency, language);
              priceSubtext = t('pricing_plan_forever');
            } else if (isPro) {
              if (billingCycle === 'annual') {
                const annualMonthly =
                  currency === 'USD'
                    ? plan.pricing.USD.annualMonthly || 7
                    : plan.pricing.EGP.annualMonthly || 275;
                const annualTotal =
                  currency === 'USD'
                    ? plan.pricing.USD.annualTotal || 84
                    : plan.pricing.EGP.annualTotal || 3300;

                displayPrice = formatPrice(annualMonthly, currency, language);
                priceSubtext = t('pricing_plan_per_month');
                annualNote = isAr
                  ? `يتم الدفع سنوياً (${formatPrice(annualTotal, currency, 'ar')})`
                  : `Billed annually (${formatPrice(annualTotal, currency, language)}/yr)`;
              } else {
                const monthlyPrice =
                  currency === 'USD'
                    ? plan.pricing.USD.monthly || 9
                    : plan.pricing.EGP.monthly || 350;
                displayPrice = formatPrice(monthlyPrice, currency, language);
                priceSubtext = t('pricing_plan_per_month');
              }
            } else if (isPayg) {
              const packPrice =
                currency === 'USD'
                  ? plan.pricing.USD.oneTime || 5
                  : plan.pricing.EGP.oneTime || 199;
              displayPrice = formatPrice(packPrice, currency, language);
              priceSubtext = t('pricing_plan_one_time');
            }

            return (
              <div
                key={plan.id}
                className={`rounded-[10px] p-6 sm:p-7 flex flex-col justify-between card-hover ${
                  isPro
                    ? 'border-2 border-accent bg-surface shadow-card relative'
                    : 'border border-line bg-surface shadow-subtle'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h2 className="font-serif text-xl font-semibold text-ink">
                        {getLocalized(plan.name, language)}
                      </h2>
                      <p className="text-xs text-ink-3 mt-0.5">
                        {getLocalized(plan.tagline, language)}
                      </p>
                    </div>

                    {isPro && (
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-accent-soft text-accent border border-accent/20">
                        {plan.badge ? getLocalized(plan.badge, language) : t('pricing_popular_badge')}
                      </span>
                    )}
                  </div>

                  {/* Price Block */}
                  <div className="py-4 border-y border-line my-4">
                    <div className="flex items-baseline gap-1.5 font-mono">
                      <span className="text-3xl sm:text-4xl font-bold text-ink tabular-nums">
                        {displayPrice}
                      </span>
                      <span className="text-xs text-ink-3">{priceSubtext}</span>
                    </div>
                    {annualNote && (
                      <p className="text-[11px] text-ink-3 mt-1 font-mono">{annualNote}</p>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-2.5 text-xs text-ink-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-ink-3/50 shrink-0 mt-0.5" aria-hidden="true" />
                        )}
                        <span className={feature.included ? 'text-ink-2' : 'text-ink-3 line-through'}>
                          {getLocalized(feature.text, language)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card CTA */}
                <div className="space-y-2">
                  {isCurrentPlan ? (
                    <Button variant="outline" size="md" disabled className="w-full">
                      {isAr ? 'خطتك الحالية' : 'Current Plan'}
                    </Button>
                  ) : (
                    <Button
                      variant={isPro ? 'primary' : 'secondary'}
                      size="md"
                      isLoading={loadingPlanId === plan.id}
                      onClick={() => handleCtaClick(plan)}
                      className="w-full"
                    >
                      {getLocalized(plan.cta, language)}
                    </Button>
                  )}

                  {!isFree && !isCurrentPlan && (
                    <button
                      type="button"
                      onClick={() => handleCtaClick(plan, 'USDT')}
                      className="w-full text-center text-[11px] font-mono text-ink-3 hover:text-accent transition-colors pt-1 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>{isAr ? 'أو الدفع بـ Binance / Crypto (USDT)' : 'Or pay with Binance / Crypto (USDT)'}</span>
                      <ArrowRight className="w-3 h-3 rtl:-scale-x-100" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Guarantees Strip */}
        <div className="rounded-[8px] border border-line bg-surface p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-ink-2 mb-16">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-accent shrink-0" />
            <span>{isAr ? 'تشفير آمن للبيانات 256-bit' : 'Encrypted 256-bit payment processing'}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-accent shrink-0" />
            <span>{isAr ? 'تفعيل فوري لجميع مزايا الباقة' : 'Instant activation upon checkout'}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-accent shrink-0" />
            <span>{isAr ? 'إلغاء الاشتراك بنقرة واحدة في أي وقت' : 'Cancel anytime with zero fees'}</span>
          </div>
        </div>

        {/* Plan Comparison Section */}
        <div className="mb-16">
          <div className="text-center md:text-start mb-6">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              {t('pricing_compare_title')}
            </h2>
            <p className="text-xs text-ink-3 mt-1 font-mono">
              {isAr ? 'نظرة شاملة على جميع إمكانيات ومزايا كل باقة' : 'Full feature breakdown across tiers'}
            </p>
          </div>

          {/* Desktop Table (>=768px) */}
          <div className="hidden md:block overflow-x-auto rounded-[8px] border border-line bg-surface">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-surface-2 border-b border-line text-ink">
                  <th className="py-3 px-4 text-start font-semibold">{isAr ? 'الميزة' : 'Feature'}</th>
                  <th className="py-3 px-4 text-start font-semibold">{getLocalized(PLANS[0].name, language)}</th>
                  <th className="py-3 px-4 text-start font-semibold text-accent">{getLocalized(PLANS[1].name, language)}</th>
                  <th className="py-3 px-4 text-start font-semibold">{getLocalized(PLANS[2].name, language)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {compareFeatures.map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-surface-2/40 hover:bg-surface-2 transition-colors' : 'hover:bg-surface-2 transition-colors'}>
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
              { id: 'free', name: getLocalized(PLANS[0].name, language), key: 'free' as const, isPopular: false },
              { id: 'pro', name: getLocalized(PLANS[1].name, language), key: 'pro' as const, isPopular: true },
              { id: 'payg', name: getLocalized(PLANS[2].name, language), key: 'payg' as const, isPopular: false },
            ].map((p) => (
              <div
                key={p.id}
                className={`rounded-[8px] p-4 bg-surface ${
                  p.isPopular ? 'border-2 border-accent' : 'border border-line'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
                  <h3 className="font-serif text-base font-semibold text-ink">{p.name}</h3>
                  {p.isPopular && (
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-accent-soft text-accent">
                      {t('pricing_popular_badge')}
                    </span>
                  )}
                </div>
                <dl className="divide-y divide-line text-xs">
                  {compareFeatures.map((f, idx) => (
                    <div key={idx} className="py-2 flex flex-col gap-0.5">
                      <dt className="text-ink-3 font-mono text-[11px]">{f.feature}</dt>
                      <dd className={`font-medium ${p.isPopular ? 'text-accent' : 'text-ink'}`}>
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
