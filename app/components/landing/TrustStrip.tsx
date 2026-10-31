'use client';

import React from 'react';
import { ShieldCheck, Globe, FileCheck2, Lock } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Stagger } from './ScrollReveal';

export default function TrustStrip() {
  const { t } = useLanguage();

  const facts = [
    {
      icon: ShieldCheck,
      title: t('trust_fact_templates_title'),
      desc: t('trust_fact_templates_desc'),
    },
    {
      icon: Globe,
      title: t('trust_fact_languages_title'),
      desc: t('trust_fact_languages_desc'),
    },
    {
      icon: FileCheck2,
      title: t('trust_fact_export_title'),
      desc: t('trust_fact_export_desc'),
    },
    {
      icon: Lock,
      title: t('trust_fact_privacy_title'),
      desc: t('trust_fact_privacy_desc'),
    },
  ];

  return (
    <section
      aria-label={t('trust_strip_aria')}
      className="overflow-x-clip border-y border-line-strong bg-surface-2 py-8 sm:py-10"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <Stagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          direction="up"
        >
          {facts.map((fact, idx) => {
            const Icon = fact.icon;
            return (
              <div
                key={idx}
                className="card-interactive flex items-start gap-3.5 p-4 rounded-xl border border-line-strong bg-surface shadow-subtle text-start"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-ink">{fact.title}</h3>
                  <p className="text-xs text-ink-2 mt-0.5 leading-relaxed">
                    {fact.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
