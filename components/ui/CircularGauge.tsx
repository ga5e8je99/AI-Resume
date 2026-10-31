'use client';

import React from 'react';

export interface CircularGaugeProps {
  score: number | null;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  className?: string;
  label?: string;
}

export function CircularGauge({
  score,
  size = 72,
  strokeWidth = 6,
  showValue = true,
  className = '',
  label,
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const validScore = score !== null && !isNaN(score) ? Math.max(0, Math.min(100, score)) : null;

  const [animatedScore, setAnimatedScore] = React.useState<number | null>(validScore);

  React.useEffect(() => {
    if (validScore === null) {
      setAnimatedScore(null);
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setAnimatedScore(validScore);
      return;
    }

    let startTimestamp: number | null = null;
    const duration = 300;
    const startValue = 0;
    const endValue = validScore;
    let animId: number;

    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(startValue + (endValue - startValue) * ease));

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [validScore]);

  const currentScore = animatedScore ?? validScore;
  const strokeDashoffset =
    currentScore !== null ? circumference - (currentScore / 100) * circumference : circumference;

  const getColor = (s: number | null) => {
    if (s === null) return '-ink-2 stroke-current';
    if (s >= 80) return 'text-emerald-400 stroke-current';
    if (s >= 65) return 'text-amber-400 stroke-current';
    return 'text-rose-400 stroke-current';
  };

  return (
    <div
      role="progressbar"
      aria-valuenow={validScore ?? 0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || 'ATS Score Gauge'}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90 transform"
        aria-hidden="true"
      >
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          className="text-surface-2 opacity-80"
        />

        {/* Dynamic score progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className={`${getColor(currentScore)} transition-all duration-300 ease-out`}
        />
      </svg>

      {/* Centered Score Display */}
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center" dir="ltr">
          <span
            data-score
            className={`font-serif font-extrabold -ink leading-none tabular-nums ${
              size >= 120 ? 'text-3xl sm:text-4xl' : size >= 90 ? 'text-2xl' : 'text-base'
            }`}
          >
            {currentScore !== null ? currentScore : '—'}
          </span>
          <span
            className={`-ink-2 font-mono leading-none mt-1 tabular-nums ${
              size >= 120 ? 'text-xs' : 'text-[9px]'
            }`}
          >
            /100
          </span>
        </div>
      )}
    </div>
  );
}

export default CircularGauge;
