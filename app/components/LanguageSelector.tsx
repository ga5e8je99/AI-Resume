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
  const { language, setLanguage, supportedLanguages, languageInfo } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/80 hover:bg-slate-850 text-slate-200 text-xs font-medium transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Select Language"
      >
        <span className="text-sm leading-none" role="img" aria-label={languageInfo.name}>
          {languageInfo.flag}
        </span>
        {variant === 'full' ? (
          <span className="hidden sm:inline font-semibold">{languageInfo.nativeName}</span>
        ) : (
          <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300">
            {languageInfo.code}
          </span>
        )}
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-cyan-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-48 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/80 py-1.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-1.5 border-b border-slate-800/80 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Select Language • اختر اللغة
          </div>
          <div className="py-1">
            {supportedLanguages.map((item) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  role="menuitem"
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className={`w-full text-left rtl:text-right px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/10 text-cyan-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base" role="img" aria-label={item.name}>
                      {item.flag}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-200">{item.nativeName}</span>
                      <span className="text-[10px] text-slate-400">{item.name}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
