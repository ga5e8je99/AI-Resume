'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'surface' | 'elevated' | 'subtle' | 'outline';
  interactive?: boolean;
}

export function Card({
  children,
  className = '',
  padding = 'md',
  variant = 'surface',
  interactive = false,
  ...props
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const variants = {
    surface: 'bg-surface border border-line-strong shadow-card',
    elevated: 'bg-elevated border border-line-strong shadow-elevated',
    subtle: 'bg-surface-2 border border-line-strong',
    outline: 'bg-transparent border border-line-strong',
  };

  return (
    <div
      className={`rounded-xl text-ink transition-all duration-[var(--duration-base,250ms)] ease-[var(--ease-out,cubic-bezier(.22,1,.36,1))] ${variants[variant]} ${paddings[padding]} ${
        interactive
          ? 'card-interactive border-line-strong hover:-translate-y-0.5 hover:shadow-elevated active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 pb-4 border-b -line-strong mb-4 ${className}`}>
      <div>
        <h3 className="font-serif text-lg font-semibold -ink tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs -ink-2 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`-ink ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`pt-4 mt-4 border-t -line-strong flex items-center justify-between gap-3 ${className}`}>
      {children}
    </div>
  );
}
