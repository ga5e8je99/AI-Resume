'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Button } from '@/components/ui';
import ScrollReveal from './ScrollReveal';

interface CtaBandProps {
  onScanClick: (e: React.MouseEvent) => void;
}

export default function CtaBand({ onScanClick }: CtaBandProps) {
  const { t } = useLanguage();

  return (
    <section className="py-16 sm:py-24 max-w-[1200px] mx-auto px-4 sm:px-6">
      <ScrollReveal>
        <div className="relative rounded-2xl bg-brand text-on-brand p-8 sm:p-14 lg:p-16 overflow-hidden shadow-elevated text-center">
          {/* Subtle Ambient Radial Amber Lighting */}
          <div
            className="absolute -top-24 start-1/2 -translate-x-1/2 w-[520px] h-[320px] bg-highlight/20 rounded-full blur-[90px] pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-on-brand text-xs font-mono shadow-subtle">
              <Sparkles className="w-3.5 h-3.5 text-highlight" />
              <span>{t('cta_band_eyebrow')}</span>
            </div>

            {/* Headline */}
            <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              {t('cta_band_title')}
            </h2>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-white/85 leading-relaxed max-w-xl mx-auto">
              {t('cta_band_desc')}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
              {/* White / Amber Button */}
              <Link href="/builder">
                <Button
                  size="lg"
                  className="!bg-white !text-stone-900 hover:!bg-amber-50 hover:!text-brand !border !border-amber-300/40 shadow-elevated font-semibold hover:shadow-[0_4px_24px_rgba(200,137,43,0.35)] transition-all"
                  rightIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180 text-highlight" />}
                >
                  {t('cta_band_btn_primary')}
                </Button>
              </Link>

              {/* Ghost / Outline Scan CTA */}
              <Button
                variant="outline"
                size="lg"
                onClick={onScanClick}
                className="!border-white/30 !text-white hover:!bg-white/10 hover:!border-white/50 transition-all"
                leftIcon={<FileText className="w-4 h-4 text-white/80" />}
              >
                {t('cta_band_btn_secondary')}
              </Button>
            </div>

            {/* Trust Line */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-white/75">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-highlight" />
                {t('cta_band_trust1')}
              </span>
              <span>•</span>
              <span>{t('cta_band_trust2')}</span>
              <span>•</span>
              <span>{t('cta_band_trust3')}</span>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
