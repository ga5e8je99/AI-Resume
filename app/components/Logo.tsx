import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  withLink?: boolean;
  variant?: 'svg' | 'image';
  className?: string;
}

export default function Logo({
  size = 'md',
  showText = true,
  withLink = true,
  variant = 'svg',
  className = '',
}: LogoProps) {
  const sizeMap = {
    sm: { box: 'w-7 h-7 sm:w-8 sm:h-8', text: 'text-base sm:text-lg', icon: 20 },
    md: { box: 'w-9 h-9 sm:w-10 sm:h-10', text: 'text-lg sm:text-2xl', icon: 26 },
    lg: { box: 'w-11 h-11 sm:w-12 sm:h-12', text: 'text-xl sm:text-3xl', icon: 32 },
    xl: { box: 'w-14 h-14 sm:w-16 sm:h-16', text: 'text-2xl sm:text-4xl', icon: 42 },
  };

  const currentSize = sizeMap[size];

  const logoMark = (
    <div
      className={`relative group-hover:scale-105 transition-all duration-300 shrink-0 ${className}`}
    >
      {/* Outer ambient glow */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/40 via-blue-500/30 to-fuchsia-500/40 blur-sm opacity-70 group-hover:opacity-100 transition-opacity" />

      {/* Main emblem container */}
      <div
        className={`${currentSize.box} relative rounded-xl sm:rounded-2xl bg-slate-950/90 border border-cyan-500/30 p-1 flex items-center justify-center shadow-lg shadow-cyan-500/10 overflow-hidden backdrop-blur-md`}
      >
        {variant === 'image' ? (
          <Image
            src="/images/logo.jpg"
            alt="JobMatch Logo"
            width={currentSize.icon * 2}
            height={currentSize.icon * 2}
            className="w-full h-full object-cover rounded-lg"
            priority
          />
        ) : (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full p-0.5 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
          >
            <defs>
              <linearGradient id="jmLinear" x1="10%" y1="10%" x2="90%" y2="90%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="35%" stopColor="#38bdf8" />
                <stop offset="65%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#e879f9" />
              </linearGradient>
              <linearGradient id="jmLinearGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
              </linearGradient>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Glowing neon background aura circle */}
            <circle cx="50" cy="50" r="42" stroke="url(#jmLinearGlow)" strokeWidth="1" strokeDasharray="3 4" opacity="0.3" />

            {/* Interlocking Monogram JM Vector */}
            {/* Letter J */}
            <path
              d="M32 24 H48 V56 C48 64 42 70 32 70 C24 70 18 64 18 56"
              stroke="url(#jmLinear)"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#neonGlow)"
            />
            {/* Top accent for J */}
            <path
              d="M32 24 V32"
              stroke="url(#jmLinear)"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Letter M - Interlocked and rising */}
            <path
              d="M48 50 L60 30 L72 50 L84 24 V70"
              stroke="url(#jmLinear)"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#neonGlow)"
            />

            {/* Center AI Connection Spark */}
            <circle cx="60" cy="30" r="2.5" fill="#ffffff" className="animate-ping" opacity="0.75" />
            <circle cx="60" cy="30" r="2" fill="#ffffff" />
          </svg>
        )}
      </div>
    </div>
  );

  const content = (
    <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
      {logoMark}

      {showText && (
        <span className={`font-bold tracking-tight text-white flex items-center ${currentSize.text}`}>
          Job
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400 bg-clip-text text-transparent ml-0.5">
            Match
          </span>
          <span className="ml-1.5 hidden md:inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            AI
          </span>
        </span>
      )}
    </div>
  );

  if (!withLink) {
    return content;
  }

  return (
    <Link href="/" aria-label="JobMatch Home">
      {content}
    </Link>
  );
}
