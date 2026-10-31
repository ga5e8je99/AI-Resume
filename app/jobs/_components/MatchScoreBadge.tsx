'use client';

import React from 'react';
import { useLanguage } from '@/app/context/LanguageContext';

interface MatchScoreBadgeProps {
  score: number;
}

export default function MatchScoreBadge({ score }: MatchScoreBadgeProps) {
  const { t } = useLanguage();

  const getBadgeConfig = (val: number) => {
    if (val >= 80) {
      return {
        classes: 'bg-success/10 text-success border-success/20',
        label: t('jobs_match_strong'),
      };
    }
    if (val >= 60) {
      return {
        classes: 'bg-warning/10 text-warning border-warning/20',
        label: t('jobs_match_good'),
      };
    }
    return {
      classes: 'bg-surface-2 text-ink-2 border-line-strong',
      label: t('jobs_match_partial'),
    };
  };

  const badge = getBadgeConfig(score);

  return (
    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-1 shrink-0">
      <div
        className={`px-2.5 py-1 rounded-lg border font-mono flex items-baseline gap-1 ${badge.classes}`}
      >
        <span className="text-xl sm:text-2xl font-bold tracking-tight">{score}%</span>
        <span className="text-[10px] uppercase font-bold">{t('jobs_match_label')}</span>
      </div>
      <span className="text-[10px] font-mono text-ink-2">{badge.label}</span>
    </div>
  );
}

