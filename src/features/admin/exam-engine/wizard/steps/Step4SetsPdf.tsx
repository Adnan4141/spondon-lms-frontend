'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export function Step4SetsPdf({ state, dispatch }: Props) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-lg text-[#0D1B35]">Sets & shuffle</CardTitle>
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
          <Select value={state.shuffle} onValueChange={(v) => dispatch({ type: 'MERGE', patch: { shuffle: v } })}>
            <SelectTrigger className="border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FULL">Full random</SelectItem>
              <SelectItem value="ORDER">Same Q, shuffle order</SelectItem>
              <SelectItem value="OPTS">Shuffle options only</SelectItem>
              <SelectItem value="MIXED">Mixed</SelectItem>
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
