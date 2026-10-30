'use client';

import React from 'react';
import LogoMark from './LogoMark';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/app/context/LanguageContext';
import { translations, LanguageCode } from '@/app/lib/translations';

export interface BrandedLoaderProps {
  /** Main status heading (e.g., "Preparing your workspace...") */
  status?: string;
  /** Secondary explanatory text */
  subtext?: string;
  /** Optional staged progress percentage (0 - 100) */
  progress?: number;
  /** Optional stage description (e.g., "Step 2 of 4: Keyword matching") */
  stage?: string;
  /** Callback triggered when user clicks the cancel button */
  onCancel?: () => void;
  /** Cancel button text (defaults to "Cancel") */
  cancelText?: string;
  /** Sizing scale for the emblem and typography */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to render as an absolute/fixed full-viewport overlay */
  fullScreen?: boolean;
  /** Extra CSS classes */
  className?: string;
}

export default function BrandedLoader({
  status,
  subtext,
  progress,
  stage,
  onCancel,
  cancelText,
  size = 'md',
  fullScreen = false,
  className = '',
}: BrandedLoaderProps) {
  let langContext: ReturnType<typeof useLanguage> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    langContext = useLanguage();
  } catch {
    langContext = null;
  }

  const activeLang: LanguageCode =
    langContext?.language ||
    (typeof document !== 'undefined'
      ? (document.documentElement.getAttribute('lang') as LanguageCode)
      : 'en') ||
    'en';
  const dict = translations[activeLang] || translations.en;

  const resolvedStatus =
    status && status !== 'Preparing your workspace...'
      ? status
      : langContext?.t('loading_preparing_workspace') ||
        dict.loading_preparing_workspace ||
        'Preparing your workspace...';

  const resolvedSubtext =
    subtext !== undefined
      ? subtext
      : langContext?.t('loading_document_assets') ||
        dict.loading_document_assets ||
        'Loading document templates & ATS models';

  const resolvedCancelText =
    cancelText && cancelText !== 'Cancel'
      ? cancelText
      : langContext?.t('loading_cancel') || dict.loading_cancel || 'Cancel';

  const configs = {
    sm: {
      markSize: 26,
      ringSize: 64,
      radius: 26,
      strokeWidth: 2.5,
      sparkRadius: 26,
      headingText: 'text-sm font-medium',
      subtextText: 'text-[11px]',
    },
    md: {
      markSize: 36,
      ringSize: 88,
      radius: 36,
      strokeWidth: 3,
      sparkRadius: 36,
      headingText: 'text-base font-semibold',
      subtextText: 'text-xs',
    },
    lg: {
      markSize: 48,
      ringSize: 112,
      radius: 46,
      strokeWidth: 3.5,
      sparkRadius: 46,
      headingText: 'text-lg font-semibold',
      subtextText: 'text-sm',
    },
  }[size];

  const circumference = 2 * Math.PI * configs.radius;
  const isDeterminate = typeof progress === 'number';
  const validProgress = Math.min(100, Math.max(0, progress || 0));
  const dashOffset = isDeterminate
    ? circumference * (1 - validProgress / 100)
    : circumference * 0.75;

  const content = (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center text-center p-6 select-none ${className}`}
    >
      {/* Central Branded Emblem with Orbiting Ring */}
      <div
        className="relative flex items-center justify-center mb-4"
        style={{ width: configs.ringSize, height: configs.ringSize }}
      >
        {/* SVG Progress Ring */}
        <svg
          viewBox={`0 0 ${configs.ringSize} ${configs.ringSize}`}
          width={configs.ringSize}
          height={configs.ringSize}
          className="absolute inset-0 transform -rotate-90 pointer-events-none"
        >
          {/* Background track */}
          <circle
            cx={configs.ringSize / 2}
            cy={configs.ringSize / 2}
            r={configs.radius}
            fill="none"
            stroke="var(--brand-soft)"
            strokeWidth={configs.strokeWidth}
          />
          {/* Animated Jade Progress Stroke */}
          <circle
            cx={configs.ringSize / 2}
            cy={configs.ringSize / 2}
            r={configs.radius}
            fill="none"
            stroke="var(--brand)"
            strokeWidth={configs.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={`transition-[stroke-dashoffset] duration-300 ease-out ${
              !isDeterminate ? 'animate-spin' : ''
            }`}
            style={!isDeterminate ? { animationDuration: '2s' } : undefined}
          />
        </svg>

        {/* Orbiting Amber Spark */}
        <div
          className="absolute inset-0 pointer-events-none animate-loader-orbit"
          aria-hidden="true"
        >
          <svg
            viewBox={`0 0 ${configs.ringSize} ${configs.ringSize}`}
            width={configs.ringSize}
            height={configs.ringSize}
            className="w-full h-full"
          >
            {/* 4-point diamond spark positioned precisely on ring perimeter */}
            <path
              d="M 0,-3.5 C 0,-1.5 1.5,0 3.5,0 C 1.5,0 0,1.5 0,3.5 C 0,1.5 -1.5,0 -3.5,0 C -1.5,0 0,-1.5 0,-3.5 Z"
              fill="var(--highlight)"
              transform={`translate(${configs.ringSize / 2}, ${
                configs.ringSize / 2 - configs.sparkRadius
              })`}
            />
          </svg>
        </div>

        {/* Logo Mark in Center */}
        <div className="relative z-10 flex items-center justify-center p-2 rounded-full bg-surface shadow-subtle border border-border">
          <LogoMark size={configs.markSize} />
        </div>
      </div>

      {/* Status Typography (Translated into active language) */}
      <h3 className={`font-serif tracking-tight text-text-primary ${configs.headingText}`}>
        {resolvedStatus}
      </h3>

      {resolvedSubtext && (
        <p className={`font-mono text-text-muted mt-1 ${configs.subtextText}`}>
          {resolvedSubtext}
        </p>
      )}

      {/* Staged Stage Label */}
      {stage && (
        <span className="inline-block mt-2 font-mono text-[11px] font-semibold text-brand bg-brand-soft px-2.5 py-0.5 rounded-full border border-brand/20">
          {stage}
        </span>
      )}

      {/* Optional Progress Bar */}
      {isDeterminate && (
        <div className="mt-4 w-48 sm:w-56 space-y-1">
          <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-brand rounded-full transition-all duration-300 ease-out"
              style={{ width: `${validProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-text-muted px-0.5">
            <span>Progress</span>
            <span className="font-semibold text-brand">{Math.round(validProgress)}%</span>
          </div>
        </div>
      )}

      {/* Cancel Action */}
      {onCancel && (
        <div className="mt-4 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-xs text-text-secondary hover:text-danger hover:border-danger transition-colors"
          >
            {resolvedCancelText}
          </Button>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 backdrop-blur-md transition-opacity">
        {content}
      </div>
    );
  }

  return content;
}
