'use client';

import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ExamWizardState } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
};

type ShuffleOption = { id: string; label: string; mcqOnly?: boolean };

const SHUFFLE_OPTIONS: ShuffleOption[] = [
  { id: 'FULL', label: 'Full random' },
  { id: 'ORDER', label: 'Same Q, shuffle order' },
  { id: 'OPTS', label: 'Shuffle options only', mcqOnly: true },
  { id: 'MIXED', label: 'Mixed', mcqOnly: true },
];

export function Step4SetsPdf({ state, dispatch }: Props) {
  const writtenOnly = state.productType === 'WRITTEN';
  const visibleShuffles = useMemo(
    () => SHUFFLE_OPTIONS.filter((opt) => !opt.mcqOnly || !writtenOnly),
    [writtenOnly],
  );

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-lg text-[#0D1B35]">Sets & shuffle</CardTitle>
        <CardDescription>
          {writtenOnly
            ? 'Written exams shuffle only question order — option shuffling is not applicable.'
            : 'Choose how many sets to generate and how to vary them.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Number of sets</Label>
          <Input
            type="number"
            min={1}
            max={26}
            value={state.nSets}
            onChange={(e) => dispatch({ type: 'MERGE', patch: { nSets: e.target.value } })}
            className="border-slate-200"
          />
        </div>
        <div className="space-y-2">
          <Label>Shuffle</Label>
          <Select
            value={visibleShuffles.some((opt) => opt.id === state.shuffle) ? state.shuffle : visibleShuffles[0].id}
            onValueChange={(v) => dispatch({ type: 'MERGE', patch: { shuffle: v } })}
          >
            <SelectTrigger className="border-slate-200">
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
        </div>
        <div className="space-y-2">
          <Label>Set naming</Label>
          <Select
            value={state.setNaming}
            onValueChange={(v) => dispatch({ type: 'MERGE', patch: { setNaming: v as ExamWizardState['setNaming'] } })}
          >
            <SelectTrigger className="border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALPHA">A, B, C…</SelectItem>
              <SelectItem value="NUM">1, 2, 3…</SelectItem>
              <SelectItem value="KA">ক, খ, গ…</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
