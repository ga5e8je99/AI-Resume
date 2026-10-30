'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive' | 'outline' | 'highlight';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      type = 'button',
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    // Normalize destructive to danger
    const effectiveVariant = variant === 'destructive' ? 'danger' : variant;

    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-md select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

    const variants = {
      primary:
        'bg-brand text-on-brand hover:bg-brand-hover active:bg-brand-hover border border-transparent shadow-subtle',
      secondary:
        'bg-surface text-text-primary hover:bg-surface-2 active:bg-surface-2 border border-border-strong shadow-subtle',
      outline:
        'bg-transparent text-text-primary border border-border hover:border-border-strong hover:bg-surface-2 active:bg-surface-2',
      ghost:
        'bg-transparent text-brand hover:bg-brand-soft active:bg-brand-soft border border-transparent',
      highlight:
        'bg-highlight text-white hover:bg-highlight/90 active:bg-highlight/95 border border-transparent shadow-subtle',
      danger:
        'bg-danger text-white hover:opacity-90 active:opacity-100 border border-transparent shadow-subtle',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 min-h-[32px] gap-1.5',
      md: 'text-sm px-4 py-2 min-h-[40px] gap-2',
      lg: 'text-base px-5 py-2.5 min-h-[48px] gap-2.5',
    };

    const iconSizeClass =
      size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

    const hasOnlyRightIcon = !leftIcon && Boolean(rightIcon);

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading ? 'true' : undefined}
        className={`${baseStyles} ${variants[effectiveVariant]} ${sizes[size]} ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
        {...props}
      >
        {/* Left icon or spinner (when left icon exists or when button has no icon) */}
        {isLoading && !hasOnlyRightIcon ? (
          <span className={`shrink-0 flex items-center justify-center ${iconSizeClass}`}>
            <Loader2 className={`${iconSizeClass} animate-spin text-current`} aria-hidden="true" />
          </span>
        ) : leftIcon ? (
          <span className={`shrink-0 flex items-center justify-center ${iconSizeClass}`}>
            {leftIcon}
          </span>
        ) : null}

        <span className="truncate">{children}</span>

        {/* Right icon or spinner (when button originally only had right icon) */}
        {isLoading && hasOnlyRightIcon ? (
          <span className={`shrink-0 flex items-center justify-center ${iconSizeClass}`}>
            <Loader2 className={`${iconSizeClass} animate-spin text-current`} aria-hidden="true" />
          </span>
        ) : !isLoading && rightIcon ? (
          <span className={`shrink-0 flex items-center justify-center ${iconSizeClass}`}>
            {rightIcon}
          </span>
        ) : null}
      </button>
    );
  }
);

Button.displayName = 'Button';
