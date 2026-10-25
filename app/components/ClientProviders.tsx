'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';
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
    <AuthProvider>
      {children}
      <ScrollToTop />
    </AuthProvider>
  );
}
