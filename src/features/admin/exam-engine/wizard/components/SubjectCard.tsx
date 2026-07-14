'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { WizardSubject } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';

type Props = {
  subject: WizardSubject;
  index: number;
  dispatch: React.Dispatch<WizardFormAction>;
};

export function SubjectCard({ subject, index, dispatch }: Props) {
  const total =
    Number(subject.mcqSingleCount || 0) +
    Number(subject.mcqPassageCount || 0) +
    Number(subject.cqCount || 0) +
    Number(subject.shortCount || 0);
  const hasMixedTypes =
    [Number(subject.mcqSingleCount || 0) + Number(subject.mcqPassageCount || 0) > 0,
      Number(subject.cqCount || 0) > 0,
      Number(subject.shortCount || 0) > 0].filter(Boolean).length > 1;

  const patchCount = (patch: Partial<WizardSubject>) => {
    const next = { ...subject, ...patch };
    const count =
      Number(next.mcqSingleCount || 0) +
      Number(next.mcqPassageCount || 0) +
      Number(next.cqCount || 0) +
      Number(next.shortCount || 0);
    dispatch({ type: 'UPDATE_SUBJECT', localId: subject.localId, patch: { ...patch, count } });
  };

  return (
    <div
      className="space-y-4 rounded-[20px] border border-slate-100 bg-gradient-to-r from-white to-slate-50/30 p-5 shadow-sm transition-all duration-300 hover:shadow-md"
      style={{ borderLeftColor: '#0D1B35', borderLeftWidth: '4px' }}
    >
      {/* Subject Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0D1B35] text-xs font-black text-[#E2C98A]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <Input
            placeholder="Subject name (e.g. Physics)"
            value={subject.name}
            onChange={(event) =>
              dispatch({ type: 'UPDATE_SUBJECT', localId: subject.localId, patch: { name: event.target.value } })
            }
            className="h-10 min-w-[200px] max-w-xs border-slate-200 bg-white text-sm font-bold text-slate-800 rounded-xl focus-visible:ring-indigo-500"
          />
          <div className="flex flex-col gap-0.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm select-none">
            <div className="flex items-center gap-2.5 h-6">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mandatory</Label>
              <Switch
                checked={subject.compulsory}
                onCheckedChange={(checked) =>
                  dispatch({ type: 'UPDATE_SUBJECT', localId: subject.localId, patch: { compulsory: checked } })
                }
              />
            </div>
            <p className="text-[9px] leading-snug text-slate-400 max-w-[180px]">
              Only mandatory subjects affect overall pass/fail.
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
          onClick={() => dispatch({ type: 'REMOVE_SUBJECT', localId: subject.localId })}
        >
          <Trash2 className="h-4.5 w-4.5" />
        </Button>
      </div>

      {hasMixedTypes ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] font-medium text-amber-900">
          This subject mixes question types. In Step 3, link folders and verify bank capacity for each type separately.
        </p>
      ) : null}

      {/* Grid Configuration Fields */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 items-end">
        {[
          ['MCQ Single', 'mcqSingleCount'],
          ['Passage MCQ', 'mcqPassageCount'],
          ['CQ Count', 'cqCount'],
          ['SAQ Count', 'shortCount'],
        ].map(([label, key]) => (
          <div key={key} className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
            <Input
              type="number"
              min={0}
              className="h-10 border-slate-200 bg-white text-sm font-semibold text-slate-700 rounded-xl"
              value={Number(subject[key as keyof WizardSubject]) || 0}
              onChange={(event) => patchCount({ [key]: Math.max(0, Number(event.target.value) || 0) })}
            />
          </div>
        ))}

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Marks per Q</span>
          <Input
            type="number"
            step="0.25"
            className="h-10 border-slate-200 bg-white text-sm font-semibold text-slate-700 rounded-xl"
            value={subject.marks}
            onChange={(event) =>
              dispatch({ type: 'UPDATE_SUBJECT', localId: subject.localId, patch: { marks: Number(event.target.value) } })
            }
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Negative Marks</span>
          <Input
            type="number"
            step="0.25"
            className="h-10 border-slate-200 bg-white text-sm font-semibold text-slate-700 rounded-xl"
            value={subject.neg}
            onChange={(event) =>
              dispatch({ type: 'UPDATE_SUBJECT', localId: subject.localId, patch: { neg: Number(event.target.value) } })
            }
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pass Marks</span>
          <Input
            type="number"
            step="0.25"
            min={0}
            className={cn(
              'h-10 border-slate-200 bg-white text-sm font-semibold text-slate-700 rounded-xl',
              subject.compulsory && (!subject.passMarks || Number(subject.passMarks) <= 0) && 'border-rose-300 ring-1 ring-rose-200',
            )}
            value={subject.passMarks}
            onChange={(event) =>
              dispatch({ type: 'UPDATE_SUBJECT', localId: subject.localId, patch: { passMarks: event.target.value } })
            }
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Section Total</span>
          <div className="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 shadow-sm select-none tabular-nums">
            {(total * Number(subject.marks || 0)).toFixed(2)}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Qs</span>
          <div className="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-[#0D1B35] px-3 text-sm font-black text-[#E2C98A] shadow-sm select-none">
            {total}Q
          </div>
        </div>
      </div>
    </div>
  );
}
