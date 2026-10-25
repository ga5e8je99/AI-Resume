'use client';

import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { GENERATION_STEPS } from '../constants';
import { CoverLetterLanguage, CoverLetterTone } from '../types';

interface GeneratingStepperProps {
  currentStep: number;
  language: CoverLetterLanguage;
  tone: CoverLetterTone;
}

export function GeneratingStepper({ currentStep, language, tone }: GeneratingStepperProps) {
  const isAr = language === 'ar';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center backdrop-blur-md shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col items-center justify-center space-y-6">
      {/* Glowing Ambient Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/20 animate-pulse">
          <Sparkles className="w-10 h-10 animate-spin" />
        </div>
      </div>

      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-bold text-white">
          {isAr ? 'جاري صياغة خطاب التقديم الذكي...' : 'Synthesizing Your AI Cover Letter...'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          {isAr
            ? `يقوم محرك الذكاء الاصطناعي بمطابقة خبراتك واستخراج الكلمات المفتاحية وصياغة خطاب بنبرة (${tone}).`
            : `Our AI engine is matching your background, extracting ATS keywords, and crafting a tailored draft with (${tone}) tone.`}
        </p>
      </div>

      {/* Stepper Progress */}
      <div className="w-full max-w-sm space-y-2.5 text-right">
        {GENERATION_STEPS.map((step) => {
          const isPassed = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          return (
            <div
              key={step.id}
              className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
                isCurrent
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold shadow-sm'
                  : isPassed
                  ? 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                  : 'bg-slate-900/40 border-slate-800 text-slate-600'
              }`}
            >
              <div className="shrink-0">
                {isPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 text-[10px] flex items-center justify-center text-slate-500">
                    {step.id}
                  </div>
                )}
              </div>
              <span className="truncate">{isAr ? step.titleAr : step.titleEn}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
