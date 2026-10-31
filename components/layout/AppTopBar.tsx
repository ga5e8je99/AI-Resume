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
  const { t } = useLanguage();

  return (
    <header
      className={`sticky top-0 z-sticky bg-surface backdrop-blur-md border-b border-line-strong shadow-subtle ${className}`}
    >
      {/* Skip to Content Keyboard Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:start-4 z-modal px-3.5 py-2 min-h-[44px] inline-flex items-center bg-brand text-on-accent text-xs font-semibold rounded-md shadow-elevated focus:outline-none focus:ring-2 focus:ring-focus"
      >
        {t('shell_skip_content')}
      </a>

      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Mobile & Tablet View (<lg / <1024px): Hamburger + Logo */}
        <div className="flex items-center gap-3 lg:hidden min-w-0">
          <button
            type="button"
            onClick={onOpenMobileDrawer}
            aria-label={t('shell_open_menu')}
            className="min-h-[44px] min-w-[44px] p-2.5 flex items-center justify-center rounded-md border border-line-strong bg-surface hover:bg-surface-2 text-ink transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
          <Logo size="sm" />
        </div>

        {/* Desktop View (>=1024px / lg+): Breadcrumbs & Page Heading */}
        <div className="hidden lg:flex items-center min-w-0 flex-1">
          {breadcrumbs.length > 0 || title ? (
            <Breadcrumbs items={breadcrumbs} title={title} description={description} />
          ) : (
            <div className="text-xs text-ink-2 font-medium">
              {t('shell_workspace_heading')}
            </div>
          )}
        </div>

        {/* Actions & User Menu Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {actions && <div className="hidden sm:flex items-center gap-2">{actions}</div>}

          {/* Quick Create Resume CTA on desktop */}
          <Link
            href="/builder"
            className="hidden xl:inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-md bg-brand text-on-accent hover:bg-brand-hover text-xs font-medium transition-colors shadow-subtle"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('dashboard_btn_new_resume')}</span>
          </Link>

          {/* AI Credits Pill */}
          {user && (
            <Link
              href="/pricing"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-full text-xs font-medium bg-surface-2 border border-line-strong text-ink-2 hover:text-ink transition-colors"
              title={t('credits_upgrade_title')}
            >
              <Sparkles className="w-3.5 h-3.5 text-warning" />
              <span>
                {user.plan === 'pro'
                  ? t('credits_unlimited')
                  : `${user.aiCredits ?? 3} ${t('credits_label')}`}
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
