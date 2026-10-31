'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  Copy,
  Check,
} from 'lucide-react';

export interface AppMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppMobileDrawer({ isOpen, onClose }: AppMobileDrawerProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isRtl, t } = useLanguage();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

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

  const handleCopyEmail = () => {
    if (!user?.email) return;
    navigator.clipboard.writeText(user.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const navLinks = [
    { label: t('nav_dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { label: t('nav_resume_builder'), href: '/builder', icon: FileText },
    { label: t('nav_cv_builder'), href: '/cv-builder', icon: Layers },
    { label: t('nav_cover_letter'), href: '/cover-letter', icon: Mail },
    { label: t('nav_ats_review'), href: '/review', icon: ShieldCheck },
    { label: t('nav_pricing'), href: '/pricing', icon: CreditCard },
  ];

  if (user?.role === 'admin') {
    navLinks.push({
      label: t('nav_admin'),
      href: '/admin',
      icon: ShieldAlert,
    });
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex" dir={isRtl ? 'rtl' : 'ltr'}>
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
        aria-label={t('shell_sidebar_aria')}
        className="relative z-10 w-full max-w-xs h-[100dvh] bg-surface border-e border-line-strong p-5 flex flex-col justify-between shadow-elevated overflow-y-auto animate-in slide-in-from-start duration-200"
      >
        <div className="space-y-5">
          {/* Header with Logo & Close button */}
          <div className="flex items-center justify-between pb-3 border-b border-line-strong">
            <Logo size="md" />
            <button
              type="button"
              onClick={onClose}
              aria-label={t('shell_close_menu')}
              className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center rounded-md text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* User info card */}
          {user && (
            <div className="p-3 rounded-lg bg-surface-2 border border-line-strong space-y-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-brand-soft border border-brand/20 text-brand font-bold text-xs flex items-center justify-center shrink-0">
                  <span>{initials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink truncate">{user.name || 'User'}</p>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p
                      dir="ltr"
                      style={{ unicodeBidi: 'isolate' }}
                      className="text-[10px] text-ink-2 font-mono truncate min-w-0 flex-1"
                      title={user.email}
                    >
                      {user.email}
                    </p>
                    {user.email && (
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        title={copiedEmail ? t('common_copied') : t('dashboard_copy_email')}
                        aria-label={copiedEmail ? t('common_copied') : t('dashboard_copy_email')}
                        className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface border border-line-strong text-[10px] text-ink-2 hover:text-ink transition-colors cursor-pointer"
                      >
                        {copiedEmail ? (
                          <>
                            <Check className="w-3 h-3 text-success" />
                            <span className="text-success font-medium">{t('common_copied')}</span>
                          </>
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {user.isDemo && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning-soft text-warning border border-warning/30">
                    <Zap className="w-3 h-3" />
                    <span>{t('shell_demo_active')}</span>
                  </span>
                )}
                <Badge variant={user.plan === 'pro' ? 'accent' : 'default'} size="sm">
                  {(user.plan || 'Free').toUpperCase()}
                </Badge>
                <span className="inline-flex items-center gap-1 text-[11px] text-ink-2 ms-auto">
                  <Sparkles className="w-3 h-3 text-warning" />
                  <span>
                    {user.plan === 'pro'
                      ? t('credits_unlimited')
                      : `${user.aiCredits ?? 3} ${t('credits_label')}`}
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
                  className={`min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-soft text-brand font-semibold border-s-2 border-brand'
                      : 'text-ink-2 hover:text-ink hover:bg-surface-2'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom controls */}
        <div className="pt-4 border-t border-line-strong space-y-3">
          <div className="flex items-center justify-between min-h-[44px]">
            <span className="text-xs text-ink-2">{t('dashboard_settings_theme')}</span>
            <ThemeToggle size="sm" />
          </div>

          <div className="flex items-center justify-between min-h-[44px]">
            <span className="text-xs text-ink-2">{t('dashboard_settings_language')}</span>
            <LanguageSelector variant="compact" />
          </div>

          {user && (
            <button
              type="button"
              onClick={async () => {
                onClose();
                await logout();
              }}
              className="min-h-[44px] w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-md bg-danger-soft text-danger text-xs font-medium hover:bg-danger/20 transition-colors cursor-pointer mt-2"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>{t('nav_logout')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppMobileDrawer;
