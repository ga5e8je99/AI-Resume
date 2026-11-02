'use client';

import React, { useEffect, useRef } from 'react';
import { Bell, Trash2, Search, Bookmark } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import {
  Job,
  JobProviderAttribution,
  SavedJobItem,
  SavedJobSearch,
} from '@/lib/jobs/types';
import { Stagger } from '@/components/motion/Reveal';
import JobCard, { JobCardSkeleton } from './JobCard';
import EmptyState from './EmptyState';
import { JobsViewTab } from './useJobSearch';

interface JobResultsListProps {
  isSearching: boolean;
  isLoadingMore: boolean;
  displayJobs: Job[];
  totalFound: number;
  hasMore: boolean;
  onLoadMore: () => void;
  expandedJobId: string | null;
  onToggleExpandJob: (jobId: string) => void;
  onCancelSearch: () => void;
  allProvidersFailed: boolean;
  errorMessage: string | null;
  onRetrySearch: () => void;
  onResetFilters: () => void;
  attributions: JobProviderAttribution[];
  activeTab: JobsViewTab;
  savedJobs: SavedJobItem[];
  savedJobIds: Set<string>;
  onToggleSaveJob: (job: Job) => void;
  savedSearches: SavedJobSearch[];
  onApplySavedSearch: (s: SavedJobSearch) => void;
  onDeleteSavedSearch: (id: string) => void;
  onOpenDrawer: (job: Job) => void;
  onApplyClick: (job: Job) => void;
}

export default function JobResultsList({
  isSearching,
  isLoadingMore,
  displayJobs,
  totalFound,
  hasMore,
  onLoadMore,
  expandedJobId,
  onToggleExpandJob,
  onCancelSearch,
  allProvidersFailed,
  errorMessage,
  onRetrySearch,
  onResetFilters,
  attributions,
  activeTab,
  savedJobs,
  savedJobIds,
  onToggleSaveJob,
  savedSearches,
  onApplySavedSearch,
  onDeleteSavedSearch,
  onOpenDrawer,
  onApplyClick,
}: JobResultsListProps) {
  const { t } = useLanguage();
  const isErrorState = allProvidersFailed || Boolean(errorMessage);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Infinite scroll via IntersectionObserver when hasMore is true
  useEffect(() => {
    if (activeTab !== 'all' || !hasMore || isSearching || isLoadingMore) return;
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '240px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeTab, hasMore, isSearching, isLoadingMore, onLoadMore]);

  // 1. Saved Jobs Tab
  if (activeTab === 'saved_jobs') {
    if (savedJobs.length === 0) {
      return (
        <div className="rounded-xl border border-line-strong bg-surface p-10 text-center space-y-3">
          <div className="w-11 h-11 rounded-full bg-surface-2 border border-line-strong text-accent mx-auto flex items-center justify-center">
            <Bookmark className="w-5 h-5" />
          </div>
          <p className="text-xs sm:text-sm text-ink-2 max-w-md mx-auto">
            {t('jobs_no_saved_jobs')}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {savedJobs.map((item) => (
          <JobCard
            key={item.id}
            job={item.job}
            isExpanded={expandedJobId === item.job.id}
            onToggleExpand={() => onToggleExpandJob(item.job.id)}
            isSaved={true}
            onToggleSave={onToggleSaveJob}
            onOpenDrawer={onOpenDrawer}
            onApplyClick={onApplyClick}
          />
        ))}
      </div>
    );
  }

  // 2. Saved Searches & Email Alerts Tab
  if (activeTab === 'saved_searches') {
    if (savedSearches.length === 0) {
      return (
        <div className="rounded-xl border border-line-strong bg-surface p-10 text-center space-y-3">
          <div className="w-11 h-11 rounded-full bg-surface-2 border border-line-strong text-accent mx-auto flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <p className="text-xs sm:text-sm text-ink-2 max-w-md mx-auto">
            {t('jobs_no_saved_searches')}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {savedSearches.map((s) => (
          <div
            key={s.id}
            className="rounded-xl border border-line-strong bg-surface p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-serif font-bold text-ink">{s.name}</h3>
                {s.alertEnabled && s.alertFrequency !== 'none' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/30 font-semibold flex items-center gap-1">
                    <Bell className="w-2.5 h-2.5" />
                    <span>
                      {s.alertFrequency === 'daily'
                        ? t('jobs_alert_daily')
                        : t('jobs_alert_weekly')}
                    </span>
                  </span>
                )}
                {s.remote && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 text-ink-2">
                    {t('jobs_filter_remote_btn')}
                  </span>
                )}
              </div>

              <div className="text-xs text-ink-2 font-mono flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>&ldquo;{s.query}&rdquo;</span>
                {s.location && <span>· {s.location}</span>}
                {s.employmentType && s.employmentType !== 'any' && (
                  <span>· {s.employmentType}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="primary"
                onClick={() => onApplySavedSearch(s)}
                leftIcon={<Search className="w-3.5 h-3.5" />}
              >
                <span>{t('jobs_run_saved_search_btn')}</span>
              </Button>

              <button
                type="button"
                onClick={() => onDeleteSavedSearch(s.id)}
                aria-label={t('jobs_delete_saved_search_aria')}
                className="h-8 w-8 rounded-lg border border-line-strong bg-paper text-ink-2 hover:text-warning hover:border-warning flex items-center justify-center transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 3. Main Results Tab ('all')
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

      {/* Job Cards List with 80ms Stagger (max 400ms) */}
      {!isSearching && displayJobs.length > 0 && (
        <>
          <Stagger className="space-y-3" from="up">
            {displayJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isExpanded={expandedJobId === job.id}
                onToggleExpand={() => onToggleExpandJob(job.id)}
                isSaved={savedJobIds.has(job.id)}
                onToggleSave={onToggleSaveJob}
                onOpenDrawer={onOpenDrawer}
                onApplyClick={onApplyClick}
              />
            ))}
          </Stagger>

          {/* Cursor Pagination & Infinite Scroll Sentinel */}
          <div
            ref={sentinelRef}
            className="pt-4 flex flex-col items-center justify-center gap-2 text-center"
          >
            <span className="text-xs font-mono text-ink-2">
              {t('jobs_showing_count')
                .replace('{shown}', String(displayJobs.length))
                .replace(
                  '{total}',
                  String(Math.max(displayJobs.length, totalFound))
                )}
            </span>

            {hasMore ? (
              <Button
                size="md"
                variant="outline"
                onClick={onLoadMore}
                loading={isLoadingMore}
                loadingText={t('common_loading')}
                className="border-line-strong bg-surface"
              >
                <span>{t('jobs_load_more_btn')}</span>
              </Button>
            ) : (
              <span className="text-[11px] font-mono text-ink-2">
                {t('jobs_all_loaded')}
              </span>
            )}
          </div>
        </>
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
