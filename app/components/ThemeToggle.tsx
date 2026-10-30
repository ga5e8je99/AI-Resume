'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, ThemePreference } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

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
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const isAr = language === 'ar';

  useEffect(() => {
    setMounted(true);
  }, []);

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
        label: isAr ? 'الوضع النهاري' : 'Light Theme',
        nextAction: isAr ? 'انقر للتحويل إلى الليلي' : 'Click for Dark',
      };
    }
    if (currentTheme === 'dark') {
      return {
        icon: Moon,
        iconClass: 'text-brand',
        label: isAr ? 'الوضع الليلي' : 'Dark Theme',
        nextAction: isAr ? 'انقر للتحويل إلى النظام' : 'Click for System',
      };
    }
    return {
      icon: Monitor,
      iconClass: 'text-text-muted',
      label: isAr ? 'وضع النظام' : 'System Theme',
      nextAction: isAr ? 'انقر للتحويل إلى النهاري' : 'Click for Light',
    };
  };

  const details = getThemeDetails();
  const Icon = details.icon;
  const tooltipText = isAr
    ? `المظهر: ${details.label} (${details.nextAction})`
    : `Theme: ${details.label} (${details.nextAction})`;

  if (variant === 'segmented') {
    const options: { id: ThemePreference; labelEn: string; labelAr: string; icon: any }[] = [
      { id: 'light', labelEn: 'Light', labelAr: 'نهاري', icon: Sun },
      { id: 'dark', labelEn: 'Dark', labelAr: 'ليلي', icon: Moon },
      { id: 'system', labelEn: 'System', labelAr: 'نظام', icon: Monitor },
    ];

    const isSmall = size === 'sm';

    return (
      <div
        role="radiogroup"
        aria-label={isAr ? 'محدد المظهر' : 'Color theme switcher'}
        suppressHydrationWarning
        className={`inline-flex items-center p-0.5 bg-surface-2 border border-border rounded-md ${className}`}
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
              aria-label={isAr ? opt.labelAr : `${opt.labelEn} theme`}
              onClick={() => setTheme(opt.id)}
              className={`cursor-pointer transition-all duration-150 flex items-center justify-center gap-1 rounded-[4px] font-medium active:scale-[0.98] ${
                isSmall ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-xs sm:text-sm'
              } ${
                isSelected
                  ? 'bg-surface text-text-primary font-semibold shadow-subtle border border-border'
                  : 'text-text-secondary hover:text-text-primary border border-transparent'
              }`}
            >
              <OptIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
              <span className="hidden sm:inline">{isAr ? opt.labelAr : opt.labelEn}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Single Icon Button with Tooltip and direct cycle
  const buttonSizes = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
  }[size];

  return (
    <button
      type="button"
      onClick={handleCycle}
      title={tooltipText}
      aria-label={tooltipText}
      suppressHydrationWarning
      className={`group relative inline-flex items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-2 transition-all duration-150 active:scale-[0.98] shadow-subtle cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${buttonSizes} ${className}`}
    >
      <Icon
        className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${details.iconClass}`}
        aria-hidden="true"
      />
      <span className="sr-only">{tooltipText}</span>
    </button>
  );
}
