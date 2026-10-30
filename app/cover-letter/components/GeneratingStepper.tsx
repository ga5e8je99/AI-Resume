'use client';

import React from 'react';
import { Loader2, Check, X, Sparkles } from 'lucide-react';
import { GENERATION_STEPS } from '../constants';
import { CoverLetterLanguage, CoverLetterTone } from '../types';

interface GeneratingStepperProps {
  currentStep: number;
  language: CoverLetterLanguage;
  tone: CoverLetterTone;
  onCancel?: () => void;
}

export function GeneratingStepper({
  currentStep,
  language,
  tone,
  onCancel,
}: GeneratingStepperProps) {
  const isAr = language === 'ar';

  const toneDisplay = {
    formal: isAr ? 'احترافية ورسمية' : 'Professional',
    enthusiastic: isAr ? 'ودية وحماسية' : 'Friendly',
    leadership: isAr ? 'واثقة وقيادية' : 'Confident',
    technical: isAr ? 'تقنية وتحليلية' : 'Technical',
  }[tone] || tone;

  const progressPercent = Math.min(
    Math.round((currentStep / GENERATION_STEPS.length) * 100),
    95
  );

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="bg-surface border border-line rounded-[12px] p-6 sm:p-10 shadow-sm min-h-[500px] flex flex-col items-center justify-between space-y-6"
    >
      {/* Top Pulse Badge & Header */}
      <div className="flex flex-col items-center text-center space-y-3 max-w-lg w-full">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shadow-inner">
            <Sparkles className="w-7 h-7 animate-pulse text-accent" strokeWidth={1.5} />
          </div>
          <span className="absolute -bottom-1 -end-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-surface animate-ping" />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-serif font-bold text-ink">
            {isAr ? 'جاري صياغة خطاب التقديم الذكي...' : 'Synthesizing Your Cover Letter...'}
          </h3>
          <p className="text-xs sm:text-sm text-ink-2 leading-relaxed">
            {isAr
              ? `تحليل متطلبات الوظيفة، مطابقة المهارات الرئيسية، وضبط الصياغة بنبرة (${toneDisplay}).`
              : `Matching required competencies, optimizing keywords, and tailoring tone for (${toneDisplay}).`}
          </p>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full max-w-md pt-2">
          <div className="flex justify-between items-center text-[11px] font-mono text-ink-3 mb-1.5">
            <span>{isAr ? 'تقدم المعالجة' : 'Synthesizing progress'}</span>
            <span className="font-semibold text-accent">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-2 border border-line overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent via-emerald-500 to-teal-400 transition-all duration-500 ease-out shadow-xs"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Middle Layout: Stepper + Streaming Text Skeleton */}
      <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Generation Steps */}
        <div className="space-y-2">
          {GENERATION_STEPS.map((step) => {
            const isPassed = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={step.id}
                className={`p-2.5 rounded-[8px] border text-xs flex items-center gap-2.5 transition-all ${
                  isCurrent
                    ? 'bg-surface border-accent text-ink font-medium shadow-sm ring-1 ring-accent/30'
                    : isPassed
                    ? 'bg-surface-2/60 border-line text-ink-2'
                    : 'bg-transparent border-transparent text-ink-3/70'
                }`}
              >
                <div className="shrink-0">
                  {isPassed ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" strokeWidth={2.5} />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-line text-[10px] flex items-center justify-center text-ink-3 font-mono">
                      {step.id}
                    </div>
                  )}
                </div>
                <span className="truncate">{isAr ? step.titleAr : step.titleEn}</span>
              </div>
            );
          })}
        </div>

        {/* Streaming Skeleton Preview */}
        <div className="p-4 rounded-[10px] bg-paper border border-line flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              <span className="text-[11px] font-mono text-ink-2 font-medium">
                {isAr ? 'محاكاة التوليد الفوري' : 'Live stream drafting'}
              </span>
            </div>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-ink-3" />
          </div>

          <div className="space-y-2.5 py-1">
            <div className="h-2.5 bg-surface-2 rounded-full w-3/4 animate-pulse" />
            <div className="h-2.5 bg-surface-2 rounded-full w-full animate-pulse delay-75" />
            <div className="h-2.5 bg-surface-2 rounded-full w-5/6 animate-pulse delay-150" />
            <div className="h-2.5 bg-surface-2 rounded-full w-2/3 animate-pulse delay-200" />
            <div className="flex items-center gap-1 pt-1">
              <div className="h-2.5 bg-accent/30 rounded-full w-1/2 animate-pulse" />
              <span className="inline-block w-1.5 h-3 bg-accent animate-blink" />
            </div>
          </div>

          <p className="text-[10px] text-ink-3 font-mono text-end">
            {isAr ? 'يتم التوليد بدقة عالية...' : 'Generating tailored draft...'}
          </p>
        </div>
      </div>

      {/* Bottom Action: Cancel Button */}
      {onCancel && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-[8px] bg-surface hover:bg-surface-2 border border-line text-ink-2 hover:text-rose-500 hover:border-rose-500/30 text-xs font-medium transition-all flex items-center gap-2 cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-rose-500"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2} />
            <span>{isAr ? 'إلغاء التوليد والعودة للنموذج' : 'Cancel Generation'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
