'use client';

import React, { useCallback, useState, useSyncExternalStore } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { AppSidebar } from './AppSidebar';
import { AppTopBar } from './AppTopBar';
import { AppMobileNav } from './AppMobileNav';
import { AppMobileDrawer } from './AppMobileDrawer';
import { BreadcrumbItem } from './Breadcrumbs';

const SIDEBAR_STORAGE_KEY = 'jobmatch_sidebar_collapsed';
const sidebarStoreListeners = new Set<() => void>();

function subscribeSidebarStore(listener: () => void): () => void {
  sidebarStoreListeners.add(listener);
  if (typeof window === 'undefined') {
    return () => {
      sidebarStoreListeners.delete(listener);
    };
  }
  const handleStorage = (event: StorageEvent) => {
    if (event.key === SIDEBAR_STORAGE_KEY) {
      listener();
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => {
    sidebarStoreListeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}

function getSidebarSnapshotForDefault(): boolean {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) {
        return stored === 'true';
      }
    } catch {
      // Intentionally ignored: localStorage may be unavailable in private browsing mode
    }
  }
  return false;
}

function getSidebarSnapshotForCanvas(): boolean {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) {
        return stored === 'true';
      }
    } catch {
      // Intentionally ignored: localStorage may be unavailable in private browsing mode
    }
  }
  return true;
}

function getSidebarServerSnapshotDefault(): boolean {
  return false;
}

function getSidebarServerSnapshotCanvas(): boolean {
  return true;
}

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
  const isCanvas = variant === 'canvas';
  const sidebarCollapsed = useSyncExternalStore(
    subscribeSidebarStore,
    isCanvas ? getSidebarSnapshotForCanvas : getSidebarSnapshotForDefault,
    isCanvas ? getSidebarServerSnapshotCanvas : getSidebarServerSnapshotDefault
  );

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Sync collapse state with localStorage
  const handleToggleCollapse = useCallback(() => {
    const next = !sidebarCollapsed;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Intentionally ignored: localStorage write may fail in private browsing; in-memory listeners still update UI
      }
    }
    sidebarStoreListeners.forEach((listener) => listener());
  }, [sidebarCollapsed]);

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-[100dvh] bg-paper text-ink flex selection:bg-brand-soft selection:text-brand relative w-full max-w-full overflow-x-hidden"
    >
      {/* Desktop Collapsible Sidebar (>=1024px / lg+) */}
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden pb-16 lg:pb-0">
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

      {/* Mobile & Tablet Fixed Bottom Navigation Bar (<1024px / <lg) */}
      <AppMobileNav onOpenDrawer={() => setMobileDrawerOpen(true)} />

      {/* Mobile & Tablet Slide-Over Drawer (<1024px / <lg) */}
      <AppMobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />
    </div>
  );
}

export default AppShell;
