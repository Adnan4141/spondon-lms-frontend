'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DueReminderStep = 'review' | 'message' | 'confirm';

const STEPS: Array<{ key: DueReminderStep; label: string }> = [
  { key: 'review', label: 'Review' },
  { key: 'message', label: 'Message' },
  { key: 'confirm', label: 'Confirm' },
];

export function DueReminderStepper({
  activeStep,
  onStepClick,
}: {
  activeStep: DueReminderStep;
  onStepClick?: (step: DueReminderStep) => void;
}) {
  const activeIndex = STEPS.findIndex((step) => step.key === activeStep);

  return (
    <nav aria-label="Due reminder steps" className="rounded-xl border border-slate-200 bg-white p-3">
      <ol className="grid grid-cols-3 gap-2">
        {STEPS.map((step, index) => {
          const isComplete = index < activeIndex;
          const isActive = step.key === activeStep;
          const isClickable = onStepClick && index < activeIndex;

          return (
            <li key={step.key}>
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(step.key)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600',
                  isClickable ? 'hover:bg-slate-50' : 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black',
                    isComplete ? 'bg-emerald-500 text-white' : isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600',
                  )}
                >
                  {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="font-semibold">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
