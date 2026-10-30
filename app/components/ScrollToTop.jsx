'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ScrollToTop() {
  const { isRtl, language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isAr = language === 'ar';

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const label = isAr ? 'انتقل إلى أعلى الصفحة' : 'Scroll to top';
  const tooltipText = isAr ? 'العودة للأعلى' : 'Back to top';

  return (
    <>
      <button
        type="button"
        onClick={scrollToTop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        suppressHydrationWarning
        aria-label={label}
        className={`
          fixed bottom-6 end-6
          w-11 h-11
          rounded-full
          bg-surface
          text-ink
          border border-line-strong
          cursor-pointer
          shadow-subtle
          flex items-center justify-center
          transition-all duration-200 ease-out
          z-40
          ${
            isVisible
              ? 'opacity-100 translate-y-0 visible pointer-events-auto'
              : 'opacity-0 translate-y-6 invisible pointer-events-none'
          }
          hover:bg-surface-2
          active:scale-95
          focus-visible:outline-2 outline-offset-2 outline-[var(--focus)]
        `}
      >
        <ArrowUp className="w-5 h-5 text-accent" />
      </button>

      {/* Tooltip */}
      {isHovered && isVisible && (
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          className="fixed bottom-20 end-6 bg-surface border border-line-strong text-ink text-xs px-3 py-1.5 rounded-[6px] shadow-subtle z-40 animate-in fade-in"
        >
          {tooltipText}
        </div>
      )}
    </>
  );
}
