'use client';

import React, { useEffect, useRef, useState } from 'react';

export type RevealDirection = 'up' | 'down' | 'start' | 'end' | 'fade';

export interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Entrance direction: 'up' | 'down' | 'start' | 'end' | 'fade'. Default: 'up' */
  direction?: RevealDirection;
  /** Delay in ms before revealing once in viewport. Default: 0 */
  delay?: number;
  /** Backwards-compatible alias for delay */
  delayMs?: number;
  /** Whether to trigger reveal only once (default: true) or toggle on exit */
  once?: boolean;
}

const HIDDEN_DIRECTION_CLASSES: Record<RevealDirection, string> = {
  up: 'opacity-0 translate-y-3',
  down: 'opacity-0 -translate-y-3',
  start: 'opacity-0 -translate-x-3 rtl:translate-x-3',
  end: 'opacity-0 translate-x-3 rtl:-translate-x-3',
  fade: 'opacity-0',
};

const VISIBLE_DIRECTION_CLASSES: Record<RevealDirection, string> = {
  up: 'opacity-100 translate-y-0',
  down: 'opacity-100 translate-y-0',
  start: 'opacity-100 translate-x-0',
  end: 'opacity-100 translate-x-0',
  fade: 'opacity-100',
};

/**
 * Lightweight IntersectionObserver scroll reveal wrapper using CSS motion tokens.
 * Respects prefers-reduced-motion via CSS (.scroll-reveal & motion-reduce:*).
 */
export function ScrollReveal({
  children,
  className = '',
  direction = 'up',
  delay,
  delayMs,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const effectiveDelay = delay ?? delayMs ?? 0;

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isAutomatedAudit =
      typeof navigator !== 'undefined' && navigator.webdriver === true;

    if (prefersReducedMotion || isAutomatedAudit) {
      return;
    }

    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      return;
    }

    let initialized = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            initialized = true;
            setIsVisible(true);
            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!initialized) {
            initialized = true;
            const viewportH =
              entry.rootBounds?.height ??
              (typeof window !== 'undefined' ? window.innerHeight : 800);
            // Only arm hidden state if strictly below the viewport fold (zero CLS)
            if (entry.boundingClientRect.top > viewportH + 32) {
              setIsVisible(false);
            } else if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -24px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const stateClass = isVisible
    ? `transition-[opacity,transform] duration-[var(--duration-slow,400ms)] ease-[var(--ease-out,cubic-bezier(.22,1,.36,1))] ${VISIBLE_DIRECTION_CLASSES[direction]}`
    : `transition-none ${HIDDEN_DIRECTION_CLASSES[direction]}`;

  return (
    <div
      ref={ref}
      style={
        isVisible && effectiveDelay > 0
          ? { transitionDelay: `${effectiveDelay}ms` }
          : undefined
      }
      className={`scroll-reveal motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100 ${stateClass} ${className}`}
    >
      {children}
    </div>
  );
}

export interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  /** Automatic delay increment per child in ms. Default: 60ms */
  staggerMs?: number;
  /** Base delay before the first child in ms. Default: 0ms */
  baseDelay?: number;
  /** Entrance direction for each child. Default: 'up' */
  direction?: RevealDirection;
  /** Whether each item reveals only once. Default: true */
  once?: boolean;
  /** Optional className applied to each ScrollReveal child wrapper */
  itemClassName?: string;
}

/**
 * Stagger list wrapper that automatically wraps each child in ScrollReveal
 * with an incremental 60ms delay (index * 60ms).
 */
export function Stagger({
  children,
  className = '',
  staggerMs = 60,
  baseDelay = 0,
  direction = 'up',
  once = true,
  itemClassName = '',
}: StaggerProps) {
  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <div className={className}>
      {items.map((child, index) => {
        const key =
          React.isValidElement(child) && child.key != null ? child.key : index;
        return (
          <ScrollReveal
            key={key}
            direction={direction}
            delay={baseDelay + index * staggerMs}
            once={once}
            className={itemClassName}
          >
            {child}
          </ScrollReveal>
        );
      })}
    </div>
  );
}

export default ScrollReveal;
