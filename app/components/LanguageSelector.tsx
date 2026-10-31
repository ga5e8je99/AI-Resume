'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { LanguageCode } from '../lib/translations';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export default function LanguageSelector({
  variant = 'compact',
  className = '',
}: LanguageSelectorProps) {
  const { language, setLanguage, supportedLanguages, languageInfo, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation inside dropdown menu
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }

      const activeIndex = itemRefs.current.findIndex(
        (el) => el === document.activeElement
      );

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = activeIndex < itemRefs.current.length - 1 ? activeIndex + 1 : 0;
        itemRefs.current[nextIndex]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = activeIndex > 0 ? activeIndex - 1 : itemRefs.current.length - 1;
        itemRefs.current[prevIndex]?.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        itemRefs.current[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        itemRefs.current[itemRefs.current.length - 1]?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      ref={dropdownRef}
      suppressHydrationWarning
      className={`relative inline-block text-start ${className}`}
    >
      <button
        ref={triggerRef}
        type="button"
        suppressHydrationWarning
        onClick={() => setIsOpen((prev) => !prev)}
        className="min-h-[44px] min-w-[44px] px-2.5 rounded-md border border-line-strong bg-surface hover:bg-surface-2 text-ink text-xs font-mono font-medium transition-all duration-150 active:scale-[0.98] shadow-subtle flex items-center justify-center gap-1 sm:gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`${t('nav_change_language_aria')}: ${languageInfo.code.toUpperCase()}`}
      >
        <Globe className="w-3.5 h-3.5 text-brand shrink-0" aria-hidden="true" />
        <span className="font-mono uppercase tracking-wider text-[11px] font-semibold text-ink">
          {languageInfo.code}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-ink-2 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-label={t('nav_language_options_aria')}
          className="absolute end-0 mt-1.5 w-44 rounded-xl bg-surface border border-line-strong shadow-elevated py-1.5 z-dropdown text-start animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-3 py-1 text-[10px] uppercase font-mono font-semibold tracking-wider text-ink-2 border-b border-line-strong mb-1">
            {t('nav_lang_switch')}
          </div>
          <div className="py-0.5" role="none">
            {supportedLanguages.map((item, index) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  role="menuitem"
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className={`w-full text-start px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-surface-2 ${
                    isSelected
                      ? 'bg-brand-soft text-brand font-semibold'
                      : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-4 rounded-[3px] bg-surface-2 border border-line-strong text-[9px] font-mono font-semibold flex items-center justify-center text-ink shrink-0 uppercase">
                      {item.code}
                    </span>
                    <span className="text-xs">{item.nativeName}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
