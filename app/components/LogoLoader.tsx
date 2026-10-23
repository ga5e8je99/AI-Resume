'use client';

import React from 'react';

interface LogoLoaderProps {
  text?: string;
  subtext?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

export default function LogoLoader({
  text = 'JobMatch AI',
  subtext = 'Loading, please wait...',
  size = 'md',
  fullScreen = true,
  className = '',
}: LogoLoaderProps) {
  const sizeConfig = {
    sm: {
      box: 'w-16 h-16',
      icon: 40,
      ring: 'w-24 h-24',
      text: 'text-base',
      subtext: 'text-xs',
    },
    md: {
      box: 'w-24 h-24',
      icon: 56,
      ring: 'w-36 h-36',
      text: 'text-xl',
      subtext: 'text-sm',
    },
    lg: {
      box: 'w-32 h-32',
      icon: 72,
      ring: 'w-48 h-48',
      text: 'text-2xl',
      subtext: 'text-base',
    },
  };

  const currentSize = sizeConfig[size];

  const content = (
    <div className={`flex flex-col items-center justify-center p-6 text-center select-none ${className}`}>
      {/* Animated Emblem Wrapper */}
      <div className="relative flex items-center justify-center">
        {/* Sonar Radar Pulse Waves */}
        <div
          className={`absolute ${currentSize.ring} rounded-full border border-cyan-500/20 animate-ping opacity-60 pointer-events-none`}
          style={{ animationDuration: '2.5s' }}
        />
        <div
          className={`absolute ${currentSize.ring} rounded-full border border-fuchsia-500/20 animate-ping opacity-40 pointer-events-none delay-500`}
          style={{ animationDuration: '3s' }}
        />

        {/* Orbiting Neon Ring */}
        <div
          className={`absolute ${currentSize.ring} rounded-full border-2 border-transparent border-t-cyan-400 border-r-fuchsia-500/40 animate-spin`}
          style={{ animationDuration: '2s' }}
        />
        <div
          className={`absolute ${currentSize.ring} rounded-full border-2 border-transparent border-b-blue-500 border-l-purple-500/30 animate-spin`}
          style={{ animationDuration: '3.5s', animationDirection: 'reverse' }}
        />

        {/* Ambient Glow Backdrop */}
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-cyan-500/30 via-blue-500/20 to-pink-500/30 blur-xl opacity-80 animate-pulse" />

        {/* Central Logo Box with Floating Breathing Animation */}
        <div
          className={`${currentSize.box} relative rounded-2xl sm:rounded-3xl bg-slate-950/90 border border-cyan-500/40 p-2.5 sm:p-3 flex items-center justify-center shadow-[0_0_35px_rgba(6,182,212,0.25)] backdrop-blur-xl animate-bounce-subtle`}
        >
          {/* Shimmer Light Sweep */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full animate-shimmer" />
          </div>

          {/* Scalable Vector JM Monogram Logo */}
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full filter drop-shadow-[0_0_10px_rgba(6,182,212,0.7)]"
          >
            <defs>
              <linearGradient id="loaderJmGrad" x1="10%" y1="10%" x2="90%" y2="90%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="35%" stopColor="#38bdf8" />
                <stop offset="65%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#e879f9" />
              </linearGradient>
              <linearGradient id="loaderGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.9" />
              </linearGradient>
              <filter id="loaderNeon" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Glowing neon aura dash circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="url(#loaderGlowGrad)"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity="0.4"
              className="animate-spin"
              style={{ animationDuration: '12s' }}
            />

            {/* Letter J */}
            <path
              d="M32 24 H48 V56 C48 64 42 70 32 70 C24 70 18 64 18 56"
              stroke="url(#loaderJmGrad)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#loaderNeon)"
            />
            <path
              d="M32 24 V32"
              stroke="url(#loaderJmGrad)"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Letter M - Interlocked and rising */}
            <path
              d="M48 50 L60 30 L72 50 L84 24 V70"
              stroke="url(#loaderJmGrad)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#loaderNeon)"
            />

            {/* Glowing Center AI Spark */}
            <circle cx="60" cy="30" r="3.5" fill="#ffffff" className="animate-ping" opacity="0.8" />
            <circle cx="60" cy="30" r="2.5" fill="#ffffff" />
          </svg>
        </div>
      </div>

      {/* Typography with gradient shimmer */}
      {text && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <h3
            className={`font-bold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-fuchsia-300 bg-clip-text text-transparent ${currentSize.text}`}
          >
            {text}
          </h3>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
        </div>
      )}

      {/* Subtext */}
      {subtext && (
        <p className={`text-slate-400 mt-2 font-medium max-w-sm ${currentSize.subtext}`}>
          {subtext}
        </p>
      )}

      {/* Modern Neon Progress Bar */}
      <div className="w-48 sm:w-56 h-1.5 bg-slate-800/90 rounded-full mt-5 overflow-hidden border border-slate-700/50 p-0.2">
        <div className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 rounded-full animate-indeterminate-bar" />
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes bounceSubtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        @keyframes indeterminateBar {
          0% {
            transform: translateX(-100%);
            width: 30%;
          }
          50% {
            transform: translateX(100%);
            width: 65%;
          }
          100% {
            transform: translateX(250%);
            width: 30%;
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-bounce-subtle {
          animation: bounceSubtle 2.5s ease-in-out infinite;
        }
        .animate-indeterminate-bar {
          animation: indeterminateBar 1.8s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl">
        {content}
      </div>
    );
  }

  return content;
}
