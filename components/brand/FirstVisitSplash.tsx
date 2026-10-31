'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import LogoMark from './LogoMark';

const MAX_SPLASH_DURATION_MS = 500;
const FADE_START_MS = 320;
const SPLASH_SESSION_KEY = 'jobmatch_session_visited';

let splashEvaluated = false;
let splashShouldShow = false;
let splashDismissed = false;
const splashListeners = new Set<() => void>();

function subscribeSplashStore(listener: () => void): () => void {
  splashListeners.add(listener);
  return () => {
    splashListeners.delete(listener);
  };
}

function getSplashClientSnapshot(): boolean {
  if (splashDismissed || typeof window === 'undefined') {
    return false;
  }

  if (!splashEvaluated) {
    splashEvaluated = true;

    // SSR already renders the full page immediately; only show splash if explicitly enabled
    const explicitlyEnabled =
      (window as unknown as { __ENABLE_SPLASH?: boolean }).__ENABLE_SPLASH === true;
    if (!explicitlyEnabled) {
      splashShouldShow = false;
      return false;
    }

    // 1. Skip for crawlers, automated audits, and search engine bots
    const isCrawler =
      navigator.webdriver === true ||
      /bot|googlebot|crawler|spider|robot|crawling|lighthouse|headless/i.test(
        navigator.userAgent
      );
    if (isCrawler) {
      splashShouldShow = false;
      return false;
    }

    // 2. Skip immediately if user prefers reduced motion
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      splashShouldShow = false;
      return false;
    }

    // 3. Storage check: only execute on very first visit in this browser session
    try {
      if (sessionStorage.getItem(SPLASH_SESSION_KEY)) {
        splashShouldShow = false;
        return false;
      }
      sessionStorage.setItem(SPLASH_SESSION_KEY, 'true');
      splashShouldShow = true;
    } catch {
      splashShouldShow = false;
      return false;
    }
  }

  return splashShouldShow;
}

function getSplashServerSnapshot(): boolean {
  return false;
}

export default function FirstVisitSplash() {
  const mounted = useSyncExternalStore(
    subscribeSplashStore,
    getSplashClientSnapshot,
    getSplashServerSnapshot
  );
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!mounted) return;

    // Begin crossfade out before 500ms cap
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, FADE_START_MS);

    // Completely unmount at strictly <= 500ms
    const removeTimer = setTimeout(() => {
      splashDismissed = true;
      splashShouldShow = false;
      splashListeners.forEach((listener) => listener());
    }, MAX_SPLASH_DURATION_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-paper pointer-events-none transition-opacity duration-150 ease-out select-none ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`transform transition-all duration-150 ease-out flex flex-col items-center gap-3 ${
          fadeOut ? 'scale-105 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="p-3.5 rounded-2xl bg-surface border border-line-strong shadow-card">
          <LogoMark size={44} />
        </div>
        <span className="font-serif text-sm font-medium tracking-tight text-ink-2">
          JobMatch AI
        </span>
      </div>
    </div>
  );
}
