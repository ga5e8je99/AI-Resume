'use client';

import React, { useState } from 'react';
import { TemplateId } from '../types';
import { Check, Sparkles, Filter } from 'lucide-react';
import { Stagger } from '@/components/motion/Reveal';

interface Props {
  selectedTemplate: TemplateId;
  onSelect: (t: TemplateId) => void;
  accentColor?: string;
  isRtl?: boolean;
}

export type TemplateCategory = 'all' | 'ats-top' | 'modern' | 'classic';

interface TemplateDefinition {
  id: TemplateId;
  nameEn: string;
  nameAr: string;
  tagEn: string;
  tagAr: string;
  atsScore: string;
  category: 'ats-top' | 'modern' | 'classic';
  descEn: string;
  descAr: string;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'compact',
    nameEn: 'Compact ATS',
    nameAr: 'موجز ومتوافق مع ATS',
    tagEn: 'Most Popular',
    tagAr: 'الأكثر استخداماً',
    atsScore: '99%',
    category: 'ats-top',
    descEn: 'Single column, high-density layout with inline contact & clean dividers.',
    descAr: 'عمود واحد بمسافات مدروسة وخطوط واضحة، متوافق بنسبة 99% مع أنظمة ATS.',
  },
  {
    id: 'oslo',
    nameEn: 'Oslo ATS Pure',
    nameAr: 'أوسلو (نص نقي 100%)',
    tagEn: '100% Parse Rate',
    tagAr: 'أعلى توافق 100%',
    atsScore: '100%',
    category: 'ats-top',
    descEn: 'Pure typography, zero graphics. Guaranteed pass on Workday, Taleo & Greenhouse.',
    descAr: 'نصوص نقية بلا أي رسوميات تضمن القراءة الآلية بنسبة 100% في كافة المنصات.',
  },
  {
    id: 'executive-blue',
    nameEn: 'Executive Studio',
    nameAr: 'النمط القيادي',
    tagEn: 'Executive',
    tagAr: 'للمدراء والخبراء',
    atsScore: '98%',
    category: 'ats-top',
    descEn: 'Bold colored header banner with generous whitespace and underline rules.',
    descAr: 'رأس ملون بارز وهوامش مريحة للعين مع عناوين مؤكدة بخطوط أنيقة.',
  },
  {
    id: 'two-column',
    nameEn: 'Two Column',
    nameAr: 'عمودان متوازيان',
    tagEn: 'Modern Split',
    tagAr: 'تصميم عصري',
    atsScore: '95%',
    category: 'modern',
    descEn: 'Skills & education paired in a sleek sidebar alongside experience.',
    descAr: 'شريط جانبي أنيق للمهارات والبيانات مع عمود رئيسي للخبرات.',
  },
  {
    id: 'modern',
    nameEn: 'Modern Creative',
    nameAr: 'العصري الأنيق',
    tagEn: 'Clean & Polished',
    tagAr: 'أناقة عصرية',
    atsScore: '96%',
    category: 'modern',
    descEn: 'Contemporary layout with balanced margins and prominent accent headers.',
    descAr: 'تصميم عصري ذو لمسات لونية واضحة وهيكل مرن يناسب الشركات الحديثة والتقنية.',
  },
  {
    id: 'amsterdam',
    nameEn: 'Amsterdam',
    nameAr: 'أمستردام (يدعم الصورة)',
    tagEn: 'Photo Friendly',
    tagAr: 'يدعم الصورة',
    atsScore: '94%',
    category: 'modern',
    descEn: 'Modern clean layout with optional circular profile photo and crisp accents.',
    descAr: 'تنسيق أوروبي عصري مع دائرة صورة شخصية اختيارية وخطوط ناعمة.',
  },
  {
    id: 'london',
    nameEn: 'London Serif',
    nameAr: 'لندن الأنيق',
    tagEn: 'Editorial Serif',
    tagAr: 'خط سيريف أنيق',
    atsScore: '95%',
    category: 'modern',
    descEn: 'Refined serif headings with balanced margins and corporate aesthetics.',
    descAr: 'عناوين سيريف فخمة مع توازن مدروس بين الأسطر والهوامش.',
  },
  {
    id: 'classic',
    nameEn: 'Classic Professional',
    nameAr: 'الكلاسيكي الاحترافي',
    tagEn: 'Traditional Ivy',
    tagAr: 'تقليدي ورصين',
    atsScore: '98%',
    category: 'classic',
    descEn: 'Timeless single-column design with clean section dividers and traditional structure.',
    descAr: 'تصميم كلاسيكي رصين بعمود واحد وتقسيمات هندسية واضحة للخبرات والتعليم.',
  },
  {
    id: 'simple',
    nameEn: 'Simple Editorial',
    nameAr: 'التحريري الأكاديمي',
    tagEn: 'Academic CV',
    tagAr: 'أكاديمي ورسمي',
    atsScore: '97%',
    category: 'classic',
    descEn: 'Traditional academic style with labeled sections and horizontal rules.',
    descAr: 'نمط أكاديمي رصين بخطوط أفقية وترتيب تسلسلي تقليدي معتمد.',
  },
  {
    id: 'stockholm',
    nameEn: 'Stockholm',
    nameAr: 'ستوكهولم المكثف',
    tagEn: 'High Density',
    tagAr: 'مساحة مكثفة',
    atsScore: '96%',
    category: 'classic',
    descEn: 'Engineered for senior professionals with extensive career histories.',
    descAr: 'مصمم خصيصاً لأصحاب المسيرات المهنية الطويلة ليحتوي أكبر قدر من البيانات.',
  },
  {
    id: 'minimal',
    nameEn: 'Minimalist Clean',
    nameAr: 'المينيمال البسيط',
    tagEn: 'Zero Clutter',
    tagAr: 'خالٍ من التعقيد',
    atsScore: '99%',
    category: 'ats-top',
    descEn: 'Hyper-minimalist aesthetic focusing entirely on content and achievements.',
    descAr: 'تصميم نقي وبسيط يركز بشكل كامل على قوة الإنجازات والأرقام بدون أي زوائد.',
  },
];

export default function TemplateSelector({
  selectedTemplate,
  onSelect,
  accentColor = '#0F5C4D',
  isRtl = false,
}: Props) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('all');

  const filteredTemplates = TEMPLATES.filter((tpl) => {
    if (activeCategory === 'all') return true;
    return tpl.category === activeCategory;
  });

  const categories = [
    { id: 'all' as const, labelAr: `الكل (${TEMPLATES.length})`, labelEn: `All (${TEMPLATES.length})` },
    { id: 'ats-top' as const, labelAr: 'الأعلى توافقاً مع ATS (98%-100%)', labelEn: 'Top ATS (98%-100%)' },
    { id: 'modern' as const, labelAr: 'عصري وأنيق', labelEn: 'Modern & Creative' },
    { id: 'classic' as const, labelAr: 'كلاسيكي وأكاديمي', labelEn: 'Classic & Academic' },
  ];

  return (
    <div className="w-full space-y-3.5">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-surface-2 text-ink-2 hover:text-ink hover:bg-line/40 border border-line'
              }`}
            >
              {isRtl ? cat.labelAr : cat.labelEn}
            </button>
          );
        })}
      </div>

      {/* Templates Grid: 2 columns on small screens, 3 columns on tablet/desktop */}
      <Stagger
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4"
        itemClassName="h-full"
        direction="up"
      >
        {filteredTemplates.map((tpl) => {
          const isSelected = selectedTemplate === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelect(tpl.id)}
              className={`card-interactive h-full w-full group relative text-start p-3 sm:p-3.5 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-brand bg-brand/5 ring-2 ring-brand shadow-sm'
                  : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2 hover:shadow-xs'
              }`}
            >
              {/* Miniature Document Wireframe */}
              <div className="w-full aspect-[1/1.22] rounded-xl bg-white border border-line-strong/30 p-3 overflow-hidden shadow-xs relative mb-2.5 flex flex-col justify-between group-hover:scale-[1.02] transition-transform">
                {renderMiniWireframe(tpl.id, accentColor)}

                {/* Active check pill */}
                {isSelected && (
                  <div className="absolute top-2 end-2 bg-brand text-white rounded-full p-1 shadow-sm">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {/* ATS score tag */}
                <div className="absolute bottom-2 start-2 bg-slate-900/85 backdrop-blur-xs text-[9px] font-mono font-bold text-white px-2 py-0.5 rounded-md shadow-xs">
                  ATS {tpl.atsScore}
                </div>
              </div>

              {/* Title & Tag */}
              <div className="flex-1 flex flex-col justify-start">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h4 className="text-sm font-bold text-ink leading-snug">
                    {isRtl ? tpl.nameAr : tpl.nameEn}
                  </h4>
                </div>
                <span className="inline-flex self-start items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 mb-1">
                  {isRtl ? tpl.tagAr : tpl.tagEn}
                </span>
                <p className="text-xs text-ink-2 leading-relaxed line-clamp-2 mt-0.5">
                  {isRtl ? tpl.descAr : tpl.descEn}
                </p>
              </div>

              {/* Active Status Footer */}
              <div className="mt-3 pt-2.5 border-t border-line/60 flex items-center justify-between text-xs w-full">
                {isSelected ? (
                  <span className="font-bold text-brand flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{isRtl ? 'القالب المختار' : 'Active Template'}</span>
                  </span>
                ) : (
                  <span className="text-ink-2 group-hover:text-brand font-medium transition-colors">
                    {isRtl ? 'اختيار القالب ←' : 'Select Template →'}
                  </span>
                )}
                <span className="text-[10px] font-mono text-ink-3">
                  {tpl.atsScore}
                </span>
              </div>
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
        <div className="w-full h-full flex gap-1.5">
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
    case 'ats-friendly':
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

    case 'classic':
      return (
        <div className="w-full h-full flex flex-col gap-1 p-0.5">
          <div className="w-3/4 h-2 bg-slate-900 rounded-[1px]" />
          <div className="w-1/2 h-1 bg-slate-500 rounded-[0.5px]" />
          <div className="w-full h-0.5" style={{ backgroundColor: accent }} />
          <div className="flex flex-col gap-1 mt-0.5">
            <div className="w-1/3 h-1.5 font-serif rounded-[0.5px]" style={{ color: accent }} />
            <div className="w-full h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-5/6 h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-1/3 h-1.5 rounded-[0.5px] mt-1" style={{ color: accent }} />
            <div className="w-full h-1 bg-slate-300 rounded-[0.5px]" />
          </div>
        </div>
      );

    case 'modern':
      return (
        <div className="w-full h-full flex flex-col gap-1 p-0.5">
          <div className="flex items-center gap-1.5 pb-1 border-b" style={{ borderColor: accent }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accent }} />
            <div className="flex-1">
              <div className="w-3/4 h-2 bg-slate-900 rounded-[1px]" />
              <div className="w-1/2 h-1 bg-slate-400 rounded-[0.5px] mt-0.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-0.5">
            <div className="w-2/5 h-1.5 rounded-[1px]" style={{ backgroundColor: accent }} />
            <div className="w-full h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-4/5 h-1 bg-slate-300 rounded-[0.5px]" />
            <div className="w-2/5 h-1.5 rounded-[1px] mt-1" style={{ backgroundColor: accent }} />
            <div className="w-full h-1 bg-slate-300 rounded-[0.5px]" />
          </div>
        </div>
      );

    case 'minimal':
      return (
        <div className="w-full h-full flex flex-col items-center gap-1 p-1">
          <div className="w-1/2 h-2 bg-slate-900 rounded-[0.5px]" />
          <div className="w-1/3 h-1 bg-slate-400 rounded-[0.5px]" />
          <div className="w-full flex flex-col gap-1 mt-1 text-center items-center">
            <div className="w-1/4 h-1 bg-slate-700 rounded-[0.5px]" />
            <div className="w-5/6 h-0.5 bg-slate-300" />
            <div className="w-4/6 h-0.5 bg-slate-300" />
            <div className="w-1/4 h-1 bg-slate-700 rounded-[0.5px] mt-1" />
            <div className="w-5/6 h-0.5 bg-slate-300" />
          </div>
        </div>
      );

    case 'compact':
    default:
      return (
        <div className="w-full h-full flex flex-col gap-1 p-0.5">
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
