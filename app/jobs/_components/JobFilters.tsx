'use client';

import React from 'react';
import { Globe, Bookmark, Bell, ListFilter } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { SortByOption, JobsViewTab } from './useJobSearch';

interface JobFiltersProps {
  totalDisplayed: number;
  isCachedResult: boolean;
  includeMatch: boolean;
  activeTab: JobsViewTab;
  onChangeActiveTab: (tab: JobsViewTab) => void;
  savedJobsCount: number;
  savedSearchesCount: number;
  filterRemote: boolean;
  onToggleFilterRemote: () => void;
  filterMinScore: number;
  onChangeFilterMinScore: (score: number) => void;
  filterSource: string;
  onChangeFilterSource: (source: string) => void;
  availableSources: string[];
  sortBy: SortByOption;
  onChangeSortBy: (sort: SortByOption) => void;
}

export default function JobFilters({
  totalDisplayed,
  isCachedResult,
  includeMatch,
  activeTab,
  onChangeActiveTab,
  savedJobsCount,
  savedSearchesCount,
  filterRemote,
  onToggleFilterRemote,
  filterMinScore,
  onChangeFilterMinScore,
  filterSource,
  onChangeFilterSource,
  availableSources,
  sortBy,
  onChangeSortBy,
}: JobFiltersProps) {
  const { t } = useLanguage();

  const normalizedSortValue =
    sortBy === 'date' ? 'newest' : sortBy === 'score' ? 'match' : sortBy;

  return (
    <div className="space-y-3 pb-2">
      {/* Top Row: View Tabs + Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line-strong pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeActiveTab('all')}
            className={`h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors ${
              activeTab === 'all'
                ? 'bg-accent text-on-accent border-accent'
                : 'bg-surface text-ink-2 border-line-strong hover:border-accent/40'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>{t('jobs_tab_all')}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-paper/20">
              {totalDisplayed}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeActiveTab('saved_jobs')}
            className={`h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors ${
              activeTab === 'saved_jobs'
                ? 'bg-accent text-on-accent border-accent'
                : 'bg-surface text-ink-2 border-line-strong hover:border-accent/40'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>
              {t('jobs_tab_saved_jobs').replace('{count}', String(savedJobsCount))}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeActiveTab('saved_searches')}
            className={`h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors ${
              activeTab === 'saved_searches'
                ? 'bg-accent text-on-accent border-accent'
                : 'bg-surface text-ink-2 border-line-strong hover:border-accent/40'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>
              {t('jobs_tab_saved_searches').replace(
                '{count}',
                String(savedSearchesCount)
              )}
            </span>
          </button>
        </div>

        {/* Filter and Sort Toolbar */}
        {activeTab === 'all' && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {isCachedResult && (
              <span className="text-[10px] font-mono text-ink-2 px-2 py-0.5 rounded bg-surface border border-line-strong">
                {t('jobs_cached_badge')}
              </span>
            )}

            {/* Remote only filter */}
            <button
              type="button"
              onClick={onToggleFilterRemote}
              className={`h-8 px-2.5 rounded-lg border font-mono transition-colors flex items-center gap-1.5 ${
                filterRemote
                  ? 'bg-accent text-on-accent border-accent'
                  : 'bg-surface border-line-strong text-ink-2 hover:border-accent/40'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>{t('jobs_filter_remote_btn')}</span>
            </button>

            {/* Min Match Filter (shown when CV Match % is enabled) */}
            {includeMatch && (
              <select
                aria-label={t('jobs_filter_min_score_aria')}
                value={filterMinScore}
                onChange={(e) => onChangeFilterMinScore(Number(e.target.value))}
                className="h-8 rounded-lg border border-line-strong bg-surface px-2 text-xs text-ink focus:outline-none font-mono"
              >
                <option value={0}>{t('jobs_filter_score_all')}</option>
                <option value={60}>{t('jobs_filter_score_60')}</option>
                <option value={80}>{t('jobs_filter_score_80')}</option>
              </select>
            )}

            {/* Source Filter */}
            {availableSources.length > 1 && (
              <select
                aria-label={t('jobs_filter_source_aria')}
                value={filterSource}
                onChange={(e) => onChangeFilterSource(e.target.value)}
                className="h-8 rounded-lg border border-line-strong bg-surface px-2 text-xs text-ink focus:outline-none font-mono"
              >
                <option value="all">{t('jobs_filter_source_all')}</option>
                {availableSources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}

            {/* Sort By (Relevance / Newest / Match %) */}
            <select
              aria-label={t('jobs_sort_aria')}
              value={normalizedSortValue}
              onChange={(e) => onChangeSortBy(e.target.value as SortByOption)}
              className="h-8 rounded-lg border border-line-strong bg-surface px-2 text-xs text-ink focus:outline-none font-mono"
            >
              <option value="relevance">{t('jobs_sort_relevance')}</option>
              <option value="newest">{t('jobs_sort_newest')}</option>
              {includeMatch && <option value="match">{t('jobs_sort_match')}</option>}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
