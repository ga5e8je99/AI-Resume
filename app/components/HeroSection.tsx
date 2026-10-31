'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Zap, Check, CheckCircle2, FileText } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '@/app/context/LanguageContext';
import { Button } from '@/components/ui';
import { ScrollReveal } from './landing/ScrollReveal';

interface HeroSectionProps {
  onScanClick: (e: React.MouseEvent) => void;
  onDemoClick: () => void;
  isDemoLoading: boolean;
}

const TARGET_SCORE = 94;
const SCORE_DURATION_MS = 800;
const radius = 17;
const circumference = 2 * Math.PI * radius; // ~106.81

export default function HeroSection({
  onScanClick,
  onDemoClick,
  isDemoLoading,
}: HeroSectionProps) {
  const { language, t } = useLanguage();
  const isAr = language === 'ar';

  // ATS Score count-up state & single-run guard
  const [displayScore, setDisplayScore] = useState(TARGET_SCORE);
  const hasAnimatedScoreRef = useRef(false);
  const scoreSectionRef = useRef<HTMLDivElement>(null);
  const scoreTextRef = useRef<HTMLSpanElement>(null);
  const scoreCircleRef = useRef<SVGCircleElement>(null);

  // Score circular progress offset (94 / 100)
  const strokeOffset = circumference - (displayScore / 100) * circumference;

  const keywords = [
    t('hero_preview_kw1'),
    t('hero_preview_kw2'),
    t('hero_preview_kw3'),
    t('hero_preview_kw4'),
    t('hero_preview_kw5'),
  ];

  useEffect(() => {
    if (hasAnimatedScoreRef.current) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      hasAnimatedScoreRef.current = true;
      return;
    }

    const targetEl = scoreSectionRef.current;
    if (!targetEl || typeof IntersectionObserver === 'undefined') {
      hasAnimatedScoreRef.current = true;
      return;
    }

    let rafId = 0;

    const runCountUp = () => {
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / SCORE_DURATION_MS, 1);
        // Smooth cubic ease-out over 800ms: 1 - (1 - progress)^3
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentScore = Math.round(easedProgress * TARGET_SCORE);
        const currentOffset =
          circumference - (currentScore / 100) * circumference;

        if (scoreTextRef.current) {
          scoreTextRef.current.textContent = String(currentScore);
        }
        if (scoreCircleRef.current) {
          scoreCircleRef.current.style.strokeDashoffset = String(currentOffset);
        }

        if (progress < 1) {
          rafId = requestAnimationFrame(animate);
        } else {
          setDisplayScore(TARGET_SCORE);
        }
      };

      rafId = requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasAnimatedScoreRef.current) {
            hasAnimatedScoreRef.current = true;
            observer.disconnect();
            runCountUp();
            break;
          }
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(targetEl);

    return () => {
      observer.disconnect();
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <section className="relative overflow-hidden overflow-x-clip pt-10 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 lg:pb-28">
      {/* 1. Subtle Editorial Grid Background (CSS only, ultra-low opacity) */}
      <div
        className="absolute inset-0 pointer-events-none -z-20 opacity-[0.035] dark:opacity-[0.045]"
        style={{
          backgroundImage:
            'linear-gradient(90deg, var(--ink) 1px, transparent 1px), linear-gradient(180deg, var(--ink) 1px, transparent 1px)',
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
        className="absolute top-1/2 end-0 sm:end-[2%] lg:end-[6%] -translate-y-1/2 w-[280px] sm:w-[480px] lg:w-[580px] h-[280px] sm:h-[480px] lg:h-[580px] rounded-full bg-brand-soft/70 dark:bg-brand/10 blur-[80px] sm:blur-[110px] pointer-events-none -z-10 transition-colors"
        aria-hidden="true"
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-14 items-center">
          {/* ========================================================================= */}
          {/* Start Column: Sequential Entrance (Headline -> Subtitle -> CTAs)          */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 xl:col-span-6 text-start space-y-6 min-w-0 max-w-full">
            {/* Step 1: Eyebrow + Headline (delay: 0ms) */}
            <ScrollReveal direction="up" delay={0} className="space-y-6">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-full border border-line-strong bg-surface backdrop-blur-sm text-ink-2 text-[11px] sm:text-[13px] font-mono shadow-subtle max-w-full">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
                </span>
                <span className="truncate">{t('hero_eyebrow')}</span>
              </div>

              {/* Headline with amber hand-drawn underline SVG */}
              <h1
                className={clsx(
                  'text-ink tracking-tight font-semibold break-words',
                  isAr
                    ? 'font-sans text-[clamp(1.95rem,4.5vw,3.65rem)] leading-[1.25]'
                    : 'font-serif text-[clamp(2.15rem,5vw,4.15rem)] leading-[1.1]'
                )}
              >
                {t('hero_headline_part1')}{' '}
                <span className="relative inline-block sm:whitespace-nowrap text-brand max-w-full">
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
            </ScrollReveal>

            {/* Step 2: Subheadline (delay: 100ms) */}
            <ScrollReveal direction="up" delay={100}>
              <p className="text-base sm:text-lg lg:text-[1.125rem] text-ink-2 leading-relaxed max-w-[56ch]">
                {t('hero_subheadline')}
              </p>
            </ScrollReveal>

            {/* Step 3: Action CTAs & Trust Ticks (delay: 200ms) */}
            <ScrollReveal direction="up" delay={200} className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onScanClick}
                  endIcon={
                    <ArrowRight className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                  }
                  className="w-full sm:w-auto shadow-card hover:shadow-glow transition-all"
                >
                  {t('hero_scan_cta')}
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  isLoading={isDemoLoading}
                  onClick={onDemoClick}
                  startIcon={<Zap className="w-4 h-4 text-highlight fill-highlight/25" />}
                  className="w-full sm:w-auto border-line-strong transition-all"
                >
                  {t('hero_demo_cta')}
                </Button>
              </div>

              {/* Trust Ticks */}
              <p className="text-xs text-ink-2 flex flex-wrap items-center gap-2 pt-1 font-mono">
                <span className="text-ink-2 font-medium">
                  {t('hero_trust_free')}
                </span>
                <span>•</span>
                <span>{t('hero_trust_no_card')}</span>
                <span>•</span>
                <span>{t('hero_trust_instant')}</span>
              </p>
            </ScrollReveal>
          </div>

          {/* ========================================================================= */}
          {/* End Column: Step 4 Mockup (delay: 300ms) + One-Time 800ms ATS Count-Up    */}
          {/* ========================================================================= */}
          <ScrollReveal
            direction="up"
            delay={300}
            className="lg:col-span-6 xl:col-span-6 flex justify-center lg:justify-end min-w-0 max-w-full"
          >
            <div
              ref={scoreSectionRef}
              className="relative w-full max-w-[480px] pt-2 sm:pt-6 pe-0 sm:pe-5 min-w-0"
            >
              {/* Secondary peeking card behind for physical document depth (Hidden on <640px) */}
              <div
                className="hidden sm:block absolute inset-0 translate-x-3 translate-y-3 sm:translate-x-4 sm:translate-y-4 rounded-xl border border-line-strong bg-surface-2 shadow-card pointer-events-none -rotate-1"
                aria-hidden="true"
              />

              {/* Unified Responsive ATS Score Badge:
                  - Mobile (<640px): safe in-bounds (relative inset-x-0 mb-3.5 w-full) with zero overflow
                  - Desktop/Tablet (sm+): floating top-end (sm:absolute sm:inset-x-auto sm:w-auto sm:mb-0 sm:-top-5 sm:-end-4) */}
              <div
                data-testid="hero-ats-badge"
                className={clsx(
                  'relative inset-x-0 mb-3.5 w-full flex items-center justify-between gap-2.5 p-3 rounded-xl',
                  'sm:absolute sm:inset-x-auto sm:w-auto sm:mb-0 sm:-top-5 sm:-end-4 z-20 sm:justify-start sm:gap-3 sm:px-3.5 sm:py-2.5',
                  'bg-surface dark:bg-elevated/95 backdrop-blur-md border border-line-strong text-ink shadow-elevated'
                )}
                aria-label={t('hero_preview_ats_score_aria').replace(
                  '{score}',
                  String(TARGET_SCORE)
                )}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  {/* SVG Progress Ring */}
                  <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
                    <svg className="w-10 h-10 sm:w-11 sm:h-11 -rotate-90" viewBox="0 0 42 42">
                      <circle
                        cx="21"
                        cy="21"
                        r={radius}
                        className="text-line-strong"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        fill="transparent"
                      />
                      <circle
                        ref={scoreCircleRef}
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
                      <span
                        ref={scoreTextRef}
                        dir="ltr"
                        style={{ unicodeBidi: 'isolate' }}
                        className="font-mono text-xs font-bold text-ink tabular-nums [unicode-bidi:isolate]"
                      >
                        {displayScore}
                      </span>
                      <span className="hidden sm:inline text-[8px] font-mono uppercase text-ink-2">
                        {t('hero_preview_ats_short')}
                      </span>
                    </div>
                  </div>

                  {/* Score Details */}
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-success flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                      <span className="truncate">{t('hero_preview_match_score')}</span>
                    </span>
                    <span className="text-[10px] text-ink-2 font-mono block truncate">
                      {t('hero_preview_parser_ready')}
                    </span>
                  </div>
                </div>

                <span className="sm:hidden text-[10px] font-mono px-2 py-0.5 rounded bg-brand-soft text-brand font-semibold border border-brand/20 shrink-0">
                  {t('hero_preview_ats_passed')}
                </span>
              </div>

              {/* Primary Realistic Resume Card */}
              <div
                className={clsx(
                  'relative rounded-xl border border-line-strong bg-surface text-ink p-4 sm:p-7 shadow-elevated text-start select-none min-w-0 max-w-full overflow-hidden',
                  'rotate-0 sm:rotate-[1.5deg]'
                )}
              >
                {/* Document Top Strip: Sample label & ISO format badge */}
                <div className="flex items-center justify-between gap-2 pb-3 mb-3.5 border-b border-line-strong/80">
                  <div className="flex items-center gap-1.5 text-ink-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-brand shrink-0" />
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold truncate">
                      {t('hero_preview_sample')}
                    </span>
                  </div>
                  <span
                    dir="ltr"
                    style={{ unicodeBidi: 'isolate' }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded border border-line-strong bg-surface-2 text-ink-2 font-medium shrink-0 [unicode-bidi:isolate]"
                  >
                    {t('hero_preview_iso')}
                  </span>
                </div>

                {/* Document Header (Clear layout with zero collision with badges) */}
                <div className="border-b border-line-strong/70 pb-3.5 mb-3.5">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-ink">
                    {t('hero_preview_name')}
                  </h2>
                  <p className="text-xs font-semibold text-brand mt-0.5 font-sans">
                    {t('hero_preview_title')}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-2 mt-2 font-mono">
                    <span
                      dir="ltr"
                      style={{ unicodeBidi: 'isolate' }}
                      className="[unicode-bidi:isolate]"
                    >
                      {t('hero_preview_email')}
                    </span>
                    <span aria-hidden="true">•</span>
                    <span
                      dir="ltr"
                      style={{ unicodeBidi: 'isolate' }}
                      className="[unicode-bidi:isolate]"
                    >
                      {t('hero_preview_phone')}
                    </span>
                    <span aria-hidden="true">•</span>
                    <span>{t('hero_preview_location')}</span>
                  </div>
                </div>

                {/* Executive Profile Snippet */}
                <div className="mb-3.5">
                  <h3 className="text-[10px] font-mono uppercase tracking-wider text-ink-2 mb-1 font-semibold">
                    {t('hero_preview_summary_title')}
                  </h3>
                  <p className="text-xs text-ink-2 leading-relaxed">
                    {t('hero_preview_summary_desc')}
                  </p>
                </div>

                {/* Key Experience Highlight */}
                <div className="mb-3.5">
                  <h3 className="text-[10px] font-mono uppercase tracking-wider text-ink-2 mb-1 font-semibold">
                    {t('hero_preview_exp_title')}
                  </h3>
                  <div className="text-xs font-semibold text-ink">
                    {t('hero_preview_exp_role')}
                  </div>
                  <p className="text-[11px] text-ink-2 mt-0.5 leading-relaxed">
                    {t('hero_preview_exp_desc')}
                  </p>
                </div>

                {/* Matched Keywords Section */}
                <div className="mb-3.5 pt-3 border-t border-line-strong/80">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="text-[10px] font-mono uppercase tracking-wider text-ink-2 font-semibold truncate">
                      {t('hero_preview_kw_title')}
                    </h3>
                    <span
                      dir="ltr"
                      style={{ unicodeBidi: 'isolate' }}
                      className="text-[10px] font-mono font-bold text-brand bg-brand-soft px-1.5 py-0.5 rounded border border-brand/20 shrink-0 [unicode-bidi:isolate]"
                    >
                      {t('hero_preview_kw_matched')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map((kw) => (
                      <span
                        key={kw}
                        dir="ltr"
                        style={{ unicodeBidi: 'isolate' }}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-brand-soft text-brand border border-brand/20 flex items-center gap-1 [unicode-bidi:isolate]"
                      >
                        <Check className="w-3 h-3 text-brand shrink-0" />
                        <span>{kw}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Verification Pin & Format Status */}
                <div className="pt-2.5 border-t border-line-strong/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-2">
                  <span className="flex items-center gap-1 text-success font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                    <span>{t('hero_preview_verified')}</span>
                  </span>
                  <span
                    dir="ltr"
                    style={{ unicodeBidi: 'isolate' }}
                    className="font-mono text-ink-2 flex items-center gap-1 [unicode-bidi:isolate]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                    <span>{t('hero_preview_errors')}</span>
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
