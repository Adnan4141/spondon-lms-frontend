'use client';

import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ExamWizardState } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import { WizardStepCard } from '../components/WizardStepCard';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
};

type ShuffleOption = { id: string; label: string; hint: string; mcqOnly?: boolean };

const SHUFFLE_OPTIONS: ShuffleOption[] = [
  { id: 'FULL', label: 'Full random', hint: 'Questions and options vary per set.' },
  { id: 'ORDER', label: 'Same Q, shuffle order', hint: 'Same pool, different sequence.' },
  { id: 'OPTS', label: 'Shuffle options only', hint: 'MCQ answer positions change.', mcqOnly: true },
  { id: 'MIXED', label: 'Mixed', hint: 'Blend order and option shuffles.', mcqOnly: true },
];

export function Step4SetsPdf({ state, dispatch }: Props) {
  const writtenOnly = state.productType === 'WRITTEN';
  const visibleShuffles = useMemo(
    () => SHUFFLE_OPTIONS.filter((opt) => !opt.mcqOnly || !writtenOnly),
    [writtenOnly],
  );
  const activeShuffle = visibleShuffles.find((opt) => opt.id === state.shuffle) ?? visibleShuffles[0];
  const setCount = Number(state.nSets) || 1;

  return (
    <WizardStepCard
      title="Sets & shuffle"
      description={
        writtenOnly
          ? 'Written exams shuffle only question order — option shuffling is not applicable.'
          : 'Choose how many sets to generate and how to vary them.'
      }
      contentClassName="space-y-5"
      accent="gold"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Number of sets</Label>
          <Input
            type="number"
            min={1}
            max={26}
            value={state.nSets}
            onChange={(e) => dispatch({ type: 'MERGE', patch: { nSets: e.target.value } })}
            className="border-slate-200 bg-white"
          />
          <p className="text-[11px] text-slate-400">Up to 26 sets (A–Z).</p>
        </div>
        <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shuffle</Label>
          <Select
            value={activeShuffle.id}
            onValueChange={(v) => dispatch({ type: 'MERGE', patch: { shuffle: v } })}
          >
            <SelectTrigger className="border-slate-200 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visibleShuffles.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-400">{activeShuffle.hint}</p>
        </div>
        <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Set naming</Label>
          <Select
            value={state.setNaming}
            onValueChange={(v) => dispatch({ type: 'MERGE', patch: { setNaming: v as ExamWizardState['setNaming'] } })}
          >
            <SelectTrigger className="border-slate-200 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALPHA">A, B, C…</SelectItem>
              <SelectItem value="NUM">1, 2, 3…</SelectItem>
              <SelectItem value="KA">ক, খ, গ…</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-400">Labels printed on each set.</p>
        </div>
        <div className="flex flex-col justify-center rounded-xl border border-dashed border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold text-slate-700">Preview</p>
          <p className="mt-1 text-2xl font-bold text-[#0D1B35]">
            {setCount} set{setCount === 1 ? '' : 's'}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">{activeShuffle.label} · PDF generated on finalize</p>
        </div>
      </div>
    </WizardStepCard>
  );
}
