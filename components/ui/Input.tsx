'use client';

import React, { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      id,
      className = '',
      leftAddon,
      rightAddon,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full text-start">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-text-primary uppercase tracking-wide mb-1.5"
          >
            {label}
            {required && <span className="text-danger ms-1" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute start-3 flex items-center pointer-events-none text-text-muted">
              {leftAddon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary transition-colors duration-150 placeholder:text-text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:border-transparent disabled:opacity-50 disabled:bg-surface-2 disabled:cursor-not-allowed ${
              leftAddon ? 'ps-9' : ''
            } ${rightAddon ? 'pe-9' : ''} ${
              error
                ? 'border-danger focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
                : 'border-border hover:border-border-strong'
            } ${className}`}
            {...props}
          />

          {rightAddon && (
            <div className="absolute end-3 flex items-center text-text-muted">
              {rightAddon}
            </div>
          )}
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
          <p id={helperId} className="mt-1 text-xs text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
