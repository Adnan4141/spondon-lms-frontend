'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { ExamWizardState, OmrConfig, OmrSheetSize } from '../../types';
import { OMR_SHEET_PRESETS } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
  deliveryMode: 'ONLINE' | 'OFFLINE';
};

/**
 * Visible only when Type=MCQ (or COMBINED MCQ part) is delivered OFFLINE.
 * Sheet-size presets pre-fill question + option counts and persist to
 * `state.omrConfig`, which the persistence layer maps to
 * `exam.omrQuestionCount` / `exam.omrOptionCount`.
 */
export function OmrSheetConfigCard({ state, dispatch, deliveryMode }: Props) {
  const offlineMcq =
    deliveryMode === 'OFFLINE' && (state.productType === 'MCQ' || state.productType === 'COMBINED');
  if (!offlineMcq) return null;

  const enabled = state.omrConfig !== null;
  const config: OmrConfig = state.omrConfig ?? { sheetSize: '50', questionCount: 50, optionCount: 4 };
  const sheetOptions = useMemo(() => Object.entries(OMR_SHEET_PRESETS) as [OmrSheetSize, (typeof OMR_SHEET_PRESETS)[OmrSheetSize]][], []);

  const setConfig = (next: OmrConfig | null) => {
    dispatch({ type: 'MERGE', patch: { omrConfig: next } });
  };

  const applyPreset = (sheetSize: OmrSheetSize) => {
    const preset = OMR_SHEET_PRESETS[sheetSize];
    setConfig({ sheetSize, questionCount: preset.questionCount, optionCount: preset.optionCount });
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="font-serif text-base text-[#0D1B35]">OMR sheet</CardTitle>
          <Switch
            checked={enabled}
            onCheckedChange={(checked) => setConfig(checked ? config : null)}
            aria-label="Enable OMR sheet"
          />
        </div>
        <CardDescription>
          Generate a printable OMR sheet for paper-based delivery. Pick a sheet size or set custom counts.
        </CardDescription>
      </CardHeader>
      {enabled ? (
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {sheetOptions.map(([id, preset]) => {
              const active = config.sheetSize === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => applyPreset(id)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
                    active
                      ? 'border-[#0D1B35] bg-[#0D1B35] text-[#E2C98A]'
                      : 'border-slate-200 text-slate-600 hover:border-[#C8A96E] hover:bg-[#FBF4E6]/60',
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Question count</Label>
              <Input
                type="number"
                min={5}
                max={500}
                value={config.questionCount}
                onChange={(event) =>
                  setConfig({
                    ...config,
                    questionCount: Math.max(1, Math.min(500, Number(event.target.value) || 0)),
                  })
                }
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Options per question</Label>
              <Input
                type="number"
                min={2}
                max={6}
                value={config.optionCount}
                onChange={(event) =>
                  setConfig({
                    ...config,
                    optionCount: Math.max(2, Math.min(6, Number(event.target.value) || 4)),
                  })
                }
                className="border-slate-200"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Generate answer OMR sheets from step 6 after pulling questions from the bank. Make sure your MCQ section totals match{' '}
            <span className="font-semibold text-slate-700">{config.questionCount}</span> questions.
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
}
