import React from 'react';

/**
 * Route transition template: applies a 250ms (--duration-base) opacity + translateY(8px)
 * entrance animation (.page-transition-enter in globals.css) on route changes.
 * Automatically disabled when prefers-reduced-motion: reduce is active.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-transition-enter">{children}</div>;
}
