'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'neutral' | 'accent' | 'brand' | 'highlight' | 'success' | 'warning' | 'warn' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  ...props
}: BadgeProps) {
  // Normalize aliases
  const effectiveVariant =
    variant === 'neutral'
      ? 'default'
      : variant === 'warn'
      ? 'warning'
      : variant === 'brand'
      ? 'accent'
      : variant;

  const variants = {
    default: 'bg-surface-2 text-text-secondary border border-border',
    accent: 'bg-brand-soft text-brand border border-brand/20',
    highlight: 'bg-highlight-soft text-highlight border border-highlight/25',
    success: 'bg-success-soft text-success border border-success/20',
    warning: 'bg-warning-soft text-warning border border-warning/25',
    danger: 'bg-danger-soft text-danger border border-danger/25',
    info: 'bg-info-soft text-info border border-info/25',
    outline: 'bg-transparent text-text-primary border border-border-strong',
  };

  const dotColors = {
    default: 'bg-text-muted',
    accent: 'bg-brand',
    highlight: 'bg-highlight',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    outline: 'bg-text-primary',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-mono',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md tracking-wide select-none ${variants[effectiveVariant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[effectiveVariant]}`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}
