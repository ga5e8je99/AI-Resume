'use client';

import React from 'react';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
  ariaLabel = 'Segmented options',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex items-center rounded-md border -line-strong bg-surface-2 p-1 gap-1 ${className}`}
    >
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            type="button"
            aria-checked={isSelected}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={`relative flex items-center justify-center font-medium rounded-sm transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'
            } ${
              isSelected
                ? 'bg-surface -ink shadow-subtle border -line-strong/60 font-semibold'
                : '-ink-2 -ink -surface-2 border border-transparent'
            } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span>{opt.label}</span>
            {opt.badge && (
              <span className="ms-1.5 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-soft text-brand">
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
