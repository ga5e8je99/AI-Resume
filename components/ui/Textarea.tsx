'use client';

import React, { forwardRef, useId, useState } from 'react';
import { AlertCircle } from 'lucide-react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      id,
      className = '',
      rows = 4,
      disabled,
      required,
      maxLength,
      showCount = false,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    // Track internal character count if needed
    const [charCount, setCharCount] = useState<number>(() => {
      if (typeof value === 'string') return value.length;
      if (typeof defaultValue === 'string') return defaultValue.length;
      return 0;
    });

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="w-full text-start">
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <label
              htmlFor={textareaId}
              className="block text-xs font-semibold text-text-primary uppercase tracking-wide"
            >
              {label}
              {required && <span className="text-danger ms-1" aria-hidden="true">*</span>}
            </label>
          )}

          {showCount && (
            <span className="text-[11px] font-mono text-text-muted">
              {charCount}
              {maxLength ? ` / ${maxLength}` : ''}
            </span>
          )}
        </div>

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary transition-colors duration-150 placeholder:text-text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:border-transparent disabled:opacity-50 disabled:bg-surface-2 disabled:cursor-not-allowed resize-y ${
            error
              ? 'border-danger focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
              : 'border-border hover:border-border-strong'
          } ${className}`}
          {...props}
        />

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

Textarea.displayName = 'Textarea';
