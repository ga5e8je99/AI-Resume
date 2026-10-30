'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
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
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { language, t } = useLanguage();
  const pathname = usePathname();
  const isAr = language === 'ar';

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);

  // Close mobile drawer and tools menu on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
    setIsToolsOpen(false);
  }

  // Scroll listener: 1px bottom border only appears after scrolling (> 8px)
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

  // Click outside to close Tools mega-menu
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

  // Keyboard navigation & Esc key handler for Tools mega-menu
  useEffect(() => {
    if (!isToolsOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsToolsOpen(false);
        toolsButtonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isToolsOpen]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    toggleBtnRef.current?.focus();
  };

  // Keyboard navigation & focus trap for mobile drawer
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Tools list for Desktop Mega-Menu and Mobile Drawer
  const tools = [
    {
      id: 'resume-generate',
      title: isAr ? 'مُولّد السير الذاتية بالذكاء الاصطناعي' : 'AI Resume & CV Generator',
      desc: isAr ? 'توليد سيرة ذاتية أو CV مخصص لأي وصف وظيفي' : 'Generate tailored ATS resumes & CVs with AI',
      href: '/resume/generate',
      icon: Sparkles,
    },
    {
      id: 'builder',
      title: t('nav_tool_builder_title'),
      desc: t('nav_tool_builder_desc'),
      href: '/builder',
      icon: FileText,
    },
    {
      id: 'scanner',
      title: t('nav_tool_scanner_title'),
      desc: t('nav_tool_scanner_desc'),
      href: '/review',
      icon: ShieldCheck,
    },
    {
      id: 'cover-letter',
      title: t('nav_tool_cover_title'),
      desc: t('nav_tool_cover_desc'),
      href: '/cover-letter',
      icon: Mail,
    },
    {
      id: 'job-match',
      title: t('nav_tool_match_title'),
      desc: t('nav_tool_match_desc'),
      href: '/jobs',
      icon: Briefcase,
    },
  ];

  const isToolsActive =
    pathname.startsWith('/builder') ||
    pathname.startsWith('/review') ||
    pathname.startsWith('/cover-letter') ||
    pathname.startsWith('/resume/generate') ||
    pathname.startsWith('/cv-builder') ||
    pathname.startsWith('/jobs');

  const isPricingActive = pathname === '/pricing';

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 bg-bg/80 backdrop-blur-md ${
          isScrolled
            ? 'border-b border-border shadow-subtle'
            : 'border-b border-transparent'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* ================================================================= */}
          {/* 1. START SIDE: Icon Mark + Wordmark + AI Pill                     */}
          {/* ================================================================= */}
          <div className="flex items-center gap-6 shrink-0">
            <Logo size="md" />
          </div>

          {/* ================================================================= */}
          {/* 2. CENTER: Tools Dropdown (Mega-Menu) + Pricing                   */}
          {/* ================================================================= */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center gap-1 xl:gap-2"
          >
            {/* Tools Dropdown Trigger */}
            <div ref={toolsMenuRef} className="relative">
              <button
                ref={toolsButtonRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={isToolsOpen}
                onClick={() => setIsToolsOpen((prev) => !prev)}
                className={`relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${
                  isToolsActive || isToolsOpen
                    ? 'text-brand font-semibold after:absolute after:bottom-0 after:start-3 after:end-3 after:h-[2px] after:bg-brand after:rounded-full'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-2/60'
                }`}
              >
                <span>{t('nav_tools')}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    isToolsOpen ? 'rotate-180 text-brand' : 'text-text-muted'
                  }`}
                  aria-hidden="true"
                />
              </button>

              {/* Desktop Mega-Menu Dropdown (2 Columns) */}
              {isToolsOpen && (
                <div
                  role="menu"
                  aria-label={t('nav_tools')}
                  className="absolute top-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 mt-2 w-[540px] p-3 rounded-2xl bg-surface border border-border shadow-elevated grid grid-cols-2 gap-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  {tools.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setIsToolsOpen(false)}
                        className={`group flex items-start gap-3 p-3 rounded-xl transition-all duration-150 text-start ${
                          isActive
                            ? 'bg-brand-soft/70 border border-brand/20'
                            : 'hover:bg-surface-2 border border-transparent'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                            isActive
                              ? 'bg-brand text-on-brand shadow-subtle'
                              : 'bg-brand-soft text-brand group-hover:bg-brand group-hover:text-on-brand'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-semibold transition-colors ${
                              isActive
                                ? 'text-brand'
                                : 'text-text-primary group-hover:text-brand'
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </Link>
                    );
                  })}

                  {/* Academic CV Callout Footer Strip */}
                  <div className="col-span-2 pt-2 mt-1 border-t border-border">
                    <Link
                      href="/cv-builder"
                      role="menuitem"
                      onClick={() => setIsToolsOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2/60 hover:bg-surface-2 transition-colors text-xs text-text-secondary hover:text-text-primary group"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-brand" />
                        <span className="font-medium">
                          {t('nav_academic_cv_callout')}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-brand rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Link */}
            <Link
              href="/pricing"
              className={`relative px-3 py-2 text-sm font-medium transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${
                isPricingActive
                  ? 'text-brand font-semibold after:absolute after:bottom-0 after:start-3 after:end-3 after:h-[2px] after:bg-brand after:rounded-full'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-2/60'
              }`}
            >
              {t('nav_pricing')}
            </Link>
          </nav>

          {/* ================================================================= */}
          {/* 3. END SIDE: Language + Theme + Log in / CTA or User Avatar        */}
          {/* ================================================================= */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            {/* 1. Compact Language Dropdown */}
            <LanguageSelector variant="compact" />

            {/* 2. Theme Toggle (Single Icon Button with Tooltip) */}
            <ThemeToggle size="sm" variant="icon" />

            {/* 3. User Avatar Menu (Logged in) OR Log in + Build your resume (Logged out) */}
            {user ? (
              <div className="ms-1">
                <UserMenu variant="compact" />
              </div>
            ) : (
              <div className="flex items-center gap-2 ms-1">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                >
                  {t('nav_login')}
                </Link>

                <Link
                  href="/builder"
                  className="inline-flex items-center justify-center font-medium transition-all duration-150 rounded-md bg-brand text-on-brand hover:bg-brand-hover hover:shadow-glow active:scale-[0.98] text-sm px-4 py-2 shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 cursor-pointer"
                >
                  {t('nav_cta_build')}
                </Link>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* 4. MOBILE HAMBURGER & QUICK CONTROLS (< 1024px)                   */}
          {/* ================================================================= */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <LanguageSelector variant="compact" />
            <ThemeToggle size="sm" variant="icon" />

            {/* Mobile Hamburger Button */}
            <button
              ref={toggleBtnRef}
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={isMobileMenuOpen}
              className="p-2 rounded-md border border-border bg-surface text-text-primary hover:bg-surface-2 transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 5. FULL-HEIGHT MOBILE DRAWER (Sliding from inline-end side)          */}
        {/* =================================================================== */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            {/* Backdrop Overlay */}
            <div
              className="fixed inset-0 bg-ink/40 backdrop-blur-xs modal-backdrop-animate"
              onClick={closeMobileMenu}
              aria-hidden="true"
            />

            {/* Drawer Container */}
            <div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation Menu"
              className="relative z-10 w-full max-w-xs sm:max-w-sm h-[100dvh] bg-surface border-s border-border shadow-elevated flex flex-col justify-between overflow-y-auto animate-in slide-in-from-end duration-200 ease-out text-start"
            >
              {/* Drawer Header */}
              <div>
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <Logo size="sm" onClick={closeMobileMenu} />
                  <button
                    type="button"
                    onClick={closeMobileMenu}
                    aria-label="Close Navigation Menu"
                    className="p-1.5 rounded-md border border-border text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Grouped Links with Large Tap Targets */}
                <div className="p-4 space-y-6">
                  {/* Tools Section */}
                  <div>
                    <span className="block text-[11px] font-mono uppercase tracking-wider text-text-muted px-2 mb-2 font-semibold">
                      {t('nav_platform_tools')}
                    </span>
                    <nav className="space-y-1">
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
                                ? 'bg-brand-soft text-brand font-semibold'
                                : 'text-text-primary hover:bg-surface-2'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isActive
                                  ? 'bg-brand text-on-brand'
                                  : 'bg-surface-2 text-brand'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{item.title}</p>
                              <p className="text-[11px] text-text-muted truncate">
                                {item.desc}
                              </p>
                            </div>
                          </Link>
                        );
                      })}

                      {/* Academic CV link */}
                      <Link
                        href="/cv-builder"
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors min-h-[48px] ${
                          pathname === '/cv-builder'
                            ? 'bg-brand-soft text-brand font-semibold'
                            : 'text-text-primary hover:bg-surface-2'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            pathname === '/cv-builder'
                              ? 'bg-brand text-on-brand'
                              : 'bg-surface-2 text-brand'
                          }`}
                        >
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {t('nav_academic_cv')}
                          </p>
                          <p className="text-[11px] text-text-muted truncate">
                            {t('nav_academic_cv_desc')}
                          </p>
                        </div>
                      </Link>
                    </nav>
                  </div>

                  {/* General Section */}
                  <div>
                    <span className="block text-[11px] font-mono uppercase tracking-wider text-text-muted px-2 mb-2 font-semibold">
                      {t('nav_general')}
                    </span>
                    <nav className="space-y-1">
                      <Link
                        href="/pricing"
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors min-h-[44px] ${
                          pathname === '/pricing'
                            ? 'bg-brand-soft text-brand font-semibold'
                            : 'text-text-primary hover:bg-surface-2'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-text-muted shrink-0" />
                        <span className="text-sm font-medium">
                          {t('nav_pricing_plans')}
                        </span>
                      </Link>

                      {user && (
                        <Link
                          href="/dashboard"
                          onClick={closeMobileMenu}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors min-h-[44px] ${
                            pathname === '/dashboard'
                              ? 'bg-brand-soft text-brand font-semibold'
                              : 'text-text-primary hover:bg-surface-2'
                          }`}
                        >
                          <LayoutDashboard className="w-4 h-4 text-brand shrink-0" />
                          <span className="text-sm font-medium">
                            {t('nav_dashboard')}
                          </span>
                        </Link>
                      )}
                    </nav>
                  </div>

                  {/* Settings strip inside drawer */}
                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-medium text-text-secondary">
                      {t('nav_preferences')}
                    </span>
                    <div className="flex items-center gap-2">
                      <LanguageSelector variant="compact" />
                      <ThemeToggle size="sm" variant="icon" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Pinned CTA Actions */}
              <div className="p-4 border-t border-border bg-surface sticky bottom-0 space-y-2 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-2 border border-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-brand-soft text-brand font-bold text-xs flex items-center justify-center shrink-0">
                          {user.name ? user.name[0].toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-text-primary truncate">
                            {user.name || user.email}
                          </p>
                          <p className="text-[10px] text-text-muted font-mono truncate">
                            {user.plan?.toUpperCase() || 'FREE'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          closeMobileMenu();
                        }}
                        className="p-1.5 rounded-md text-danger hover:bg-danger-soft transition-colors cursor-pointer"
                        title={t('nav_logout')}
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>

                    <Link
                      href="/builder"
                      onClick={closeMobileMenu}
                      className="w-full inline-flex items-center justify-center py-2.5 px-4 text-sm font-semibold rounded-md bg-brand text-on-brand hover:bg-brand-hover shadow-subtle text-center transition-colors"
                    >
                      {t('nav_cta_build')}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/login"
                      onClick={closeMobileMenu}
                      className="w-full inline-flex items-center justify-center py-2.5 px-4 text-sm font-medium rounded-md border border-border bg-surface hover:bg-surface-2 text-text-primary text-center transition-colors"
                    >
                      {t('nav_login')}
                    </Link>

                    <Link
                      href="/builder"
                      onClick={closeMobileMenu}
                      className="w-full inline-flex items-center justify-center py-2.5 px-4 text-sm font-semibold rounded-md bg-brand text-on-brand hover:bg-brand-hover shadow-subtle text-center transition-colors"
                    >
                      {t('nav_cta_build')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
