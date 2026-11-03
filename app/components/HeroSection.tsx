'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Globe,
  BarChart3,
  Layers,
  Briefcase,
  FileText,
  ScanLine,
  TrendingUp,
  Upload,
  Cpu,
  FileCheck2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Button from '@/components/ui/Button';

export interface HeroSectionProps {
  onScanClick?: (e: React.MouseEvent) => void;
  onDemoClick?: (e: React.MouseEvent) => void;
  isDemoLoading?: boolean;
  variant?: 'bento' | 'classic';
}

const TARGET_SCORE = 94;
const SCORE_DURATION_MS = 800;

export default function HeroSection({
  onScanClick,
  variant = 'bento',
}: HeroSectionProps) {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';

  const [animatedScore, setAnimatedScore] = useState(0);
  const [activeSkillCycle, setActiveSkillCycle] = useState(0);
  const scoreContainerRef = useRef<HTMLDivElement | null>(null);
  const bentoContainerRef = useRef<HTMLDivElement | null>(null);
  const hasAnimatedScoreRef = useRef(false);
  const rafParallaxRef = useRef<number | null>(null);

  // Animate ATS score once from 0 -> 94 over 900ms on first viewport entry
  useEffect(() => {
    if (hasAnimatedScoreRef.current) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      hasAnimatedScoreRef.current = true;
      const immediateTimer = window.setTimeout(() => {
        setAnimatedScore(TARGET_SCORE);
      }, 0);
      return () => window.clearTimeout(immediateTimer);
    }

    let rafId: number | null = null;
    const runCountUp = () => {
      if (hasAnimatedScoreRef.current) return;
      hasAnimatedScoreRef.current = true;
      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / SCORE_DURATION_MS, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimatedScore(Math.round(eased * TARGET_SCORE));
        if (progress < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          setAnimatedScore(TARGET_SCORE);
        }
      };

      rafId = requestAnimationFrame(tick);
    };

    const node = scoreContainerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      runCountUp();
      return () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          runCountUp();
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // Gentle cycle of active scan stage & skill chips (disabled on reduced motion)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    const intervalId = window.setInterval(() => {
      setActiveSkillCycle((prev) => (prev + 1) % 3);
    }, 2800);

    return () => window.clearInterval(intervalId);
  }, []);

  // Subtle mouse parallax on desktop only (disabled on prefers-reduced-motion)
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    if (
      !window.matchMedia('(min-width: 1024px)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const container = bentoContainerRef.current;
    if (!container) return;

    const { x, y, width, height } = e.currentTarget.getBoundingClientRect();
    const normX = (e.clientX - x) / width - 0.5;
    const normY = (e.clientY - y) / height - 0.5;

    if (rafParallaxRef.current !== null) {
      cancelAnimationFrame(rafParallaxRef.current);
    }

    rafParallaxRef.current = requestAnimationFrame(() => {
      container.style.setProperty('--bento-px', `${(normX * 10).toFixed(2)}px`);
      container.style.setProperty('--bento-py', `${(normY * 8).toFixed(2)}px`);
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    const container = bentoContainerRef.current;
    if (!container) return;
    container.style.setProperty('--bento-px', '0px');
    container.style.setProperty('--bento-py', '0px');
  }, []);

  const handlePrimaryScan = (e: React.MouseEvent) => {
    if (onScanClick) {
      onScanClick(e);
      return;
    }
    const target = document.getElementById('ats-scanner');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleHowItWorksScroll = () => {
    const target =
      document.getElementById('how-it-works') ||
      document.getElementById('ats-scanner');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Ring geometry (r = 28 => circumference ≈ 175.9)
  const ringRadius = 28;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringStrokeOffset =
    ringCircumference - (animatedScore / 100) * ringCircumference;

  // 3 indicator bars
  const scoreMetrics = [
    { label: t('hero_bento_metric_keywords'), value: 96 },
    { label: t('hero_bento_metric_format'), value: 100 },
    { label: t('hero_bento_metric_impact'), value: 88 },
  ];

  // 6 general, company-neutral skill chips that smoothly alternate Matched/Missing
  const skillChips = [
    { label: t('hero_skill_communication'), matched: true },
    { label: t('hero_skill_analysis'), matched: true },
    { label: t('hero_skill_teamwork'), matched: activeSkillCycle !== 1 },
    { label: t('hero_skill_reporting'), matched: activeSkillCycle === 1 },
    { label: t('hero_skill_planning'), matched: activeSkillCycle !== 2 },
    { label: t('hero_skill_leadership'), matched: activeSkillCycle === 2 },
  ];

  // 3 abstract job match rows
  const jobMatchRows = [
    { id: 1, titleWidth: 'w-24 sm:w-28', subWidth: 'w-16', score: 94 },
    { id: 2, titleWidth: 'w-20 sm:w-24', subWidth: 'w-14', score: 89 },
    { id: 3, titleWidth: 'w-24 sm:w-28', subWidth: 'w-16', score: 84 },
  ];

  return (
    <section
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative flex items-center bg-[var(--paper)] pt-6 pb-12 sm:pt-10 sm:pb-16 lg:py-16 lg:max-h-[100svh] overflow-x-clip overflow-y-clip"
    >
      {/* Background: fine dot/line grid with radial mask + single ultra-light jade & amber ambient blob */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.22]"
          style={{
            backgroundImage:
              'linear-gradient(90deg, var(--line) 1px, transparent 1px), linear-gradient(180deg, var(--line) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage:
              'radial-gradient(ellipse 75% 65% at 50% 45%, #000 30%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 75% 65% at 50% 45%, #000 30%, transparent 100%)',
          }}
        />
        <div
          className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[22rem] sm:w-[36rem] h-[18rem] sm:h-[26rem] rounded-full blur-3xl opacity-20 dark:opacity-15"
          style={{
            background:
              'radial-gradient(circle at 35% 40%, var(--brand) 0%, var(--highlight) 55%, transparent 78%)',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center min-w-0">
          {/* START COLUMN: Headline -> Subtitle -> CTAs -> Trust Row */}
          <div className="lg:col-span-6 text-start min-w-0">
            {/* Honest Eyebrow Pill */}
            <div className="hero-lcp-enter inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-soft)] border border-[var(--brand)]/20 text-[var(--brand)] text-xs font-semibold tracking-wide mb-4 max-w-full">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-[var(--brand)]" aria-hidden="true" />
              <span className="truncate">{t('hero_eyebrow')}</span>
            </div>

            {/* 2-Line Headline in Newsreader (serif in LTR, sans in RTL) */}
            <h1
              className={`${
                isRtl
                  ? 'font-sans leading-[1.22] tracking-normal'
                  : 'font-serif leading-[1.1] tracking-tight'
              } hero-lcp-enter hero-lcp-delay-50 text-3xl sm:text-4xl lg:text-5xl font-semibold text-[var(--ink)] mb-4 max-w-xl`}
            >
              <span>{t('hero_headline_part1')} </span>
              <span className="relative inline-block whitespace-nowrap">
                <span className="bg-gradient-to-r from-[var(--brand)] via-[var(--brand)] to-[var(--highlight)] bg-clip-text text-transparent font-bold">
                  {t('hero_headline_highlight')}
                </span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 200 12"
                  fill="none"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute -bottom-1 inset-x-0 w-full h-2.5 text-[var(--highlight)] opacity-80"
                >
                  <path
                    d="M3 8.5C52 2.5 142 2.5 197 7.5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{' '}
              <span>{t('hero_headline_part2')}</span>
            </h1>

            {/* Subtitle (full wrap, no clipping) */}
            <p className="hero-lcp-enter hero-lcp-delay-100 text-sm sm:text-base lg:text-lg text-[var(--ink-2)] leading-relaxed mb-6 max-w-xl">
              {t('hero_subheadline')}
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="hero-lcp-enter hero-lcp-delay-150 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 min-w-0">
              <Button
                variant="primary"
                size="lg"
                onClick={handlePrimaryScan}
                endIcon={
                  <ArrowRight
                    className="w-4 h-4 rtl:rotate-180 transition-transform"
                    aria-hidden="true"
                  />
                }
                className="w-full sm:w-auto font-bold shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)]"
              >
                {t('hero_scan_cta')}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={handleHowItWorksScroll}
                className="w-full sm:w-auto font-semibold text-[var(--ink)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
              >
                {t('hero_how_it_works_cta')}
              </Button>
            </div>

            {/* Honest 3-Item Trust Row with Lucide Icons */}
            <ul className="hero-lcp-enter hero-lcp-delay-200 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[var(--ink-2)]">
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2
                  className="w-3.5 h-3.5 text-[var(--success)] shrink-0"
                  aria-hidden="true"
                />
                <span>{t('hero_trust_free')}</span>
              </li>
              <li className="inline-flex items-center gap-1.5">
                <ShieldCheck
                  className="w-3.5 h-3.5 text-[var(--brand)] shrink-0"
                  aria-hidden="true"
                />
                <span>{t('hero_trust_no_card')}</span>
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Globe
                  className="w-3.5 h-3.5 text-[var(--highlight)] shrink-0"
                  aria-hidden="true"
                />
                <span>{t('hero_trust_languages')}</span>
              </li>
            </ul>
          </div>

          {/* END COLUMN: Interactive Live A4 Resume X-Ray Scanner + Floating Brand Score HUD */}
          <div
            ref={scoreContainerRef}
            className="lg:col-span-6 w-full min-w-0 max-w-full hero-lcp-enter hero-lcp-delay-200"
          >
            {/* Single Accessible Text Alternative for Screen Readers */}
            <p className="sr-only">{t('hero_bento_sr_summary')}</p>

            {variant === 'bento' ? (
              <div
                ref={bentoContainerRef}
                aria-hidden="true"
                style={{
                  transform:
                    'translate3d(var(--bento-px, 0px), var(--bento-py, 0px), 0)',
                  transition: 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                className="relative w-full max-w-[540px] mx-auto select-none pt-3 pb-4 sm:py-5 sm:px-4"
              >
                {/* MAIN CENTERPIECE: Connected Vertical Workflow Pipeline (3 Stages) */}
                <div className="relative rounded-2xl bg-[var(--surface)] border border-[var(--line-strong)] shadow-[var(--shadow-elevated)] overflow-hidden p-4 sm:p-5">
                  {/* Subtle animated laser scan beam sweeping across the pipeline */}
                  <div className="hero-scan-beam pointer-events-none absolute inset-x-0 z-20 flex flex-col items-center">
                    <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--brand)] to-transparent shadow-[0_0_12px_var(--brand)]" />
                    <div className="w-full h-8 bg-gradient-to-b from-[var(--brand)]/10 to-transparent" />
                  </div>

                  {/* Top Pipeline Toolbar */}
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3.5 border-b border-[var(--line)]">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--danger)]/60" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--warning)]/70" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--success)]/80" />
                      </div>
                      <span className="ms-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--line)] text-[11px] font-mono font-semibold text-[var(--ink-2)] truncate">
                        <Sparkles className="w-3 h-3 text-[var(--brand)] shrink-0" />
                        {isRtl ? 'مسار المعالجة الفوري (3 مراحل)' : 'Instant 3-Stage Pipeline'}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--success-soft)] text-[var(--success)] text-[11px] font-semibold shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                      {t('hero_bento_score_badge')}
                    </span>
                  </div>

                  {/* THE VERTICAL PIPELINE CONTAINER */}
                  <div className="relative ps-6 sm:ps-7 space-y-3">
                    {/* Continuous Vertical Timeline Track */}
                    <div
                      aria-hidden="true"
                      className="absolute start-2.5 sm:start-3 top-3 bottom-3 w-[2px] bg-gradient-to-b from-[var(--brand)] via-[var(--brand)]/60 to-[var(--brand)]/20"
                    />

                    {/* STAGE 01: Upload & Initial Parsing */}
                    <div className="relative rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/50 p-2.5 sm:p-3 transition-all">
                      {/* Timeline Node 01 */}
                      <div
                        dir="ltr"
                        style={{ unicodeBidi: 'isolate' }}
                        className="absolute -start-6 sm:-start-7 top-2.5 w-5 h-5 rounded-full bg-[var(--brand)] text-[var(--on-brand)] flex items-center justify-center font-mono text-[9px] font-bold shadow-subtle [unicode-bidi:isolate]"
                      >
                        01
                      </div>

                      {/* Stage 1 Header */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Upload className="w-3.5 h-3.5 text-[var(--brand)] shrink-0" />
                          <span className="text-xs font-bold text-[var(--ink)] truncate">
                            {t('how_step_1_title')}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] text-[10px] font-mono font-semibold shrink-0">
                          <ShieldCheck className="w-3 h-3 shrink-0" />
                          {isRtl ? 'خصوصية 100%' : '100% In-Browser'}
                        </span>
                      </div>

                      {/* Stage 1 Content: Document Meta & Verification Tokens */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-[var(--brand)] shrink-0" />
                          <div className="min-w-0">
                            <div className="h-2 w-24 sm:w-32 rounded bg-[var(--ink)]/80" />
                            <div className="h-1.5 w-14 sm:w-16 rounded bg-[var(--ink-2)]/30 mt-1" />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--line)]">
                            ISO A4 ✓
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--line)]">
                            E.164 ✓
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--line)]">
                            RTL/LTR ✓
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* STAGE 02: Instant ATS Audit & Score Counter */}
                    <div className="relative rounded-xl border border-[var(--brand)]/35 bg-[var(--brand-soft)]/20 p-2.5 sm:p-3 transition-all shadow-subtle">
                      {/* Timeline Node 02 (Pulsing Active Indicator) */}
                      <div
                        dir="ltr"
                        style={{ unicodeBidi: 'isolate' }}
                        className="absolute -start-6 sm:-start-7 top-2.5 w-5 h-5 rounded-full bg-[var(--brand)] text-[var(--on-brand)] flex items-center justify-center font-mono text-[9px] font-bold shadow-subtle ring-2 ring-[var(--brand-soft)] [unicode-bidi:isolate]"
                      >
                        02
                      </div>

                      {/* Stage 2 Header + Score Transform Pill */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ScanLine className="w-3.5 h-3.5 text-[var(--brand)] shrink-0" />
                          <span className="text-xs font-bold text-[var(--ink)] truncate">
                            {t('hero_bento_score_title')}
                          </span>
                        </div>

                        {/* Score Upgrade Pill: 54 -> 94 */}
                        <div
                          dir="ltr"
                          style={{ unicodeBidi: 'isolate' }}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--brand)]/30 shrink-0 [unicode-bidi:isolate]"
                        >
                          <span className="text-[10px] font-mono line-through text-[var(--danger)] opacity-75">
                            54
                          </span>
                          <ArrowRight className="w-2.5 h-2.5 text-[var(--ink-3)]" />
                          <span className="text-[11px] font-mono font-bold text-[var(--brand)]">
                            {animatedScore}/100
                          </span>
                        </div>
                      </div>

                      {/* Stage 2 Content: 3 Live Diagnostic Meters */}
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        {scoreMetrics.map((metric, idx) => {
                          const isHighlighted = activeSkillCycle === idx;
                          return (
                            <div
                              key={metric.label}
                              className={`p-1.5 sm:p-2 rounded-lg border transition-all duration-300 ${
                                isHighlighted
                                  ? 'bg-[var(--surface)] border-[var(--brand)] shadow-subtle'
                                  : 'bg-[var(--surface)]/80 border-[var(--line)]'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[9px] font-semibold text-[var(--ink-2)] truncate">
                                  {metric.label}
                                </span>
                                <span
                                  dir="ltr"
                                  className="font-mono text-[9px] font-bold text-[var(--ink)] shrink-0"
                                >
                                  {metric.value}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--highlight)] transition-all duration-500"
                                  style={{ width: `${metric.value}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* STAGE 03: Skills Alignment, Role Matches & Verified Export */}
                    <div className="relative rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/50 p-2.5 sm:p-3 transition-all">
                      {/* Timeline Node 03 */}
                      <div
                        dir="ltr"
                        style={{ unicodeBidi: 'isolate' }}
                        className="absolute -start-6 sm:-start-7 top-2.5 w-5 h-5 rounded-full bg-[var(--surface)] text-[var(--brand)] border-2 border-[var(--brand)] flex items-center justify-center font-mono text-[9px] font-bold shadow-subtle [unicode-bidi:isolate]"
                      >
                        03
                      </div>

                      {/* Stage 3 Header */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)] shrink-0" />
                          <span className="text-xs font-bold text-[var(--ink)] truncate">
                            {t('how_step_3_title')}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-[var(--success)] font-semibold shrink-0">
                          {isRtl ? 'جاهز للتصدير ✓' : 'Export Ready ✓'}
                        </span>
                      </div>

                      {/* Skills Tags Strip */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-bold text-[var(--ink-2)] flex items-center gap-1">
                            <Layers className="w-3 h-3 text-[var(--brand)]" />
                            {t('hero_bento_skills_title')}
                          </span>
                          <div className="flex items-center gap-1.5 text-[9px] font-semibold">
                            <span className="inline-flex items-center gap-0.5 text-[var(--success)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                              {t('hero_bento_skills_matched')}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[var(--warning)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" />
                              {t('hero_bento_skills_missing')}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {skillChips.map((chip) => (
                            <span
                              key={chip.label}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-semibold border transition-all duration-300 ${
                                chip.matched
                                  ? 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]/25'
                                  : 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/30'
                              }`}
                            >
                              <span
                                dir="ltr"
                                style={{ unicodeBidi: 'isolate' }}
                                className="text-[8px] font-bold shrink-0"
                              >
                                {chip.matched ? '✓' : '+'}
                              </span>
                              <span className="truncate">{chip.label}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Role Matches Grid (with grid-cols-1 sm:grid-cols-2 lg:grid-cols-3) */}
                      <div className="pt-2 border-t border-[var(--line)]">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-bold text-[var(--ink-2)] flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-[var(--highlight)]" />
                            {t('hero_bento_jobs_title')}
                          </span>
                          <span className="text-[9px] font-medium text-[var(--ink-3)]">
                            {t('hero_bento_jobs_subtitle')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                          {jobMatchRows.map((row, rIdx) => (
                            <div
                              key={row.id}
                              className={`flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg border transition-all duration-300 ${
                                activeSkillCycle === rIdx
                                  ? 'bg-[var(--brand-soft)]/50 border-[var(--brand)]/40'
                                  : 'bg-[var(--surface)] border-[var(--line)]'
                              }`}
                            >
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="h-1.5 w-10 sm:w-12 rounded-full bg-[var(--ink)]/25" />
                                <div className="h-1 w-7 sm:w-8 rounded-full bg-[var(--ink)]/15" />
                              </div>
                              <span
                                dir="ltr"
                                style={{ unicodeBidi: 'isolate' }}
                                className="px-1.5 py-0.5 rounded-full bg-[var(--brand)] text-[var(--on-brand)] font-mono text-[9px] font-bold shrink-0"
                              >
                                {t('hero_bento_jobs_match_badge').replace(
                                  '{score}',
                                  String(row.score)
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FLOATING HUD BADGE (Top-End Corner): Olive Brand Score Ring Badge */}
                <div className="hidden sm:flex bento-float-1 absolute -top-4 -end-3 z-30 items-center gap-2.5 px-3 py-2 rounded-2xl bg-[var(--brand)] text-[var(--on-brand)] shadow-[var(--shadow-elevated)] border border-[var(--on-brand)]/15">
                  <div
                    dir="ltr"
                    style={{ unicodeBidi: 'isolate' }}
                    className="relative w-11 h-11 flex items-center justify-center shrink-0 [unicode-bidi:isolate]"
                  >
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 68 68">
                      <circle
                        cx="34"
                        cy="34"
                        r={ringRadius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeOpacity="0.2"
                        strokeWidth="5.5"
                      />
                      <circle
                        cx="34"
                        cy="34"
                        r={ringRadius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="5.5"
                        strokeDasharray={ringCircumference}
                        strokeDashoffset={ringStrokeOffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-bold">
                      {animatedScore}%
                    </span>
                  </div>
                  <div className="pe-1">
                    <div className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider opacity-85">
                      <TrendingUp className="w-3 h-3" />
                      <span>ATS Score</span>
                    </div>
                    <div className="text-[11px] font-bold leading-tight mt-0.5">
                      {t('hero_badge_ats')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Classic Variant (A/B prop support): Generic abstract skeleton sheet with zero personal/company data */
              <div
                aria-hidden="true"
                className="w-full min-w-0 max-w-lg mx-auto rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-5 shadow-[var(--shadow-card)] select-none"
              >
                <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-[var(--line)]">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[var(--ink)] truncate">
                      {t('hero_preview_name')}
                    </div>
                    <div className="text-xs text-[var(--ink-2)] truncate">
                      {t('hero_preview_title')}
                    </div>
                  </div>
                  <div
                    dir="ltr"
                    style={{ unicodeBidi: 'isolate' }}
                    className="px-2.5 py-1 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] font-mono text-xs font-bold shrink-0"
                  >
                    {animatedScore}/100
                  </div>
                </div>
                <div className="space-y-2.5 mb-4">
                  <div className="h-2.5 w-3/4 rounded-full bg-[var(--surface-2)]" />
                  <div className="h-2 w-full rounded-full bg-[var(--surface-2)]" />
                  <div className="h-2 w-5/6 rounded-full bg-[var(--surface-2)]" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skillChips.slice(0, 4).map((chip) => (
                    <span
                      key={chip.label}
                      className="px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--ink-2)] text-[11px] font-medium"
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
