'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export interface RouteProgressBarProps {
  /** Anti-flicker delay in milliseconds (defaults to 150ms) */
  delay?: number;
  /** Minimum visible time in milliseconds once shown (defaults to 300ms) */
  minVisibleTime?: number;
}

function RouteProgressBarInner({
  delay = 150,
  minVisibleTime = 300,
}: RouteProgressBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isRtl, setIsRtl] = useState(false);

  const flickerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const trickleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safeguardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const visibleStartTimeRef = useRef<number | null>(null);
  const isPendingRef = useRef(false);

  // Check RTL document direction
  useEffect(() => {
    const updateDir = () => {
      const dir =
        document.documentElement.getAttribute('dir') ||
        document.body.getAttribute('dir') ||
        (document.documentElement.classList.contains('rtl') ? 'rtl' : 'ltr');
      setIsRtl(dir === 'rtl');
    };
    updateDir();

    const observer = new MutationObserver(updateDir);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir', 'class'],
    });
    return () => observer.disconnect();
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

    // Anti-flicker rule: Only display if navigation exceeds the delay threshold (150ms)
    flickerTimerRef.current = setTimeout(() => {
      visibleStartTimeRef.current = Date.now();
      setIsVisible(true);
      setProgress(24);

      // Smooth trickle toward ~85%
      trickleTimerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) return prev;
          const remaining = 85 - prev;
          const step = Math.max(1, remaining * 0.15);
          return Math.min(85, prev + step);
        });
      }, 200);
    }, delay);

    // Safeguard: auto-cancel after 8s if navigation is abandoned or stuck
    safeguardTimerRef.current = setTimeout(() => {
      cancelTransition();
    }, 8000);
  }, [delay, clearAllTimers, cancelTransition]);

  const completeTransition = useCallback(() => {
    isPendingRef.current = false;

    // If navigation completed under anti-flicker threshold (150ms), abort cleanly without rendering
    if (!isVisible) {
      clearAllTimers();
      setProgress(0);
      return;
    }

    clearAllTimers();

    // Anti-flicker rule: Once shown, keep visible for at least minVisibleTime (300ms)
    const elapsed = visibleStartTimeRef.current
      ? Date.now() - visibleStartTimeRef.current
      : minVisibleTime;
    const remainingHold = Math.max(0, minVisibleTime - elapsed);

    setTimeout(() => {
      setIsCompleting(true);
      setProgress(100);

      // Fade out and reset state cleanly
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
        setIsCompleting(false);
        visibleStartTimeRef.current = null;
      }, 220);
    }, remainingHold);

    // Accessibility focus management: shift focus to page's primary heading or main content
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
    }, remainingHold + 60);
  }, [isVisible, minVisibleTime, clearAllTimers]);

  // Route change completion
  useEffect(() => {
    completeTransition();
  }, [pathname, searchParams, completeTransition]);

  // Intercept anchor clicks, router.push (via history pushState/replaceState), popstate, and Escape
  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      // Must be standard left-click without modifier keys
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

      // Ignore downloads, external targets, hash anchors, mailto, tel, javascript
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

        // Ignore external domains
        if (targetUrl.origin !== window.location.origin) return;

        // Ignore same-URL navigations (including same path with hash-only changes)
        if (
          targetUrl.pathname === window.location.pathname &&
          targetUrl.search === window.location.search
        ) {
          return;
        }

        startTransition();
      } catch {
        // Fallback for relative or malformed URLs
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

    // Monkey-patch history.pushState and history.replaceState to capture programmatic router.push
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
        } catch {}
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
        } catch {}
      }
      return origReplaceState.apply(this, args);
    };

    // Custom navigation events listeners for explicit app triggers
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
      style={{
        position: 'fixed',
        top: 0,
        insetInlineStart: 0,
        [isRtl ? 'right' : 'left']: 0,
        height: '3px',
        width: `${progress}%`,
        backgroundColor: 'var(--brand, #0F5C4D)',
        boxShadow:
          'var(--shadow-glow, 0 0 10px rgba(15, 92, 77, 0.45)), 0 0 4px var(--brand, #0F5C4D)',
        opacity: isVisible ? 1 : 0,
        transition: isCompleting
          ? 'width 180ms ease-out, opacity 200ms ease-in 60ms'
          : 'width 250ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease-in',
        zIndex: 9999,
        pointerEvents: 'none',
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
