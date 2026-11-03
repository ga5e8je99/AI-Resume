'use client';

import React from 'react';

export type WaveVariant =
  | 'paper-to-surface2'
  | 'surface2-to-paper'
  | 'paper-to-brand'
  | 'custom';

export interface SectionWaveProps {
  id?: string;
  className?: string;
  flipX?: boolean;
  flipY?: boolean;
  variant?: WaveVariant;
  fromColor?: string;
  toColor?: string;
}

export default function SectionWave({
  id = 'wave',
  className = '',
  flipX = false,
  flipY = false,
  variant = 'paper-to-surface2',
  fromColor,
  toColor,
}: SectionWaveProps) {
  const gradientId = `wave-grad-${id}`;

  const transformParts = [
    flipX ? 'scaleX(-1)' : '',
    flipY ? 'scaleY(-1)' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Determine section background and wave fill colors based on variant
  let resolvedFrom = 'var(--paper)';
  let resolvedTo = 'var(--surface-2)';
  let isBrandWave = false;

  if (variant === 'paper-to-surface2') {
    resolvedFrom = 'var(--paper)';
    resolvedTo = 'var(--surface-2)';
  } else if (variant === 'surface2-to-paper') {
    resolvedFrom = 'var(--surface-2)';
    resolvedTo = 'var(--paper)';
  } else if (variant === 'paper-to-brand') {
    resolvedFrom = 'var(--paper)';
    resolvedTo = 'var(--brand)';
    isBrandWave = true;
  } else if (variant === 'custom') {
    resolvedFrom = fromColor || 'var(--paper)';
    resolvedTo = toColor || 'var(--surface-2)';
  }

  // Allow explicit prop overrides
  if (fromColor) resolvedFrom = fromColor;
  if (toColor) resolvedTo = toColor;

  return (
    <div
      aria-hidden="true"
      style={{ backgroundColor: resolvedFrom }}
      className={`w-full overflow-x-clip overflow-y-hidden leading-none select-none pointer-events-none transition-colors duration-150 ${className}`}
    >
      <svg
        id={`wave-svg-${id}`}
        viewBox="0 0 1440 390"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-10 sm:h-14 lg:h-18 transition-all duration-300 ease-in-out block"
        style={transformParts ? { transform: transformParts } : undefined}
      >
        <defs>
          {isBrandWave ? (
            <linearGradient id={gradientId} x1="18%" y1="88%" x2="82%" y2="12%">
              <stop offset="5%" stopColor="var(--brand)" stopOpacity="0.55" />
              <stop offset="50%" stopColor="var(--brand-hover, #0B4A3E)" stopOpacity="0.65" />
              <stop offset="95%" stopColor="var(--highlight, #C8892B)" stopOpacity="0.45" />
            </linearGradient>
          ) : (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--border)" stopOpacity="0.4" />
              <stop offset="50%" stopColor="var(--brand-soft)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--border)" stopOpacity="0.4" />
            </linearGradient>
          )}
        </defs>

        {/* Back Wave Layer (Path 0) */}
        <path
          d="M 0,400 L 0,100 C 57.61229749631812,91.45158321060383 115.22459499263624,82.90316642120766 172,71 C 228.77540500736376,59.096833578792335 284.7139175257731,43.83891752577319 356,52 C 427.2860824742269,60.16108247422681 513.9197349042711,91.74116347569958 565,110 C 616.0802650957289,128.25883652430042 631.6071428571428,133.19642857142856 689,121 C 746.3928571428572,108.80357142857143 845.6516936671576,79.47312223858614 921,77 C 996.3483063328424,74.52687776141386 1047.7860824742268,98.91108247422682 1098,103 C 1148.2139175257732,107.08891752577318 1197.2039764359354,90.88254786450662 1254,87 C 1310.7960235640646,83.11745213549338 1375.3980117820324,91.55872606774669 1440,100 L 1440,400 L 0,400 Z"
          stroke="none"
          strokeWidth="0"
          fill={`url(#${gradientId})`}
          className="transition-all duration-300 ease-in-out path-0"
        />

        {/* Front Wave Layer (Path 1) - Matches the incoming section's exact background */}
        <path
          d="M 0,400 L 0,233 C 54.85180412371135,256.0167525773196 109.7036082474227,279.03350515463916 173,278 C 236.2963917525773,276.96649484536084 308.0373711340206,251.8827319587629 372,243 C 435.9626288659794,234.1172680412371 492.1469072164948,241.43556701030928 547,237 C 601.8530927835052,232.56443298969072 655.375,216.37500000000006 712,224 C 768.625,231.62499999999994 828.3530927835052,263.0644329896907 891,270 C 953.6469072164948,276.9355670103093 1019.2126288659792,259.36726804123714 1088,259 C 1156.7873711340208,258.63273195876286 1228.7963917525774,275.46649484536084 1288,274 C 1347.2036082474226,272.53350515463916 1393.6018041237112,252.76675257731958 1440,233 L 1440,400 L 0,400 Z"
          stroke="none"
          strokeWidth="0"
          fill={resolvedTo}
          fillOpacity="1"
          className="transition-all duration-300 ease-in-out path-1"
        />
      </svg>
    </div>
  );
}
