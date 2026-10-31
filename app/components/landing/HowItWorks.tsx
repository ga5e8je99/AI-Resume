'use client';

import React from 'react';
import { Upload, Cpu, FileCheck2 } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Dropzone, DropzoneState } from '@/components/ui';
import { ScrollReveal, Stagger } from './ScrollReveal';

export interface HowItWorksProps {
  dropzoneState: DropzoneState;
  dropzoneError?: string;
  uploadedFileName?: string;
  onFileSelect: (file: File) => void | Promise<void>;
}

export default function HowItWorks({
  dropzoneState,
  dropzoneError,
  uploadedFileName,
  onFileSelect,
}: HowItWorksProps) {
  const { t } = useLanguage();

  const steps = [
    {
      num: '01',
      icon: Upload,
      title: t('how_step_1_title'),
      desc: t('how_step_1_desc'),
      meta: t('how_step_1_meta'),
    },
    {
      num: '02',
      icon: Cpu,
      title: t('how_step_2_title'),
      desc: t('how_step_2_desc'),
      meta: t('how_step_2_meta'),
    },
    {
      num: '03',
      icon: FileCheck2,
      title: t('how_step_3_title'),
      desc: t('how_step_3_desc'),
      meta: t('how_step_3_meta'),
    },
  ];

  return (
    <section id="ats-scanner" className="overflow-x-clip py-16 sm:py-24 bg-paper">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
        <ScrollReveal direction="up" className="text-center max-w-2xl mx-auto space-y-3">
          <span className="inline-block text-xs font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-brand-soft text-brand font-semibold">
            {t('how_it_works_tag')}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-ink">
            {t('how_it_works_title')}
          </h2>
          <p className="text-sm sm:text-base text-ink-2 leading-relaxed">
            {t('how_it_works_desc')}
          </p>
        </ScrollReveal>

        <Stagger
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          direction="up"
        >
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="card-interactive relative rounded-2xl border border-line-strong bg-surface p-6 sm:p-7 shadow-subtle text-start space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-ink-2 px-2.5 py-1 rounded-md bg-surface-2 border border-line-strong">
                    {step.num} • {step.meta}
                  </span>
                </div>
                <h3 className="text-lg font-serif font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="text-sm text-ink-2 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </Stagger>

        <ScrollReveal direction="up" delay={120} className="max-w-2xl mx-auto space-y-3">
          <div className="text-center">
            <span className="text-xs font-mono uppercase tracking-wider text-brand font-semibold">
              {t('how_try_it_banner')}
            </span>
          </div>
          <Dropzone
            state={dropzoneState}
            errorMessage={dropzoneError}
            fileName={uploadedFileName}
            onFileSelect={onFileSelect}
          />
        </ScrollReveal>
      </div>
    </section>
  );
}
