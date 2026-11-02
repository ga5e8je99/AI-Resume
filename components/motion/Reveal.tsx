'use client';

import React from 'react';
import { useLanguage } from '@/app/context/LanguageContext';

export type RevealDirection = 'up' | 'down' | 'start' | 'end' | 'zoom' | 'fade';

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Logical entrance direction: 'up' | 'down' | 'start' | 'end' | 'zoom' | 'fade'. Default: 'up' */
  from?: RevealDirection;
  /** Backwards-compatible alias for `from` */
  direction?: RevealDirection;
  /** Delay in ms before revealing once in viewport (clamped to max 400ms for staggered items). Default: 0 */
  delay?: number;
  /** Backwards-compatible alias for `delay` */
  delayMs?: number;
  /** Animation duration in ms. Default: 700 (from AOS.init) */
  duration?: number;
  /** Optional index or boolean to automatically stagger children/items by 80ms up to 400ms */
  stagger?: number | boolean;
  /** Whether to trigger reveal only once (default: true) */
  once?: boolean;
}

function resolveAosAnimation(from: RevealDirection, dir: 'ltr' | 'rtl'): string {
  switch (from) {
    case 'up':
      return 'fade-up';
    case 'down':
      return 'fade-down';
    case 'start':
      // Logical inline-start: comes from the start edge towards the end edge.
      // In LTR (start = left), element slides from left -> right ('fade-right').
      // In RTL (start = right), element slides from right -> left ('fade-left').
      return dir === 'rtl' ? 'fade-left' : 'fade-right';
    case 'end':
      // Logical inline-end: comes from the end edge towards the start edge.
      // In LTR (end = right), element slides from right -> left ('fade-left').
      // In RTL (end = left), element slides from left -> right ('fade-right').
      return dir === 'rtl' ? 'fade-right' : 'fade-left';
    case 'zoom':
      return 'zoom-in';
    case 'fade':
      return 'fade';
    default:
      return 'fade-up';
  }
}

/**
 * RTL-aware AOS scroll reveal wrapper (<Reveal>).
 * Never use `data-aos` directly in pages — always use `<Reveal>` or `<Stagger>`.
 * Automatically flips `fade-left` <-> `fade-right` when `dir="rtl"`.
 */
export function Reveal({
  children,
  className = '',
  from,
  direction,
  delay,
  delayMs,
  duration,
  stagger,
  once = true,
}: RevealProps) {
  const { dir } = useLanguage();
  const effectiveFrom: RevealDirection = from ?? direction ?? 'up';

  // If `stagger={true}` is passed on a container, wrap each direct child with staggered delay (index * 80ms, max 400ms)
  if (stagger === true) {
    const items = React.Children.toArray(children).filter(Boolean);
    const baseDelay = delay ?? delayMs ?? 0;
    return (
      <div className={className}>
        {items.map((child, index) => {
          const key =
            React.isValidElement(child) && child.key != null ? child.key : index;
          const itemDelay = Math.min(baseDelay + index * 80, 400);
          return (
            <Reveal
              key={key}
              from={effectiveFrom}
              delay={itemDelay}
              duration={duration}
              once={once}
            >
              {child}
            </Reveal>
          );
        })}
      </div>
    );
  }

  const rawDelay =
    typeof stagger === 'number'
      ? Math.min(stagger * 80, 400)
      : (delay ?? delayMs ?? 0);
  const clampedDelay = Math.min(Math.max(0, rawDelay), 400);
  const aosName = resolveAosAnimation(effectiveFrom, dir);

  return (
    <div
      data-aos={aosName}
      data-aos-delay={clampedDelay > 0 ? String(clampedDelay) : undefined}
      data-aos-duration={duration ? String(duration) : undefined}
      data-aos-once={once ? 'true' : 'false'}
      className={className || undefined}
    >
      {children}
    </div>
  );
}

export interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  /** Automatic delay increment per child in ms. Default: 80ms (capped at 400ms) */
  staggerMs?: number;
  /** Base delay before the first child in ms. Default: 0ms */
  baseDelay?: number;
  /** Logical entrance direction for each child. Default: 'up' */
  from?: RevealDirection;
  /** Alias for `from` */
  direction?: RevealDirection;
  /** Optional duration in ms */
  duration?: number;
  /** Whether each item reveals only once. Default: true */
  once?: boolean;
  /** Optional className applied to each Reveal child wrapper */
  itemClassName?: string | ((index: number, total: number) => string);
}

/**
 * Stagger list wrapper that automatically wraps each child in <Reveal>
 * with `delay = Math.min(baseDelay + index * 80, 400)`.
 */
export function Stagger({
  children,
  className = '',
  staggerMs = 80,
  baseDelay = 0,
  from,
  direction,
  duration,
  once = true,
  itemClassName = '',
}: StaggerProps) {
  const items = React.Children.toArray(children).filter(Boolean);
  const effectiveFrom: RevealDirection = from ?? direction ?? 'up';

  return (
    <div className={className}>
      {items.map((child, index) => {
        const key =
          React.isValidElement(child) && child.key != null ? child.key : index;
        const itemDelay = Math.min(baseDelay + index * staggerMs, 400);
        const resolvedItemClass =
          typeof itemClassName === 'function'
            ? itemClassName(index, items.length)
            : itemClassName;
        return (
          <Reveal
            key={key}
            from={effectiveFrom}
            delay={itemDelay}
            duration={duration}
            once={once}
            className={resolvedItemClass}
          >
            {child}
          </Reveal>
        );
      })}
    </div>
  );
}

export default Reveal;
