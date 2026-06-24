'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type WizardStepItem = {
  label: string;
  stepNumber: number;
};

type Props = {
  steps: WizardStepItem[];
  activeStep: number;
  currentIndex: number;
  onStepClick: (stepNumber: number) => void;
  isStepValid: (stepNumber: number) => boolean;
};

export function ExamWizardStepNav({
  steps,
  activeStep,
  currentIndex,
  onStepClick,
  isStepValid,
}: Props) {
  const progressPct = steps.length > 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
        <p className="text-xs font-semibold text-slate-600">
          Step {currentIndex + 1} of {steps.length}
          <span className="mx-1.5 text-slate-300">·</span>
          <span className="text-[#0D1B35]">{steps[currentIndex]?.label}</span>
        </p>
        <p className="hidden text-[11px] text-slate-400 sm:block">Click any step to jump</p>
      </div>

      <div className="h-1 bg-slate-100">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-[#C8A96E] to-[#0D1B35] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-6">
        {steps.map(({ label, stepNumber: n }, i) => {
          const active = n === activeStep;
          const done = i < currentIndex;
          const valid = isStepValid(n);

          return (
            <button
              key={label}
              type="button"
              onClick={() => onStepClick(n)}
              className={cn(
                'group flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all',
                active && 'border-[#C8A96E] bg-[#FBF4E6] shadow-sm ring-1 ring-[#C8A96E]/30',
                done && !active && 'border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-50',
                !active && !done && valid && 'border-slate-200 bg-white text-slate-600 hover:border-[#C8A96E]/60 hover:bg-[#FBF4E6]/40',
                !active && !done && !valid && 'border-dashed border-slate-200 bg-slate-50/50 text-slate-500 hover:border-slate-300',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors',
                  active && 'bg-[#C8A96E] text-[#0D1B35]',
                  done && !active && 'bg-emerald-600 text-white',
                  !active && !done && valid && 'bg-slate-100 text-slate-600 group-hover:bg-[#C8A96E]/20',
                  !active && !done && !valid && 'bg-white text-slate-400',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : n}
              </span>
              <span className="truncate text-[11px] font-semibold leading-tight sm:text-xs">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
