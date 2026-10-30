'use client';

import React, { useEffect, useState } from 'react';
import LogoMark from './LogoMark';

export default function FirstVisitSplash() {
  const [mounted, setMounted] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // 1. Guard against SSR
    if (typeof window === 'undefined') return;

    // 2. Skip for crawlers and search engine bots to protect SEO & indexing
    const isCrawler = /bot|googlebot|crawler|spider|robot|crawling|lighthouse|headless/i.test(
      navigator.userAgent
    );
    if (isCrawler) return;

    // 3. Skip if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // 4. Session storage check: only execute on very first visit in this browser session
    try {
      if (sessionStorage.getItem('jobmatch_session_visited')) {
        return;
      }
      sessionStorage.setItem('jobmatch_session_visited', 'true');
    } catch {
      // If sessionStorage is unavailable (e.g. strict privacy mode), skip splash
      return;
    }

    // Activate splash overlay
    setMounted(true);

    // Crossfade out at 550ms
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 550);

    // Completely unmount at 800ms
    const removeTimer = setTimeout(() => {
      setMounted(false);
    }, 800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-bg pointer-events-none transition-opacity duration-250 ease-out select-none ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`transform transition-all duration-400 ease-out flex flex-col items-center gap-3 ${
          fadeOut ? 'scale-105 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="p-3.5 rounded-2xl bg-surface border border-border shadow-card">
          <LogoMark size={44} />
        </div>
        <span className="font-serif text-sm font-medium tracking-tight text-text-muted">
          JobMatch AI
        </span>
      </div>
    </div>
  );
}
