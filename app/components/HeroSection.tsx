'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap, Check, CheckCircle2, FileText } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '@/app/context/LanguageContext';
import { Button } from '@/components/ui';

interface HeroSectionProps {
  onScanClick: (e: React.MouseEvent) => void;
  onDemoClick: () => void;
  isDemoLoading: boolean;
}

export default function HeroSection({
  onScanClick,
  onDemoClick,
  isDemoLoading,
}: HeroSectionProps) {
  const { language, t } = useLanguage();
  const isAr = language === 'ar';

  const [mounted, setMounted] = useState(false);
  const [score, setScore] = useState(0);

  // Score circular progress constants
  const radius = 17;
  const circumference = 2 * Math.PI * radius; // ~106.81
  const strokeOffset = circumference - (score / 100) * circumference;

  useEffect(() => {
    // Check user preference for reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setMounted(true);
      setScore(94);
      return;
    }

    // Trigger entrance animation
    setMounted(true);

    // Animate score from 0 to 94 over 900ms with easeOutCubic
    const target = 94;
    const duration = 900;
    const startTime = performance.now();

    const animateScore = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setScore(Math.round(easeOut * target));

      if (progress < 1) {
        requestAnimationFrame(animateScore);
      }
    };

    const rafId = requestAnimationFrame(animateScore);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const keywords = ['TypeScript', 'Kubernetes', 'PostgreSQL', 'Microservices', 'AWS CI/CD'];

  return (
    <section className="relative overflow-hidden pt-10 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 lg:pb-28">
      {/* 1. Subtle Editorial Grid Background (CSS only, ultra-low opacity) */}
      <div
        className="absolute inset-0 pointer-events-none -z-20 opacity-[0.035] dark:opacity-[0.045]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--ink) 1px, transparent 1px), linear-gradient(to bottom, var(--ink) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage:
            'radial-gradient(ellipse 70% 60% at 50% 40%, #000 60%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 60% at 50% 40%, #000 60%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* 2. Soft Ambient Jade/Pine Aura behind the preview card */}
      <div
        className="absolute top-1/2 end-[-8%] sm:end-[2%] lg:end-[6%] -translate-y-1/2 w-[340px] sm:w-[480px] lg:w-[580px] h-[340px] sm:h-[480px] lg:h-[580px] rounded-full bg-brand-soft/70 dark:bg-brand/10 blur-[80px] sm:blur-[110px] pointer-events-none -z-10 transition-colors"
        aria-hidden="true"
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-14 items-center">
          {/* ========================================================================= */}
          {/* Left Column: Headline, Copy, Action CTAs, Trust Ticks                      */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 xl:col-span-6 text-start space-y-6">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-border bg-surface/90 backdrop-blur-sm text-text-secondary text-xs sm:text-[13px] font-mono shadow-subtle">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
              </span>
              <span>{t('hero_eyebrow')}</span>
            </div>

            {/* Headline with amber hand-drawn underline SVG */}
            <h1
              className={clsx(
                'text-text-primary tracking-tight font-semibold',
                isAr
                  ? 'font-sans text-[clamp(2.15rem,4.5vw,3.65rem)] leading-[1.25]'
                  : 'font-serif text-[clamp(2.45rem,5vw,4.15rem)] leading-[1.1]'
              )}
            >
              {t('hero_headline_part1')}{' '}
              <span className="relative inline-block whitespace-nowrap text-brand">
                <span>{t('hero_headline_highlight')}</span>
                <svg
                  className="absolute -bottom-1.5 sm:-bottom-2 start-0 w-full h-3 sm:h-3.5 text-highlight pointer-events-none overflow-visible"
                  viewBox="0 0 240 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2.5 10C48 3.5 145 2 237.5 5.5C170 9.5 75 11.5 12 11.5"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>{' '}
              {t('hero_headline_part2')}
            </h1>

            {/* Subheadline (Body Large, ink-2, max 56ch) */}
            <p className="text-base sm:text-lg lg:text-[1.125rem] text-text-secondary leading-relaxed max-w-[56ch]">
              {t('hero_subheadline')}
            </p>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={onScanClick}
                rightIcon={
                  <ArrowRight className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                }
                className="shadow-card hover:shadow-glow transition-all"
              >
                {t('hero_scan_cta')}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                isLoading={isDemoLoading}
                onClick={onDemoClick}
                leftIcon={<Zap className="w-4 h-4 text-highlight fill-highlight/25" />}
                className="hover:border-border-strong transition-all"
              >
                {t('hero_demo_cta')}
              </Button>
            </div>

            {/* Trust Ticks */}
            <p className="text-xs text-text-muted flex flex-wrap items-center gap-2 pt-1 font-mono">
              <span className="text-text-secondary font-medium">
                {t('hero_trust_free')}
              </span>
              <span>•</span>
              <span>{t('hero_trust_no_card')}</span>
              <span>•</span>
              <span>{t('hero_trust_instant')}</span>
            </p>
          </div>

          {/* ========================================================================= */}
          {/* Right Column: Realistic Resume Card + Non-Overlapping ATS Score Badge      */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 xl:col-span-6 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[480px] pt-4 sm:pt-6 pe-0 sm:pe-5">
              {/* Secondary peeking card behind for physical document depth (Hidden on <640px) */}
              <div
                className="hidden sm:block absolute inset-0 translate-x-3 translate-y-3 sm:translate-x-4 sm:translate-y-4 rounded-xl border border-border bg-surface-2/90 shadow-card pointer-events-none -rotate-1"
                aria-hidden="true"
              />

              {/* Mobile-only In-Bounds ATS Badge (<640px) - sits neatly above card with zero overflow */}
              <div className="sm:hidden mb-3.5 bg-surface/95 dark:bg-elevated/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-subtle flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 42 42">
                      <circle
                        cx="21"
                        cy="21"
                        r={radius}
                        className="text-border"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        fill="transparent"
                      />
                      <circle
                        cx="21"
                        cy="21"
                        r={radius}
                        className="text-success"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeOffset}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                      <span className="font-mono text-xs font-bold text-text-primary">
                        {score}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-success flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      {t('hero_preview_match_score')}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono block">
                      Workday & Taleo Ready
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-soft text-brand font-semibold border border-brand/20">
                  ATS Passed
                </span>
              </div>

              {/* Desktop/Tablet Floating ATS Score Badge (>=640px) */}
              {/* Positioned outside the top-end corner so it NEVER covers card content */}
              <div
                className={clsx(
                  'hidden sm:flex absolute -top-5 -end-4 sm:-top-6 sm:-end-5 z-20',
                  'bg-surface/95 dark:bg-elevated/95 backdrop-blur-md border border-border-strong/80 text-text-primary px-3.5 py-2.5 rounded-xl shadow-elevated items-center gap-3',
                  'transition-all duration-[250ms]',
                  mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
                  'motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100'
                )}
                aria-label="ATS Score: 94 out of 100"
              >
                {/* SVG Progress Ring */}
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <svg className="w-11 h-11 -rotate-90" viewBox="0 0 42 42">
                    <circle
                      cx="21"
                      cy="21"
                      r={radius}
                      className="text-border"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      fill="transparent"
                    />
                    <circle
                      cx="21"
                      cy="21"
                      r={radius}
                      className="text-success transition-all duration-1000 ease-out"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                    <span className="font-mono text-xs font-bold text-text-primary">
                      {score}
                    </span>
                    <span className="text-[8px] font-mono uppercase text-text-muted">
                      ATS
                    </span>
                  </div>
                </div>

                {/* Score Details */}
                <div>
                  <span className="text-xs font-bold text-success flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    {t('hero_preview_match_score')}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono block">
                    Workday & Taleo Ready
                  </span>
                </div>
              </div>

              {/* Primary Realistic Resume Card */}
              <div
                className={clsx(
                  'relative rounded-xl border border-border bg-surface text-text-primary p-5 sm:p-7 shadow-elevated text-start select-none transition-all duration-[250ms]',
                  'rotate-0 sm:rotate-[1.5deg]',
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
                  'motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100'
                )}
              >
                {/* Document Top Strip: Sample label & ISO format badge */}
                <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-border/80">
                  <div className="flex items-center gap-1.5 text-text-muted">
                    <FileText className="w-3.5 h-3.5 text-brand" />
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                      {t('hero_preview_sample')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-border bg-surface-2 text-text-secondary font-medium">
                    {t('hero_preview_iso')}
                  </span>
                </div>

                {/* Document Header (Clear layout with zero collision with badges) */}
                <div className="border-b border-border/70 pb-3.5 mb-3.5">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                    {t('hero_preview_name')}
                  </h2>
                  <p className="text-xs font-semibold text-brand mt-0.5 font-sans">
                    {t('hero_preview_title')}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-muted mt-2 font-mono">
                    <span>tariq@example.com</span>
                    <span>•</span>
                    <span>+971 50 123 4567</span>
                    <span>•</span>
                    <span>Dubai, UAE</span>
                  </div>
                </div>

                {/* Executive Profile Snippet */}
                <div className="mb-3.5">
                  <h3 className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1 font-semibold">
                    {t('hero_preview_summary_title')}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {t('hero_preview_summary_desc')}
                  </p>
                </div>

                {/* Key Experience Highlight */}
                <div className="mb-3.5">
                  <h3 className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1 font-semibold">
                    {t('hero_preview_exp_title')}
                  </h3>
                  <div className="text-xs font-semibold text-text-primary">
                    {t('hero_preview_exp_role')}
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                    {t('hero_preview_exp_desc')}
                  </p>
                </div>

                {/* Matched Keywords Section (With 40ms stagger animation) */}
                <div className="mb-3.5 pt-3 border-t border-border/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-semibold">
                      {t('hero_preview_kw_title')}
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-brand bg-brand-soft px-1.5 py-0.5 rounded border border-brand/20">
                      {t('hero_preview_kw_matched')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map((kw, idx) => (
                      <span
                        key={kw}
                        className={clsx(
                          'px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-brand-soft text-brand border border-brand/20 flex items-center gap-1 transition-all duration-300',
                          mounted
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-1',
                          'motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100'
                        )}
                        style={{
                          transitionDelay: mounted ? `${idx * 40}ms` : '0ms',
                        }}
                      >
                        <Check className="w-3 h-3 text-brand" />
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Verification Pin & Format Status */}
                <div className="pt-2.5 border-t border-border/80 flex items-center justify-between text-[11px] text-text-secondary">
                  <span className="flex items-center gap-1 text-success font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    {t('hero_preview_verified')}
                  </span>
                  <span className="font-mono text-text-muted flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    {t('hero_preview_errors')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
