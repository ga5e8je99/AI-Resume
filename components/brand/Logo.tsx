'use client';

import React from 'react';
import Link from 'next/link';
import LogoMark from './LogoMark';

export type LogoVariant = 'full' | 'mark' | 'stacked';
export type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | number;

export interface LogoProps {
  /** Logo variant: horizontal 'full' (mark + wordmark + AI pill), icon-only 'mark', or 'stacked' */
  variant?: LogoVariant;
  /** Size preset ('sm' | 'md' | 'lg' | 'xl') or explicit numerical height/width */
  size?: LogoSize;
  /** Extra CSS classes */
  className?: string;
  /** When true, renders single-color currentColor for monochromatic contexts */
  monochrome?: boolean;
  /** Wrap in Next.js Link to root (or custom href) */
  withLink?: boolean;
  /** Target href when withLink is true (defaults to '/') */
  href?: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Accessible label */
  ariaLabel?: string;
}

// Vector paths for exact Inter SemiBold outlines
const WORDMARK_FULL_PATH =
  'M47.47 23.70Q45.31 23.70 44.04 22.53Q42.76 21.36 42.76 19.20L42.76 18.37L45.37 18.37L45.37 19.22Q45.94 20.37 45.94 20.96Q46.51 21.55 47.47 21.55Q48.42 21.55 48.98 20.96Q49.55 20.37 49.55 19.22L49.55 8.95L52.14 8.95L52.14 19.19Q52.14 21.35 50.87 22.52Q49.61 23.70 47.47 23.70 M59.68 23.72Q58.08 23.72 56.91 23.02Q55.74 22.31 55.10 21.04Q54.46 19.78 54.46 18.10Q54.46 16.40 55.10 15.13Q55.74 13.85 56.91 13.15Q58.08 12.45 59.68 12.45Q61.28 12.45 62.45 13.15Q63.62 13.85 64.26 15.13Q64.90 16.40 64.90 18.10Q64.90 19.78 64.26 21.04Q63.62 22.31 62.45 23.02Q61.28 23.72 59.68 23.72M59.68 21.66Q60.56 21.66 61.16 21.19Q61.75 20.71 62.03 19.90Q62.32 19.09 62.32 18.09Q62.32 17.08 62.03 16.27Q61.75 15.46 61.16 14.98Q60.56 14.51 59.68 14.51Q58.79 14.51 58.21 14.98Q57.63 15.46 57.34 16.27Q57.05 17.07 57.05 18.09Q57.05 19.09 57.34 19.90Q57.63 20.71 58.21 21.19Q58.79 21.66 59.68 21.66 M72.88 23.70Q71.95 23.70 71.33 23.38Q70.70 23.06 70.33 22.61Q69.96 22.16 69.76 21.77L69.60 21.77L69.60 23.50L67.12 23.50L67.12 8.95L69.66 8.95L69.66 14.39L69.76 14.39Q69.96 14 70.32 13.55Q70.68 13.10 71.30 12.77Q71.92 12.45 72.89 12.45Q74.16 12.45 75.17 13.09Q76.19 13.73 76.79 14.99Q77.39 16.24 77.39 18.06Q77.39 19.86 76.80 21.12Q76.22 22.38 75.20 23.04Q74.18 23.70 72.88 23.70M72.20 21.61Q73.04 21.61 73.62 21.14Q74.20 20.68 74.49 19.87Q74.78 19.07 74.78 18.05Q74.78 17.04 74.50 16.24Q74.21 15.44 73.63 14.99Q73.05 14.54 72.20 14.54Q71.36 14.54 70.78 14.97Q70.20 15.41 69.91 16.20Q69.61 16.99 69.61 18.05Q69.61 19.12 69.91 19.92Q70.20 20.72 70.78 21.16Q71.37 21.61 72.20 21.61 M82.27 23.50L79.71 23.50L79.71 8.95L83.64 8.95L86.40 16.46Q86.55 16.88 86.73 17.54Q86.91 18.20 87.10 18.96Q87.29 19.72 87.46 20.45Q87.63 21.18 87.75 21.73L87.22 21.73Q87.34 21.19 87.51 20.47Q87.68 19.75 87.87 18.98Q88.06 18.22 88.25 17.55Q88.43 16.89 88.56 16.46L91.30 8.95L95.23 8.95L95.23 23.50L92.63 23.50L92.63 16.16Q92.63 15.69 92.64 15.02Q92.65 14.36 92.67 13.60Q92.69 12.84 92.71 12.06Q92.73 11.28 92.73 10.58L92.92 10.58Q92.72 11.35 92.49 12.16Q92.26 12.96 92.04 13.72Q91.81 14.48 91.61 15.11Q91.41 15.75 91.27 16.16L88.58 23.50L86.37 23.50L83.64 16.16Q83.49 15.75 83.29 15.13Q83.09 14.51 82.86 13.75Q82.63 13 82.41 12.19Q82.18 11.37 81.95 10.58L82.17 10.58Q82.18 11.23 82.20 12Q82.21 12.77 82.23 13.54Q82.24 14.31 82.26 14.99Q82.27 15.67 82.27 16.16 M101.09 23.72Q100.06 23.72 99.23 23.35Q98.40 22.97 97.92 22.24Q97.44 21.51 97.44 20.43Q97.44 19.51 97.79 18.90Q98.13 18.29 98.72 17.93Q99.31 17.57 100.06 17.39Q100.80 17.20 101.60 17.12Q102.55 17.02 103.14 16.94Q103.74 16.86 104.02 16.68Q104.29 16.51 104.29 16.14L104.29 16.09Q104.29 15.55 104.08 15.17Q103.87 14.80 103.44 14.60Q103.02 14.40 102.39 14.40Q101.76 14.40 101.29 14.59Q100.83 14.79 100.54 15.10Q100.24 15.41 100.11 15.78L97.75 15.30Q98.07 14.33 98.75 13.70Q99.42 13.07 100.35 12.76Q101.29 12.45 102.38 12.45Q103.15 12.45 103.94 12.63Q104.72 12.81 105.38 13.24Q106.03 13.67 106.43 14.39Q106.83 15.11 106.83 16.21L106.83 23.50L104.40 23.50L104.40 22L104.30 22Q104.06 22.46 103.64 22.85Q103.21 23.25 102.58 23.49Q101.95 23.72 101.09 23.72M101.75 21.84Q102.54 21.84 103.11 21.53Q103.68 21.21 104 20.70Q104.31 20.19 104.31 19.58L104.31 18.29Q104.19 18.39 103.89 18.48Q103.59 18.57 103.23 18.64Q102.86 18.71 102.50 18.75Q102.15 18.80 101.90 18.83Q101.34 18.91 100.88 19.09Q100.42 19.26 100.16 19.58Q99.90 19.90 99.90 20.40Q99.90 20.87 100.14 21.19Q100.38 21.51 100.79 21.67Q101.21 21.84 101.75 21.84 M108.38 12.58L114.58 12.58L114.58 14.57L108.38 14.57L108.38 12.58M109.93 20.64L109.93 9.98L112.47 9.98L112.47 20.42Q112.47 21.02 112.72 21.30Q112.98 21.58 113.55 21.58Q113.73 21.58 114.02 21.53Q114.30 21.49 114.48 21.45L114.88 23.41Q114.46 23.54 114.02 23.59Q113.58 23.65 113.18 23.65Q111.61 23.65 110.77 22.87Q109.93 22.08 109.93 20.64 M121.33 23.72Q119.73 23.72 118.56 23.02Q117.39 22.31 116.75 21.04Q116.11 19.78 116.11 18.10Q116.11 16.40 116.75 15.13Q117.39 13.85 118.56 13.15Q119.73 12.45 121.33 12.45Q122.23 12.45 123.02 12.68Q123.80 12.91 124.41 13.36Q125.03 13.80 125.44 14.44Q125.86 15.07 126.03 15.87L123.66 16.37Q123.55 15.95 123.35 15.60Q123.15 15.26 122.86 15.01Q122.57 14.77 122.19 14.64Q121.80 14.51 121.35 14.51Q120.46 14.51 119.87 14.98Q119.29 15.45 118.99 16.26Q118.70 17.06 118.70 18.09Q118.70 19.10 118.99 19.91Q119.29 20.72 119.87 21.19Q120.46 21.66 121.35 21.66Q121.81 21.66 122.20 21.53Q122.59 21.39 122.88 21.14Q123.18 20.88 123.39 20.52Q123.59 20.16 123.69 19.72L126.06 20.22Q125.89 21.04 125.47 21.68Q125.06 22.33 124.44 22.78Q123.82 23.24 123.03 23.48Q122.24 23.72 121.33 23.72 M130.78 17.10L130.78 23.50L128.24 23.50L128.24 8.95L130.74 8.95L130.74 15.28L130.48 15.28Q130.94 13.86 131.82 13.15Q132.71 12.45 134.05 12.45Q135.17 12.45 136.02 12.92Q136.86 13.40 137.33 14.32Q137.79 15.24 137.79 16.56L137.79 23.50L135.24 23.50L135.24 16.95Q135.24 15.85 134.68 15.23Q134.11 14.60 133.11 14.60Q132.44 14.60 131.91 14.90Q131.38 15.19 131.08 15.75Q130.78 16.31 130.78 17.10';

const AI_PILL_FULL_PATH =
  'M153.85 22L152.36 22L155.02 14.36L156.76 14.36L159.49 22L157.99 22L156.63 18.03Q156.43 17.42 156.21 16.64Q156 15.86 155.74 14.87L156.02 14.87Q155.77 15.87 155.56 16.66Q155.35 17.44 155.17 18.03L153.85 22M157.93 20.11L153.91 20.11L153.91 19.01L157.93 19.01 M160.51 14.36L161.88 14.36L161.88 22L160.51 22';

const WORDMARK_STACKED_PATH =
  'M17.72 68.18Q15.78 68.18 14.63 67.13Q13.49 66.08 13.49 64.13L13.49 63.39L15.83 63.39L15.83 64.15Q15.83 65.18 16.35 65.71Q16.86 66.24 17.72 66.24Q18.57 66.24 19.08 65.71Q19.59 65.18 19.59 64.15L19.59 54.90L21.92 54.90L21.92 64.12Q21.92 66.07 20.78 67.12Q19.65 68.18 17.72 68.18 M28.71 68.20Q27.28 68.20 26.22 67.56Q25.17 66.93 24.59 65.79Q24.01 64.65 24.01 63.14Q24.01 61.61 24.59 60.46Q25.17 59.32 26.22 58.68Q27.28 58.05 28.71 58.05Q30.15 58.05 31.20 58.68Q32.26 59.32 32.83 60.46Q33.41 61.61 33.41 63.14Q33.41 64.65 32.83 65.79Q32.26 66.93 31.20 67.56Q30.15 68.20 28.71 68.20M28.71 66.35Q29.51 66.35 30.04 65.92Q30.57 65.49 30.83 64.76Q31.09 64.03 31.09 63.13Q31.09 62.23 30.83 61.50Q30.57 60.77 30.04 60.34Q29.51 59.91 28.71 59.91Q27.91 59.91 27.39 60.34Q26.86 60.77 26.60 61.49Q26.34 62.22 26.60 63.13Q26.34 64.03 26.60 64.76Q26.86 65.49 27.39 65.92Q27.91 66.35 28.71 66.35 M40.59 68.18Q39.76 68.18 39.19 67.89Q38.63 67.60 38.30 67.20Q37.96 66.80 37.79 66.44L37.64 66.44L37.64 68L35.41 68L35.41 54.90L37.69 54.90L37.69 59.80L37.79 59.80Q37.96 59.45 38.29 59.04Q38.61 58.64 39.17 58.35Q39.73 58.05 40.60 58.05Q41.74 58.05 42.66 58.63Q43.57 59.21 44.11 60.34Q44.65 61.47 44.65 63.10Q44.65 64.72 44.12 65.86Q43.60 66.99 42.68 67.58Q41.76 68.18 40.59 68.18M39.98 66.29Q40.74 66.29 41.26 65.88Q41.78 65.46 42.04 64.73Q42.30 64.01 42.30 63.10Q42.30 62.18 42.05 61.47Q41.79 60.75 41.27 60.34Q40.75 59.93 39.98 59.93Q39.22 59.93 38.70 60.33Q38.18 60.72 37.91 61.43Q37.65 62.14 37.65 63.10Q37.65 64.05 37.91 64.77Q38.18 65.50 38.71 65.90Q39.23 66.29 39.98 66.29 M49.05 68L46.74 68L46.74 54.90L50.28 54.90L52.76 61.66Q52.90 62.04 53.06 62.63Q53.22 63.23 53.39 63.91Q53.56 64.60 53.72 65.25Q53.87 65.91 53.98 66.41L53.50 66.41Q53.61 65.92 53.76 65.27Q53.92 64.63 54.09 63.94Q54.26 63.25 54.42 62.65Q54.58 62.05 54.71 61.66L57.17 54.90L60.71 54.90L60.71 68L58.37 68L58.37 61.39Q58.37 60.97 58.38 60.37Q58.39 59.77 58.41 59.09Q58.42 58.40 58.44 57.70Q58.46 57 58.46 56.37L58.63 56.37Q58.45 57.07 58.24 57.79Q58.04 58.52 57.84 59.20Q57.63 59.88 57.45 60.45Q57.27 61.02 57.14 61.39L54.72 68L52.73 68L50.28 61.39Q50.14 61.02 49.96 60.46Q49.78 59.91 49.58 59.23Q49.37 58.55 49.16 57.82Q48.96 57.08 48.76 56.37L48.95 56.37Q48.96 56.96 48.98 57.65Q48.99 58.34 49.01 59.04Q49.02 59.73 49.03 60.34Q49.05 60.95 49.05 61.39 M65.98 68.20Q65.05 68.20 64.30 67.86Q63.56 67.53 63.13 66.87Q62.70 66.21 62.70 65.24Q62.70 64.41 63.01 63.86Q63.32 63.32 63.85 62.99Q64.38 62.67 65.05 62.50Q65.72 62.33 66.44 62.26Q67.29 62.16 67.83 62.09Q68.36 62.02 68.61 61.87Q68.87 61.71 68.87 61.37L68.87 61.33Q68.87 60.85 68.67 60.51Q68.48 60.17 68.10 59.99Q67.71 59.81 67.15 59.81Q66.58 59.81 66.16 59.98Q65.75 60.16 65.48 60.44Q65.22 60.72 65.09 61.05L62.98 60.62Q63.27 59.75 63.87 59.18Q64.48 58.61 65.32 58.33Q66.16 58.05 67.14 58.05Q67.84 58.05 68.54 58.21Q69.25 58.38 69.84 58.76Q70.43 59.15 70.79 59.80Q71.15 60.45 71.15 61.43L71.15 68L68.96 68L68.96 66.65L68.87 66.65Q68.65 67.06 68.27 67.42Q67.89 67.77 67.32 67.99Q66.76 68.20 65.98 68.20M66.57 66.51Q67.28 66.51 67.80 66.22Q68.31 65.94 68.60 65.48Q68.88 65.02 68.88 64.48L68.88 63.32Q68.77 63.40 68.50 63.48Q68.23 63.56 67.90 63.62Q67.57 63.68 67.25 63.73Q66.93 63.77 66.71 63.80Q66.20 63.87 65.79 64.03Q65.38 64.19 65.14 64.47Q64.91 64.76 64.91 65.21Q64.91 65.64 65.13 65.92Q65.34 66.21 65.71 66.36Q66.09 66.51 66.57 66.51 M72.54 58.17L78.12 58.17L78.12 59.97L72.54 59.97L72.54 58.17M73.94 65.42L73.94 55.84L76.22 55.84L76.22 65.23Q76.22 65.77 76.45 66.02Q76.68 66.27 77.20 66.27Q77.36 66.27 77.61 66.23Q77.87 66.19 78.03 66.15L78.39 67.92Q78.01 68.04 77.62 68.08Q77.22 68.13 76.86 68.13Q75.45 68.13 74.69 67.43Q73.94 66.73 73.94 65.42 M84.19 68.20Q82.76 68.20 81.71 67.56Q80.65 66.93 80.08 65.79Q79.50 64.65 79.50 63.14Q79.50 61.61 80.08 60.46Q80.65 59.32 81.71 58.68Q82.76 58.05 84.19 58.05Q85.01 58.05 85.71 58.26Q86.42 58.47 86.97 58.87Q87.52 59.27 87.90 59.84Q88.27 60.42 88.43 61.14L86.29 61.58Q86.20 61.21 86.02 60.89Q85.84 60.58 85.57 60.36Q85.31 60.14 84.97 60.02Q84.62 59.91 84.21 59.91Q83.41 59.91 82.88 60.33Q82.36 60.76 82.09 61.48Q81.83 62.21 81.83 63.13Q81.83 64.04 82.09 64.77Q82.36 65.50 82.88 65.92Q83.41 66.35 84.21 66.35Q84.63 66.35 84.98 66.22Q85.33 66.10 85.60 65.87Q85.86 65.64 86.05 65.32Q86.23 64.99 86.32 64.60L88.46 65.05Q88.30 65.79 87.92 66.37Q87.55 66.95 86.99 67.35Q86.43 67.76 85.73 67.98Q85.02 68.20 84.19 68.20 M92.70 62.24L92.70 68L90.42 68L90.42 54.90L92.67 54.90L92.67 60.60L92.43 60.60Q92.84 59.33 93.64 58.69Q94.44 58.05 95.65 58.05Q96.66 58.05 97.42 58.48Q98.18 58.91 98.59 59.74Q99.01 60.56 99.01 61.75L99.01 68L96.72 68L96.72 62.10Q96.72 61.12 96.21 60.56Q95.70 59.99 94.80 59.99Q94.20 59.99 93.72 60.26Q93.25 60.52 92.97 61.03Q92.70 61.53 92.70 62.24';

const AI_PILL_STACKED_PATH =
  'M112.99 66.80L111.63 66.80L114.04 59.89L115.62 59.89L118.08 66.80L116.73 66.80L115.50 63.21Q115.32 62.65 115.12 61.95Q114.93 61.25 114.69 60.35L114.95 60.35Q114.72 61.26 114.53 61.96Q114.34 62.67 114.17 63.21L112.99 66.80M116.68 65.09L113.04 65.09L113.04 64.09L116.68 64.09 M119.01 59.89L120.25 59.89L120.25 66.80L119.01 66.80';

// Sizing maps
const FULL_DIMENSIONS: Record<'sm' | 'md' | 'lg' | 'xl', { w: number; h: number }> = {
  sm: { w: 124, h: 26 },
  md: { w: 152, h: 32 },
  lg: { w: 172, h: 36 },
  xl: { w: 215, h: 45 },
};

const STACKED_DIMENSIONS: Record<'sm' | 'md' | 'lg' | 'xl', { w: number; h: number }> = {
  sm: { w: 100, h: 60 },
  md: { w: 120, h: 72 },
  lg: { w: 140, h: 84 },
  xl: { w: 175, h: 105 },
};

export default function Logo({
  variant = 'full',
  size = 'md',
  className = '',
  monochrome = false,
  withLink = true,
  href = '/',
  onClick,
  ariaLabel = 'JobMatch AI',
}: LogoProps) {
  // If variant is 'mark', delegate cleanly to LogoMark
  if (variant === 'mark') {
    const markContent = (
      <LogoMark
        size={size}
        className={className}
        monochrome={monochrome}
        ariaLabel={ariaLabel}
        ariaHidden={withLink}
      />
    );

    if (withLink) {
      return (
        <Link
          href={href}
          onClick={onClick}
          aria-label={ariaLabel}
          className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md transition-opacity hover:opacity-90"
        >
          {markContent}
        </Link>
      );
    }

    if (onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          aria-label={ariaLabel}
          className="inline-flex items-center cursor-pointer border-none bg-transparent p-0"
        >
          {markContent}
        </button>
      );
    }

    return markContent;
  }

  // Calculate width/height for full or stacked variants
  let width: number | string = 172;
  let height: number | string = 36;

  if (variant === 'full') {
    if (typeof size === 'number') {
      height = size;
      width = Math.round((172 / 36) * size);
    } else if (size in FULL_DIMENSIONS) {
      width = FULL_DIMENSIONS[size as keyof typeof FULL_DIMENSIONS].w;
      height = FULL_DIMENSIONS[size as keyof typeof FULL_DIMENSIONS].h;
    }
  } else if (variant === 'stacked') {
    if (typeof size === 'number') {
      height = size;
      width = Math.round((140 / 84) * size);
    } else if (size in STACKED_DIMENSIONS) {
      width = STACKED_DIMENSIONS[size as keyof typeof STACKED_DIMENSIONS].w;
      height = STACKED_DIMENSIONS[size as keyof typeof STACKED_DIMENSIONS].h;
    }
  }

  // Render SVG with outlined paths
  const svgElement =
    variant === 'stacked' ? (
      <svg
        viewBox="0 0 140 84"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
        aria-hidden={withLink}
        role={withLink ? 'presentation' : 'img'}
      >
        {/* Centered Mark */}
        <g transform="translate(52, 6) scale(1.125)">
          {monochrome ? (
            <>
              <path
                d="M 5,6.5 C 5,5.12 6.12,4 7.5,4 L 17,4 L 23,10 L 23,25.5 C 23,26.88 21.88,28 20.5,28 L 7.5,28 C 6.12,28 5,26.88 5,25.5 Z"
                fill="currentColor"
                fillOpacity={0.12}
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path
                d="M 17,4 L 17,8.5 C 17,9.33 17.67,10 18.5,10 L 23,10 Z"
                fill="currentColor"
                fillOpacity={0.22}
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <line x1="9" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
              <line x1="9" y1="18" x2="14.5" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
              <line x1="9" y1="22" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
              <path
                d="M 24.5,1.5 C 24.5,2.6 25.4,3.5 26.5,3.5 C 25.4,3.5 24.5,4.4 24.5,5.5 C 24.5,4.4 23.6,3.5 22.5,3.5 C 23.6,3.5 24.5,2.6 24.5,1.5 Z"
                fill="currentColor"
              />
              <circle cx="22" cy="22" r="5.5" fill="currentColor" stroke="var(--bg, #FAF8F4)" strokeWidth="2" />
              <path d="M 19.3,22.2 L 21.1,24 L 24.8,20.2" stroke="var(--bg, #FAF8F4)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : (
            <>
              <path
                d="M 5,6.5 C 5,5.12 6.12,4 7.5,4 L 17,4 L 23,10 L 23,25.5 C 23,26.88 21.88,28 20.5,28 L 7.5,28 C 6.12,28 5,26.88 5,25.5 Z"
                fill="var(--brand-soft, #E3EFEA)"
                stroke="var(--brand, #0F5C4D)"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path
                d="M 17,4 L 17,8.5 C 17,9.33 17.67,10 18.5,10 L 23,10 Z"
                fill="var(--brand-subtle, #D1E7DF)"
                stroke="var(--brand, #0F5C4D)"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <line x1="9" y1="14" x2="17" y2="14" stroke="var(--brand, #0F5C4D)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
              <line x1="9" y1="18" x2="14.5" y2="18" stroke="var(--brand, #0F5C4D)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
              <line x1="9" y1="22" x2="12" y2="22" stroke="var(--brand, #0F5C4D)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
              <path
                d="M 24.5,1.5 C 24.5,2.6 25.4,3.5 26.5,3.5 C 25.4,3.5 24.5,4.4 24.5,5.5 C 24.5,4.4 23.6,3.5 22.5,3.5 C 23.6,3.5 24.5,2.6 24.5,1.5 Z"
                fill="var(--highlight, #C8892B)"
              />
              <circle cx="22" cy="22" r="5.5" fill="var(--brand, #0F5C4D)" stroke="var(--bg, #FAF8F4)" strokeWidth="2" />
              <path d="M 19.3,22.2 L 21.1,24 L 24.8,20.2" stroke="var(--on-brand, #FFFFFF)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
        </g>

        {/* Stacked Wordmark */}
        <path d={WORDMARK_STACKED_PATH} fill={monochrome ? 'currentColor' : 'var(--text-primary, #14181F)'} />

        {/* Stacked AI Pill */}
        <rect
          x="105.5"
          y="55.5"
          width="21"
          height="15.5"
          rx="7.75"
          fill={monochrome ? 'currentColor' : 'var(--brand-soft, #E3EFEA)'}
          fillOpacity={monochrome ? 0.12 : 1}
          stroke={monochrome ? 'currentColor' : 'var(--brand, #0F5C4D)'}
          strokeOpacity={monochrome ? 0.25 : 0.25}
          strokeWidth="1"
        />
        <path d={AI_PILL_STACKED_PATH} fill={monochrome ? 'currentColor' : 'var(--brand, #0F5C4D)'} />
      </svg>
    ) : (
      // Horizontal Full Logo
      <svg
        viewBox="0 0 172 36"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
        aria-hidden={withLink}
        role={withLink ? 'presentation' : 'img'}
      >
        {/* Mark translated to (2, 2) */}
        <g transform="translate(2, 2)">
          {monochrome ? (
            <>
              <path
                d="M 5,6.5 C 5,5.12 6.12,4 7.5,4 L 17,4 L 23,10 L 23,25.5 C 23,26.88 21.88,28 20.5,28 L 7.5,28 C 6.12,28 5,26.88 5,25.5 Z"
                fill="currentColor"
                fillOpacity={0.12}
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path
                d="M 17,4 L 17,8.5 C 17,9.33 17.67,10 18.5,10 L 23,10 Z"
                fill="currentColor"
                fillOpacity={0.22}
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <line x1="9" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
              <line x1="9" y1="18" x2="14.5" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
              <line x1="9" y1="22" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
              <path
                d="M 24.5,1.5 C 24.5,2.6 25.4,3.5 26.5,3.5 C 25.4,3.5 24.5,4.4 24.5,5.5 C 24.5,4.4 23.6,3.5 22.5,3.5 C 23.6,3.5 24.5,2.6 24.5,1.5 Z"
                fill="currentColor"
              />
              <circle cx="22" cy="22" r="5.5" fill="currentColor" stroke="var(--bg, #FAF8F4)" strokeWidth="2" />
              <path d="M 19.3,22.2 L 21.1,24 L 24.8,20.2" stroke="var(--bg, #FAF8F4)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : (
            <>
              <path
                d="M 5,6.5 C 5,5.12 6.12,4 7.5,4 L 17,4 L 23,10 L 23,25.5 C 23,26.88 21.88,28 20.5,28 L 7.5,28 C 6.12,28 5,26.88 5,25.5 Z"
                fill="var(--brand-soft, #E3EFEA)"
                stroke="var(--brand, #0F5C4D)"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path
                d="M 17,4 L 17,8.5 C 17,9.33 17.67,10 18.5,10 L 23,10 Z"
                fill="var(--brand-subtle, #D1E7DF)"
                stroke="var(--brand, #0F5C4D)"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <line x1="9" y1="14" x2="17" y2="14" stroke="var(--brand, #0F5C4D)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
              <line x1="9" y1="18" x2="14.5" y2="18" stroke="var(--brand, #0F5C4D)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
              <line x1="9" y1="22" x2="12" y2="22" stroke="var(--brand, #0F5C4D)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
              <path
                d="M 24.5,1.5 C 24.5,2.6 25.4,3.5 26.5,3.5 C 25.4,3.5 24.5,4.4 24.5,5.5 C 24.5,4.4 23.6,3.5 22.5,3.5 C 23.6,3.5 24.5,2.6 24.5,1.5 Z"
                fill="var(--highlight, #C8892B)"
              />
              <circle cx="22" cy="22" r="5.5" fill="var(--brand, #0F5C4D)" stroke="var(--bg, #FAF8F4)" strokeWidth="2" />
              <path d="M 19.3,22.2 L 21.1,24 L 24.8,20.2" stroke="var(--on-brand, #FFFFFF)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
        </g>

        {/* Wordmark */}
        <path d={WORDMARK_FULL_PATH} fill={monochrome ? 'currentColor' : 'var(--text-primary, #14181F)'} />

        {/* AI Pill Badge */}
        <rect
          x="145.5"
          y="9.5"
          width="23.5"
          height="17"
          rx="8.5"
          fill={monochrome ? 'currentColor' : 'var(--brand-soft, #E3EFEA)'}
          fillOpacity={monochrome ? 0.12 : 1}
          stroke={monochrome ? 'currentColor' : 'var(--brand, #0F5C4D)'}
          strokeOpacity={monochrome ? 0.25 : 0.25}
          strokeWidth="1"
        />
        <path d={AI_PILL_FULL_PATH} fill={monochrome ? 'currentColor' : 'var(--brand, #0F5C4D)'} />
      </svg>
    );

  // In RTL pages, brand names stay LTR; dir="ltr" preserves exact logo flow
  const wrappedContent = (
    <span dir="ltr" className="inline-flex items-center">
      {svgElement}
    </span>
  );

  if (withLink) {
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-label={ariaLabel}
        className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md transition-opacity hover:opacity-95"
      >
        {wrappedContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className="inline-flex items-center cursor-pointer border-none bg-transparent p-0"
      >
        {wrappedContent}
      </button>
    );
  }

  return wrappedContent;
}
