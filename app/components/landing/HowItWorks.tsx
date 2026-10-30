'use client';

import React from 'react';
import { Upload, Search, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Dropzone, DropzoneState } from '@/components/ui';
import ScrollReveal from './ScrollReveal';

interface HowItWorksProps {
  dropzoneState: DropzoneState;
  dropzoneError?: string;
  uploadedFileName?: string;
  onFileSelect: (file: File) => void;
}

export default function HowItWorks({
  dropzoneState,
  dropzoneError,
  uploadedFileName,
  onFileSelect,
}: HowItWorksProps) {
  const { language, t } = useLanguage();
  const isAr = language === 'ar';

  const steps = [
    {
      numeral: '01',
      icon: Upload,
      title: t('how_step_1_title'),
      description: t('how_step_1_desc'),
      meta: t('how_step_1_meta'),
    },
    {
      numeral: '02',
      icon: Search,
      title: t('how_step_2_title'),
      description: t('how_step_2_desc'),
      meta: t('how_step_2_meta'),
    },
    {
      numeral: '03',
      icon: CheckCircle2,
      title: t('how_step_3_title'),
      description: t('how_step_3_desc'),
      meta: t('how_step_3_meta'),
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-16 sm:py-24 lg:py-28 max-w-[1200px] mx-auto px-4 sm:px-6 text-start"
    >
      <ScrollReveal>
        {/* Section Header */}
        <div className="max-w-2xl mb-12 sm:mb-16">
          <span className="text-xs font-mono uppercase tracking-wider text-brand font-semibold">
            {t('how_it_works_tag')}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mt-1.5 leading-tight">
            {t('how_it_works_title')}
          </h2>
          <p className="text-sm sm:text-base text-text-secondary mt-2 leading-relaxed max-w-[56ch]">
            {t('how_it_works_desc')}
          </p>
        </div>

        {/* 3 Numbered Steps with Connecting Line */}
        <div className="relative mb-14 lg:mb-16">
          {/* Connecting thin horizontal line on desktop */}
          <div
            className="hidden md:block absolute top-[44px] inset-x-12 lg:inset-x-16 h-[1px] bg-border pointer-events-none z-0"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="relative rounded-xl border border-border bg-surface p-6 sm:p-7 shadow-subtle hover:border-border-strong hover:shadow-card transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      {/* Large Serif Numeral */}
                      <span className="font-serif text-3xl sm:text-4xl font-bold text-brand leading-none">
                        {step.numeral}
                      </span>
                      {/* Step Icon */}
                      <div className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center border border-brand/20 shadow-subtle">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    <h3 className="font-serif text-lg sm:text-xl font-semibold text-text-primary mb-2">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-5 border-t border-border/60 flex items-center gap-1.5 text-[11px] font-mono text-text-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                    <span>{step.meta}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real In-Browser Dropzone Scanner Anchor */}
        <div id="ats-scanner" className="pt-4 scroll-mt-24">
          <div className="mb-4 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-xs font-mono text-text-secondary shadow-subtle">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span>{t('how_try_it_banner')}</span>
            </span>
          </div>
          <Dropzone
            onFileSelect={onFileSelect}
            state={dropzoneState}
            errorMessage={dropzoneError}
            fileName={uploadedFileName}
            isArabic={isAr}
          />
        </div>
      </ScrollReveal>
    </section>
  );
}
