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
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const navItems = [
    {
      label: isAr ? 'الرئيسية' : 'Home',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: isAr ? 'السيرة' : 'Resume',
      href: '/builder',
      icon: FileText,
    },
    {
      label: isAr ? 'الخطاب' : 'Letter',
      href: '/cover-letter',
      icon: Mail,
    },
    {
      label: isAr ? 'فحص' : 'Review',
      href: '/review',
      icon: ShieldCheck,
    },
  ];

  return (
    <nav
      aria-label={isAr ? 'التنقل السفلي للهواتف' : 'Mobile Bottom Navigation'}
      className={`md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border shadow-elevated pb-[env(safe-area-inset-bottom)] ${className}`}
    >
      <div className="grid grid-cols-5 h-14 items-center">
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
              className={`flex flex-col items-center justify-center h-full min-h-[44px] py-1 transition-colors relative cursor-pointer ${
                isActive
                  ? 'text-brand font-semibold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {isActive && (
                <span
                  className="absolute top-0 inset-x-3 h-0.5 bg-brand rounded-full"
                  aria-hidden="true"
                />
              )}
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[60px]">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More / Menu Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label={isAr ? 'المزيد من القوائم' : 'Open full navigation menu'}
          className="flex flex-col items-center justify-center h-full min-h-[44px] py-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
          <span className="text-[10px] mt-0.5 tracking-tight">
            {isAr ? 'المزيد' : 'More'}
          </span>
        </button>
      </div>
    </nav>
  );
}

export default AppMobileNav;
