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
  const { language, isRtl } = useLanguage();
  const isAr = language === 'ar';

  const navItems = [
    {
      label: isAr ? 'لوحة التحكم' : 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: isAr ? 'منشئ السيرة الذاتية' : 'Resume Builder',
      href: '/builder',
      icon: FileText,
      badge: null,
    },
    {
      label: isAr ? 'السيرة الأكاديمية' : 'Academic CV',
      href: '/cv-builder',
      icon: Layers,
      badge: 'CV',
    },
    {
      label: isAr ? 'خطاب التقديم' : 'Cover Letter',
      href: '/cover-letter',
      icon: Mail,
      badge: 'AI',
    },
    {
      label: isAr ? 'فحص الـ ATS' : 'ATS Review',
      href: '/review',
      icon: ShieldCheck,
      badge: null,
    },
    {
      label: isAr ? 'الأسعار والترقية' : 'Pricing & Plans',
      href: '/pricing',
      icon: CreditCard,
      badge: user?.plan === 'pro' ? 'PRO' : null,
    },
  ];

  if (user?.role === 'admin') {
    navItems.push({
      label: isAr ? 'لوحة الإدارة' : 'Admin Panel',
      href: '/admin',
      icon: ShieldAlert,
      badge: 'Admin',
    });
  }

  return (
    <aside
      aria-label={isAr ? 'الشريط الجانبي للتنقل' : 'Sidebar Navigation'}
      className={`hidden md:flex flex-col shrink-0 h-screen sticky top-0 bg-surface border-e border-border transition-all duration-200 z-sticky ${
        collapsed ? 'w-16' : 'w-64'
      } ${className}`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-border justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md p-1"
          title={isAr ? 'جوب ماتش AI' : 'JobMatch AI'}
        >
          {collapsed ? (
            <div className="w-8 h-8 rounded-md bg-brand-soft border border-brand/20 flex items-center justify-center font-serif font-bold text-brand text-base shrink-0">
              J
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Logo size="sm" withLink={false} />
              {user?.isDemo && (
                <span className="hidden lg:inline-flex text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all group relative cursor-pointer ${
                isActive
                  ? 'bg-brand-soft text-brand font-semibold shadow-subtle border-s-2 border-brand'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive ? 'text-brand' : 'text-text-muted group-hover:text-text-primary'
                }`}
                aria-hidden="true"
              />

              {!collapsed && (
                <>
                  <span className="truncate flex-1">{item.label}</span>
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
      <div className="p-3 border-t border-border space-y-2">
        {/* Demo status alert if user is demo */}
        {user?.isDemo && !collapsed && (
          <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold">{isAr ? 'وضع تجريبي نشط' : 'Demo Mode Active'}</p>
              <p className="text-[10px] text-amber-400/80 truncate">
                {isAr ? 'جلسة تجريبية غير مقيدة' : 'Temporary demo session'}
              </p>
            </div>
          </div>
        )}

        {/* AI Credits Pill if expanded */}
        {!collapsed && (
          <div className="px-2.5 py-2 rounded-md bg-surface-2/60 border border-border flex items-center justify-between text-xs">
            <span className="text-text-secondary flex items-center gap-1.5 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'رصيد الذكاء الاصطناعي:' : 'AI Credits:'}</span>
            </span>
            <span className="font-mono font-semibold text-text-primary text-[11px]">
              {user?.plan === 'pro'
                ? (isAr ? 'غير محدود' : 'Unlimited')
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
              ? isAr
                ? 'توسيع الشريط الجانبي'
                : 'Expand sidebar'
              : isAr
              ? 'طي الشريط الجانبي'
              : 'Collapse sidebar'
          }
          className={`w-full flex items-center gap-2 py-2 px-2.5 rounded-md border border-border bg-surface hover:bg-surface-2 text-text-muted hover:text-text-primary text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            collapsed ? 'justify-center px-0' : 'justify-between'
          }`}
        >
          {!collapsed && (
            <span className="text-[11px] font-medium">
              {isAr ? 'طي القائمة' : 'Collapse'}
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
