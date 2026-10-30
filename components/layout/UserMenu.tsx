'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import LanguageSelector from '@/app/components/LanguageSelector';
import ThemeToggle from '@/app/components/ThemeToggle';
import { Badge } from '@/components/ui/Badge';
import {
  User,
  LogOut,
  Sparkles,
  LayoutDashboard,
  FileText,
  Mail,
  ShieldCheck,
  ChevronDown,
  Layers,
  CreditCard,
  Zap,
  Settings,
} from 'lucide-react';

interface UserMenuProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function UserMenu({ className = '', variant = 'default' }: UserMenuProps) {
  const { user, logout } = useAuth();
  const { language, isRtl } = useLanguage();
  const router = useRouter();
  const isAr = language === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation (Escape to close)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-xs font-semibold text-text-primary hover:text-brand px-3 py-1.5 rounded-md border border-border bg-surface hover:bg-surface-2 transition-colors shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {isAr ? 'تسجيل الدخول' : 'Sign in'}
      </Link>
    );
  }

  // Calculate initials
  const initials = (() => {
    if (!user.name) return user.email ? user.email.slice(0, 2).toUpperCase() : 'U';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  })();

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push('/');
  };

  return (
    <div ref={menuRef} className={`relative inline-block text-start ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={isAr ? 'قائمة المستخدم' : 'User account menu'}
        className="flex items-center gap-2 p-1 sm:pe-2.5 sm:ps-1 rounded-full sm:rounded-md border border-border bg-surface hover:bg-surface-2 text-text-primary transition-colors shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
      >
        {/* Avatar Circle */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-soft border border-brand/20 text-brand font-semibold text-xs flex items-center justify-center shrink-0">
          <span>{initials}</span>
        </div>

        {/* Demo badge if demo user */}
        {user.isDemo && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <Zap className="w-2.5 h-2.5" />
            <span>{isAr ? 'تجريبي' : 'Demo'}</span>
          </span>
        )}

        {/* User Name & Plan (desktop when not compact) */}
        {variant !== 'compact' && !user.isDemo && (
          <div className="hidden sm:flex flex-col items-start text-start leading-tight min-w-0 max-w-[120px]">
            <span className="text-xs font-semibold text-text-primary truncate w-full">
              {user.name || 'User'}
            </span>
            <span className="text-[10px] text-text-muted flex items-center gap-1 font-mono">
              <span>{user.plan || 'Free'}</span>
            </span>
          </div>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 text-text-muted transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute end-0 top-full mt-2 w-72 max-w-[90vw] z-dropdown bg-surface border border-border rounded-xl shadow-elevated overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header Profile Section */}
          <div className="p-3.5 bg-surface-2/60 border-b border-border space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-soft border border-brand/20 text-brand font-bold text-sm flex items-center justify-center shrink-0">
                <span>{initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-text-primary truncate">
                  {user.name || (isAr ? 'مستخدم جوب ماتش' : 'JobMatch User')}
                </p>
                <p className="text-[11px] text-text-muted font-mono truncate">{user.email}</p>
              </div>
            </div>

            {/* Badges strip: Demo badge & Plan */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {user.isDemo && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  <Zap className="w-3 h-3" />
                  <span>{isAr ? 'حساب تجريبي' : 'Demo Mode'}</span>
                </span>
              )}

              <Badge variant={user.plan === 'pro' ? 'accent' : 'default'} size="sm">
                {(user.plan || 'Free').toUpperCase()}
              </Badge>

              <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary ms-auto font-mono">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>
                  {user.plan === 'pro'
                    ? (isAr ? 'غير محدود' : 'Unlimited')
                    : `${user.aiCredits ?? 3} ${isAr ? 'نقاط' : 'pts'}`}
                </span>
              </span>
            </div>
          </div>

          {/* Navigation Links: Dashboard, Settings, Plan & Credits, Admin (if admin) */}
          <div className="p-1.5 space-y-0.5" role="none">
            <Link
              href="/dashboard"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-2 rounded-md transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-brand shrink-0" />
              <span>{isAr ? 'لوحة التحكم' : 'Dashboard'}</span>
            </Link>

            <Link
              href="/dashboard#settings"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-2 rounded-md transition-colors"
            >
              <Settings className="w-4 h-4 text-brand shrink-0" />
              <span>{isAr ? 'الإعدادات' : 'Settings'}</span>
            </Link>

            <Link
              href="/pricing"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-2 rounded-md transition-colors"
            >
              <CreditCard className="w-4 h-4 text-brand shrink-0" />
              <span>{isAr ? 'الترقية ونقاط الاستخدام' : 'Plan & Credits'}</span>
            </Link>

            {user.role === 'admin' && (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-amber-500 hover:bg-amber-500/10 rounded-md transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{isAr ? 'لوحة الإدارة' : 'Admin Panel'}</span>
              </Link>
            )}
          </div>

          {/* Preferences Row */}
          <div className="p-2 border-t border-border bg-surface-2/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-text-muted">{isAr ? 'المظهر:' : 'Theme:'}</span>
              <ThemeToggle size="sm" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-text-muted">{isAr ? 'اللغة:' : 'Lang:'}</span>
              <LanguageSelector variant="compact" />
            </div>
          </div>

          {/* Logout Section */}
          <div className="p-1.5 border-t border-border" role="none">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-danger hover:bg-danger-soft rounded-md transition-colors cursor-pointer text-start"
            >
              <LogOut className="w-4 h-4 text-danger shrink-0" />
              <span>{isAr ? 'تسجيل الخروج' : 'Sign out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
