'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  LanguageCode,
  LanguageInfo,
  SUPPORTED_LANGUAGES,
  TranslationDictionary,
  translations,
} from '../lib/translations';
import {
  formatDate,
  formatRelativeTime,
  formatNumber,
  formatCurrency,
  formatPercent,
} from '../lib/formatUtils';

interface LanguageContextType {
  language: LanguageCode;
  languageInfo: LanguageInfo;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: keyof TranslationDictionary, fallback?: string) => string;
  isRtl: boolean;
  dir: 'ltr' | 'rtl';
  supportedLanguages: LanguageInfo[];
  formatDate: (date: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (date: Date | string | number | null | undefined) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatPercent: (fraction: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'jobmatch_user_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [mounted, setMounted] = useState<boolean>(false);

  // Initialize from URL param, localStorage, cookie, or browser preferences
  useEffect(() => {
    try {
      let saved: LanguageCode | null = null;

      // 1. URL parameter takes highest precedence
      if (typeof window !== 'undefined' && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const qLang = urlParams.get('lang') as LanguageCode | null;
        if (qLang && SUPPORTED_LANGUAGES.some((l) => l.code === qLang)) {
          saved = qLang;
          localStorage.setItem(STORAGE_KEY, qLang);
          document.cookie = `${STORAGE_KEY}=${encodeURIComponent(qLang)}; path=/; max-age=31536000; SameSite=Lax`;
        }
      }

      // 2. Cookie
      if (!saved && typeof document !== 'undefined') {
        const matchCookie = document.cookie.match(/(?:^|; )jobmatch_user_language=([^;]+)/);
        if (matchCookie) {
          const cookieLang = decodeURIComponent(matchCookie[1]) as LanguageCode;
          if (SUPPORTED_LANGUAGES.some((l) => l.code === cookieLang)) {
            saved = cookieLang;
          }
        }
      }

      // 3. localStorage
      if (!saved && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
        if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
          saved = stored;
        }
      }

      if (saved) {
        React.startTransition(() => {
          setLanguageState(saved);
          setMounted(true);
        });
      } else {
        // 4. Inspect browser language (Accept-Language / navigator.language)
        const browserLang = (typeof navigator !== 'undefined' ? navigator.language : '')?.toLowerCase() || '';
        const match = SUPPORTED_LANGUAGES.find((l) =>
          browserLang.startsWith(l.code)
        );
        if (match) {
          localStorage.setItem(STORAGE_KEY, match.code);
          document.cookie = `${STORAGE_KEY}=${encodeURIComponent(match.code)}; path=/; max-age=31536000; SameSite=Lax`;
          React.startTransition(() => {
            setLanguageState(match.code);
            setMounted(true);
          });
        } else {
          React.startTransition(() => {
            setMounted(true);
          });
        }
      }
    } catch (e) {
      // Ignore storage errors
      setMounted(true);
    }
  }, []);

  const languageInfo = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === language) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [language]);

  const isRtl = languageInfo.dir === 'rtl';

  // Apply HTML lang and dir attributes on change
  useEffect(() => {
    if (!mounted) return;
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = languageInfo.dir;
      if (isRtl) {
        document.documentElement.classList.add('rtl');
        document.body.classList.add('rtl');
      } else {
        document.documentElement.classList.remove('rtl');
        document.body.classList.remove('rtl');
      }
    }
  }, [mounted, language, languageInfo, isRtl]);

  const setLanguage = (newLang: LanguageCode) => {
    if (!SUPPORTED_LANGUAGES.some((l) => l.code === newLang)) return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.cookie = `${STORAGE_KEY}=${encodeURIComponent(newLang)}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {
      // Ignore storage errors
    }

    if (typeof document !== 'undefined') {
      const info = SUPPORTED_LANGUAGES.find((l) => l.code === newLang) || SUPPORTED_LANGUAGES[0];
      document.documentElement.lang = newLang;
      document.documentElement.dir = info.dir;
      if (info.dir === 'rtl') {
        document.documentElement.classList.add('rtl');
        document.body.classList.add('rtl');
      } else {
        document.documentElement.classList.remove('rtl');
        document.body.classList.remove('rtl');
      }
    }
  };

  const t = (key: keyof TranslationDictionary, fallback?: string): string => {
    const dict = translations[language] || translations.en;
    if (dict && dict[key]) {
      return dict[key];
    }
    const enDict = translations.en;
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return fallback || String(key);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        languageInfo,
        setLanguage,
        t,
        isRtl,
        dir: languageInfo.dir,
        supportedLanguages: SUPPORTED_LANGUAGES,
        formatDate: (date, options) => formatDate(date, language, options),
        formatRelativeTime: (date) => formatRelativeTime(date, language),
        formatNumber: (value, options) => formatNumber(value, language, options),
        formatCurrency: (amount, currency = 'USD') => formatCurrency(amount, currency, language),
        formatPercent: (fraction) => formatPercent(fraction, language),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
