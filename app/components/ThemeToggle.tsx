'use client';

import React, { useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme, ResolvedTheme } from '../context/ThemeContext';
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
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const currentTheme: ResolvedTheme = mounted ? resolvedTheme : 'light';

  // Toggle strictly between light and dark (initial default comes from system via resolvedTheme)
  const handleCycle = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  const getThemeDetails = () => {
    if (currentTheme === 'dark') {
      return {
        icon: Moon,
        iconClass: 'text-brand',
        label: t('nav_theme_dark'),
      };
    }
    return {
      icon: Sun,
      iconClass: 'text-warning',
      label: t('nav_theme_light'),
    };
  };

  const details = getThemeDetails();
  const Icon = details.icon;
  const tooltipText = `${t('nav_theme_switcher_aria')}: ${details.label}`;

  if (variant === 'segmented') {
    const options: { id: ResolvedTheme; label: string; icon: any }[] = [
      { id: 'light', label: t('nav_theme_light'), icon: Sun },
      { id: 'dark', label: t('nav_theme_dark'), icon: Moon },
    ];

    const isSmall = size === 'sm';

    return (
      <div
        role="radiogroup"
        aria-label={t('nav_theme_switcher_aria')}
        suppressHydrationWarning
        className={`inline-flex items-center p-1 bg-ink/[0.05] border border-line/60 rounded-full ${className}`}
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
              className={`h-8 cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 rounded-full font-medium active:scale-[0.97] ${
                isSmall ? 'px-3 text-xs' : 'px-3.5 text-xs sm:text-sm'
              } ${
                isSelected
                  ? 'bg-surface text-ink font-semibold shadow-subtle border border-line-strong/40'
                  : 'text-ink-2 hover:text-ink border border-transparent'
              }`}
            >
              <OptIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Sleek circular pill icon button
  const buttonSizes = {
    sm: 'w-9 h-9',
    md: 'w-10 h-10',
  }[size];

  return (
    <button
      type="button"
      onClick={handleCycle}
      title={tooltipText}
      aria-label={tooltipText}
      suppressHydrationWarning
      className={`group relative inline-flex items-center justify-center rounded-full border border-transparent hover:border-line-strong/40 bg-ink/[0.04] hover:bg-ink/[0.08] transition-all duration-200 active:scale-[0.95] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${buttonSizes} ${className}`}
    >
      <Icon
        className={`w-4 h-4 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110 ${details.iconClass}`}
        aria-hidden="true"
      />
      <span className="sr-only">{tooltipText}</span>
    </button>
  );
}
