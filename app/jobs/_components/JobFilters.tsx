'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { SortByOption } from './useJobSearch';

interface JobFiltersProps {
  totalDisplayed: number;
  isCachedResult: boolean;
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

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div className="flex items-center gap-2.5">
        <h2 className="text-xl font-serif font-bold text-ink">
          {t('jobs_open_positions_title')}
        </h2>
        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-accent border border-line-strong">
          {t('jobs_found_count').replace('{count}', String(totalDisplayed))}
        </span>
        {isCachedResult && (
          <span className="text-[10px] font-mono text-ink-2 px-2 py-0.5 rounded bg-surface border border-line-strong">
            {t('jobs_cached_badge')}
          </span>
        )}
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
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

        {/* Min Match Filter */}
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

        {/* Sort By */}
        <select
          aria-label={t('jobs_sort_aria')}
          value={sortBy}
          onChange={(e) => onChangeSortBy(e.target.value as SortByOption)}
          className="h-8 rounded-lg border border-line-strong bg-surface px-2 text-xs text-ink focus:outline-none font-mono"
        >
          <option value="score">{t('jobs_sort_score')}</option>
          <option value="date">{t('jobs_sort_date')}</option>
        </select>
      </div>
    </div>
  );
}

