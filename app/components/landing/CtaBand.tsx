'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Button } from '@/components/ui';
import { ScrollReveal } from './ScrollReveal';

export interface CtaBandProps {
  onScanClick?: (e: React.MouseEvent) => void;
}

export default function CtaBand({ onScanClick }: CtaBandProps) {
  const { t } = useLanguage();

  return (
    <section className="overflow-x-clip py-16 sm:py-20 bg-surface-2 border-t border-line-strong">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
        <ScrollReveal
          direction="up"
          className="rounded-3xl bg-brand text-on-brand p-6 sm:p-12 lg:p-14 shadow-elevated text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-on-brand/15 text-on-brand text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('cta_band_eyebrow')}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-on-brand max-w-2xl mx-auto leading-tight">
            {t('cta_band_title')}
          </h2>

          <p className="text-sm sm:text-base text-on-brand/90 max-w-xl mx-auto leading-relaxed">
            {t('cta_band_desc')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/builder" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                endIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
              >
                {t('cta_band_btn_primary')}
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              onClick={onScanClick}
              className="w-full sm:w-auto border-on-brand/40 text-on-brand hover:bg-on-brand/15"
            >
              {t('cta_band_btn_secondary')}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-mono text-on-brand/85">
            <span>{t('cta_band_trust1')}</span>
            <span>•</span>
            <span>{t('cta_band_trust2')}</span>
            <span>•</span>
            <span>{t('cta_band_trust3')}</span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
