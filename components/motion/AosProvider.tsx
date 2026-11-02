'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useLanguage } from '@/app/context/LanguageContext';

let aosInitialized = false;

export default function AosProvider() {
  const pathname = usePathname();
  const { language, dir } = useLanguage();

  // Initialize AOS once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isReducedMotion = () =>
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      navigator.webdriver === true;

    if (!isReducedMotion()) {
      document.documentElement.classList.add('js-aos');
    } else {
      document.documentElement.classList.remove('js-aos');
    }

    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 80,
      disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    });
    aosInitialized = true;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.remove('js-aos');
      } else {
        document.documentElement.classList.add('js-aos');
      }
      AOS.refresh();
    };

    mediaQuery.addEventListener('change', handleMotionChange);
    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // Refresh AOS on route change or language/direction change after hydration
  useEffect(() => {
    if (!aosInitialized || typeof window === 'undefined') return;

    const rafId = window.requestAnimationFrame(() => {
      AOS.refresh();
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [pathname, language, dir]);

  return null;
}

