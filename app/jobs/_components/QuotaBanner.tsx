'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Zap, Briefcase, AlertCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { JOB_MATCH_FREE_QUOTA } from '@/lib/plans';

interface QuotaBannerProps {
  isProUser: boolean;
  freeQuotaUsed: number;
  isQuotaExhausted: boolean;
}

export default function QuotaBanner({
  isProUser,
  freeQuotaUsed,
  isQuotaExhausted,
}: QuotaBannerProps) {
  const { t } = useLanguage();

  const usedCount = Math.min(JOB_MATCH_FREE_QUOTA, freeQuotaUsed);
  const remainingCount = Math.max(0, JOB_MATCH_FREE_QUOTA - freeQuotaUsed);

  return (
    <>
      {/* Top Header & Quota Status Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-line-strong">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-surface-2 text-accent border border-line-strong">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('jobs_badge')}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-ink tracking-tight">
            {t('jobs_title')}
          </h1>
          <p className="text-xs sm:text-sm text-ink-2 max-w-2xl leading-relaxed">
            {t('jobs_subtitle')}
          </p>
        </div>

        {/* Quota Badge */}
        <div className="flex items-center gap-3 shrink-0">
          {isProUser ? (
            <div className="px-3.5 py-2 rounded-lg bg-success/10 border border-success/25 flex items-center gap-2">
              <Zap className="w-4 h-4 text-success" />
              <div>
                <span className="text-xs font-mono font-bold text-success block leading-tight">
                  {t('jobs_pro_unlimited_badge')}
                </span>
                <span className="text-[10px] text-ink-2">
                  {t('jobs_pro_unlimited_sub')}
                </span>
              </div>
            </div>
          ) : (
            <div className="px-3.5 py-2 rounded-lg bg-surface border border-line-strong flex items-center gap-2.5">
              <Briefcase className="w-4 h-4 text-accent" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-ink">
                    {t('jobs_free_used_label')
                      .replace('{used}', String(usedCount))
                      .replace('{total}', String(JOB_MATCH_FREE_QUOTA))}
                  </span>
                  {freeQuotaUsed >= JOB_MATCH_FREE_QUOTA && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20 font-semibold">
                      {t('jobs_payg_badge')}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-ink-2 block">
                  {freeQuotaUsed < JOB_MATCH_FREE_QUOTA
                    ? t('jobs_free_remaining_label').replace('{count}', String(remainingCount))
                    : t('jobs_one_credit_per_search')}
                </span>
              </div>
            </div>
          )}

          <Link href="/pricing">
            <Button
              size="sm"
              variant="outline"
              className="border-line-strong hover:bg-surface-2 text-xs"
            >
              {t('jobs_view_plans')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Quota Exhausted Paywall Banner */}
      {isQuotaExhausted && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-ink">
                {t('jobs_quota_exhausted_title').replace(
                  '{total}',
                  String(JOB_MATCH_FREE_QUOTA)
                )}
              </h3>
              <p className="text-xs text-ink-2 mt-0.5">
                {t('jobs_quota_exhausted_desc')}
              </p>
            </div>
          </div>
          <Link href="/pricing" className="shrink-0">
            <Button size="sm" variant="primary">
              <span>{t('jobs_upgrade_pro_btn')}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}

