'use client';

import React from 'react';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: 'brand' | 'accent' | 'highlight' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  variant = 'brand',
  size = 'md',
  animated = false,
  className = '',
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const effectiveVariant = variant === 'accent' ? 'brand' : variant;

  const barColors = {
    brand: 'bg-brand',
    highlight: 'bg-highlight',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
  };

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={`w-full text-start ${className}`} {...props}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs font-medium text-text-secondary mb-1.5">
          {label && <span>{label}</span>}
          {showValue && (
            <span className="font-mono tabular-nums text-text-primary font-semibold" dir="ltr">
              {percentage}%
            </span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
        className={`w-full bg-surface-2 rounded-full overflow-hidden border border-border/50 ${heights[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            barColors[effectiveVariant]
          } ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
