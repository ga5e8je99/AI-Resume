'use client';

import React, { useSyncExternalStore } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, ThemePreference } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const emptySubscribe = () => () => {};

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'icon' | 'segmented';
}

export default function ThemeToggle({
  className = '',
  size = 'sm',
  variant = 'icon',
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const currentTheme = mounted ? theme : 'system';

  // Cycle sequence: light -> dark -> system -> light
  const handleCycle = () => {
    if (currentTheme === 'light') {
      setTheme('dark');
    } else if (currentTheme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getThemeDetails = () => {
    if (currentTheme === 'light') {
      return {
        icon: Sun,
        iconClass: 'text-warning',
        label: t('nav_theme_light'),
      };
    }
    if (currentTheme === 'dark') {
      return {
        icon: Moon,
        iconClass: 'text-brand',
        label: t('nav_theme_dark'),
      };
    }
    return {
      icon: Monitor,
      iconClass: 'text-ink-2',
      label: t('nav_theme_system'),
    };
  };

  const details = getThemeDetails();
  const Icon = details.icon;
  const tooltipText = `${t('nav_theme_switcher_aria')}: ${details.label}`;

  if (variant === 'segmented') {
    const options: { id: ThemePreference; label: string; icon: any }[] = [
      { id: 'light', label: t('nav_theme_light'), icon: Sun },
      { id: 'dark', label: t('nav_theme_dark'), icon: Moon },
      { id: 'system', label: t('nav_theme_system'), icon: Monitor },
    ];

    const isSmall = size === 'sm';

    return (
      <div
        role="radiogroup"
        aria-label={t('nav_theme_switcher_aria')}
        suppressHydrationWarning
        className={`inline-flex items-center p-0.5 bg-surface-2 border border-line-strong rounded-md ${className}`}
      >
        {options.map((opt) => {
          const OptIcon = opt.icon;
          const isSelected = currentTheme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              suppressHydrationWarning
              aria-checked={isSelected}
              aria-label={opt.label}
              onClick={() => setTheme(opt.id)}
              className={`min-h-[44px] min-w-[44px] cursor-pointer transition-all duration-150 flex items-center justify-center gap-1 rounded-[4px] font-medium active:scale-[0.98] ${
                isSmall ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs sm:text-sm'
              } ${
                isSelected
                  ? 'bg-surface text-ink font-semibold shadow-subtle border border-line-strong'
                  : 'text-ink-2 hover:text-ink border border-transparent'
              }`}
            >
              <OptIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Single Icon Button with Tooltip and direct cycle (>= 44px touch target)
  const buttonSizes = {
    sm: 'min-w-[44px] min-h-[44px] w-11 h-11',
    md: 'min-w-[44px] min-h-[44px] w-11 h-11',
  }[size];

  return (
    <button
      type="button"
      onClick={handleCycle}
      title={tooltipText}
      aria-label={tooltipText}
      suppressHydrationWarning
      className={`group relative inline-flex items-center justify-center rounded-md border border-line-strong bg-surface hover:bg-surface-2 transition-all duration-150 active:scale-[0.98] shadow-subtle cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${buttonSizes} ${className}`}
    >
      <Icon
        className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${details.iconClass}`}
        aria-hidden="true"
      />
      <span className="sr-only">{tooltipText}</span>
    </button>
  );
}
