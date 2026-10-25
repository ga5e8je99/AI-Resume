'use client';

import React from 'react';
import { CoverLetterTone, CoverLetterLanguage } from '../types';
import { TONE_PRESETS } from '../constants';
import { Briefcase, Code, Award, Sparkles } from 'lucide-react';

interface ToneCardSelectorProps {
  selectedTone: CoverLetterTone;
  onChange: (tone: CoverLetterTone) => void;
  language: CoverLetterLanguage;
}

export function ToneCardSelector({ selectedTone, onChange, language }: ToneCardSelectorProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase':
        return <Briefcase className="w-4 h-4" />;
      case 'Code':
        return <Code className="w-4 h-4" />;
      case 'Award':
        return <Award className="w-4 h-4" />;
      case 'Sparkles':
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-1.5" role="radiogroup" aria-label={language === 'ar' ? 'اختيار نبرة الخطاب' : 'Select cover letter tone'}>
      <label className="block text-xs font-semibold text-slate-300">
        {language === 'ar' ? 'نبرة الخطاب (Tone)' : 'Letter Tone'}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {TONE_PRESETS.map((t) => {
          const isSelected = selectedTone === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(t.id)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                language === 'ar' ? 'text-right' : 'text-left'
              } ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-500/10'
                  : 'bg-slate-800/60 border-slate-700/70 hover:border-slate-600 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                  {language === 'ar' ? t.labelAr : t.labelEn}
                </span>
                <span className={`p-1 rounded-md ${isSelected ? 'text-amber-400 bg-amber-500/20' : 'text-slate-400 bg-slate-700/50'}`}>
                  {getIcon(t.icon)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                {language === 'ar' ? t.descriptionAr : t.descriptionEn}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
