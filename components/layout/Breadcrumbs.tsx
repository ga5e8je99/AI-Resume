'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/app/context/LanguageContext';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function Breadcrumbs({
  items = [],
  title,
  description,
  actions,
  className = '',
}: BreadcrumbsProps) {
  const { t } = useLanguage();

  return (
    <div className={`space-y-1.5 min-w-0 max-w-full ${className}`}>
      {/* Breadcrumb Trail */}
      {items.length > 0 && (
        <nav
          aria-label={t('shell_breadcrumb_aria')}
          className="flex items-center gap-1.5 text-xs text-ink-2 overflow-x-auto no-scrollbar py-0.5"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-ink-2 hover:text-ink transition-colors shrink-0"
            title={t('nav_home')}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only sm:not-sr-only text-[11px]">
              {t('nav_home')}
            </span>
          </Link>

          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <React.Fragment key={`${item.label}-${index}`}>
                <ChevronRight
                  className="w-3.5 h-3.5 text-ink-2 shrink-0 rtl:rotate-180"
                  aria-hidden="true"
                />
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="text-ink-2 hover:text-ink transition-colors truncate max-w-[120px] sm:max-w-[200px]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className={`truncate max-w-[150px] sm:max-w-[240px] ${
                      isLast ? 'text-ink font-medium' : 'text-ink-2'
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Page Title & Description + Actions Header */}
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <div className="min-w-0 flex-1">
            {title && (
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-ink tracking-tight truncate">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-ink-2 mt-0.5 line-clamp-2 max-w-2xl">
                {description}
              </p>
            )}
          </div>

          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
    </div>
  );
}

export default Breadcrumbs;
