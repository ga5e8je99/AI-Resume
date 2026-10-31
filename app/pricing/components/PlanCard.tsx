'use client';

import React from 'react';
import {
  PlanConfig,
  CurrencyCode,
  BillingCycle,
  formatPrice,
  getLocalized,
} from '@/lib/plans';
import { useLanguage } from '@/app/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Check, X, ArrowRight } from 'lucide-react';

export interface PlanCardProps {
  plan: PlanConfig;
  currency: CurrencyCode;
  billingCycle: BillingCycle;
  isCurrentPlan: boolean;
  isProUser: boolean;
  isExpiringSoon: boolean;
  hasStripeBilling: boolean;
  isMainLoading: boolean;
  isCryptoLoading: boolean;
  isPortalLoading: boolean;
  isAnyBusy: boolean;
  onSelectPlan: (plan: PlanConfig, overrideCurrency?: CurrencyCode) => void;
  onManageSubscription: () => void;
}

export function PlanCard({
  plan,
  currency,
  billingCycle,
  isCurrentPlan,
  isExpiringSoon,
  hasStripeBilling,
  isMainLoading,
  isCryptoLoading,
  isPortalLoading,
  isAnyBusy,
  onSelectPlan,
  onManageSubscription,
}: PlanCardProps) {
  const { language, t } = useLanguage();

  const isFree = plan.id === 'free';
  const isPro = plan.id === 'pro';
  const isPayg = plan.id === 'payg';

  let displayPrice = '$0';
  let priceSubtext = '';
  let annualNote = '';

  if (isFree) {
    displayPrice = formatPrice(0, currency, language);
    priceSubtext = t('pricing_plan_forever');
  } else if (isPro) {
    const currKey = currency === 'EGP' ? 'EGP' : 'USD';
    if (billingCycle === 'annual') {
      const annualMonthly = plan.pricing[currKey].annualMonthly ?? 0;
      const annualTotal = plan.pricing[currKey].annualTotal ?? 0;

      displayPrice = formatPrice(annualMonthly, currency, language);
      priceSubtext = t('pricing_plan_per_month');
      annualNote = t('pricing_billed_annually_note').replace(
        '{amount}',
        formatPrice(annualTotal, currency, language)
      );
    } else {
      const monthlyPrice = plan.pricing[currKey].monthly ?? 0;
      displayPrice = formatPrice(monthlyPrice, currency, language);
      priceSubtext = t('pricing_plan_per_month');
    }
  } else if (isPayg) {
    const currKey = currency === 'EGP' ? 'EGP' : 'USD';
    const packPrice = plan.pricing[currKey].oneTime ?? 0;
    displayPrice = formatPrice(packPrice, currency, language);
    priceSubtext = t('pricing_plan_one_time');
  }

  return (
    <div
      className={`card-interactive h-full rounded-[10px] p-6 sm:p-7 flex flex-col justify-between ${
        isPro
          ? 'border-2 border-accent bg-surface shadow-card relative'
          : 'border border-line-strong bg-surface shadow-subtle'
      }`}
    >
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink">
              {getLocalized(plan.name, language)}
            </h2>
            <p className="text-xs text-ink-2 mt-0.5">
              {getLocalized(plan.tagline, language)}
            </p>
          </div>

          {isPro && (
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface-2 text-accent border border-line-strong">
              {plan.badge
                ? getLocalized(plan.badge, language)
                : t('pricing_popular_badge')}
            </span>
          )}
        </div>

        {/* Price Block */}
        <div className="py-4 border-y border-line-strong my-4">
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-3xl sm:text-4xl font-bold text-ink tabular-nums">
              {displayPrice}
            </span>
            <span className="text-xs text-ink-2">{priceSubtext}</span>
          </div>
          {annualNote && (
            <p className="text-[11px] text-ink-2 mt-1 font-mono">{annualNote}</p>
          )}
        </div>

        {/* Feature Checklist */}
        <ul className="space-y-2.5 text-xs text-ink-2 mb-6">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              {feature.included ? (
                <Check
                  className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              ) : (
                <X
                  className="w-3.5 h-3.5 text-ink-2/50 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              )}
              <span
                className={
                  feature.included ? 'text-ink-2' : 'text-ink-2 line-through'
                }
              >
                {getLocalized(feature.text, language)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Card CTA */}
      <div className="space-y-2">
        {isCurrentPlan ? (
          isPro && hasStripeBilling ? (
            <Button
              variant="outline"
              size="md"
              fullWidth
              loading={isPortalLoading}
              loadingText={t('common_loading')}
              disabled={isAnyBusy && !isPortalLoading}
              aria-busy={isPortalLoading}
              onClick={onManageSubscription}
            >
              {t('billing_manage_subscription')}
            </Button>
          ) : isPro && isExpiringSoon ? (
            <Button
              variant="primary"
              size="md"
              fullWidth
              loading={isMainLoading}
              loadingText={t('common_loading')}
              disabled={isAnyBusy && !isMainLoading}
              aria-busy={isMainLoading}
              onClick={() => onSelectPlan(plan)}
            >
              {t('billing_renew_now')}
            </Button>
          ) : (
            <Button variant="outline" size="md" fullWidth disabled>
              {t('billing_current_plan')}
            </Button>
          )
        ) : (
          <Button
            variant={isPro ? 'primary' : 'secondary'}
            size="md"
            fullWidth
            loading={isMainLoading}
            loadingText={t('common_loading')}
            disabled={isAnyBusy && !isMainLoading}
            aria-busy={isMainLoading}
            onClick={() => onSelectPlan(plan)}
          >
            {getLocalized(plan.cta, language)}
          </Button>
        )}

        {!isFree && !isCurrentPlan && currency !== 'USDT' && (
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            loading={isCryptoLoading}
            loadingText={t('common_loading')}
            disabled={isAnyBusy && !isCryptoLoading}
            aria-busy={isCryptoLoading}
            rightIcon={<ArrowRight className="w-3 h-3 rtl:-scale-x-100" />}
            onClick={() => onSelectPlan(plan, 'USDT')}
            className="text-[11px] font-mono text-ink-2 hover:text-accent"
          >
            {t('pricing_or_pay_crypto')}
          </Button>
        )}
      </div>
    </div>
  );
}

export default PlanCard;

