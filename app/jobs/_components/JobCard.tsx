'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building,
  MapPin,
  DollarSign,
  Clock,
  Sparkles,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Job } from '@/lib/jobs/types';
import MatchScoreBadge from './MatchScoreBadge';

interface JobCardProps {
  job: Job;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function JobCardSkeleton() {
  return (
    <div className="rounded-xl border border-line-strong bg-surface p-5 shadow-subtle space-y-3">
      {/* Header Row matching JobCard */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-56 rounded" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded" />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
        </div>
        {/* MatchScoreBadge Skeleton */}
        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-1 shrink-0">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>

      {/* Excerpt Description Skeleton */}
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-full rounded" />
        <Skeleton className="h-3.5 w-4/5 rounded" />
      </div>

      {/* Why It Matches Accordion Box Skeleton */}
      <div className="rounded-lg bg-surface-2 border border-line-strong/60 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-4 w-4 rounded" />
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <Skeleton className="h-3.5 w-40 rounded" />
          <Skeleton className="h-3.5 w-44 rounded" />
        </div>
      </div>

      {/* Card Actions Footer Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-5 w-20 rounded" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function JobCard({ job, isExpanded, onToggleExpand }: JobCardProps) {
  const { t } = useLanguage();
  const score = job.matchScore || 50;

  return (
    <div className="card-interactive rounded-xl border border-line-strong bg-surface p-5 hover:border-accent/40 shadow-subtle space-y-3">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-base sm:text-lg font-bold text-ink">
              {job.title}
            </h3>
            {job.remote && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20 font-semibold">
                {t('jobs_filter_remote_btn')}
              </span>
            )}
            {job.jobType && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 text-ink-2">
                {job.jobType}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
            <span className="font-medium text-ink flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-ink-2" />
              <span>{job.company}</span>
            </span>

            <span className="flex items-center gap-1 text-ink-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>{job.location}</span>
            </span>

            {job.salary && (
              <span className="flex items-center gap-1 text-success font-mono font-medium">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{job.salary}</span>
              </span>
            )}

            {job.postedDate && (
              <span className="flex items-center gap-1 text-ink-2 font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>{job.postedDate}</span>
              </span>
            )}
          </div>
        </div>

        <MatchScoreBadge score={score} />
      </div>

      {/* Excerpt Description */}
      {job.description && (
        <p className="text-xs text-ink-2 line-clamp-2 leading-relaxed">
          {job.description}
        </p>
      )}

      {/* Why It Matches Explanation / Expandable Accordion */}
      <div className="rounded-lg bg-surface-2 border border-line-strong/60 p-3 text-xs space-y-2">
        <button
          type="button"
          onClick={onToggleExpand}
          className="btn w-full flex items-center justify-between text-ink-2 hover:text-ink focus:outline-none cursor-pointer"
        >
          <span className="font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>{t('jobs_why_matches_btn')}</span>
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-ink-2" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-ink-2" />
          )}
        </button>

        {/* Collapsed summary pill list */}
        {!isExpanded && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {(job.matchReasons || []).slice(0, 2).map((reason, idx) => (
              <span
                key={idx}
                className="text-[11px] text-ink-2 font-mono flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                <span>{reason}</span>
              </span>
            ))}
          </div>
        )}

        {/* Expanded detailed breakdown */}
        {isExpanded && (
          <div className="pt-2 border-t border-line-strong/50 space-y-2.5">
            {/* Match reasons */}
            <div className="space-y-1">
              {(job.matchReasons || []).map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-1.5 text-[11px] text-ink-2 font-mono"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>

            {/* Matched skills chips */}
            {job.matchedSkills && job.matchedSkills.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-success">
                  {t('jobs_matched_skills_label')}
                </span>
                <div className="flex flex-wrap gap-1">
                  {job.matchedSkills.map((sk) => (
                    <span
                      key={sk}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-success/10 text-success border border-success/20"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing skills warning chips */}
            {job.missingSkills && job.missingSkills.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-warning flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{t('jobs_missing_skills_label')}</span>
                </span>
                <div className="flex flex-wrap gap-1">
                  {job.missingSkills.map((sk) => (
                    <span
                      key={sk}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-ink-2">
            {t('jobs_source_label')}
          </span>
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-2 text-ink border border-line-strong">
            {job.source}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Direct link to tailor a cover letter */}
          <Link
            href={`/cover-letter?targetRole=${encodeURIComponent(
              job.title
            )}&company=${encodeURIComponent(job.company)}`}
          >
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-line-strong"
              leftIcon={<Mail className="w-3.5 h-3.5" />}
            >
              <span>{t('jobs_tailor_cover_btn')}</span>
            </Button>
          </Link>

          {/* View on source external link */}
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button
              size="sm"
              variant="primary"
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              <span>
                {t('jobs_view_on_source').replace('{source}', job.source)}
              </span>
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
