'use client';

import React from 'react';
import Link from 'next/link';
import { Check, X, ArrowRight } from 'lucide-react';
import { PLANS, formatPrice, getLocalized } from '@/lib/plans';
import { useLanguage } from '@/app/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { ScrollReveal, Stagger } from './ScrollReveal';

export function PricingTeaser() {
  const { language, t } = useLanguage();

  return (
    <section
      id="pricing"
      className="overflow-x-clip py-16 sm:py-24 lg:py-28 border-t border-line-strong bg-surface-2 text-start"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <ScrollReveal direction="up">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 text-start">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-brand font-semibold">
                {t('pricing_teaser_tag')}
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-ink mt-2 tracking-tight">
                {t('pricing_teaser_title')}
              </h2>
              <p className="text-sm sm:text-base text-ink-2 mt-2 max-w-xl">
                {t('pricing_teaser_desc')}
              </p>
            </div>

            <Link
              href="/pricing"
              className="btn inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-hover transition-colors group shrink-0"
            >
              <span>{t('pricing_view_full')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
            </Link>
          </div>
        </ScrollReveal>

        <Stagger
          className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch"
          itemClassName="h-full"
          direction="up"
        >
          {PLANS.map((plan) => {
            const isFree = plan.id === 'free';
            const isPro = plan.id === 'pro';
            const isPayg = plan.id === 'payg';

            let displayPrice = '$0';
            let priceSubtext = '';

            if (isFree) {
              displayPrice = formatPrice(0, 'USD', language);
              priceSubtext = t('pricing_plan_forever');
            } else if (isPro) {
              displayPrice = formatPrice(
                plan.pricing.USD.annualMonthly ?? 7.99,
                'USD',
                language
              );
              priceSubtext = t('pricing_plan_per_month');
            } else if (isPayg) {
              displayPrice = formatPrice(
                plan.pricing.USD.oneTime ?? 4.99,
                'USD',
                language
              );
              priceSubtext = t('pricing_plan_one_time');
            }

            return (
              <div
                key={plan.id}
                className={`card-interactive h-full rounded-xl p-6 sm:p-7 flex flex-col justify-between text-start ${isPro
                  ? 'border-2 border-brand bg-surface shadow-card relative'
                  : 'border border-line-strong bg-surface shadow-subtle'
                  }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-ink">
                        {getLocalized(plan.name, language)}
                      </h3>
                      <p className="text-xs text-ink-2 mt-0.5">
                        {getLocalized(plan.tagline, language)}
                      </p>
                    </div>
                    {isPro && (
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-soft text-brand border border-brand/20">
                        {plan.badge
                          ? getLocalized(plan.badge, language)
                          : t('pricing_popular_badge')}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="pb-4 mb-5 border-b border-line-strong/80 flex items-baseline gap-1.5">
                    <span
                      dir="ltr"
                      style={{ unicodeBidi: 'isolate' }}
                      className="font-mono text-3xl sm:text-4xl font-bold text-ink tracking-tight [unicode-bidi:isolate]"
                    >
                      {displayPrice}
                    </span>
                    <span className="text-xs text-ink-2">{priceSubtext}</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-ink-2 mb-6">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-ink-2/50 shrink-0 mt-0.5" />
                        )}
                        <span
                          className={
                            feature.included
                              ? 'text-ink-2'
                              : 'text-ink-2 line-through'
                          }
                        >
                          {getLocalized(feature.text, language)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Plan CTA */}
                <div className="pt-2">
                  <Link href="/pricing" className="block w-full">
                    <Button
                      variant={isPro ? 'primary' : 'outline'}
                      size="md"
                      fullWidth
                      endIcon={<ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />}
                      className={isPro ? 'shadow-card' : undefined}
                    >
                      {getLocalized(plan.cta, language)}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

export default PricingTeaser;
