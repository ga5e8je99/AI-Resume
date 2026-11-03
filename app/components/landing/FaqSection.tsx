'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Accordion } from '@/components/ui/Accordion';
import { Reveal } from '@/components/motion/Reveal';

export default function FaqSection() {
  const { t } = useLanguage();

  const items = [
    { id: 'q1', title: t('faq_q1_title'), content: t('faq_q1_desc') },
    { id: 'q2', title: t('faq_q2_title'), content: t('faq_q2_desc') },
    { id: 'q3', title: t('faq_q3_title'), content: t('faq_q3_desc') },
    { id: 'q4', title: t('faq_q4_title'), content: t('faq_q4_desc') },
    { id: 'q5', title: t('faq_q5_title'), content: t('faq_q5_desc') },
    { id: 'q6', title: t('faq_q6_title'), content: t('faq_q6_desc') },
    { id: 'q7', title: t('faq_q7_title'), content: t('faq_q7_desc') },
    { id: 'q8', title: t('faq_q8_title'), content: t('faq_q8_desc') },
  ];

  return (
    <section className="relative overflow-x-clip py-18 sm:py-24 lg:py-28 bg-gradient-to-b from-paper via-surface-2/40 to-paper">
      {/* Decorative ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 overflow-hidden"
      >
        {/* Architectural subtle grid pattern with radial fade */}
        <div
          className="absolute inset-0 opacity-[0.25] dark:opacity-[0.16]"
          style={{
            backgroundImage:
              'linear-gradient(90deg, var(--line) 1px, transparent 1px), linear-gradient(180deg, var(--line) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            maskImage:
              'radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 100%)',
          }}
        />

        {/* Ambient brand color glows */}
        <div className="absolute top-10 start-1/4 -translate-x-1/2 rtl:translate-x-1/2 w-96 h-96 rounded-full bg-brand-soft/70 blur-3xl opacity-40 dark:opacity-30" />
        <div className="absolute bottom-10 end-1/4 translate-x-1/2 rtl:-translate-x-1/2 w-80 h-80 rounded-full bg-highlight-soft/50 blur-3xl opacity-35 dark:opacity-25" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 space-y-12">
        <Reveal from="up" className="text-center space-y-3.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-soft text-brand text-xs font-mono font-semibold border border-brand/20 shadow-subtle">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t('faq_tag')}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-ink tracking-tight">
            {t('faq_title')}
          </h2>

          <p className="text-sm sm:text-base text-ink-2 leading-relaxed">
            {t('faq_desc')}
          </p>
        </Reveal>

        <Reveal from="up" delay={100}>
          <Accordion items={items} showNumbers={true} />
        </Reveal>
      </div>
    </section>
  );
}
