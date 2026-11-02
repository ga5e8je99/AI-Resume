'use client';

import React from 'react';
import { CheckCircle2, XCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Reveal, Stagger } from '@/components/motion/Reveal';

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
        <Reveal from="up" className="text-center max-w-2xl mx-auto space-y-3">
          <span className="inline-block text-xs font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-brand-soft text-brand font-semibold">
            {t('comparison_tag')}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-ink">
            {t('comparison_title')}
          </h2>
          <p className="text-sm sm:text-base text-ink-2 leading-relaxed">
            {t('comparison_desc')}
          </p>
        </Reveal>

        <Stagger
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch auto-rows-fr"
          itemClassName="h-full flex"
          from="up"
        >
          {/* Before Card */}
          <div className="card-interactive h-full w-full rounded-2xl border border-line-strong bg-surface p-6 sm:p-8 shadow-subtle flex flex-col justify-between gap-6 text-start">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-danger font-semibold">
                    {t('comparison_before_tag')}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-ink mt-1">
                    {t('comparison_before_title')}
                  </h3>
                </div>
                <span
                  dir="ltr"
                  style={{ unicodeBidi: 'isolate' }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-danger-soft text-danger border border-danger/25 shrink-0 [unicode-bidi:isolate]"
                >
                  54 • {t('comparison_before_score')}
                </span>
              </div>

              {/* Visual Score Meter */}
              <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden border border-line-strong/60">
                <div
                  className="h-full rounded-full bg-danger transition-all duration-500"
                  style={{ width: '54%' }}
                />
              </div>

              <ul className="space-y-3.5 pt-4 border-t border-line-strong">
                {beforeBullets.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-ink-2 leading-relaxed">
                    <XCircle className="w-4 h-4 text-danger shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-line-strong flex items-center justify-between gap-2 text-xs font-mono text-danger font-semibold">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t('comparison_before_tag')}</span>
              </div>
              <span dir="ltr" className="[unicode-bidi:isolate]">54 / 100</span>
            </div>
          </div>

          {/* After Card */}
          <div className="card-interactive h-full w-full rounded-2xl border-2 border-brand bg-surface p-6 sm:p-8 shadow-card flex flex-col justify-between gap-6 text-start">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-success font-semibold">
                    {t('comparison_after_tag')}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-ink mt-1">
                    {t('comparison_after_title')}
                  </h3>
                </div>
                <span
                  dir="ltr"
                  style={{ unicodeBidi: 'isolate' }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-success-soft text-success border border-success/25 shrink-0 [unicode-bidi:isolate]"
                >
                  91 • {t('comparison_after_score')}
                </span>
              </div>

              {/* Visual Score Meter */}
              <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden border border-line-strong/60">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-500"
                  style={{ width: '91%' }}
                />
              </div>

              <ul className="space-y-3.5 pt-4 border-t border-line-strong">
                {afterBullets.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-ink leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-line-strong flex items-center justify-between gap-2 text-xs font-mono text-brand font-semibold">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{t('comparison_badge_verified')}</span>
              </div>
              <span dir="ltr" className="[unicode-bidi:isolate]">91 / 100</span>
            </div>
          </div>
        </Stagger>
      </div>
    </section>
  );
}
