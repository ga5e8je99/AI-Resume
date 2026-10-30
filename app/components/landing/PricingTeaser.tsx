'use client';

import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '@/app/context/LanguageContext';
import { PLANS } from '@/lib/plans';
import { Button } from '@/components/ui';
import ScrollReveal from './ScrollReveal';

export default function PricingTeaser() {
  const { language, t } = useLanguage();

  const getLocalized = (obj: any) => {
    if (!obj) return '';
    return obj[language] || obj.en || '';
  };

  return (
    <section
      id="pricing"
      className="py-16 sm:py-24 lg:py-28 border-t border-border bg-surface-2/40 text-start"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <ScrollReveal>
          {/* Section Header */}
          <div className="max-w-2xl mb-12 sm:mb-16">
            <span className="text-xs font-mono uppercase tracking-wider text-brand font-semibold">
              {t('pricing_teaser_tag')}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mt-1.5 leading-tight">
              {t('pricing_teaser_title')}
            </h2>
            <p className="text-sm sm:text-base text-text-secondary mt-2 leading-relaxed max-w-[56ch]">
              {t('pricing_teaser_desc')}
            </p>
          </div>

          {/* 3 Compact Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {PLANS.map((plan) => {
              const isPro = plan.id === 'pro';
              const price =
                plan.type === 'free'
                  ? '$0'
                  : plan.type === 'subscription'
                  ? `$${plan.pricing.USD.monthly}`
                  : `$${plan.pricing.USD.oneTime}`;

              const period =
                plan.type === 'free'
                  ? t('pricing_plan_forever')
                  : plan.type === 'subscription'
                  ? t('pricing_plan_per_month')
                  : t('pricing_plan_one_time');

              return (
                <div
                  key={plan.id}
                  className={clsx(
                    'rounded-xl bg-surface p-6 sm:p-7 flex flex-col justify-between transition-all relative',
                    isPro
                      ? 'border-2 border-brand shadow-card ring-1 ring-brand/20'
                      : 'border border-border shadow-subtle hover:border-border-strong hover:shadow-card'
                  )}
                >
                  {/* Popular Badge */}
                  {isPro && (
                    <div className="absolute -top-3 end-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand text-on-brand text-[10px] font-mono font-bold uppercase shadow-subtle tracking-wider">
                        <Sparkles className="w-3 h-3 text-highlight" />
                        <span>{t('pricing_popular_badge')}</span>
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Plan Name & Tagline */}
                    <div className="pb-4 border-b border-border/80">
                      <h3 className="font-serif text-xl font-bold text-text-primary">
                        {getLocalized(plan.name)}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1 min-h-[32px] leading-relaxed">
                        {getLocalized(plan.tagline)}
                      </p>

                      {/* Price */}
                      <div className="mt-4 flex items-baseline gap-1.5">
                        <span className="font-mono text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
                          {price}
                        </span>
                        <span className="font-mono text-xs text-text-muted">
                          {period}
                        </span>
                      </div>
                    </div>

                    {/* Plan Features */}
                    <ul className="space-y-2.5 pt-5 pb-6 text-xs text-text-secondary">
                      {plan.features.slice(0, 5).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                          <span className="leading-snug">
                            {getLocalized(feat.text)}
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
                        rightIcon={<ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />}
                        className={clsx(isPro && 'shadow-card')}
                      >
                        {getLocalized(plan.cta)}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footnote Link */}
          <div className="text-center pt-8">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand hover:text-brand-hover underline underline-offset-4"
            >
              <span>{t('pricing_view_full')}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
