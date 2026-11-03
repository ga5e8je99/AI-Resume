'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  className?: string;
  showNumbers?: boolean;
}

export function Accordion({
  items,
  className = '',
  showNumbers = false,
}: AccordionProps) {
  return (
    <div className={`space-y-3.5 sm:space-y-4 ${className}`}>
      {items.map((item, index) => (
        <details
          key={item.id}
          open={item.defaultOpen}
          className="group rounded-2xl border border-line-strong/80 bg-surface/90 backdrop-blur-sm transition-all duration-200 shadow-subtle hover:border-brand/40 hover:shadow-card open:border-brand/50 open:bg-surface open:shadow-card overflow-hidden"
        >
          <summary className="flex items-center justify-between gap-3.5 p-4 sm:p-5 text-sm sm:text-base font-semibold text-ink cursor-pointer list-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-2xl transition-colors [&::-webkit-details-marker]:hidden">
            {showNumbers && (
              <span
                dir="ltr"
                style={{ unicodeBidi: 'isolate' }}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-surface-2 text-ink-2 border border-line-strong/50 group-hover:border-brand/30 group-open:border-brand/40 group-open:bg-brand-soft group-open:text-brand flex items-center justify-center text-xs font-mono font-bold transition-all duration-200 shrink-0 [unicode-bidi:isolate]"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
            )}
            <span className="flex-1 text-ink group-hover:text-brand group-open:text-brand transition-colors text-start font-semibold leading-snug">
              {item.title}
            </span>
            <span className="w-8 h-8 rounded-full bg-surface-2 border border-line-strong/50 text-ink-2 group-hover:border-brand/30 group-hover:bg-brand-soft group-hover:text-brand group-open:rotate-180 group-open:bg-brand-soft group-open:text-brand group-open:border-brand/40 flex items-center justify-center transition-all duration-300 shrink-0 shadow-subtle">
              <ChevronDown className="w-4 h-4 transition-transform duration-300" />
            </span>
          </summary>
          <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm sm:text-[15px] text-ink-2 leading-relaxed border-t border-line-strong/50 pt-3.5 text-start">
            <div className={showNumbers ? 'sm:ps-11' : ''}>
              {item.content}
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
