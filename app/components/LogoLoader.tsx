'use client';

import React from 'react';
import BrandedLoader, { BrandedLoaderProps } from '@/components/brand/BrandedLoader';

export interface LogoLoaderProps {
  text?: string;
  subtext?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
  progress?: number;
  stage?: string;
  onCancel?: () => void;
  cancelText?: string;
}

export default function LogoLoader({
  text = 'JobMatch AI',
  subtext = 'Preparing your workspace...',
  size = 'md',
  fullScreen = true,
  className = '',
  progress,
  stage,
  onCancel,
  cancelText,
}: LogoLoaderProps) {
  return (
    <BrandedLoader
      status={text}
      subtext={subtext}
      size={size}
      fullScreen={fullScreen}
      className={className}
      progress={progress}
      stage={stage}
      onCancel={onCancel}
      cancelText={cancelText}
    />
  );
}
