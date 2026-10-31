'use client';

import React from 'react';
import { FileQuestion } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-lg border -line-strong bg-surface ${className}`}
    >
      <div className="w-12 h-12 rounded-lg border -line-strong bg-surface-2 flex items-center justify-center -ink-2 mb-4 shadow-subtle">
        {icon || <FileQuestion className="w-6 h-6 -ink-2" aria-hidden="true" />}
      </div>
      <h3 className="font-serif text-lg font-semibold -ink mb-1.5">{title}</h3>
      <p className="text-sm -ink-2 max-w-sm leading-relaxed mb-6">{description}</p>
      
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button variant="primary" size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" size="md" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
