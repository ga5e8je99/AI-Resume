'use client';

import React from 'react';
import { TemplateId } from '../types';
import { Check } from 'lucide-react';
import { Stagger } from '@/app/components/landing/ScrollReveal';

interface Props {
  selectedTemplate: TemplateId;
  onSelect: (t: TemplateId) => void;
  accentColor?: string;
  isRtl?: boolean;
}

interface TemplateDefinition {
  id: TemplateId;
  nameEn: string;
  nameAr: string;
  tagEn: string;
  tagAr: string;
  atsScore: string;
  descEn: string;
  descAr: string;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'compact',
    nameEn: 'Compact ATS',
    nameAr: 'موجز ومتوافق مع ATS',
    tagEn: 'Best Seller',
    tagAr: 'الأكثر استخداماً',
    atsScore: '99%',
    descEn: 'Single column, high-density layout with inline contact & clean dividers.',
    descAr: 'عمود واحد بمسافات مدروسة وخطوط واضحة، متوافق بنسبة 99% مع أنظمة ATS.',
  },
  {
    id: 'two-column',
    nameEn: 'Two Column',
    nameAr: 'عمودان متوازيان',
    tagEn: 'Modern Split',
    tagAr: 'تصميم عصري',
    atsScore: '95%',
    descEn: 'Skills & education paired in a sleek sidebar alongside experience.',
    descAr: 'شريط جانبي أنيق للمهارات والبيانات مع عمود رئيسي للخبرات.',
  },
  {
    id: 'executive-blue',
    nameEn: 'Executive Studio',
    nameAr: 'النمط القيادي',
    tagEn: 'Executive',
    tagAr: 'للمدراء والخبراء',
    atsScore: '98%',
    descEn: 'Bold colored header banner with generous whitespace and underline rules.',
    descAr: 'رأس ملون بارز وهوامش مريحة للعين مع عناوين مؤكدة بخطوط أنيقة.',
  },
  {
    id: 'simple',
    nameEn: 'Simple Editorial',
    nameAr: 'التحريري الكلاسيكي',
    tagEn: 'Academic CV',
    tagAr: 'أكاديمي ورسمي',
    atsScore: '97%',
    descEn: 'Traditional academic style with labeled sections and horizontal rules.',
    descAr: 'نمط أكاديمي رصين بخطوط أفقية وترتيب تسلسلي تقليدي.',
  },
  {
    id: 'oslo',
    nameEn: 'Oslo ATS Pure',
    nameAr: 'أوسلو (نص نقي)',
    tagEn: '100% Parse Rate',
    tagAr: 'أعلى توافق 100%',
    atsScore: '100%',
    descEn: 'Pure typography, zero graphics. Guaranteed pass on Workday & Taleo.',
    descAr: 'نصوص نقية بلا أي رسوميات تضمن القراءة التلقائية بنسبة 100%.',
  },
  {
    id: 'amsterdam',
    nameEn: 'Amsterdam',
    nameAr: 'أمستردام (مع صورة)',
    tagEn: 'Photo Friendly',
    tagAr: 'يدعم الصورة',
    atsScore: '94%',
    descEn: 'Modern clean layout with optional circular profile photo and crisp accents.',
    descAr: 'تنسيق أوروبي عصري مع دائرة صورة شخصية اختيارية وخطوط ناعمة.',
  },
  {
    id: 'stockholm',
    nameEn: 'Stockholm',
    nameAr: 'ستوكهولم المكثف',
    tagEn: 'High Density',
    tagAr: 'مساحة مكثفة',
    atsScore: '96%',
    descEn: 'Engineered for senior professionals with extensive career histories.',
    descAr: 'مصمم خصيصاً لأصحاب المسيرات المهنية الطويلة ليحتوي أكبر قدر من البيانات.',
  },
  {
    id: 'london',
    nameEn: 'London Serif',
    nameAr: 'لندن الأنيق',
    tagEn: 'Editorial Serif',
    tagAr: 'خط سيريف أنيق',
    atsScore: '95%',
    descEn: 'Refined serif headings with balanced margins and corporate aesthetics.',
    descAr: 'عناوين سيريف فخمة مع توازن مدروس بين الأسطر والهوامش.',
  },
];

export default function TemplateSelector({
  selectedTemplate,
  onSelect,
  accentColor = '#0F5C4D',
  isRtl = false,
}: Props) {
  return (
    <div className="w-full">
      <Stagger
        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3"
        itemClassName="h-full"
        direction="up"
      >
        {TEMPLATES.map((tpl) => {
          const isSelected = selectedTemplate === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelect(tpl.id)}
              className={`card-interactive h-full w-full group relative text-start p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer focus-visible:outline-2 outline-offset-2 outline-[var(--focus)] ${
                isSelected
                  ? 'border-brand bg-brand/10 ring-2 ring-brand/40 shadow-sm'
                  : 'border-line-strong bg-surface hover:border-line-strong hover:bg-surface-2'
              }`}
            >
              {/* Thumbnail Miniature Wireframe */}
              <div className="w-full aspect-[1/1.28] rounded-md bg-white border border-line-strong/30 p-2 overflow-hidden shadow-xs relative mb-2 flex flex-col justify-between group-hover:scale-[1.02] transition-transform">
                {/* Miniature preview rendering based on template ID */}
                {renderMiniWireframe(tpl.id, accentColor)}

                {/* Active check pill */}
                {isSelected && (
                  <div className="absolute top-1 end-1 bg-brand text-white rounded-full p-0.5 shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* ATS score tag */}
                <div className="absolute bottom-1 start-1 bg-slate-900/80 backdrop-blur-xs text-[8px] font-mono text-white px-1 py-0.2 rounded">
                  ATS {tpl.atsScore}
                </div>
              </div>

              {/* Title & Tag */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <h4 className="text-xs font-semibold text-ink truncate">
                    {isRtl ? tpl.nameAr : tpl.nameEn}
                  </h4>
                </div>
                <span className="text-[10px] font-medium text-brand block truncate">
                  {isRtl ? tpl.tagAr : tpl.tagEn}
                </span>
                <p className="text-[10px] text-ink-2 line-clamp-2 mt-0.5 leading-snug">
                  {isRtl ? tpl.descAr : tpl.descEn}
                </p>
              </div>

              {/* Selection status */}
              {isSelected && (
                <div className="mt-2 text-[10px] font-semibold text-brand flex items-center gap-1 font-mono">
                  <span>✓ {isRtl ? 'قيد المعاينة' : 'Active Preview'}</span>
                </div>
              )}
            </button>
          );
        })}
      </Stagger>
    </div>
  );
}

/**
 * Renders an authentic miniature wireframe of each resume layout
 */
function renderMiniWireframe(templateId: TemplateId, accent: string) {
  switch (templateId) {
    case 'two-column':
      return (
        <div className="w-full h-full flex gap-1">
          {/* Left mini sidebar */}
          <div className="w-[34%] h-full rounded-[2px] p-1 flex flex-col gap-1 bg-slate-100">
            <div className="w-full h-2 rounded-[1px]" style={{ backgroundColor: accent }} />
            <div className="w-3/4 h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-full h-px bg-slate-300 my-0.5" />
            <div className="w-full h-1 bg-slate-400 rounded-[0.5px]" />
            <div className="w-5/6 h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-2/3 h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-full h-1.5 bg-slate-200 rounded-[1px] mt-1" />
            <div className="w-4/5 h-1 bg-slate-300 rounded-[0.5px]" />
          </div>
          {/* Right main column */}
          <div className="flex-1 h-full p-1 flex flex-col gap-1">
            <div className="w-3/4 h-2 bg-slate-800 rounded-[1px]" />
            <div className="w-1/2 h-1 bg-slate-400 rounded-[0.5px]" />
            <div className="w-full h-px bg-slate-200 my-0.5" />
            <div className="w-full h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-5/6 h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-4/5 h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-2/3 h-1.5 rounded-[1px] mt-1" style={{ backgroundColor: accent }} />
            <div className="w-full h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-5/6 h-1 bg-slate-300 rounded-[0.5px]" />
          </div>
        </div>
      );

    case 'executive-blue':
      return (
        <div className="w-full h-full flex flex-col gap-1">
          {/* Top colored accent banner */}
          <div className="w-full h-4 rounded-[2px] p-1 flex flex-col justify-center" style={{ backgroundColor: accent }}>
            <div className="w-2/3 h-1.5 bg-white rounded-[0.5px]" />
            <div className="w-1/3 h-1 bg-white/70 rounded-[0.5px] mt-0.5" />
          </div>
          {/* Body lines with colored underlines */}
          <div className="p-0.5 flex flex-col gap-1">
            <div className="w-2/5 h-1 rounded-[0.5px]" style={{ backgroundColor: accent }} />
            <div className="w-full h-px" style={{ backgroundColor: accent }} />
            <div className="w-full h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-5/6 h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-2/5 h-1 rounded-[0.5px] mt-1" style={{ backgroundColor: accent }} />
            <div className="w-full h-px" style={{ backgroundColor: accent }} />
            <div className="w-full h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-4/5 h-1 bg-slate-300 rounded-[0.5px]" />
          </div>
        </div>
      );

    case 'simple':
      return (
        <div className="w-full h-full flex flex-col items-center gap-1 p-0.5">
          {/* Centered academic header with double border */}
          <div className="w-3/4 h-2 bg-slate-800 rounded-[1px] mt-0.5" />
          <div className="w-1/2 h-1 bg-slate-500 rounded-[0.5px]" />
          <div className="w-full border-t-2 border-b border-slate-700 py-0.5 my-0.5" />
          <div className="w-full flex flex-col gap-1">
            <div className="w-1/3 h-1.5 bg-slate-700 rounded-[0.5px]" />
            <div className="w-full h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-5/6 h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-1/3 h-1.5 bg-slate-700 rounded-[0.5px] mt-1" />
            <div className="w-full h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-4/5 h-1 bg-slate-300 rounded-[0.5px]" />
          </div>
        </div>
      );

    case 'amsterdam':
      return (
        <div className="w-full h-full flex flex-col gap-1 p-0.5">
          {/* Header with photo circle */}
          <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-200">
            <div className="flex-1">
              <div className="w-3/4 h-2 bg-slate-800 rounded-[1px]" />
              <div className="w-1/2 h-1 bg-slate-400 rounded-[0.5px] mt-0.5" />
            </div>
            <div className="w-4 h-4 rounded-full border shrink-0" style={{ borderColor: accent, backgroundColor: `${accent}20` }} />
          </div>
          <div className="flex flex-col gap-1 mt-0.5">
            <div className="w-1/3 h-1.5 rounded-[0.5px]" style={{ backgroundColor: accent }} />
            <div className="w-full h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-5/6 h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-1/3 h-1.5 rounded-[0.5px] mt-1" style={{ backgroundColor: accent }} />
            <div className="w-full h-1 bg-slate-300 rounded-[0.5px]" />
          </div>
        </div>
      );

    case 'oslo':
      return (
        <div className="w-full h-full flex flex-col gap-1 p-0.5 font-mono">
          {/* Strict typography, pure text */}
          <div className="w-3/5 h-2 bg-slate-900 rounded-[0.5px]" />
          <div className="w-2/5 h-1 bg-slate-600 rounded-[0.5px]" />
          <div className="w-4/5 h-0.5 bg-slate-400 mt-1" />
          <div className="flex flex-col gap-1 mt-1">
            <div className="w-1/4 h-1.5 bg-slate-800 rounded-[0.5px]" />
            <div className="w-full h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-5/6 h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-1/4 h-1.5 bg-slate-800 rounded-[0.5px] mt-1" />
            <div className="w-full h-1 bg-slate-300 rounded-[0.5px]" />
          </div>
        </div>
      );

    case 'stockholm':
      return (
        <div className="w-full h-full flex flex-col gap-0.5 p-0.5">
          {/* High density multi-row */}
          <div className="w-3/4 h-2 bg-slate-900 rounded-[0.5px]" />
          <div className="w-full h-0.5 bg-slate-400" />
          <div className="grid grid-cols-2 gap-1 mt-0.5">
            <div className="h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="h-1 bg-slate-300 rounded-[0.5px]" />
          </div>
          <div className="flex flex-col gap-0.5 mt-1">
            <div className="w-1/3 h-1 bg-slate-700" />
            <div className="w-full h-0.5 bg-slate-300" />
            <div className="w-full h-0.5 bg-slate-300" />
            <div className="w-5/6 h-0.5 bg-slate-300" />
            <div className="w-1/3 h-1 bg-slate-700 mt-0.5" />
            <div className="w-full h-0.5 bg-slate-300" />
            <div className="w-4/5 h-0.5 bg-slate-300" />
          </div>
        </div>
      );

    case 'london':
      return (
        <div className="w-full h-full flex flex-col items-center gap-1 p-0.5">
          <div className="w-2/3 h-2 bg-slate-900 rounded-[1px] tracking-widest" />
          <div className="w-1/3 h-1 bg-slate-500 rounded-[0.5px]" />
          <div className="w-1/2 h-px my-0.5" style={{ backgroundColor: accent }} />
          <div className="w-full flex flex-col gap-1">
            <div className="w-2/5 h-1.5 rounded-[0.5px]" style={{ color: accent }} />
            <div className="w-full h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-4/5 h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-2/5 h-1.5 rounded-[0.5px] mt-0.5" />
            <div className="w-full h-1 bg-slate-300 rounded-[0.5px]" />
          </div>
        </div>
      );

    case 'compact':
    default:
      return (
        <div className="w-full h-full flex flex-col gap-1 p-0.5">
          {/* Classic single column with crisp divider line */}
          <div className="w-3/4 h-2 bg-slate-900 rounded-[1px]" />
          <div className="w-1/2 h-1 bg-slate-500 rounded-[0.5px]" />
          <div className="w-full h-px bg-slate-800 my-0.5" />
          <div className="w-full h-1 bg-slate-300 rounded-[0.5px]" />
          <div className="w-5/6 h-1 bg-slate-300 rounded-[0.5px]" />
          <div className="w-1/3 h-1.5 rounded-[0.5px] mt-1" style={{ backgroundColor: accent }} />
          <div className="w-full h-1 bg-slate-300 rounded-[0.5px]" />
          <div className="w-4/5 h-1 bg-slate-300 rounded-[0.5px]" />
        </div>
      );
  }
}
