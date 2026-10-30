'use client';

import React from 'react';
import { FileCheck, Globe, Download, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import ScrollReveal from './ScrollReveal';

export default function TrustStrip() {
  const { t } = useLanguage();

  const facts = [
    {
      icon: FileCheck,
      title: t('trust_fact_templates_title'),
      description: t('trust_fact_templates_desc'),
    },
    {
      icon: Globe,
      title: t('trust_fact_languages_title'),
      description: t('trust_fact_languages_desc'),
    },
    {
      icon: Download,
      title: t('trust_fact_export_title'),
      description: t('trust_fact_export_desc'),
    },
    {
      icon: ShieldCheck,
      title: t('trust_fact_privacy_title'),
      description: t('trust_fact_privacy_desc'),
    },
  ];

  return (
    <section
      aria-label={t('trust_strip_aria')}
      className="border-y border-border bg-surface-2/40 py-8 sm:py-10 transition-colors"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {facts.map((fact, idx) => {
              const Icon = fact.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 text-start p-2.5 rounded-xl border border-transparent hover:border-border hover:bg-surface/60 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0 border border-brand/20 shadow-subtle mt-0.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-sm sm:text-base font-semibold text-text-primary leading-snug">
                      {fact.title}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      {fact.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
