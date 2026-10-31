'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Button } from '@/components/ui/Button';

interface ProviderStatusBannerProps {
  visible: boolean;
  onRetry: () => void;
  isSearching?: boolean;
}

export default function ProviderStatusBanner({
  visible,
  onRetry,
  isSearching = false,
}: ProviderStatusBannerProps) {
  const { t } = useLanguage();

  if (!visible || isSearching) {
    return null;
  }

  return (
    <div className="rounded-xl border border-warning/30 bg-warning/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-ink">
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-warning shrink-0" />
        <span>{t('jobs_partial_providers_failed')}</span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onRetry}
        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        className="shrink-0 text-xs"
      >
        <span>{t('jobs_retry_btn')}</span>
      </Button>
    </div>
  );
}

