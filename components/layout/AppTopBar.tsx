'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import Logo from '@/app/components/Logo';
import LanguageSelector from '@/app/components/LanguageSelector';
import ThemeToggle from '@/app/components/ThemeToggle';
import { UserMenu } from './UserMenu';
import { BreadcrumbItem, Breadcrumbs } from './Breadcrumbs';
import { Menu, Sparkles, Plus } from 'lucide-react';

export interface AppTopBarProps {
  onOpenMobileDrawer: () => void;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function AppTopBar({
  onOpenMobileDrawer,
  breadcrumbs = [],
  title,
  description,
  actions,
  className = '',
}: AppTopBarProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <header
      className={`sticky top-0 z-sticky bg-surface/85 backdrop-blur-md border-b border-border shadow-subtle ${className}`}
    >
      {/* Skip to Content Keyboard Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:start-4 z-modal px-3.5 py-1.5 bg-brand text-on-accent text-xs font-semibold rounded-md shadow-elevated focus:outline-none focus:ring-2 focus:ring-focus"
      >
        {isAr ? 'الانتقال إلى المحتوى الأساسي' : 'Skip to main content'}
      </a>

      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Mobile View: Hamburger + Logo */}
        <div className="flex items-center gap-3 md:hidden min-w-0">
          <button
            type="button"
            onClick={onOpenMobileDrawer}
            aria-label={isAr ? 'فتح قائمة التنقل' : 'Open navigation menu'}
            className="p-2 rounded-md border border-border bg-surface hover:bg-surface-2 text-text-primary transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
          <Logo size="sm" />
        </div>

        {/* Desktop View: Breadcrumbs & Page Heading */}
        <div className="hidden md:flex items-center min-w-0 flex-1">
          {breadcrumbs.length > 0 || title ? (
            <Breadcrumbs items={breadcrumbs} title={title} description={description} />
          ) : (
            <div className="text-xs text-text-muted font-medium">
              {isAr ? 'لوحة التحكم والمستندات' : 'Workspace & Documents'}
            </div>
          )}
        </div>

        {/* Actions & User Menu Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {actions && <div className="hidden sm:flex items-center gap-2">{actions}</div>}

          {/* Quick Create Resume CTA on desktop */}
          <Link
            href="/builder"
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand text-on-accent hover:bg-brand-hover text-xs font-medium transition-colors shadow-subtle"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'سيرة جديدة' : 'New Resume'}</span>
          </Link>

          {/* AI Credits Pill */}
          {user && (
            <Link
              href="/pricing"
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-2 border border-border text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
              title={isAr ? 'ترقية رصيد الذكاء الاصطناعي' : 'Upgrade AI Credits'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {user.plan === 'pro'
                  ? (isAr ? 'غير محدود' : 'Unlimited')
                  : `${user.aiCredits ?? 3} ${isAr ? 'نقاط' : 'pts'}`}
              </span>
            </Link>
          )}

          {/* Theme Toggle (desktop) */}
          <div className="hidden sm:block">
            <ThemeToggle size="sm" />
          </div>

          {/* Language Selector (desktop) */}
          <div className="hidden sm:block">
            <LanguageSelector variant="compact" />
          </div>

          {/* Rich User Menu Dropdown */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

export default AppTopBar;
