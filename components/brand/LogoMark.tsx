import React from 'react';

export interface LogoMarkProps {
  /** Size in pixels (number) or CSS string (e.g. '100%'), or predefined 'sm' | 'md' | 'lg' | 'xl' */
  size?: number | string | 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes for the root SVG */
  className?: string;
  /** When true, renders in single currentColor for monochromatic contexts */
  monochrome?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
  /** Whether to hide from assistive tech when purely decorative */
  ariaHidden?: boolean;
}

const SIZE_MAP: Record<'sm' | 'md' | 'lg' | 'xl', number> = {
  sm: 20,
  md: 28,
  lg: 36,
  xl: 48,
};

export default function LogoMark({
  size = 32,
  className = '',
  monochrome = false,
  ariaLabel = 'JobMatch AI Logo Mark',
  ariaHidden = true,
}: LogoMarkProps) {
  const pixelSize = typeof size === 'string' && size in SIZE_MAP 
    ? SIZE_MAP[size as keyof typeof SIZE_MAP] 
    : size;

  return (
    <svg
      viewBox="0 0 32 32"
      width={pixelSize}
      height={pixelSize}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-colors duration-200 ${className}`}
      aria-label={ariaHidden ? undefined : ariaLabel}
      aria-hidden={ariaHidden}
      role={ariaHidden ? 'presentation' : 'img'}
    >
      {monochrome ? (
        <>
          {/* Document Sheet */}
          <path
            d="M 5,6.5 C 5,5.12 6.12,4 7.5,4 L 17,4 L 23,10 L 23,25.5 C 23,26.88 21.88,28 20.5,28 L 7.5,28 C 6.12,28 5,26.88 5,25.5 Z"
            fill="currentColor"
            fillOpacity={0.12}
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          {/* Folded Corner Flap */}
          <path
            d="M 17,4 L 17,8.5 C 17,9.33 17.67,10 18.5,10 L 23,10 Z"
            fill="currentColor"
            fillOpacity={0.22}
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          {/* 3 Text Lines */}
          <line x1="9" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
          <line x1="9" y1="18" x2="14.5" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
          <line x1="9" y1="22" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
          {/* Spark Accent */}
          <path
            d="M 24.5,1.5 C 24.5,2.6 25.4,3.5 26.5,3.5 C 25.4,3.5 24.5,4.4 24.5,5.5 C 24.5,4.4 23.6,3.5 22.5,3.5 C 23.6,3.5 24.5,2.6 24.5,1.5 Z"
            fill="currentColor"
          />
          {/* ATS Badge & Checkmark */}
          <circle cx="22" cy="22" r="5.5" fill="currentColor" stroke="var(--bg, #FAF8F4)" strokeWidth="2" />
          <path d="M 19.3,22.2 L 21.1,24 L 24.8,20.2" stroke="var(--bg, #FAF8F4)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          {/* Document Sheet with Brand Tokens */}
          <path
            d="M 5,6.5 C 5,5.12 6.12,4 7.5,4 L 17,4 L 23,10 L 23,25.5 C 23,26.88 21.88,28 20.5,28 L 7.5,28 C 6.12,28 5,26.88 5,25.5 Z"
            fill="var(--brand-soft, #E3EFEA)"
            stroke="var(--brand, #0F5C4D)"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          {/* Folded Corner Flap */}
          <path
            d="M 17,4 L 17,8.5 C 17,9.33 17.67,10 18.5,10 L 23,10 Z"
            fill="var(--brand-subtle, #D1E7DF)"
            stroke="var(--brand, #0F5C4D)"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          {/* 3 Text Lines */}
          <line x1="9" y1="14" x2="17" y2="14" stroke="var(--brand, #0F5C4D)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
          <line x1="9" y1="18" x2="14.5" y2="18" stroke="var(--brand, #0F5C4D)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
          <line x1="9" y1="22" x2="12" y2="22" stroke="var(--brand, #0F5C4D)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
          {/* Amber AI Spark Accent */}
          <path
            d="M 24.5,1.5 C 24.5,2.6 25.4,3.5 26.5,3.5 C 25.4,3.5 24.5,4.4 24.5,5.5 C 24.5,4.4 23.6,3.5 22.5,3.5 C 23.6,3.5 24.5,2.6 24.5,1.5 Z"
            fill="var(--highlight, #C8892B)"
          />
          {/* ATS Badge Knockout Ring & Fill */}
          <circle cx="22" cy="22" r="5.5" fill="var(--brand, #0F5C4D)" stroke="var(--bg, #FAF8F4)" strokeWidth="2" />
          {/* ATS Pass Checkmark */}
          <path d="M 19.3,22.2 L 21.1,24 L 24.8,20.2" stroke="var(--on-brand, #FFFFFF)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}
