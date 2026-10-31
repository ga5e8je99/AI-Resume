'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
}

const THEME_STORAGE_KEY = 'jobmatch_theme';
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themeStoreListeners = new Set<() => void>();

function subscribeThemePreference(listener: () => void): () => void {
  themeStoreListeners.add(listener);
  if (typeof window === 'undefined') {
    return () => {
      themeStoreListeners.delete(listener);
    };
  }
  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      listener();
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => {
    themeStoreListeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}

function getThemePreferenceSnapshot(): ThemePreference {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // Intentionally ignored: localStorage may be inaccessible in private browsing or sandboxed iframes
    }
  }
  return 'system';
}

function getThemePreferenceServerSnapshot(): ThemePreference {
  return 'system';
}

function subscribeSystemColorScheme(listener: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', listener);
  return () => mediaQuery.removeEventListener('change', listener);
}

function getSystemColorSchemeSnapshot(): ResolvedTheme {
  if (typeof window !== 'undefined') {
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') {
      return attr;
    }
  }
  return 'light';
}

function getSystemColorSchemeServerSnapshot(): ResolvedTheme {
  return 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeThemePreference,
    getThemePreferenceSnapshot,
    getThemePreferenceServerSnapshot
  );

  const systemTheme = useSyncExternalStore(
    subscribeSystemColorScheme,
    getSystemColorSchemeSnapshot,
    getSystemColorSchemeServerSnapshot
  );

  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    const root = document.documentElement;
    const resolved: ResolvedTheme = resolvedTheme;

    root.setAttribute('data-theme', resolved);

    if (resolved === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [resolvedTheme]);

  const setTheme = useCallback((newTheme: ThemePreference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Intentionally ignored: localStorage write may fail in private browsing; in-memory listeners still update UI
    }
    themeStoreListeners.forEach((listener) => listener());
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback for components rendered outside provider
    return {
      theme: 'system' as ThemePreference,
      resolvedTheme: 'light' as ResolvedTheme,
      setTheme: () => {},
    };
  }
  return context;
}
