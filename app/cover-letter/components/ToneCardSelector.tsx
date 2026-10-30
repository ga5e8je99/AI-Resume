'use client';

import React from 'react';
import { CoverLetterTone, CoverLetterLanguage } from '../types';
import { TONE_PRESETS, TonePreset } from '../constants';
import { Briefcase, Sparkles, Award, Code, Check } from 'lucide-react';

interface ToneCardSelectorProps {
  selectedTone: CoverLetterTone;
  onChange: (tone: CoverLetterTone) => void;
  language: CoverLetterLanguage;
}

export function ToneCardSelector({ selectedTone, onChange, language }: ToneCardSelectorProps) {
  const isAr = language === 'ar';

  const getIcon = (id: string) => {
    switch (id) {
      case 'formal':
        return <Briefcase className="w-4 h-4" strokeWidth={1.75} />;
      case 'enthusiastic':
        return <Sparkles className="w-4 h-4" strokeWidth={1.75} />;
      case 'leadership':
        return <Award className="w-4 h-4" strokeWidth={1.75} />;
      case 'technical':
      default:
        return <Code className="w-4 h-4" strokeWidth={1.75} />;
    }
  };

  // Primary 3 Tones requested in Task U7: Professional, Friendly, Confident
  const primaryToneIds: CoverLetterTone[] = ['formal', 'enthusiastic', 'leadership'];
  const primaryTones = TONE_PRESETS.filter((t) => primaryToneIds.includes(t.id));
  const technicalPreset = TONE_PRESETS.find((t) => t.id === 'technical');

  return (
    <div className="space-y-2.5" role="radiogroup" aria-label={isAr ? 'اختيار نبرة الخطاب' : 'Select cover letter tone'}>
      <div className="flex items-baseline justify-between">
        <label className="block text-xs font-semibold text-ink">
          {isAr ? 'نبرة الخطاب (Tone)' : 'Letter Tone'}
        </label>
        <span className="text-[11px] text-ink-3">
          {isAr ? 'تحدد أسلوب الصياغة والمقدمة' : 'Shapes tone, phrasing & intro'}
        </span>
      </div>

      {/* 3 Prominent Primary Cards: Professional, Friendly, Confident */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {primaryTones.map((t) => {
          const isSelected = selectedTone === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(t.id)}
              className={`p-3 rounded-[10px] border text-start transition-all cursor-pointer flex flex-col justify-between gap-1.5 focus-visible:outline-2 focus-visible:outline-accent relative ${
                isSelected
                  ? 'bg-surface border-accent shadow-xs text-ink ring-2 ring-accent/20'
                  : 'bg-surface-2/40 border-line hover:border-line-strong hover:bg-surface text-ink-2'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`p-1.5 rounded-[6px] transition-colors ${
                  isSelected ? 'text-accent bg-accent-soft' : 'text-ink-3 bg-surface-2'
                }`}>
                  {getIcon(t.id)}
                </span>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  </span>
                )}
              </div>

              <div>
                <h4 className={`text-xs font-semibold ${isSelected ? 'text-accent' : 'text-ink'}`}>
                  {isAr ? t.labelAr : t.labelEn}
                </h4>
                <p className="text-[10px] text-ink-3 leading-relaxed mt-0.5 line-clamp-2">
                  {isAr ? t.descriptionAr : t.descriptionEn}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 4th Tone: Technical (Available for engineering & dev roles) */}
      {technicalPreset && (
        <div className="pt-0.5">
          <button
            type="button"
            role="radio"
            aria-checked={selectedTone === 'technical'}
            onClick={() => onChange('technical')}
            className={`w-full py-1.5 px-3 rounded-[8px] border text-start transition-all cursor-pointer flex items-center justify-between text-xs focus-visible:outline-2 focus-visible:outline-accent ${
              selectedTone === 'technical'
                ? 'bg-surface border-cyan-500/50 shadow-xs text-ink ring-1 ring-cyan-500/30'
                : 'bg-surface-2/30 border-line hover:border-line-strong hover:bg-surface text-ink-3 hover:text-ink'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`p-1 rounded-[4px] ${selectedTone === 'technical' ? 'text-cyan-600 bg-cyan-500/10' : 'text-ink-3'}`}>
                <Code className="w-3.5 h-3.5" strokeWidth={1.75} />
              </span>
              <span className={`font-medium ${selectedTone === 'technical' ? 'text-cyan-600 font-semibold' : 'text-ink-2'}`}>
                {isAr ? technicalPreset.labelAr : technicalPreset.labelEn}
              </span>
              <span className="text-[10px] text-ink-3 hidden sm:inline">
                {isAr ? '— تركيز على المهارات البرمجية والأرقام' : '— Focused on code, metrics & tech stack'}
              </span>
            </div>
            {selectedTone === 'technical' && (
              <span className="w-3.5 h-3.5 rounded-full bg-cyan-600 text-white flex items-center justify-center">
                <Check className="w-2 h-2" strokeWidth={3} />
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
