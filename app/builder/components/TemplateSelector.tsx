import React from 'react';
import { TemplateId } from '../types';
import { FileText, Layout, Award, AlignLeft, Sparkles, BookOpen } from 'lucide-react';

interface Props {
  selectedTemplate: TemplateId;
  onSelect: (t: TemplateId) => void;
}

export default function TemplateSelector({ selectedTemplate, onSelect }: Props) {
  const templates: {
    id: TemplateId;
    name: string;
    source: string;
    tag: string;
    icon: React.ReactNode;
    desc: string;
  }[] = [
    {
      id: 'compact',
      name: 'Compact',
      source: 'ResumeForFree #1',
      tag: 'ATS Friendly',
      icon: <AlignLeft className="w-4 h-4" />,
      desc: 'Single column ATS friendly template with clean typography and inline dates.',
    },
    {
      id: 'two-column',
      name: 'Two Column',
      source: 'ResumeForFree #2',
      tag: 'Side by Side',
      icon: <Layout className="w-4 h-4" />,
      desc: 'A two-column resume layout with sections side by side.',
    },
    {
      id: 'ats-friendly',
      name: 'ATS Friendly',
      source: 'ResumeForFree #3',
      tag: 'Blue Accent',
      icon: <Award className="w-4 h-4" />,
      desc: 'Single-column template with blue accents, optimized for applicant tracking systems.',
    },
    {
      id: 'simple',
      name: 'Simple',
      source: 'ResumeForFree #4',
      tag: 'Academic CV',
      icon: <BookOpen className="w-4 h-4" />,
      desc: 'Traditional academic CV layout with labeled columns and horizontal rules.',
    },
    {
      id: 'oslo',
      name: 'Oslo ATS',
      source: 'Resume.io ATS #1',
      tag: 'Max Parse Rate',
      icon: <FileText className="w-4 h-4" />,
      desc: 'Pure typography, zero graphics or icons. Passes Taleo & Workday with 100% accuracy.',
    },
    {
      id: 'amsterdam',
      name: 'Amsterdam',
      source: 'Resume.io ATS #2',
      tag: 'Modern + Photo',
      icon: <Layout className="w-4 h-4" />,
      desc: 'Sleek single-column with optional photo, soft accent divider, and clean text contact.',
    },
    {
      id: 'stockholm',
      name: 'Stockholm',
      source: 'Resume.io ATS #3',
      tag: 'High Density',
      icon: <FileText className="w-4 h-4" />,
      desc: 'Compact layout built to fit maximum career experience cleanly onto 1-2 pages.',
    },
    {
      id: 'london',
      name: 'London',
      source: 'Resume.io ATS #4',
      tag: 'Executive Serif',
      icon: <Sparkles className="w-4 h-4" />,
      desc: 'Generous whitespace with refined executive serif typography and optional photo.',
    },
  ];

  return (
    <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 overflow-x-auto pb-2 sm:pb-0 snap-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {templates.map((tpl) => {
        const isSelected = selectedTemplate === tpl.id;
        return (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onSelect(tpl.id)}
            className={`text-left p-2.5 sm:p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between min-w-[150px] sm:min-w-0 snap-start shrink-0 sm:shrink ${
              isSelected
                ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/15 ring-2 ring-cyan-500/30'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`p-1.5 rounded-lg ${
                    isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tpl.icon}
                </span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {tpl.tag}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white mb-0.5">{tpl.name}</h4>
              <span className="text-[10px] text-cyan-400/90 font-medium block mb-1">
                {tpl.source}
              </span>
              <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">{tpl.desc}</p>
            </div>
            {isSelected && (
              <span className="text-[10px] font-semibold text-cyan-400 mt-2 flex items-center gap-1">
                ✓ Active
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
