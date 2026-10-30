'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  number?: string | number;
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  activeStep?: number; // 0-indexed
  className?: string;
  onStepClick?: (stepIndex: number) => void;
}

export function Stepper({
  steps,
  activeStep,
  className = '',
  onStepClick,
}: StepperProps) {
  // If activeStep is not provided, treat as static 3-step information timeline
  const isInteractive = typeof activeStep === 'number';

  return (
    <div className={`relative w-full ${className}`}>
      <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 list-none p-0 m-0">
        {steps.map((step, idx) => {
          const stepNum = step.number !== undefined ? step.number : idx + 1;
          const isCompleted = isInteractive && activeStep > idx;
          const isCurrent = isInteractive && activeStep === idx;
          const isUpcoming = isInteractive && activeStep < idx;

          return (
            <li
              key={idx}
              className={`relative flex flex-col items-start text-start z-10 ${
                onStepClick && (isCompleted || isCurrent) ? 'cursor-pointer' : ''
              }`}
              onClick={() => onStepClick && onStepClick(idx)}
            >
              {/* Connector line for desktop between steps */}
              {idx < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-4 start-10 end-0 h-px bg-border -z-10"
                  aria-hidden="true"
                />
              )}

              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-md font-mono text-xs font-semibold transition-colors duration-150 shadow-subtle ${
                    isCompleted
                      ? 'bg-brand text-on-accent border border-transparent'
                      : isCurrent
                      ? 'bg-surface text-brand border-2 border-brand font-bold ring-4 ring-brand/10'
                      : isUpcoming
                      ? 'bg-surface-2 text-text-muted border border-border'
                      : 'bg-surface text-text-primary border border-border'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-on-accent" strokeWidth={2.5} />
                  ) : (
                    <span>{stepNum}</span>
                  )}
                </div>

                <div className="md:hidden">
                  <span
                    className={`text-xs font-semibold ${
                      isCurrent ? 'text-brand' : 'text-text-primary'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              </div>

              <div className="hidden md:block">
                <h3
                  className={`font-serif text-base font-semibold tracking-tight mb-1 ${
                    isCurrent ? 'text-brand' : 'text-text-primary'
                  }`}
                >
                  {step.title}
                </h3>
                {step.description && (
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {step.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
