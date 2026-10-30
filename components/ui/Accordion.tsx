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
}

export function Accordion({ items, className = '' }: AccordionProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item) => (
        <details
          key={item.id}
          open={item.defaultOpen}
          className="group rounded-lg border border-border bg-surface transition-all duration-150 open:border-border-strong open:shadow-subtle"
        >
          <summary className="flex items-center justify-between gap-4 p-4 sm:p-5 font-serif text-base sm:text-lg font-medium text-text-primary cursor-pointer list-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-lg">
            <span>{item.title}</span>
            <ChevronDown className="w-4 h-4 text-text-muted transition-transform duration-200 group-open:rotate-180 shrink-0" />
          </summary>
          <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-sm text-text-secondary leading-relaxed border-t border-border/50 pt-3 text-start">
            {item.content}
          </div>
        </details>
      ))}
    </div>
  );
}
