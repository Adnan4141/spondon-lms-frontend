'use client';

import { cn } from '@/lib/utils';
import type { EnrollmentModalController } from './hooks/useEnrollmentModal';

export function EnrollmentModalStepTabs({ ctrl }: { ctrl: EnrollmentModalController }) {
  const { step, setStep } = ctrl;

  return (
      <div className="flex border border-slate-200 rounded-xl overflow-hidden mb-6">
        {['Program & Courses', 'Review & Confirm'].map((s, i) => (
          <div
            key={i}
            onClick={() => step > i + 1 && setStep(i + 1)}
            className={cn(
              'flex-1 px-4 py-3 text-center text-sm font-bold transition-colors',
              i === 0 && 'border-r border-slate-200',
              step === i + 1
                ? 'bg-slate-900 text-white'
                : step > i + 1
                  ? 'bg-indigo-50 text-indigo-700 cursor-pointer'
                  : 'bg-slate-50 text-slate-400',
            )}
          >
            {step > i + 1 ? '✓ ' : `${i + 1}. `}{s}
          </div>
        ))}
      </div>
  );
}
