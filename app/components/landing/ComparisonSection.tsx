'use client';

import React from 'react';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { ScrollReveal, Stagger } from './ScrollReveal';

export default function ComparisonSection() {
  const { t } = useLanguage();

  const beforeBullets = [
    t('comparison_before_b1'),
    t('comparison_before_b2'),
    t('comparison_before_b3'),
    t('comparison_before_b4'),
  ];

  const afterBullets = [
    t('comparison_after_b1'),
    t('comparison_after_b2'),
    t('comparison_after_b3'),
    t('comparison_after_b4'),
  ];

  return (
    <section className="overflow-x-clip py-16 sm:py-24 bg-paper">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
        <ScrollReveal direction="up" className="text-center max-w-2xl mx-auto space-y-3">
          <span className="inline-block text-xs font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-brand-soft text-brand font-semibold">
            {t('comparison_tag')}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-ink">
            {t('comparison_title')}
          </h2>
          <p className="text-sm sm:text-base text-ink-2 leading-relaxed">
            {t('comparison_desc')}
          </p>
        </ScrollReveal>

        <Stagger
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8"
          direction="up"
        >
          {/* Before Card */}
          <div className="card-interactive rounded-2xl border border-line-strong bg-surface p-6 sm:p-8 shadow-subtle space-y-5 text-start">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono uppercase text-danger font-semibold">
                  {t('comparison_before_tag')}
                </span>
                <h3 className="text-xl font-serif font-bold text-ink mt-1">
                  {t('comparison_before_title')}
                </h3>
              </div>
              <span
                dir="ltr"
                style={{ unicodeBidi: 'isolate' }}
                className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-danger-soft text-danger border border-danger/25 shrink-0 [unicode-bidi:isolate]"
              >
                54 • {t('comparison_before_score')}
              </span>
            </div>

            <ul className="space-y-3 pt-2 border-t border-line-strong">
              {beforeBullets.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-ink-2">
                  <XCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* After Card */}
          <div className="card-interactive rounded-2xl border-2 border-brand bg-surface p-6 sm:p-8 shadow-card space-y-5 text-start">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono uppercase text-success font-semibold">
                  {t('comparison_after_tag')}
                </span>
                <h3 className="text-xl font-serif font-bold text-ink mt-1">
                  {t('comparison_after_title')}
                </h3>
              </div>
              <span
                dir="ltr"
                style={{ unicodeBidi: 'isolate' }}
                className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-success-soft text-success border border-success/25 shrink-0 [unicode-bidi:isolate]"
              >
                91 • {t('comparison_after_score')}
              </span>
            </div>

            <ul className="space-y-3 pt-2 border-t border-line-strong">
              {afterBullets.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-ink">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-3 border-t border-line-strong flex items-center gap-2 text-xs font-mono text-brand font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('comparison_badge_verified')}</span>
            </div>
          </div>
        </Stagger>
      </div>
    </section>
  );
}
