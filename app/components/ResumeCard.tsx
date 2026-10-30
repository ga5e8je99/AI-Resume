'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ScoreCircle from './ScoreCircle';
import { Resume } from '../contents/index';
import { useLanguage } from '../context/LanguageContext';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ResumeCard({ resume }: { resume: Resume }) {
  const { t, isRtl } = useLanguage();

  // Retrieve localized content based on templateId
  let badge = resume.badge;
  let title = resume.companyName;
  let jobTitle = resume.jobTitle;
  let summary = resume.summary;

  if (resume.templateId === 'compact') {
    badge = t('template_1_badge', resume.badge);
    title = t('template_1_title', resume.companyName);
    jobTitle = t('template_1_job', resume.jobTitle);
    summary = t('template_1_summary', resume.summary);
  } else if (resume.templateId === 'two-column') {
    badge = t('template_2_badge', resume.badge);
    title = t('template_2_title', resume.companyName);
    jobTitle = t('template_2_job', resume.jobTitle);
    summary = t('template_2_summary', resume.summary);
  } else if (resume.templateId === 'executive-blue' || resume.templateId === 'ats-friendly') {
    badge = t('template_3_badge', resume.badge);
    title = t('template_3_title', resume.companyName);
    jobTitle = t('template_3_job', resume.jobTitle);
    summary = t('template_3_summary', resume.summary);
  }

  return (
    <div className="group border border-line rounded-[10px] shadow-subtle hover:border-line-strong card-hover overflow-hidden bg-surface flex flex-col justify-between text-start">
      {/* Header Info */}
      <div className="p-5 pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-accent-soft text-accent border border-accent/20 mb-2">
              <CheckCircle2 className="w-3 h-3 text-accent" />
              <span>{badge}</span>
            </span>

            <h3 className="text-base sm:text-lg font-serif font-semibold text-ink truncate">
              {title}
            </h3>

            <p className="text-xs text-ink-2 truncate mt-0.5">
              {jobTitle}
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-center">
            <ScoreCircle score={resume.feedback.overallScore} />
            <span className="text-[10px] font-mono font-semibold text-ink-3 mt-1 uppercase tracking-wider">
              {t('template_card_score')}
            </span>
          </div>
        </div>

        <p className="text-xs text-ink-3 line-clamp-2 mt-3 leading-relaxed">
          {summary}
        </p>
      </div>

      {/* Divider */}
      <div className="px-5">
        <div className="border-t border-line" />
      </div>

      {/* Image Preview & Interactive CTA */}
      <div className="p-4 bg-surface-2">
        <Link
          href={`/builder?template=${resume.templateId}`}
          className="block relative rounded-[6px] overflow-hidden border border-line group-hover:border-line-strong transition-all focus-visible:outline-2 outline-offset-2 outline-[var(--focus)]"
          aria-label={`${t('template_card_use')} ${title}`}
        >
          <div className="relative w-full h-[220px] bg-paper">
            <Image
              src={resume.imagePath}
              alt={`${title} Preview`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </Link>

        {/* Action Button Row */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <Link
            href={`/review?sample=${resume.templateId}`}
            aria-label={`${t('template_card_inspect')}: ${title}`}
            className="text-xs text-ink-2 hover:text-ink hover:underline transition-colors py-1.5 px-2 rounded-[4px] font-medium focus-visible:outline-2 outline-offset-2 outline-[var(--focus)]"
          >
            {t('template_card_inspect')}
          </Link>

          <Link
            href={`/builder?template=${resume.templateId}`}
            className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-on-accent text-xs font-medium py-1.5 px-3.5 rounded-[6px] transition-colors focus-visible:outline-2 outline-offset-2 outline-[var(--focus)]"
          >
            <span>{t('template_card_use')}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
          </Link>
        </div>
      </div>
    </div>
  );
}
