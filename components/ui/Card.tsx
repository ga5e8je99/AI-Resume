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
    surface: 'bg-surface border border-border shadow-card',
    elevated: 'bg-elevated border border-border shadow-elevated',
    subtle: 'bg-surface-2 border border-border-subtle',
    outline: 'bg-transparent border border-border',
  };

  return (
    <div
      className={`rounded-xl text-text-primary transition-all duration-150 ${variants[variant]} ${paddings[padding]} ${
        interactive
          ? 'hover:border-border-strong hover:-translate-y-0.5 hover:shadow-elevated active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
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
    <div className={`flex items-start justify-between gap-4 pb-4 border-b border-border mb-4 ${className}`}>
      <div>
        <h3 className="font-serif text-lg font-semibold text-text-primary tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
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
  return <div className={`text-text-primary ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`pt-4 mt-4 border-t border-border flex items-center justify-between gap-3 ${className}`}>
      {children}
    </div>
  );
}
