'use client';

import React from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Accordion, AccordionItem } from '@/components/ui';
import ScrollReveal from './ScrollReveal';

export default function FaqSection() {
  const { t } = useLanguage();

  const faqItems: AccordionItem[] = [
    {
      id: 'privacy',
      title: t('faq_q1_title'),
      content: t('faq_q1_desc'),
      defaultOpen: true,
    },
    {
      id: 'formats',
      title: t('faq_q2_title'),
      content: t('faq_q2_desc'),
    },
    {
      id: 'languages',
      title: t('faq_q3_title'),
      content: t('faq_q3_desc'),
    },
    {
      id: 'free-tier',
      title: t('faq_q4_title'),
      content: t('faq_q4_desc'),
    },
    {
      id: 'credits',
      title: t('faq_q5_title'),
      content: t('faq_q5_desc'),
    },
    {
      id: 'cancellation',
      title: t('faq_q6_title'),
      content: t('faq_q6_desc'),
    },
    {
      id: 'refunds',
      title: t('faq_q7_title'),
      content: t('faq_q7_desc'),
    },
    {
      id: 'data-deletion',
      title: t('faq_q8_title'),
      content: t('faq_q8_desc'),
    },
  ];

  return (
    <section
      id="faq"
      className="py-16 sm:py-24 lg:py-28 max-w-[1200px] mx-auto px-4 sm:px-6 text-start"
    >
      <ScrollReveal>
        {/* Section Header */}
        <div className="max-w-2xl mb-12 sm:mb-16">
          <span className="text-xs font-mono uppercase tracking-wider text-brand font-semibold">
            {t('faq_tag')}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mt-1.5 leading-tight">
            {t('faq_title')}
          </h2>
          <p className="text-sm sm:text-base text-text-secondary mt-2 leading-relaxed max-w-[56ch]">
            {t('faq_desc')}
          </p>
        </div>

        {/* Accordion Component */}
        <div className="max-w-3xl mx-auto">
          <Accordion items={faqItems} />
        </div>
      </ScrollReveal>
    </section>
  );
}
