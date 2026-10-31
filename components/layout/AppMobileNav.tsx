'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/app/context/LanguageContext';
import {
  LayoutDashboard,
  FileText,
  Mail,
  ShieldCheck,
  Menu,
} from 'lucide-react';

export interface AppMobileNavProps {
  onOpenDrawer: () => void;
  className?: string;
}

export function AppMobileNav({ onOpenDrawer, className = '' }: AppMobileNavProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    {
      label: t('nav_home'),
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: t('nav_resume_builder'),
      href: '/builder',
      icon: FileText,
    },
    {
      label: t('nav_cover_letter'),
      href: '/cover-letter',
      icon: Mail,
    },
    {
      label: t('nav_ats_review'),
      href: '/review',
      icon: ShieldCheck,
    },
  ];

  return (
    <nav
      aria-label={t('shell_bottom_nav_aria')}
      className={`lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface backdrop-blur-md border-t border-line-strong shadow-elevated pb-[env(safe-area-inset-bottom)] ${className}`}
    >
      <div className="grid grid-cols-5 h-16 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] py-1.5 transition-colors relative cursor-pointer ${
                isActive
                  ? 'text-brand font-semibold'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              {isActive && (
                <span
                  className="absolute top-0 inset-x-3 h-0.5 bg-brand rounded-full"
                  aria-hidden="true"
                />
              )}
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More / Menu Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label={t('shell_open_menu')}
          className="flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] py-1.5 text-ink-2 hover:text-ink transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
          <span className="text-[10px] mt-0.5 tracking-tight">
            {t('shell_more')}
          </span>
        </button>
      </div>
    </nav>
  );
}

export default AppMobileNav;
