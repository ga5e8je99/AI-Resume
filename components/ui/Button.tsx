'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive' | 'outline' | 'highlight';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  /** Alias kept for backward compatibility */
  isLoading?: boolean;
  loadingText?: React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
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
      loading,
      isLoading,
      loadingText,
      disabled,
      startIcon,
      endIcon,
      leftIcon,
      rightIcon,
      type = 'button',
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    const isBusy = Boolean(loading ?? isLoading);
    const effectiveVariant = variant === 'destructive' ? 'danger' : variant;
    const resolvedStartIcon = startIcon ?? leftIcon;
    const resolvedEndIcon = endIcon ?? rightIcon;

    const baseStyles =
      'btn inline-flex items-center justify-center font-medium transition-all duration-[var(--duration-fast,150ms)] ease-[var(--ease-out,cubic-bezier(.22,1,.36,1))] rounded-md select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper';

    const variants = {
      primary:
        'bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-hover border border-transparent shadow-subtle',
      secondary:
        'bg-surface text-ink hover:bg-surface-2 active:bg-surface-2 border border-line-strong shadow-subtle',
      outline:
        'bg-transparent text-ink border border-line-strong hover:bg-surface-2 active:bg-surface-2',
      ghost:
        'bg-transparent text-accent hover:bg-accent-soft active:bg-accent-soft border border-transparent',
      highlight:
        'bg-accent text-on-accent hover:opacity-90 active:opacity-95 border border-transparent shadow-subtle',
      danger:
        'bg-danger text-on-accent hover:opacity-90 active:opacity-100 border border-transparent shadow-subtle',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 min-h-[32px] gap-1.5',
      md: 'text-sm px-4 py-2 min-h-[40px] gap-2',
      lg: 'text-base px-5 py-2.5 min-h-[48px] gap-2.5',
    };

    const iconSizeClass =
      size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

    const hasOnlyEndIcon = !resolvedStartIcon && Boolean(resolvedEndIcon);
    const ariaBusyAttr = isBusy || Boolean(props['aria-busy']);

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isBusy}
        aria-busy={ariaBusyAttr ? 'true' : undefined}
        className={`${baseStyles} ${variants[effectiveVariant]} ${sizes[size]} ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
        {...props}
      >
        {/* Start icon or loading spinner */}
        {isBusy && !hasOnlyEndIcon ? (
          <span className={`shrink-0 flex items-center justify-center ${iconSizeClass}`}>
            <Loader2 className={`${iconSizeClass} animate-spin text-current`} aria-hidden="true" />
          </span>
        ) : resolvedStartIcon ? (
          <span className={`shrink-0 flex items-center justify-center ${iconSizeClass}`}>
            {resolvedStartIcon}
          </span>
        ) : null}

        <span className="truncate">
          {isBusy && loadingText !== undefined ? loadingText : children}
        </span>

        {/* End icon or loading spinner */}
        {isBusy && hasOnlyEndIcon ? (
          <span className={`shrink-0 flex items-center justify-center ${iconSizeClass}`}>
            <Loader2 className={`${iconSizeClass} animate-spin text-current`} aria-hidden="true" />
          </span>
        ) : !isBusy && resolvedEndIcon ? (
          <span className={`shrink-0 flex items-center justify-center ${iconSizeClass}`}>
            {resolvedEndIcon}
          </span>
        ) : null}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
