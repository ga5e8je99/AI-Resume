'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import Logo from '@/app/components/Logo';
import { Tooltip } from '@/components/ui/Tooltip';
import { Badge } from '@/components/ui/Badge';
import {
  LayoutDashboard,
  FileText,
  Layers,
  Mail,
  ShieldCheck,
  CreditCard,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Zap,
  Sparkles,
} from 'lucide-react';

export interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export function AppSidebar({
  collapsed,
  onToggleCollapse,
  className = '',
}: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isRtl, t } = useLanguage();

  const navItems = [
    {
      label: t('nav_dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: t('nav_resume_builder'),
      href: '/builder',
      icon: FileText,
      badge: null,
    },
    {
      label: t('nav_cv_builder'),
      href: '/cv-builder',
      icon: Layers,
      badge: 'CV',
    },
    {
      label: t('nav_cover_letter'),
      href: '/cover-letter',
      icon: Mail,
      badge: 'AI',
    },
    {
      label: t('nav_ats_review'),
      href: '/review',
      icon: ShieldCheck,
      badge: null,
    },
    {
      label: t('nav_pricing'),
      href: '/pricing',
      icon: CreditCard,
      badge: user?.plan === 'pro' ? 'PRO' : null,
    },
  ];

  if (user?.role === 'admin') {
    navItems.push({
      label: t('nav_admin'),
      href: '/admin',
      icon: ShieldAlert,
      badge: 'Admin',
    });
  }

  return (
    <aside
      aria-label={t('shell_sidebar_aria')}
      className={`hidden lg:flex flex-col shrink-0 h-[100dvh] sticky top-0 bg-surface border-e border-line-strong transition-all duration-200 z-sticky ${collapsed ? 'w-16' : 'w-64'
        } ${className}`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-3 border-b border-line-strong justify-between">
        <Link
          href="/dashboard"
          className="min-h-[44px] min-w-[44px] flex items-center gap-2.5 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md p-1.5"
          title={t('nav_brand')}
        >
          {collapsed ? (
            <div className="w-8 h-8 rounded-md bg-brand-soft border border-brand/20 flex items-center justify-center font-serif font-bold text-brand text-base shrink-0">
              J
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <Logo size="sm" withLink={false} />
              {user?.isDemo && (
                <span className="hidden lg:inline-flex text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-warning-soft text-warning border border-warning/25">
                  DEMO
                </span>
              )}
            </div>
          )}
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          const navButton = (
            <Link
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`min-h-[44px] min-w-[44px] flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all group relative cursor-pointer ${isActive
                  ? 'bg-brand-soft text-brand font-semibold shadow-subtle border-s-2 border-brand'
                  : 'text-ink-2 hover:text-ink hover:bg-surface-2'
                } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-brand' : 'text-ink-2 group-hover:text-ink'
                  }`}
                aria-hidden="true"
              />

              {!collapsed && (
                <>
                  <span className="truncate flex-1 min-w-0">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant={item.badge === 'PRO' ? 'accent' : 'default'}
                      size="sm"
                      className="text-[10px] px-1.5 py-0 shrink-0 font-mono"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href} content={item.label} position={isRtl ? 'left' : 'right'}>
                {navButton}
              </Tooltip>
            );
          }

          return <div key={item.href}>{navButton}</div>;
        })}
      </nav>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-line-strong space-y-2">
        {/* Demo status alert if user is demo */}
        {user?.isDemo && !collapsed && (
          <div className="p-2.5 rounded-md bg-warning-soft border border-warning/20 text-[11px] text-warning flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold">{t('shell_demo_active')}</p>
              <p className="text-[10px] text-warning/80 truncate">
                {t('shell_demo_sub')}
              </p>
            </div>
          </div>
        )}

        {/* AI Credits Pill if expanded */}
        {!collapsed && (
          <div className="px-2.5 py-2 min-h-[44px] rounded-md bg-surface-2 border border-line-strong flex items-center justify-between text-xs">
            <span className="text-ink-2 flex items-center gap-1.5 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-warning" />
              <span>{t('shell_ai_credits')}</span>
            </span>
            <span className="font-mono font-semibold text-ink text-[11px]">
              {user?.plan === 'pro'
                ? t('credits_unlimited')
                : (user?.aiCredits ?? 3)}
            </span>
          </div>
        )}

        {/* Collapse / Expand Toggle Button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={
            collapsed
              ? t('shell_expand_sidebar')
              : t('shell_collapse_sidebar')
          }
          className={`min-h-[44px] min-w-[44px] w-full flex items-center gap-2 py-2.5 px-3 rounded-md border border-line-strong bg-surface hover:bg-surface-2 text-ink-2 hover:text-ink text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${collapsed ? 'justify-center px-0' : 'justify-between'
            }`}
        >
          {!collapsed && (
            <span className="text-[11px] font-medium">
              {t('shell_collapse_label')}
            </span>
          )}
          {collapsed ? (
            <ChevronRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
          ) : (
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
          )}
        </button>
      </div>
    </aside>
  );
}

export default AppSidebar;
