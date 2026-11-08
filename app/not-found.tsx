'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from './context/LanguageContext';
import { Home, LayoutDashboard, ArrowRight, Sparkles } from 'lucide-react';

export default function NotFound() {
  const { t, isRtl } = useLanguage();

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-[100dvh] bg-paper text-ink flex flex-col justify-center items-center px-4 py-12 relative selection:bg-accent-soft selection:text-ink"
    >
      <main id="main-content" className="w-full max-w-lg relative z-10 text-center">
        {/* 404 Card */}
        <div className="bg-surface border border-line-strong rounded-[10px] p-8 sm:p-10 shadow-subtle text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-accent-soft text-accent text-xs font-mono font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('not_found_badge')}</span>
          </div>

          {/* 404 Number */}
          <div className="mb-6 flex items-center justify-center">
            <div className="text-7xl sm:text-8xl font-serif font-bold text-accent select-none tracking-tight">
              404
            </div>
          </div>

          {/* Heading & Subtitle */}
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-ink tracking-tight mb-2.5">
            {t('not_found_title')}
          </h1>
          <p className="text-base text-ink-2 font-medium mb-3">
            {t('not_found_subtitle')}
          </p>
          <p className="text-xs sm:text-sm text-ink-3 leading-relaxed max-w-md mx-auto mb-8">
            {t('not_found_desc')}
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent font-medium text-sm transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>{t('not_found_go_home')}</span>
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-[6px] border border-line-strong bg-surface hover:bg-surface-2 text-ink font-medium text-sm transition-colors cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-accent" />
              <span>{t('not_found_go_dashboard')}</span>
              <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
