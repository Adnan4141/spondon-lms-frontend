'use client';

import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ResultInputMode } from '@/types/exam';
import type { ExamWizardState, ExamProductType } from '../../types';
import {
  isResultInputModeAllowed,
  RESULT_INPUT_MODE_LABELS,
  resultInputModesEqual,
  suggestedResultModes,
} from '../../types';
import type { WizardFormAction } from '../examWizardReducer';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
  deliveryMode: 'ONLINE' | 'OFFLINE';
};

const ALL_MODES: ResultInputMode[] = [
  'AUTOMATED',
  'SINGLE_MANUAL',
  'BULK_MANUAL',
  'BULK_EXCEL',
  'OMR_SCAN',
];

const PRODUCT_TYPE_LABEL: Record<ExamProductType, string> = {
  MCQ: 'MCQ',
  WRITTEN: 'Written',
  COMBINED: 'Combined',
  MULTI: 'Multi-subject',
};

/**
 * Marks a mode as unavailable for the current type/course delivery combo.
 * Mirrors the preflight checks in `preflightExam` so admins see invalid
 * choices greyed out instead of hitting the error on finalize.
 */
function disabledReason(
  mode: ResultInputMode,
  state: ExamWizardState,
  deliveryMode: 'ONLINE' | 'OFFLINE',
): string | null {
  if (!isResultInputModeAllowed(mode, state.productType, deliveryMode)) {
    if (mode === 'AUTOMATED') return 'Online course only.';
    if (mode === 'OMR_SCAN' && deliveryMode !== 'OFFLINE') return 'Offline course only.';
    if (mode === 'OMR_SCAN') return 'Not supported for Written exams.';
  }
  return null;
}

export function ResultInputModeSelector({ state, dispatch, deliveryMode }: Props) {
  const suggestion = useMemo(
    () => suggestedResultModes(state.productType, deliveryMode),
    [state.productType, deliveryMode],
  );
  const suggestedSet = useMemo(() => new Set(suggestion ?? []), [suggestion]);
  const alreadyMatchingSuggestion = useMemo(
    () => Boolean(suggestion && resultInputModesEqual(state.resultInputModes, suggestion)),
    [suggestion, state.resultInputModes],
  );

  const toggle = (mode: ResultInputMode) => {
    const next = state.resultInputModes.includes(mode)
      ? state.resultInputModes.filter((m) => m !== mode)
      : [...state.resultInputModes, mode];
    dispatch({ type: 'SET_RESULT_INPUT_MODES', modes: next, deliveryMode });
  };

  const applySuggestion = () => {
    dispatch({ type: 'APPLY_SUGGESTED_RESULT_MODES', deliveryMode });
  };

  const productTypeLabel = state.productType ? PRODUCT_TYPE_LABEL[state.productType] : 'this exam';
  const suggestionLabels = (suggestion ?? []).map((m) => RESULT_INPUT_MODE_LABELS[m]).join(' + ');

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-base text-[#0D1B35]">Result entry methods</CardTitle>
        <CardDescription>
          Pick every way teachers and admins may submit marks. You can combine multiple methods (for example: OMR scan + manual single entry for resits).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestion && suggestion.length > 0 && !alreadyMatchingSuggestion ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#C8A96E]/40 bg-[#FBF4E6]/60 px-3 py-2">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#0D1B35]" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#0D1B35]">
                  Recommended for {productTypeLabel} + {deliveryMode === 'ONLINE' ? 'Online' : 'Offline'} course
                </p>
                <p className="text-[11px] text-slate-600">{suggestionLabels}</p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 border-[#0D1B35] bg-white px-3 text-[11px] font-bold text-[#0D1B35] hover:bg-[#0D1B35] hover:text-[#E2C98A]"
              onClick={applySuggestion}
            >
              Apply
            </Button>
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_MODES.map((mode) => {
            const checked = state.resultInputModes.includes(mode);
            const reason = disabledReason(mode, state, deliveryMode);
            const isSuggested = suggestedSet.has(mode) && !reason;
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
                title={reason ?? (isSuggested ? 'Recommended for this exam type and delivery mode.' : '')}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">{RESULT_INPUT_MODE_LABELS[mode]}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    {isSuggested && !checked ? (
                      <Badge variant="outline" className="border-[#C8A96E] text-[10px] text-[#0D1B35]">
                        Suggested
                      </Badge>
                    ) : null}
                    {checked ? (
                      <Badge className="bg-[#0D1B35] text-[10px] text-[#E2C98A]">Selected</Badge>
                    ) : null}
                  </div>
                </div>
                {reason ? <p className="mt-1 text-[11px] text-slate-500">{reason}</p> : null}
                {isSuggested && !reason && !checked ? (
                  <p className="mt-1 text-[11px] text-[#7A6035]">Recommended for the current type + course.</p>
                ) : null}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
