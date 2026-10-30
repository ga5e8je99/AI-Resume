'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import Logo from '@/app/components/Logo';
import LanguageSelector from '@/app/components/LanguageSelector';
import ThemeToggle from '@/app/components/ThemeToggle';
import { Badge } from '@/components/ui/Badge';
import {
  X,
  LayoutDashboard,
  FileText,
  Layers,
  Mail,
  ShieldCheck,
  CreditCard,
  ShieldAlert,
  LogOut,
  Zap,
  Sparkles,
} from 'lucide-react';

export interface AppMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppMobileDrawer({ isOpen, onClose }: AppMobileDrawerProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { language, isRtl } = useLanguage();
  const isAr = language === 'ar';
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const initials = (() => {
    if (!user?.name) return user?.email ? user.email.slice(0, 2).toUpperCase() : 'U';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  })();

  const navLinks = [
    { label: isAr ? 'لوحة التحكم' : 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: isAr ? 'منشئ السيرة الذاتية' : 'Resume Builder', href: '/builder', icon: FileText },
    { label: isAr ? 'السيرة الأكاديمية (CV)' : 'Academic CV Builder', href: '/cv-builder', icon: Layers },
    { label: isAr ? 'خطاب التقديم الذكي' : 'AI Cover Letter', href: '/cover-letter', icon: Mail },
    { label: isAr ? 'فحص الـ ATS' : 'ATS Review & Scan', href: '/review', icon: ShieldCheck },
    { label: isAr ? 'الأسعار والترقية' : 'Plans & Pricing', href: '/pricing', icon: CreditCard },
  ];

  if (user?.role === 'admin') {
    navLinks.push({
      label: isAr ? 'لوحة الإدارة' : 'Admin Panel',
      href: '/admin',
      icon: ShieldAlert,
    });
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden flex" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={isAr ? 'قائمة التنقل' : 'Navigation Menu'}
        className="relative z-10 w-full max-w-xs h-[100dvh] bg-surface border-e border-border p-5 flex flex-col justify-between shadow-elevated overflow-y-auto animate-in slide-in-from-start duration-200"
      >
        <div className="space-y-5">
          {/* Header with Logo & Close button */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <Logo size="md" />
            <button
              type="button"
              onClick={onClose}
              aria-label={isAr ? 'إغلاق القائمة' : 'Close navigation menu'}
              className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* User info card */}
          {user && (
            <div className="p-3 rounded-lg bg-surface-2/70 border border-border space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-soft border border-brand/20 text-brand font-bold text-xs flex items-center justify-center shrink-0">
                  <span>{initials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-text-primary truncate">{user.name || 'User'}</p>
                  <p className="text-[10px] text-text-muted font-mono truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {user.isDemo && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Zap className="w-3 h-3" />
                    <span>{isAr ? 'وضع تجريبي' : 'Demo Account'}</span>
                  </span>
                )}
                <Badge variant={user.plan === 'pro' ? 'accent' : 'default'} size="sm">
                  {(user.plan || 'Free').toUpperCase()}
                </Badge>
                <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary ms-auto">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>
                    {user.plan === 'pro'
                      ? (isAr ? 'غير محدود' : 'Unlimited')
                      : `${user.aiCredits ?? 3} ${isAr ? 'نقاط' : 'pts'}`}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Links list */}
          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-soft text-brand font-semibold border-s-2 border-brand'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom controls */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">{isAr ? 'المظهر' : 'Theme'}</span>
            <ThemeToggle size="sm" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">{isAr ? 'اللغة' : 'Language'}</span>
            <LanguageSelector variant="compact" />
          </div>

          {user && (
            <button
              type="button"
              onClick={async () => {
                onClose();
                await logout();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-danger-soft text-danger text-xs font-medium hover:bg-danger/20 transition-colors cursor-pointer mt-2"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>{isAr ? 'تسجيل الخروج' : 'Sign out'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppMobileDrawer;
