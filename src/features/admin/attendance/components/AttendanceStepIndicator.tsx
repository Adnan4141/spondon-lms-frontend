'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { num: 1, label: 'Program' },
  { num: 2, label: 'Course' },
  { num: 3, label: 'Branch' },
  { num: 4, label: 'Batch' },
  { num: 5, label: 'Mark & Export' },
] as const;

export function AttendanceStepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-0">
      {STEPS.map((step, idx) => (
        <React.Fragment key={step.num}>
          {idx > 0 && (
            <div className={cn('mx-2 h-px min-w-3 flex-1', step.num <= currentStep ? 'bg-emerald-400' : 'bg-border')} />
          )}
          <div
            className={cn(
              'flex items-center gap-1.5 text-xs',
              step.num === currentStep && 'font-medium text-emerald-800',
              step.num > currentStep && 'text-muted-foreground/50',
              step.num < currentStep && 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                step.num < currentStep && 'border-emerald-400 bg-emerald-50 text-emerald-800',
                step.num === currentStep && 'border-emerald-600 bg-emerald-600 text-white',
                step.num > currentStep && 'border-border bg-muted text-muted-foreground',
              )}
            >
              {step.num < currentStep ? <Check className="h-3 w-3" /> : step.num}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
