'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, FileText, ArrowRight, FolderArchive } from 'lucide-react';

interface CoverLetterHeroProps {
  onOpenDrafts?: () => void;
  draftsCount?: number;
}

export function CoverLetterHero({ onOpenDrafts, draftsCount = 0 }: CoverLetterHeroProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
      <div className="space-y-1.5 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>مولد خطابات التقديم بالذكاء الاصطناعي (AI Cover Letter)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          أنشئ خطاب تقديم مخصص يبهر مسؤولي التوظيف
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          صياغة فورية بنسبة 100% متطابقة مع متطلبات الوظيفة وسيرتك الذاتية، مع استخراج الكلمات المفتاحية واختيار النبرة المناسبة وتصدير PDF بنقرة زر.
        </p>
      </div>

      {/* Quick Action Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {onOpenDrafts && (
          <button
            type="button"
            onClick={onOpenDrafts}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-amber-500/40 text-xs text-slate-200 hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
            <span>المسودات المحفوظة</span>
            {draftsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                {draftsCount}
              </span>
            )}
          </button>
        )}

        <Link
          href="/dashboard"
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>لوحة التحكم</span>
        </Link>

        <Link
          href="/builder"
          className="px-3.5 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-xs text-cyan-300 font-semibold hover:bg-cyan-500/25 transition-all flex items-center gap-1.5"
        >
          <span>منشئ السير الذاتية</span>
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        </Link>
      </div>
    </div>
  );
}
