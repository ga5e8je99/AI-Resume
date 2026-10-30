'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FolderArchive } from 'lucide-react';

interface CoverLetterHeroProps {
  onOpenDrafts?: () => void;
  draftsCount?: number;
  language?: string;
}

export function CoverLetterHero({
  onOpenDrafts,
  draftsCount = 0,
  language = 'ar',
}: CoverLetterHeroProps) {
  const isAr = language === 'ar';

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-line pb-8">
      <div className="space-y-3 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-accent-soft text-accent text-xs font-medium">
          <span>{isAr ? 'خطاب تقديم مدعوم بالذكاء الاصطناعي' : 'Tailored Cover Letter'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-ink tracking-tight">
          {isAr
            ? 'خطاب تقديم مخصص يبرز قيمتك المهنية.'
            : 'A cover letter that speaks directly to the role.'}
        </h1>
        <p className="text-sm sm:text-base text-ink-2 leading-relaxed">
          {isAr
            ? 'صياغة مباشرة ومتطابقة مع اشتراطات الوظيفة وسيرتك الذاتية، مع استخراج الكلمات المفتاحية وضبط النبرة وتصدير PDF دقيق.'
            : 'Aligned to the job requirements and your resume. Keyword matched, tone adjusted, and export-ready.'}
        </p>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {onOpenDrafts && (
          <button
            type="button"
            onClick={onOpenDrafts}
            className="px-3.5 py-2 rounded-[6px] bg-surface border border-line hover:border-line-strong text-xs font-medium text-ink hover:text-ink transition-colors flex items-center gap-2 cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-accent"
          >
            <FolderArchive className="w-4 h-4 text-ink-2" />
            <span>{isAr ? 'المسودات المحفوظة' : 'Saved drafts'}</span>
            {draftsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-[4px] bg-surface-2 text-ink-2 text-[11px] font-mono border border-line">
                {draftsCount}
              </span>
            )}
          </button>
        )}

        <Link
          href="/builder"
          className="px-3.5 py-2 rounded-[6px] bg-accent hover:bg-accent-hover text-xs font-medium text-white transition-colors flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span>{isAr ? 'منشئ السيرة الذاتية' : 'Resume builder'}</span>
          <ArrowLeft className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} />
        </Link>
      </div>
    </div>
  );
}
