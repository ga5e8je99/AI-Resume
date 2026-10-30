'use client';

import React from 'react';
import {
  Globe,
  ArrowRight,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/app/context/LanguageContext';
import ScrollReveal from './ScrollReveal';

export default function FeatureShowcase() {
  const { t } = useLanguage();

  return (
    <section
      id="features"
      className="py-16 sm:py-24 lg:py-28 border-t border-border bg-surface-2/30"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <ScrollReveal>
          <div className="max-w-2xl text-start mb-16 lg:mb-20">
            <span className="text-xs font-mono uppercase tracking-wider text-brand font-semibold">
              {t('features_tag')}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mt-1.5 leading-tight">
              {t('features_title')}
            </h2>
            <p className="text-sm sm:text-base text-text-secondary mt-2 leading-relaxed max-w-[56ch]">
              {t('features_desc')}
            </p>
          </div>
        </ScrollReveal>

        {/* 5 Zigzag Rows */}
        <div className="space-y-20 sm:space-y-24 lg:space-y-28 text-start">
          {/* ================================================================= */}
          {/* ROW 1: ATS Scanner (Text Left, Score Gauge Visual Right)          */}
          {/* ================================================================= */}
          <ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Text Column */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-brand font-semibold">
                {t('feature_ats_tag')}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight">
                {t('feature_ats_title')}
              </h3>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                {t('feature_ats_desc')}
              </p>
              <ul className="space-y-2 pt-1 text-xs sm:text-sm text-text-secondary">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>{t('feature_ats_bullet1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>{t('feature_ats_bullet2')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>{t('feature_ats_bullet3')}</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  href="/review"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand hover:text-brand-hover underline underline-offset-4"
                >
                  <span>{t('feature_ats_cta')}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
              </div>
            </div>

            {/* Visual Column: Score Gauge Visual */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="w-full max-w-[460px] rounded-xl border border-border bg-surface p-6 sm:p-7 shadow-elevated">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <span className="text-xs font-mono uppercase tracking-wider text-text-muted font-semibold">
                    {t('feature_ats_card_tag')}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-success-soft text-success border border-success/30 font-semibold">
                    {t('feature_ats_card_badge')}
                  </span>
                </div>

                {/* Score Gauge Circle */}
                <div className="flex items-center gap-6 py-6 border-b border-border/80">
                  <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        className="text-border"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        className="text-success"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - 0.94)}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                      <span className="font-mono text-2xl font-bold text-text-primary">
                        94
                      </span>
                      <span className="text-[10px] font-mono uppercase text-text-muted mt-0.5">
                        / 100
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-serif text-lg font-bold text-text-primary">
                      {t('feature_ats_card_score_title')}
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {t('feature_ats_card_score_desc')}
                    </p>
                  </div>
                </div>

                {/* Breakdown Meters */}
                <div className="pt-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-text-secondary">{t('feature_ats_card_meter1')}</span>
                      <span className="font-bold text-success">98%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full bg-success rounded-full w-[98%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-text-secondary">{t('feature_ats_card_meter2')}</span>
                      <span className="font-bold text-brand">92%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full bg-brand rounded-full w-[92%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-text-secondary">{t('feature_ats_card_meter3')}</span>
                      <span className="font-bold text-success">100%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full bg-success rounded-full w-[100%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

          {/* ================================================================= */}
          {/* ROW 2: Resume & CV Builder (Visual Left, Text Right)              */}
          {/* ================================================================= */}
          <ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Visual Column: Editor + Live Preview Mockup */}
            <div className="lg:col-span-6 flex justify-center lg:justify-start order-2 lg:order-1">
              <div className="w-full max-w-[480px] rounded-xl border border-border bg-surface shadow-elevated overflow-hidden">
                {/* Editor Header Bar */}
                <div className="bg-surface-2 border-b border-border px-4 py-2.5 flex items-center justify-between text-xs font-mono text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-danger/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-warning/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-success/80" />
                    <span className="ms-2 font-semibold text-text-secondary">JobMatch Studio</span>
                  </div>
                  <span className="text-[10px] bg-brand-soft text-brand px-1.5 py-0.5 rounded font-bold">
                    {t('feature_builder_card_badge')}
                  </span>
                </div>

                {/* Split Mockup */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse divide-border p-4 gap-4 text-start">
                  {/* Left: Mini Inputs */}
                  <div className="space-y-3 pe-1">
                    <span className="text-[10px] font-mono uppercase text-text-muted font-bold block">
                      {t('feature_builder_card_fields')}
                    </span>
                    <div>
                      <span className="text-[10px] font-mono text-text-muted block">{t('feature_builder_card_role')}</span>
                      <div className="text-xs p-1.5 rounded border border-border bg-surface-2 font-mono text-text-primary truncate">
                        Lead Cloud Architect
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-text-muted block">{t('feature_builder_card_summary')}</span>
                      <div className="text-[11px] p-1.5 rounded border border-border bg-surface-2 text-text-secondary leading-tight line-clamp-3">
                        Distributed systems architect with 7+ years designing scalable platforms...
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-text-muted block">{t('feature_builder_card_skills')}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-soft text-brand">K8s</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-soft text-brand">PostgreSQL</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-soft text-brand">AWS</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Mini Sheet Preview */}
                  <div className="ps-1 space-y-2">
                    <span className="text-[10px] font-mono uppercase text-text-muted font-bold block">
                      {t('feature_builder_card_preview')}
                    </span>
                    <div className="rounded border border-border/80 bg-surface p-2.5 shadow-subtle space-y-1.5">
                      <div className="border-b border-border/60 pb-1">
                        <div className="font-serif text-xs font-bold text-text-primary">Tariq Al-Mansoor</div>
                        <div className="text-[9px] text-brand font-mono font-medium">Cloud Architect</div>
                      </div>
                      <div className="text-[9px] text-text-secondary leading-tight">
                        • Reduced P99 latency by 42% across 4M daily active sessions.
                      </div>
                      <div className="text-[9px] text-text-secondary leading-tight">
                        • Architected zero-downtime database migration.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Column */}
            <div className="lg:col-span-6 space-y-4 order-1 lg:order-2">
              <span className="text-xs font-mono uppercase tracking-wider text-brand font-semibold">
                {t('feature_builder_tag')}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight">
                {t('feature_builder_title')}
              </h3>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                {t('feature_builder_desc')}
              </p>
              <ul className="space-y-2 pt-1 text-xs sm:text-sm text-text-secondary">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>{t('feature_builder_bullet1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>{t('feature_builder_bullet2')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>{t('feature_builder_bullet3')}</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  href="/builder"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand hover:text-brand-hover underline underline-offset-4"
                >
                  <span>{t('feature_builder_cta')}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ================================================================= */}
        {/* ROW 3: AI Cover Letter (Text Left, Language Switch Visual Right)  */}
        {/* ================================================================= */}
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Text Column */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-brand font-semibold">
                {t('feature_cover_tag')}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight">
                {t('feature_cover_title')}
              </h3>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                {t('feature_cover_desc')}
              </p>
              <ul className="space-y-2 pt-1 text-xs sm:text-sm text-text-secondary">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>{t('feature_cover_bullet1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>{t('feature_cover_bullet2')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>{t('feature_cover_bullet3')}</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  href="/cover-letter"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand hover:text-brand-hover underline underline-offset-4"
                >
                  <span>{t('feature_cover_cta')}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
              </div>
            </div>

            {/* Visual Column: Language Switch & Letter Mockup */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="w-full max-w-[460px] rounded-xl border border-border bg-surface p-6 sm:p-7 shadow-elevated space-y-4">
                {/* Language Switch Controls Strip */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-lg border border-border text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-surface font-semibold text-brand shadow-subtle">
                      English
                    </span>
                    <span className="px-2 py-0.5 rounded text-text-muted hover:text-text-primary">
                      العربية
                    </span>
                    <span className="px-2 py-0.5 rounded text-text-muted hover:text-text-primary">
                      Français
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-soft text-brand font-semibold">
                    {t('feature_cover_card_tone')}
                  </span>
                </div>

                {/* Letter Content Snippet */}
                <div className="space-y-2.5 text-start">
                  <p className="text-xs text-text-muted font-mono">
                    To the Engineering Hiring Committee • FinTech Cloud
                  </p>
                  <p className="font-serif text-sm text-text-primary font-semibold">
                    Application for Principal Cloud Systems Architect
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Dear Hiring Team,
                    <br />
                    I am writing to express my strong enthusiasm for the Principal Cloud Architect position. Having engineered distributed microservice platforms that scaled to <span className="font-semibold text-text-primary">4M daily active sessions</span> while lowering P99 latency by <span className="font-semibold text-text-primary">42%</span>, I am eager to bring this rigor to your core infrastructure...
                  </p>
                </div>

                {/* Highlighted Alignment Tags */}
                <div className="pt-2 border-t border-border/80 flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-success-soft text-success border border-success/30">
                    {t('feature_cover_card_tag1')}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-success-soft text-success border border-success/30">
                    {t('feature_cover_card_tag2')}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-soft text-brand border border-brand/20">
                    {t('feature_cover_card_tag3')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

          {/* ================================================================= */}
          {/* ROW 4: Job Match (Visual Left, Text Right)                        */}
          {/* ================================================================= */}
          <ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Visual Column: List of Matched Job Cards */}
            <div className="lg:col-span-6 flex justify-center lg:justify-start order-2 lg:order-1">
              <div className="w-full max-w-[460px] space-y-3">
                {/* Vacancy Card 1 */}
                <div className="rounded-xl border border-border bg-surface p-4 shadow-subtle hover:border-brand/40 transition-all flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-text-primary">
                      {t('feature_match_card1_title')}
                    </h4>
                    <p className="text-xs text-text-muted font-mono mt-0.5">
                      {t('feature_match_card1_meta')}
                    </p>
                    <span className="inline-block text-[10px] font-mono text-success mt-1.5">
                      {t('feature_match_card1_sub')}
                    </span>
                  </div>
                  <div className="text-end shrink-0">
                    <span className="font-mono text-xl font-bold text-success block leading-none">
                      96%
                    </span>
                    <span className="text-[9px] font-mono uppercase text-text-muted">
                      Match
                    </span>
                  </div>
                </div>

                {/* Vacancy Card 2 */}
                <div className="rounded-xl border border-border bg-surface p-4 shadow-subtle hover:border-brand/40 transition-all flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-text-primary">
                      {t('feature_match_card2_title')}
                    </h4>
                    <p className="text-xs text-text-muted font-mono mt-0.5">
                      {t('feature_match_card2_meta')}
                    </p>
                    <span className="inline-block text-[10px] font-mono text-brand mt-1.5">
                      {t('feature_match_card2_sub')}
                    </span>
                  </div>
                  <div className="text-end shrink-0">
                    <span className="font-mono text-xl font-bold text-brand block leading-none">
                      89%
                    </span>
                    <span className="text-[9px] font-mono uppercase text-text-muted">
                      Match
                    </span>
                  </div>
                </div>

                {/* Vacancy Card 3 */}
                <div className="rounded-xl border border-border bg-surface p-4 shadow-subtle hover:border-brand/40 transition-all flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-text-primary">
                      {t('feature_match_card3_title')}
                    </h4>
                    <p className="text-xs text-text-muted font-mono mt-0.5">
                      {t('feature_match_card3_meta')}
                    </p>
                    <span className="inline-block text-[10px] font-mono text-warning mt-1.5">
                      {t('feature_match_card3_sub')}
                    </span>
                  </div>
                  <div className="text-end shrink-0">
                    <span className="font-mono text-xl font-bold text-warning block leading-none">
                      78%
                    </span>
                    <span className="text-[9px] font-mono uppercase text-text-muted">
                      Match
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Column */}
            <div className="lg:col-span-6 space-y-4 order-1 lg:order-2">
              <span className="text-xs font-mono uppercase tracking-wider text-brand font-semibold">
                {t('feature_match_tag')}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight">
                {t('feature_match_title')}
              </h3>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                {t('feature_match_desc')}
              </p>
              <ul className="space-y-2 pt-1 text-xs sm:text-sm text-text-secondary">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>{t('feature_match_bullet1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>{t('feature_match_bullet2')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>{t('feature_match_bullet3')}</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand hover:text-brand-hover underline underline-offset-4"
                >
                  <span>{t('feature_match_cta')}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ================================================================= */}
        {/* ROW 5: Multi-Language & Native RTL (Text Left, Chips Right)       */}
        {/* ================================================================= */}
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Text Column */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-brand font-semibold">
                {t('feature_lang_tag')}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight">
                {t('feature_lang_title')}
              </h3>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                {t('feature_lang_desc')}
              </p>
              <ul className="space-y-2 pt-1 text-xs sm:text-sm text-text-secondary">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>{t('feature_lang_bullet1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>{t('feature_lang_bullet2')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0" />
                  <span>{t('feature_lang_bullet3')}</span>
                </li>
              </ul>
            </div>

            {/* Visual Column: Multi-Language Badges and Chips Grid */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="w-full max-w-[460px] rounded-xl border border-border bg-surface p-6 sm:p-7 shadow-elevated space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border text-xs font-mono text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-brand" />
                    <span className="font-semibold text-text-secondary">
                      {t('feature_lang_card_title')}
                    </span>
                  </div>
                  <span className="text-[10px] bg-brand-soft text-brand px-1.5 py-0.5 rounded font-bold">
                    {t('feature_lang_card_badge')}
                  </span>
                </div>

                {/* Language Cards Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-lg border border-border bg-surface-2/60 text-start">
                    <div className="text-xs font-bold text-text-primary">English</div>
                    <div className="text-[10px] font-mono text-text-muted">Inter & Newsreader</div>
                  </div>
                  <div className="p-3 rounded-lg border border-brand/40 bg-brand-soft/30 text-start">
                    <div className="text-xs font-bold text-brand">العربية (RTL)</div>
                    <div className="text-[10px] font-mono text-brand/80">IBM Plex Sans Arabic</div>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-surface-2/60 text-start">
                    <div className="text-xs font-bold text-text-primary">Français</div>
                    <div className="text-[10px] font-mono text-text-muted">ISO Français A4</div>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-surface-2/60 text-start">
                    <div className="text-xs font-bold text-text-primary">Deutsch</div>
                    <div className="text-[10px] font-mono text-text-muted">DIN 5008 Layout</div>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-surface-2/60 text-start">
                    <div className="text-xs font-bold text-text-primary">Español</div>
                    <div className="text-[10px] font-mono text-text-muted">Curriculum Vitae</div>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-surface-2/60 text-start">
                    <div className="text-xs font-bold text-text-primary">Türkçe</div>
                    <div className="text-[10px] font-mono text-text-muted">Özgeçmiş Standardı</div>
                  </div>
                </div>

                {/* Excerpt Demo */}
                <div className="pt-3 border-t border-border/80 text-[11px] font-mono text-text-secondary flex items-center justify-between">
                  <span>{t('feature_lang_card_footer')}</span>
                  <span className="text-success font-semibold">100% Verified</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
