'use client';

import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
  /** Whether to use the subtle brand shimmer gradient (defaults to true) */
  shimmer?: boolean;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  shimmer = true,
  ...props
}: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 w-full rounded-sm',
    circular: 'rounded-full shrink-0',
    rectangular: 'w-full rounded-md',
  };

  const dynamicStyle: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
  };

  const animationClass = shimmer ? 'skeleton-shimmer' : 'animate-pulse bg-surface-2';

  return (
    <div
      role="status"
      aria-label="Loading..."
      className={`relative overflow-hidden ${animationClass} ${variantStyles[variant]} ${className}`}
      style={dynamicStyle}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-5 rounded-xl border border-line-strong bg-surface space-y-4 shadow-card ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" width="60%" height={14} />
          <Skeleton variant="text" width="40%" height={12} />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton variant="text" height={12} />
        <Skeleton variant="text" height={12} width="90%" />
        <Skeleton variant="text" height={12} width="75%" />
      </div>
    </div>
  );
}

export function SkeletonMetric({ className = '' }: { className?: string }) {
  return (
    <div className={`p-5 rounded-xl border border-line-strong bg-surface space-y-2 ${className}`}>
      <Skeleton variant="text" width="50%" height={12} />
      <Skeleton variant="text" width="70%" height={24} />
    </div>
  );
}

export function SkeletonList({ rows = 4, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-line-strong bg-surface">
          <Skeleton variant="circular" width={36} height={36} />
          <div className="flex-1 space-y-1.5">
            <Skeleton variant="text" width="45%" height={14} />
            <Skeleton variant="text" width="30%" height={11} />
          </div>
          <Skeleton variant="rectangular" width={70} height={28} className="rounded-md" />
        </div>
      ))}
    </div>
  );
}
