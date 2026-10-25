'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import ScrollToTop from './ScrollToTop';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  // Suppress hydration mismatch warnings from browser extensions
  useEffect(() => {
    const bodyElement = document.body;
    if (bodyElement && bodyElement.hasAttribute('cz-shortcut-listen')) {
      bodyElement.removeAttribute('cz-shortcut-listen');
    }
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        {children}
        <ScrollToTop />
      </AuthProvider>
    </LanguageProvider>
  );
}
