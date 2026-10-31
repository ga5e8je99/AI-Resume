'use client';

import React, { useEffect } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { ToastProvider } from '../context/ToastContext';
import ScrollToTop from './ScrollToTop';
import PostHogProvider from './PostHogProvider';
import CookieConsentBanner from './CookieConsentBanner';
import Navbar from './Navbar';
import RouteProgressBar from '@/components/navigation/RouteProgressBar';
import FirstVisitSplash from '@/components/brand/FirstVisitSplash';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  // Suppress hydration mismatch warnings from browser extensions
  useEffect(() => {
    const bodyElement = document.body;
    if (bodyElement && bodyElement.hasAttribute('cz-shortcut-listen')) {
      bodyElement.removeAttribute('cz-shortcut-listen');
    }
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <PostHogProvider>
              <RouteProgressBar />
              <FirstVisitSplash />
              <Navbar />
              {children}
              <CookieConsentBanner />
              <ScrollToTop />
            </PostHogProvider>
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
