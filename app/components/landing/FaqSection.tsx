'use client';

import React from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Accordion } from '@/components/ui/Accordion';
import { ScrollReveal } from './ScrollReveal';

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
    <section className="overflow-x-clip py-16 sm:py-24 bg-paper">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">
        <ScrollReveal direction="up" className="text-center space-y-3">
          <span className="inline-block text-xs font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-brand-soft text-brand font-semibold">
            {t('faq_tag')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-ink">
            {t('faq_title')}
          </h2>
          <p className="text-sm sm:text-base text-ink-2 leading-relaxed">
            {t('faq_desc')}
          </p>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={100}>
          <Accordion items={items} />
        </ScrollReveal>
      </div>
    </section>
  );
}
