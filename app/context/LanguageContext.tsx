'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  LanguageCode,
  LanguageInfo,
  SUPPORTED_LANGUAGES,
  TranslationDictionary,
  translations,
} from '../lib/translations';

interface LanguageContextType {
  language: LanguageCode;
  languageInfo: LanguageInfo;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: keyof TranslationDictionary, fallback?: string) => string;
  isRtl: boolean;
  dir: 'ltr' | 'rtl';
  supportedLanguages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'jobmatch_user_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [mounted, setMounted] = useState<boolean>(false);

  // Initialize from localStorage or browser preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        setLanguageState(saved);
      } else {
        // Inspect browser language
        const browserLang = navigator.language?.toLowerCase() || '';
        const match = SUPPORTED_LANGUAGES.find((l) =>
          browserLang.startsWith(l.code)
        );
        if (match) {
          setLanguageState(match.code);
        }
      }
    } catch (e) {
      // Ignore storage errors
    } finally {
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
  }, [language, languageInfo, isRtl]);

  const setLanguage = (newLang: LanguageCode) => {
    if (!SUPPORTED_LANGUAGES.some((l) => l.code === newLang)) return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (e) {
      // Ignore storage errors
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
