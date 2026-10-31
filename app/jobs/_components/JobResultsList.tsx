'use client';

import React from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Job, JobProviderAttribution } from '@/lib/jobs/types';
import { Stagger } from '@/app/components/landing/ScrollReveal';
import JobCard, { JobCardSkeleton } from './JobCard';
import EmptyState from './EmptyState';

interface JobResultsListProps {
  isSearching: boolean;
  displayJobs: Job[];
  expandedJobId: string | null;
  onToggleExpandJob: (jobId: string) => void;
  onCancelSearch: () => void;
  allProvidersFailed: boolean;
  errorMessage: string | null;
  onRetrySearch: () => void;
  onResetFilters: () => void;
  attributions: JobProviderAttribution[];
}

export default function JobResultsList({
  isSearching,
  displayJobs,
  expandedJobId,
  onToggleExpandJob,
  onCancelSearch,
  allProvidersFailed,
  errorMessage,
  onRetrySearch,
  onResetFilters,
  attributions,
}: JobResultsListProps) {
  const { t } = useLanguage();
  const isErrorState = allProvidersFailed || Boolean(errorMessage);

  return (
    <>
      {/* Loading Skeletons matching JobCard shape */}
      {isSearching && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-line-strong bg-surface flex items-center justify-between gap-4 shadow-subtle animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-xs text-ink-2 font-medium">
                {t('jobs_searching_status')}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancelSearch}
              className="text-xs text-ink-2 hover:text-warning hover:border-warning shrink-0"
            >
              {t('loading_cancel')}
            </Button>
          </div>

          {[1, 2, 3].map((i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error State vs Empty Results State */}
      {!isSearching && displayJobs.length === 0 && (
        <EmptyState
          variant={isErrorState ? 'error' : 'empty'}
          errorMessage={errorMessage}
          onRetry={onRetrySearch}
          onResetFilters={onResetFilters}
        />
      )}

      {/* Job Cards List with 60ms Stagger */}
      {!isSearching && displayJobs.length > 0 && (
        <Stagger className="space-y-3" direction="up">
          {displayJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isExpanded={expandedJobId === job.id}
              onToggleExpand={() => onToggleExpandJob(job.id)}
            />
          ))}
        </Stagger>
      )}

      {/* Official Provider Attribution Strip */}
      {attributions.length > 0 && (
        <div className="rounded-xl border border-line-strong bg-surface-2 p-4 text-center space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-2 block">
            {t('jobs_attributions_title')}
          </span>
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs text-ink-2">
            {attributions.map((attr, idx) => (
              <a
                key={idx}
                href={attr.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent underline underline-offset-4 font-mono text-[11px] transition-colors"
              >
                {attr.text}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
