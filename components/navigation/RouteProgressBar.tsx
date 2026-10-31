'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export interface RouteProgressBarProps {
  /** Anti-flicker delay in milliseconds (defaults to 0ms so every route transition shows progress) */
  delay?: number;
  /** Minimum visible time in milliseconds once shown (defaults to 220ms) */
  minVisibleTime?: number;
}

function RouteProgressBarInner({
  delay = 0,
  minVisibleTime = 220,
}: RouteProgressBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const flickerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const trickleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safeguardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const visibleStartTimeRef = useRef<number | null>(null);
  const isPendingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(mq.matches);
    handleChange();
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const clearAllTimers = useCallback(() => {
    if (flickerTimerRef.current) clearTimeout(flickerTimerRef.current);
    if (trickleTimerRef.current) clearInterval(trickleTimerRef.current);
    if (safeguardTimerRef.current) clearTimeout(safeguardTimerRef.current);
    flickerTimerRef.current = null;
    trickleTimerRef.current = null;
    safeguardTimerRef.current = null;
  }, []);

  const cancelTransition = useCallback(() => {
    isPendingRef.current = false;
    clearAllTimers();
    setIsCompleting(true);
    setProgress(0);
    setIsVisible(false);
    visibleStartTimeRef.current = null;
  }, [clearAllTimers]);

  const startTransition = useCallback(() => {
    if (isPendingRef.current) return;
    isPendingRef.current = true;
    setIsCompleting(false);

    clearAllTimers();

    const activateBar = () => {
      visibleStartTimeRef.current = Date.now();
      setIsVisible(true);
      setProgress(28);

      trickleTimerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) return prev;
          const remaining = 85 - prev;
          const step = Math.max(1.5, remaining * 0.18);
          return Math.min(85, prev + step);
        });
      }, 160);
    };

    if (delay <= 0) {
      activateBar();
    } else {
      flickerTimerRef.current = setTimeout(activateBar, delay);
    }

    // Safeguard: auto-cancel after 8s if navigation is abandoned or stuck
    safeguardTimerRef.current = setTimeout(() => {
      cancelTransition();
    }, 8000);
  }, [delay, clearAllTimers, cancelTransition]);

  const completeTransition = useCallback(() => {
    isPendingRef.current = false;

    if (!isVisible && visibleStartTimeRef.current === null) {
      clearAllTimers();
      setProgress(0);
      return;
    }

    clearAllTimers();

    const elapsed = visibleStartTimeRef.current
      ? Date.now() - visibleStartTimeRef.current
      : minVisibleTime;
    const remainingHold = Math.max(0, minVisibleTime - elapsed);

    setTimeout(() => {
      setIsCompleting(true);
      setProgress(100);

      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
        setIsCompleting(false);
        visibleStartTimeRef.current = null;
      }, 180);
    }, remainingHold);

    // Accessibility focus management: shift focus to page's primary heading or main content without scrolling
    setTimeout(() => {
      const target = document.querySelector(
        'main h1, h1, [role="main"] h1, main, [role="main"]'
      ) as HTMLElement | null;
      if (target) {
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
        }
        target.focus({ preventScroll: true });
      }
    }, remainingHold + 50);
  }, [isVisible, minVisibleTime, clearAllTimers]);

  // Complete progress bar when route pathname or searchParams update
  useEffect(() => {
    completeTransition();
  }, [pathname, searchParams, completeTransition]);

  // Intercept anchor clicks, router.push (via history pushState/replaceState), popstate, and Escape
  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.defaultPrevented
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement)?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:')
      ) {
        return;
      }

      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        if (targetUrl.origin !== window.location.origin) return;
        if (
          targetUrl.pathname === window.location.pathname &&
          targetUrl.search === window.location.search
        ) {
          return;
        }
        startTransition();
      } catch {
        // Ignore malformed URLs
      }
    };

    const handlePopState = () => {
      startTransition();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPendingRef.current) {
        cancelTransition();
      }
    };

    const origPushState = window.history.pushState;
    const origReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      const url = args[2];
      if (url) {
        try {
          const targetUrl = new URL(String(url), window.location.href);
          if (
            targetUrl.origin === window.location.origin &&
            (targetUrl.pathname !== window.location.pathname ||
              targetUrl.search !== window.location.search)
          ) {
            startTransition();
          }
        } catch {
          // Intentionally ignored: malformed URL passed to history.pushState should not break native history API
        }
      }
      return origPushState.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      const url = args[2];
      if (url) {
        try {
          const targetUrl = new URL(String(url), window.location.href);
          if (
            targetUrl.origin === window.location.origin &&
            (targetUrl.pathname !== window.location.pathname ||
              targetUrl.search !== window.location.search)
          ) {
            startTransition();
          }
        } catch {
          // Intentionally ignored: malformed URL passed to history.replaceState should not break native history API
        }
      }
      return origReplaceState.apply(this, args);
    };

    const handleCustomStart = () => startTransition();
    const handleCustomComplete = () => completeTransition();
    const handleCustomCancel = () => cancelTransition();

    document.addEventListener('click', handleAnchorClick, true);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('app:navigation-start', handleCustomStart);
    window.addEventListener('app:navigation-complete', handleCustomComplete);
    window.addEventListener('app:navigation-cancel', handleCustomCancel);

    return () => {
      document.removeEventListener('click', handleAnchorClick, true);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('app:navigation-start', handleCustomStart);
      window.removeEventListener('app:navigation-complete', handleCustomComplete);
      window.removeEventListener('app:navigation-cancel', handleCustomCancel);
      window.history.pushState = origPushState;
      window.history.replaceState = origReplaceState;
      clearAllTimers();
    };
  }, [startTransition, completeTransition, cancelTransition, clearAllTimers]);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 start-0 h-[3px] bg-accent z-[9999] pointer-events-none"
      style={{
        width: `${progress}%`,
        opacity: isVisible ? 1 : 0,
        transition: prefersReducedMotion
          ? 'none'
          : isCompleting
          ? 'width 160ms ease-out, opacity 180ms ease-in 50ms'
          : 'width 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 120ms ease-in',
      }}
    />
  );
}

export default function RouteProgressBar(props: RouteProgressBarProps) {
  return (
    <Suspense fallback={null}>
      <RouteProgressBarInner {...props} />
    </Suspense>
  );
}
