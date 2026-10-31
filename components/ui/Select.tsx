'use client';

import React, { forwardRef, useId } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      id,
      className = '',
      options,
      children,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className="w-full text-start">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold -ink uppercase tracking-wide mb-1.5"
          >
            {label}
            {required && <span className="text-danger ms-1" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full appearance-none rounded-md border bg-surface pe-9 ps-3 py-2 text-sm -ink transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:border-transparent disabled:opacity-50 disabled:bg-surface-2 disabled:cursor-not-allowed cursor-pointer ${
              error ? 'border-danger focus-visible:ring-danger' : '-line-strong -line-strong'
            } ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 -ink-2">
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>

        {error && (
          <div
            id={errorId}
            className="flex items-center gap-1.5 mt-1.5 text-xs text-danger font-medium animate-in"
            role="alert"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {!error && helperText && (
          <p id={helperId} className="mt-1 text-xs -ink-2">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
