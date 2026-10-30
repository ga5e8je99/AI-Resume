'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { AppSidebar } from './AppSidebar';
import { AppTopBar } from './AppTopBar';
import { AppMobileNav } from './AppMobileNav';
import { AppMobileDrawer } from './AppMobileDrawer';
import { BreadcrumbItem } from './Breadcrumbs';

export interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'canvas';
  className?: string;
}

export function AppShell({
  children,
  breadcrumbs = [],
  title,
  description,
  actions,
  variant = 'default',
  className = '',
}: AppShellProps) {
  const { isRtl } = useLanguage();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(variant === 'canvas');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('jobmatch_sidebar_collapsed');
      if (stored !== null) {
        setSidebarCollapsed(stored === 'true');
      }
    }
  }, []);

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Sync collapse state with localStorage
  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('jobmatch_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-bg text-text-primary flex selection:bg-brand-soft selection:text-brand relative w-full max-w-full overflow-x-hidden"
    >
      {/* Desktop Collapsible Sidebar */}
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden pb-16 md:pb-0">
        {/* Top Bar with Breadcrumbs & User Menu */}
        <AppTopBar
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
          breadcrumbs={breadcrumbs}
          title={title}
          description={description}
          actions={actions}
        />

        {/* Main Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 focus:outline-none w-full max-w-full overflow-x-hidden ${
            variant === 'canvas' ? 'p-0' : 'p-4 sm:p-6 lg:p-8'
          } ${className}`}
        >
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (<768px) */}
      <AppMobileNav onOpenDrawer={() => setMobileDrawerOpen(true)} />

      {/* Mobile Slide-Over Drawer (<768px) */}
      <AppMobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />
    </div>
  );
}

export default AppShell;
