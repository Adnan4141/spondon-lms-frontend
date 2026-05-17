'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ResultInputMode } from '@/types/exam';
import type { ExamWizardState } from '../../types';
import { RESULT_INPUT_MODE_LABELS } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
};

const ALL_MODES: ResultInputMode[] = [
  'AUTOMATED',
  'SINGLE_MANUAL',
  'BULK_MANUAL',
  'BULK_EXCEL',
  'OMR_SCAN',
];

/**
 * Marks a mode as unavailable for the current type/mode combo. Mirrors the
 * preflight checks in `preflightExam` so admins see invalid choices greyed
 * out instead of hitting the error on finalize.
 */
function disabledReason(mode: ResultInputMode, state: ExamWizardState): string | null {
  if (mode === 'AUTOMATED' && state.deliveryMode !== 'ONLINE') {
    return 'Auto grading needs Online delivery.';
  }
  if (mode === 'OMR_SCAN') {
    if (state.deliveryMode !== 'OFFLINE') return 'OMR scan needs Offline delivery.';
    if (state.productType === 'WRITTEN') return 'OMR scan is not supported for Written exams.';
  }
  return null;
}

export function ResultInputModeSelector({ state, dispatch }: Props) {
  const toggle = (mode: ResultInputMode) => {
    const next = state.resultInputModes.includes(mode)
      ? state.resultInputModes.filter((m) => m !== mode)
      : [...state.resultInputModes, mode];
    dispatch({ type: 'MERGE', patch: { resultInputModes: next.length ? next : ['AUTOMATED'] } });
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-base text-[#0D1B35]">Result entry methods</CardTitle>
        <CardDescription>
          Pick every way teachers and admins may submit marks. You can combine multiple methods (for example: OMR scan + manual single entry for resits).
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_MODES.map((mode) => {
          const checked = state.resultInputModes.includes(mode);
          const reason = disabledReason(mode, state);
          return (
            <button
              key={mode}
              type="button"
              disabled={Boolean(reason)}
              onClick={() => toggle(mode)}
              className={cn(
                'rounded-lg border bg-white p-3 text-left transition-all',
                checked && !reason && 'border-[#0D1B35] bg-[#0D1B35]/[0.04] shadow-[0_0_0_3px_rgba(13,27,53,0.06)]',
                !checked && !reason && 'border-slate-200 hover:border-[#C8A96E] hover:bg-[#FBF4E6]/60',
                reason && 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60',
              )}
              title={reason ?? ''}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900">{RESULT_INPUT_MODE_LABELS[mode]}</span>
                {checked ? <Badge className="bg-[#0D1B35] text-[10px] text-[#E2C98A]">Selected</Badge> : null}
              </div>
              {reason ? <p className="mt-1 text-[11px] text-slate-500">{reason}</p> : null}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
