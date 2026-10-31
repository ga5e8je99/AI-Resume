'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoMark } from './Logo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import { UserMenu } from '@/components/layout/UserMenu';
import {
  Menu,
  X,
  ChevronDown,
  FileText,
  ShieldCheck,
  Mail,
  Briefcase,
  Layers,
  CreditCard,
  LayoutDashboard,
  LogOut,
  ArrowRight,
  Sparkles,
  Settings,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, isRtl } = useLanguage();
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const toolItemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const closeDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close mobile drawer and tools menu on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
    setIsToolsOpen(false);
  }

  // Clear hover delay timer on unmount
  useEffect(() => {
    return () => {
      if (closeDelayTimeoutRef.current) {
        clearTimeout(closeDelayTimeoutRef.current);
      }
    };
  }, []);

  const openToolsMenu = useCallback(() => {
    if (closeDelayTimeoutRef.current) {
      clearTimeout(closeDelayTimeoutRef.current);
      closeDelayTimeoutRef.current = null;
    }
    setIsToolsOpen(true);
  }, []);

  const scheduleCloseToolsMenu = useCallback(() => {
    if (closeDelayTimeoutRef.current) {
      clearTimeout(closeDelayTimeoutRef.current);
    }
    closeDelayTimeoutRef.current = setTimeout(() => {
      setIsToolsOpen(false);
    }, 150);
  }, []);

  // Scroll listener: border-b + subtle shadow + bg-paper/90 with backdrop-blur after 8px scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isMobileMenuOpen]);

  // Click outside to close Tools dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        toolsMenuRef.current &&
        !toolsMenuRef.current.contains(event.target as Node)
      ) {
        setIsToolsOpen(false);
      }
    }
    if (isToolsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isToolsOpen]);

  // Keyboard navigation (Escape, ArrowDown, ArrowUp, Home, End) for Tools dropdown
  useEffect(() => {
    if (!isToolsOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsToolsOpen(false);
        toolsButtonRef.current?.focus();
        return;
      }

      const items = toolItemRefs.current.filter(Boolean) as HTMLAnchorElement[];
      if (items.length === 0) return;
      const activeIdx = items.findIndex((el) => el === document.activeElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx = activeIdx < items.length - 1 ? activeIdx + 1 : 0;
        items[nextIdx]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIdx = activeIdx > 0 ? activeIdx - 1 : items.length - 1;
        items[prevIdx]?.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        items[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        items[items.length - 1]?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isToolsOpen]);

  const handleToolsTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const willOpen = !isToolsOpen;
      setIsToolsOpen(willOpen);
      if (willOpen) {
        setTimeout(() => {
          toolItemRefs.current[0]?.focus();
        }, 15);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsToolsOpen(true);
      setTimeout(() => {
        toolItemRefs.current[0]?.focus();
      }, 15);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsToolsOpen(true);
      setTimeout(() => {
        const items = toolItemRefs.current.filter(Boolean);
        items[items.length - 1]?.focus();
      }, 15);
    }
  };

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    toggleBtnRef.current?.focus();
  }, []);

  // Initial focus, Escape key & Focus Trap for mobile drawer
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const focusTimer = setTimeout(() => {
      if (closeBtnRef.current) {
        closeBtnRef.current.focus();
      } else if (drawerRef.current) {
        const firstFocusable = drawerRef.current.querySelector<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    }, 10);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMobileMenu();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const activeEl = document.activeElement as HTMLElement | null;
        const isInsideDrawer = activeEl ? drawerRef.current.contains(activeEl) : false;

        if (e.shiftKey) {
          if (!isInsideDrawer || activeEl === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (!isInsideDrawer || activeEl === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen, closeMobileMenu]);

  // Tools list for Desktop ~480px Dropdown & Mobile Drawer
  const tools = [
    {
      id: 'builder',
      title: t('nav_tool_builder_title'),
      desc: t('nav_tool_builder_desc'),
      href: '/builder',
      icon: FileText,
    },
    {
      id: 'cover-letter',
      title: t('nav_tool_cover_title'),
      desc: t('nav_tool_cover_desc'),
      href: '/cover-letter',
      icon: Mail,
    },
    {
      id: 'scanner',
      title: t('nav_tool_scanner_title'),
      desc: t('nav_tool_scanner_desc'),
      href: '/review',
      icon: ShieldCheck,
    },
    {
      id: 'job-match',
      title: t('nav_tool_match_title'),
      desc: t('nav_tool_match_desc'),
      href: '/jobs',
      icon: Briefcase,
    },
    {
      id: 'resume-generate',
      title: t('nav_tool_ai_gen_title'),
      desc: t('nav_tool_ai_gen_desc'),
      href: '/resume/generate',
      icon: Sparkles,
    },
    {
      id: 'academic-cv',
      title: t('nav_academic_cv'),
      desc: t('nav_academic_cv_desc'),
      href: '/cv-builder',
      icon: Layers,
    },
  ];

  // 4 Primary Center Links (Features, Jobs, Templates, Pricing)
  const primaryLinks = [
    {
      id: 'features',
      label: t('nav_features'),
      href: '/#features',
      isActive: false,
    },
    {
      id: 'jobs',
      label: t('nav_jobs'),
      href: '/jobs',
      isActive: pathname === '/jobs' || pathname.startsWith('/jobs/'),
    },
    {
      id: 'templates',
      label: t('nav_templates'),
      href: '/builder?tab=templates',
      isActive: pathname === '/templates',
    },
    {
      id: 'pricing',
      label: t('nav_pricing'),
      href: '/pricing',
      isActive: pathname === '/pricing',
    },
  ];

  const isToolsActive =
    pathname.startsWith('/builder') ||
    pathname.startsWith('/review') ||
    pathname.startsWith('/cover-letter') ||
    pathname.startsWith('/resume/generate') ||
    pathname.startsWith('/cv-builder');

  // Hide global Navbar on standalone workspace, auth, and canvas routes that render their own shell/header
  const isStandaloneRoute =
    pathname === '/admin' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/builder') ||
    pathname.startsWith('/cv-builder') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/preview-template') ||
    pathname.startsWith('/dev/ui');

  if (isStandaloneRoute) {
    return null;
  }

  // Mobile Drawer markup — rendered OUTSIDE <header> (via createPortal to document.body)
  // so `position: fixed` and `100dvh` are always computed relative to the viewport.
  const mobileDrawerElement = isMobileMenuOpen ? (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-modal lg:hidden flex justify-start"
      onMouseDown={(e) => {
        if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
          closeMobileMenu();
        }
      }}
    >
      {/* Dimmed Backdrop Overlay */}
      <div
        data-testid="mobile-drawer-overlay"
        className="fixed inset-0 bg-ink/50 backdrop-blur-xs modal-backdrop-animate transition-opacity duration-[250ms]"
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Drawer Panel: 100dvh, slides from inline-start (auto-reverses in RTL) in 250ms */}
      <div
        id="mobile-navigation-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('nav_mobile_drawer_aria')}
        className="relative z-10 inset-y-0 start-0 w-[min(85vw,320px)] sm:max-w-sm h-[100dvh] min-h-[100dvh] max-h-[100dvh] bg-surface border-e border-line-strong shadow-elevated flex flex-col justify-between overflow-y-auto overflow-x-hidden animate-in slide-in-from-start duration-[250ms] ease-[var(--ease-out,cubic-bezier(.22,1,.36,1))] mobile-drawer-enter text-start"
      >
        {/* Drawer Header */}
        <div>
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-line-strong">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className="group inline-flex items-center gap-2.5 shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              <LogoMark
                size={28}
                ariaHidden
                className="transition-transform duration-200 group-hover:scale-105 shrink-0"
              />
              <span className="inline-flex items-baseline gap-1.5" dir="ltr">
                <span className="font-serif text-lg font-bold tracking-tight text-ink leading-none">
                  {t('nav_brand')}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-accent-soft text-accent border border-line-strong leading-none">
                  AI
                </span>
              </span>
              <span className="sr-only"> — {t('nav_home_aria')}</span>
            </Link>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={closeMobileMenu}
              aria-label={t('shell_close_menu')}
              className="btn min-h-[44px] min-w-[44px] p-2 rounded-md border border-line-strong text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer flex items-center justify-center"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Grouped Links with Large Tap Targets */}
          <div className="p-4 space-y-5">
            {/* Primary Links Section */}
            <div>
              <span className="block text-[11px] font-mono uppercase tracking-wider text-ink-2 px-2 mb-2 font-semibold">
                {t('nav_general')}
              </span>
              <nav className="space-y-1" aria-label={t('nav_general')}>
                {primaryLinks.map((link) => (
                  <Link
                    key={link.id}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-colors min-h-[44px] text-sm font-medium ${
                      link.isActive
                        ? 'bg-accent/10 text-accent font-semibold'
                        : 'text-ink hover:bg-surface-2'
                    }`}
                  >
                    <span className="truncate">{link.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-ink-3 rtl:rotate-180 shrink-0" />
                  </Link>
                ))}

                {user && (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors min-h-[44px] ${
                        pathname === '/dashboard'
                          ? 'bg-accent/10 text-accent font-semibold'
                          : 'text-ink hover:bg-surface-2'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 text-accent shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {t('nav_dashboard')}
                      </span>
                    </Link>
                    <Link
                      href="/dashboard#settings"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors min-h-[44px] text-ink hover:bg-surface-2"
                    >
                      <Settings className="w-4 h-4 text-accent shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {t('nav_settings')}
                      </span>
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* Tools Section */}
            <div>
              <span className="block text-[11px] font-mono uppercase tracking-wider text-ink-2 px-2 mb-2 font-semibold">
                {t('nav_platform_tools')}
              </span>
              <nav className="space-y-1" aria-label={t('nav_platform_tools')}>
                {tools.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors min-h-[48px] ${
                        isActive
                          ? 'bg-accent/10 text-accent font-semibold'
                          : 'text-ink hover:bg-surface-2'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-accent text-on-accent'
                            : 'bg-surface-2 text-accent'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-[11px] text-ink-2 truncate">
                          {item.desc}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Settings strip inside drawer */}
            <div className="pt-4 border-t border-line-strong flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-ink-2 truncate">
                {t('nav_preferences')}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <LanguageSelector variant="compact" />
                <ThemeToggle size="sm" variant="icon" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Pinned CTA Actions */}
        <div className="p-4 border-t border-line-strong bg-surface sticky bottom-0 space-y-2 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-2 border border-line-strong">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-accent/15 text-accent font-bold text-xs flex items-center justify-center shrink-0">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink truncate">
                      {user.name || user.email}
                    </p>
                    <p className="text-[10px] text-ink-2 font-mono truncate">
                      {user.plan === 'pro'
                        ? t('credits_unlimited')
                        : `${user.aiCredits ?? 3} ${t('credits_label')}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                  className="btn p-2 rounded-md text-danger hover:bg-danger-soft transition-colors cursor-pointer shrink-0"
                  title={t('nav_logout')}
                  aria-label={t('nav_logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <Link
                href="/builder"
                onClick={closeMobileMenu}
                className="btn w-full inline-flex items-center justify-center py-2.5 px-4 text-sm font-semibold rounded-md bg-accent text-on-accent hover:bg-accent-hover shadow-subtle text-center transition-colors"
              >
                {t('nav_start_free')}
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login"
                onClick={closeMobileMenu}
                className="btn w-full inline-flex items-center justify-center py-2.5 px-4 text-sm font-medium rounded-md border border-line-strong bg-surface hover:bg-surface-2 text-ink text-center transition-colors"
              >
                {t('nav_login_btn')}
              </Link>

              <Link
                href="/builder"
                onClick={closeMobileMenu}
                className="btn w-full inline-flex items-center justify-center py-2.5 px-4 text-sm font-semibold rounded-md bg-accent text-on-accent hover:bg-accent-hover shadow-subtle text-center transition-colors"
              >
                {t('nav_start_free')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-[250ms] ${
          isScrolled
            ? 'bg-paper/90 backdrop-blur-md border-b border-line-strong shadow-subtle'
            : 'bg-paper/80 backdrop-blur-xs border-b border-transparent'
        }`}
        data-scrolled={isScrolled ? 'true' : 'false'}
      >
        {/* Accessibility: Skip-to-Content Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md focus:bg-accent focus:text-on-accent focus:text-xs focus:font-semibold focus:shadow-elevated focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper"
        >
          {t('common_skip_content')}
        </a>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 lg:gap-8">
          {/* ================================================================= */}
          {/* 1. START ZONE: Brand Icon + Newsreader Wordmark                   */}
          {/* ================================================================= */}
          <div className="flex items-center shrink-0">
            <Link
              href="/"
              className="group inline-flex items-center gap-2.5 shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              <LogoMark
                size={30}
                ariaHidden
                className="transition-transform duration-200 group-hover:scale-105 shrink-0"
              />
              <span className="inline-flex items-baseline gap-1.5" dir="ltr">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-ink leading-none">
                  {t('nav_brand')}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-accent-soft text-accent border border-line-strong leading-none">
                  AI
                </span>
              </span>
              <span className="sr-only"> — {t('nav_home_aria')}</span>
            </Link>
          </div>

          {/* ================================================================= */}
          {/* 2. CENTER ZONE: 4 Primary Links + "Tools" Dropdown (~480px)       */}
          {/* ================================================================= */}
          <nav
            aria-label={t('nav_main_aria')}
            className="hidden lg:flex items-center gap-1 xl:gap-2"
          >
            {primaryLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                aria-current={link.isActive ? 'page' : undefined}
                className={`group relative inline-flex items-center px-3 py-2 text-sm transition-colors duration-[250ms] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
                  link.isActive
                    ? 'text-accent font-semibold'
                    : 'text-ink-2 font-medium hover:text-ink hover:bg-surface-2/60'
                }`}
              >
                <span>{link.label}</span>
                {/* Animated scaleX underline: full accent when active, subtle lighter preview on hover */}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute bottom-0 inset-x-3 h-[2px] rounded-full transition-transform duration-[250ms] ease-[var(--ease-out,cubic-bezier(.22,1,.36,1))] origin-start ${
                    link.isActive
                      ? 'bg-accent scale-x-100 opacity-100'
                      : 'bg-ink-2/40 scale-x-0 opacity-0 group-hover:scale-x-75 group-hover:opacity-100'
                  }`}
                />
              </Link>
            ))}

            {/* Tools Dropdown Trigger + ~480px Panel */}
            <div
              ref={toolsMenuRef}
              className="relative"
              onMouseEnter={openToolsMenu}
              onMouseLeave={scheduleCloseToolsMenu}
            >
              <button
                ref={toolsButtonRef}
                type="button"
                data-testid="navbar-tools-trigger"
                aria-haspopup="menu"
                aria-expanded={isToolsOpen}
                aria-controls="navbar-tools-dropdown"
                onClick={() => setIsToolsOpen((prev) => !prev)}
                onKeyDown={handleToolsTriggerKeyDown}
                className={`group relative inline-flex items-center gap-1.5 px-3 py-2 text-sm transition-colors duration-[250ms] rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
                  isToolsActive || isToolsOpen
                    ? 'text-accent font-semibold'
                    : 'text-ink-2 font-medium hover:text-ink hover:bg-surface-2/60'
                }`}
              >
                <span>{t('nav_tools')}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-[250ms] ${
                    isToolsOpen ? 'rotate-180 text-accent' : 'text-ink-2 group-hover:text-ink'
                  }`}
                  aria-hidden="true"
                />
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute bottom-0 inset-x-3 h-[2px] rounded-full transition-transform duration-[250ms] ease-[var(--ease-out,cubic-bezier(.22,1,.36,1))] origin-start ${
                    isToolsActive || isToolsOpen
                      ? 'bg-accent scale-x-100 opacity-100'
                      : 'bg-ink-2/40 scale-x-0 opacity-0 group-hover:scale-x-75 group-hover:opacity-100'
                  }`}
                />
              </button>

              {/* Desktop Tools Panel (~480px, fade + translateY animation) */}
              {isToolsOpen && (
                <div
                  id="navbar-tools-dropdown"
                  data-testid="navbar-tools-dropdown"
                  role="menu"
                  aria-label={t('nav_tools')}
                  onMouseEnter={openToolsMenu}
                  onMouseLeave={scheduleCloseToolsMenu}
                  className="absolute top-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 mt-2 w-[480px] max-w-[calc(100vw-2rem)] p-3 rounded-2xl bg-surface border border-line-strong shadow-elevated grid grid-cols-2 gap-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-[200ms] ease-[var(--ease-out,cubic-bezier(.22,1,.36,1))]"
                >
                  {tools.map((item, idx) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.id}
                        ref={(el) => {
                          toolItemRefs.current[idx] = el;
                        }}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setIsToolsOpen(false)}
                        className={`group flex items-start gap-3 p-2.5 rounded-xl transition-all duration-150 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                          isActive
                            ? 'bg-accent/10 border border-accent/25'
                            : 'hover:bg-surface-2 border border-transparent'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                            isActive
                              ? 'bg-accent text-on-accent shadow-subtle'
                              : 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-on-accent'
                          }`}
                        >
                          <Icon className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-semibold transition-colors truncate ${
                              isActive
                                ? 'text-accent'
                                : 'text-ink group-hover:text-accent'
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="text-[11px] text-ink-2 leading-snug line-clamp-2 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </Link>
                    );
                  })}

                  {/* Footer Callout Strip inside Dropdown */}
                  <div className="col-span-2 pt-2 mt-1 border-t border-line-strong">
                    <Link
                      href="/cv-builder"
                      role="menuitem"
                      onClick={() => setIsToolsOpen(false)}
                      className="flex items-center justify-between p-2 rounded-lg bg-surface-2/60 border border-line hover:bg-surface-2 transition-colors text-xs text-ink-2 hover:text-ink group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Layers className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
                        <span className="font-medium truncate">
                          {t('nav_academic_cv_callout')}
                        </span>
                      </div>
                      <ArrowRight
                        className="w-3.5 h-3.5 text-accent rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform shrink-0"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* ================================================================= */}
          {/* 3. END ZONE: Language + Theme + Auth (Ghost Log in + Start free   */}
          {/*    OR Credits Badge + Avatar Menu)                                */}
          {/* ================================================================= */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {/* Language Switcher (Globe Icon + Language Code) */}
            <LanguageSelector variant="compact" />

            {/* Theme Toggle */}
            <ThemeToggle size="sm" variant="icon" />

            {user ? (
              <div className="flex items-center gap-2 ms-1">
                {/* Remaining Credits Badge */}
                <Link
                  href="/pricing"
                  data-testid="navbar-credits-badge"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-highlight/15 text-ink border border-highlight/30 hover:bg-highlight/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  <Sparkles className="w-3.5 h-3.5 text-highlight shrink-0" aria-hidden="true" />
                  <span>
                    {user.plan === 'pro'
                      ? t('credits_unlimited')
                      : `${user.aiCredits ?? 3} ${t('credits_label')}`}
                  </span>
                </Link>

                {/* Avatar Menu (Dashboard, Billing, Settings, Logout) */}
                <UserMenu variant="compact" />
              </div>
            ) : (
              <div className="flex items-center gap-2 ms-1">
                {/* "Log in" Ghost Button */}
                <Link
                  href="/login"
                  data-testid="navbar-login-btn"
                  className="inline-flex items-center justify-center px-3.5 py-2 text-sm font-medium text-ink-2 hover:text-ink hover:bg-surface-2 rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  {t('nav_login_btn')}
                </Link>

                {/* Prominent CTA bg-accent ("Start free") */}
                <Link
                  href="/builder"
                  data-testid="navbar-start-free-cta"
                  className="btn inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md bg-accent text-on-accent hover:bg-accent-hover shadow-subtle transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper cursor-pointer"
                >
                  {t('nav_start_free')}
                </Link>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* 4. MOBILE HAMBURGER & QUICK CONTROLS (< 1024px)                   */}
          {/* ================================================================= */}
          <div className="flex items-center gap-1 sm:gap-1.5 lg:hidden shrink-0">
            <LanguageSelector variant="compact" />
            <ThemeToggle size="sm" variant="icon" />

            {/* Mobile Hamburger Button */}
            <button
              ref={toggleBtnRef}
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? t('shell_close_menu') : t('shell_open_menu')}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
              aria-haspopup="dialog"
              className="btn min-h-[44px] min-w-[44px] p-2 rounded-md border border-line-strong bg-surface text-ink hover:bg-surface-2 transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 flex items-center justify-center"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 5. FULL-HEIGHT MOBILE DRAWER (Outside <header> via Portal/Sibling)  */}
      {/* =================================================================== */}
      {mobileDrawerElement &&
        (typeof document !== 'undefined'
          ? createPortal(mobileDrawerElement, document.body)
          : mobileDrawerElement)}
    </>
  );
}
