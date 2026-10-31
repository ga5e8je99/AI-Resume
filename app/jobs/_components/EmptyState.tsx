'use client';

import React from 'react';
import { AlertCircle, Briefcase, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  variant: 'empty' | 'error';
  errorMessage?: string | null;
  onRetry: () => void;
  onResetFilters: () => void;
}

export default function EmptyState({
  variant,
  errorMessage,
  onRetry,
  onResetFilters,
}: EmptyStateProps) {
  const { t } = useLanguage();

  if (variant === 'error') {
    return (
      <div className="rounded-xl border border-warning/30 bg-surface p-10 sm:p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-warning/10 border border-warning/30 text-warning mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-base font-serif font-semibold text-ink">
            {t('jobs_all_providers_failed_title')}
          </h3>
          <p className="text-xs text-ink-2">
            {errorMessage || t('jobs_all_providers_failed_desc')}
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          <span>{t('jobs_retry_btn')}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line-strong bg-surface p-12 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-surface-2 border border-line-strong text-accent mx-auto flex items-center justify-center">
        <Briefcase className="w-6 h-6" />
      </div>
      <div className="space-y-1 max-w-md mx-auto">
        <h3 className="text-base font-serif font-semibold text-ink">
          {t('jobs_empty_state_title')}
        </h3>
        <p className="text-xs text-ink-2">{t('jobs_empty_state_desc')}</p>
      </div>
      <Button size="sm" variant="outline" onClick={onResetFilters}>
        <span>{t('jobs_reset_filters_btn')}</span>
      </Button>
    </div>
  );
}

