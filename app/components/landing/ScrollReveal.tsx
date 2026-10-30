'use client';

import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

/**
 * ScrollReveal: Lightweight, accessible scroll-reveal container.
 * - 200ms duration fade and translateY(12px)
 * - Safe for prefers-reduced-motion (disables animation entirely)
 * - Zero layout shift (GPU-accelerated transform only)
 */
export default function ScrollReveal({
  children,
  className = '',
  delayMs = 0,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If prefers-reduced-motion is requested, reveal immediately
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsVisible(true);
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delayMs > 0) {
              setTimeout(() => {
                setIsVisible(true);
              }, delayMs);
            } else {
              setIsVisible(true);
            }
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -30px 0px',
        threshold: 0.08,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [delayMs]);

  return (
    <div
      ref={elementRef}
      className={clsx(
        'transition-all duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-3',
        className
      )}
    >
      {children}
    </div>
  );
}
