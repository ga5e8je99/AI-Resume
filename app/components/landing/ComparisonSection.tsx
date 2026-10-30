'use client';

import React from 'react';
import { X, Check, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import ScrollReveal from './ScrollReveal';

export default function ComparisonSection() {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <section
      id="comparison"
      className="py-16 sm:py-24 lg:py-28 max-w-[1200px] mx-auto px-4 sm:px-6 text-start"
    >
      <ScrollReveal>
        {/* Section Header */}
        <div className="max-w-2xl mb-12 sm:mb-16">
          <span className="text-xs font-mono uppercase tracking-wider text-brand font-semibold">
            {t('comparison_tag')}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mt-1.5 leading-tight">
            {t('comparison_title')}
          </h2>
          <p className="text-sm sm:text-base text-text-secondary mt-2 leading-relaxed max-w-[56ch]">
            {t('comparison_desc')}
          </p>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {/* ================================================================= */}
          {/* BEFORE RESUME CARD (Score: 54)                                    */}
          {/* ================================================================= */}
          <div className="rounded-xl border border-danger/30 bg-surface p-6 sm:p-8 shadow-card flex flex-col justify-between space-y-6 relative overflow-hidden transition-all hover:border-danger/50">
            <div>
              {/* Header with Title and Score Pill */}
              <div className="flex items-start justify-between pb-5 border-b border-border">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-danger font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {t('comparison_before_tag')}
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-text-primary mt-1">
                    {t('comparison_before_title')}
                  </h3>
                </div>
                <div className="text-end shrink-0 ps-3">
                  <div className="w-16 h-16 rounded-xl bg-danger-soft text-danger border border-danger/30 flex flex-col items-center justify-center leading-none shadow-subtle">
                    <span className="font-mono text-2xl font-bold">54</span>
                    <span className="text-[9px] font-mono uppercase mt-0.5 font-bold tracking-tight">
                      / 100
                    </span>
                  </div>
                </div>
              </div>

              {/* Sample Mock Resume Document Snippet (Before) */}
              <div className="mt-5 p-3.5 rounded-lg border border-danger/20 bg-danger-soft/20 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between text-[11px] text-danger font-semibold pb-1.5 border-b border-danger/20">
                  <span>Sample: Standard Word Template</span>
                  <span className="bg-danger-soft px-1.5 py-0.5 rounded text-[10px]">Taleo Error</span>
                </div>
                <div className="text-text-muted opacity-80 leading-relaxed font-sans text-xs">
                  <span className="line-through decoration-danger">Alex R. • Senior Engineer</span>
                  <br />
                  <span className="text-[10px] text-danger font-mono">[Parser Stripped Multi-Column Box] [Skills Table Skipped]</span>
                </div>
              </div>

              {/* Negative Bullet Points */}
              <ul className="space-y-3.5 pt-5 text-xs sm:text-sm text-text-secondary">
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-danger-soft text-danger flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5" />
                  </div>
                  <span>{t('comparison_before_b1')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-danger-soft text-danger flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5" />
                  </div>
                  <span>{t('comparison_before_b2')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-danger-soft text-danger flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5" />
                  </div>
                  <span>{t('comparison_before_b3')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-danger-soft text-danger flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5" />
                  </div>
                  <span>{t('comparison_before_b4')}</span>
                </li>
              </ul>
            </div>

            {/* Card Footer Status */}
            <div className="pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-danger">
              <span>4 Format Violations</span>
              <span>High Rejection Risk</span>
            </div>
          </div>

          {/* ================================================================= */}
          {/* AFTER RESUME CARD (Score: 91)                                     */}
          {/* ================================================================= */}
          <div className="rounded-xl border-2 border-brand bg-surface p-6 sm:p-8 shadow-elevated flex flex-col justify-between space-y-6 relative overflow-hidden transition-all ring-1 ring-brand/20">
            <div>
              {/* Header with Title and Score Pill */}
              <div className="flex items-start justify-between pb-5 border-b border-border">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-brand font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
                    {t('comparison_after_tag')}
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-text-primary mt-1">
                    {t('comparison_after_title')}
                  </h3>
                </div>
                <div className="text-end shrink-0 ps-3">
                  <div className="w-16 h-16 rounded-xl bg-brand-soft text-brand border border-brand/30 flex flex-col items-center justify-center leading-none shadow-subtle">
                    <span className="font-mono text-2xl font-bold">91</span>
                    <span className="text-[9px] font-mono uppercase mt-0.5 font-bold tracking-tight">
                      / 100
                    </span>
                  </div>
                </div>
              </div>

              {/* Sample Mock Resume Document Snippet (After) */}
              <div className="mt-5 p-3.5 rounded-lg border border-brand/30 bg-brand-soft/30 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between text-[11px] text-brand font-semibold pb-1.5 border-b border-brand/20">
                  <span>Sample: JobMatch Linear Template</span>
                  <span className="bg-success-soft text-success px-1.5 py-0.5 rounded text-[10px] font-bold">100% Parsed</span>
                </div>
                <div className="text-text-primary leading-relaxed font-sans text-xs">
                  <span className="font-semibold text-text-primary">Alex R. • Principal Systems Architect</span>
                  <br />
                  <span className="text-[10px] text-brand font-mono">✓ Linear flow • 6 semantic sections • 14 target keywords</span>
                </div>
              </div>

              {/* Positive Bullet Points */}
              <ul className="space-y-3.5 pt-5 text-xs sm:text-sm text-text-secondary">
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-brand-soft text-brand flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{t('comparison_after_b1')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-brand-soft text-brand flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{t('comparison_after_b2')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-brand-soft text-brand flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{t('comparison_after_b3')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-brand-soft text-brand flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{t('comparison_after_b4')}</span>
                </li>
              </ul>
            </div>

            {/* Card Footer Status */}
            <div className="pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-brand">
              <span className="font-semibold flex items-center gap-1.5">
                <span>54 → 91</span>
                <span className="text-success">(+37 Score Increase)</span>
              </span>
              <span className="text-success font-semibold">{t('comparison_badge_verified')}</span>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
