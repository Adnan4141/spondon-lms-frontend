'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { WizardSubject } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';

type Props = {
  subject: WizardSubject;
  index: number;
  dispatch: React.Dispatch<WizardFormAction>;
};

export function SubjectCard({ subject, index, dispatch }: Props) {
  const total =
    Number(subject.mcqSingleCount || 0)
    + Number(subject.mcqPassageCount || 0)
    + Number(subject.cqCount || 0)
    + Number(subject.shortCount || 0);

  const patchCount = (patch: Partial<WizardSubject>) => {
    const next = { ...subject, ...patch };
    const count =
      Number(next.mcqSingleCount || 0)
      + Number(next.mcqPassageCount || 0)
      + Number(next.cqCount || 0)
      + Number(next.shortCount || 0);
    dispatch({ type: 'UPDATE_SUBJECT', localId: subject.localId, patch: { ...patch, count } });
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0D1B35] text-xs font-black text-[#E2C98A]">
          {index + 1}
        </span>
        <Input
          placeholder="Subject name"
          value={subject.name}
          onChange={(event) => dispatch({ type: 'UPDATE_SUBJECT', localId: subject.localId, patch: { name: event.target.value } })}
          className="h-9 min-w-[180px] flex-1 border-slate-200 bg-white text-sm font-semibold"
        />
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Label className="text-[11px] font-bold text-slate-500">Mandatory</Label>
          <Switch
            checked={subject.compulsory}
            onCheckedChange={(checked) => dispatch({ type: 'UPDATE_SUBJECT', localId: subject.localId, patch: { compulsory: checked } })}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-rose-600"
          onClick={() => dispatch({ type: 'REMOVE_SUBJECT', localId: subject.localId })}
        >
          Remove
        </Button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-8">
        {[
          ['MCQ single', 'mcqSingleCount'],
          ['Passage MCQ', 'mcqPassageCount'],
          ['CQ', 'cqCount'],
          ['SHORT', 'shortCount'],
        ].map(([label, key]) => (
          <div key={key} className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
            <Input
              type="number"
              min={0}
              className="h-9 border-slate-200 bg-white text-sm"
              value={Number(subject[key as keyof WizardSubject]) || 0}
              onChange={(event) => patchCount({ [key]: Math.max(0, Number(event.target.value) || 0) })}
            />
          </div>
        ))}
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Marks</span>
          <Input
            type="number"
            step="0.25"
            className="h-9 border-slate-200 bg-white text-sm"
            value={subject.marks}
            onChange={(event) => dispatch({ type: 'UPDATE_SUBJECT', localId: subject.localId, patch: { marks: Number(event.target.value) } })}
          />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Neg</span>
          <Input
            type="number"
            step="0.25"
            className="h-9 border-slate-200 bg-white text-sm"
            value={subject.neg}
            onChange={(event) => dispatch({ type: 'UPDATE_SUBJECT', localId: subject.localId, patch: { neg: Number(event.target.value) } })}
          />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Pass marks</span>
          <Input
            type="number"
            step="0.25"
            className="h-9 border-slate-200 bg-white text-sm"
            value={subject.passMarks}
            onChange={(event) => dispatch({ type: 'UPDATE_SUBJECT', localId: subject.localId, patch: { passMarks: event.target.value } })}
          />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total</span>
          <div className="flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-[#0D1B35]">
            {total}Q
          </div>
        </div>
      </div>
    </div>
  );
}
