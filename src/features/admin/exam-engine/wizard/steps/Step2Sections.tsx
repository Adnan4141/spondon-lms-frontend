'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ExamWizardState, SectionTypeUi, WizardSection } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import { buildSectionFromType } from '../examWizardReducer';
import { SEC_TYPES } from '../constants';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
  onAddSection: (section: ReturnType<typeof buildSectionFromType>) => void;
};

export function Step2Sections({ state, dispatch, onAddSection }: Props) {
  if (state.uiCategory === 'MULTI') {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-serif text-lg text-[#0D1B35]">Subjects</CardTitle>
          <Button type="button" size="sm" className="bg-[#0D1B35] text-[#E2C98A]" onClick={() => dispatch({ type: 'ADD_SUBJECT' })}>
            + Add subject
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Use the existing Exam → Subjects screen after save to attach folder rules per subject.</p>
          {state.subjects.map((sub) => (
            <div key={sub.localId} className="flex flex-wrap gap-2 rounded-lg border p-2">
              <Input
                placeholder="Subject name"
                value={sub.name}
                onChange={(e) =>
                  dispatch({ type: 'UPDATE_SUBJECT', localId: sub.localId, patch: { name: e.target.value } })
                }
                className="min-w-[140px] flex-1 border-slate-200"
              />
              <Input
                type="number"
                className="w-20 border-slate-200"
                value={sub.count}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_SUBJECT',
                    localId: sub.localId,
                    patch: { count: Number(e.target.value) },
                  })
                }
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => dispatch({ type: 'REMOVE_SUBJECT', localId: sub.localId })}>
                Remove
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (state.uiCategory === 'OMRB') {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="py-8 text-center text-sm text-slate-600">OMR book flow — sections optional.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="font-serif text-lg text-[#0D1B35]">Section builder</CardTitle>
        <div className="flex flex-wrap gap-1">
          {SEC_TYPES.map((t) => (
            <Button
              key={t.id}
              type="button"
              size="sm"
              variant="outline"
              className="border-slate-200 text-xs"
              style={{ borderColor: `${t.color}55`, color: t.color }}
              onClick={() => onAddSection(buildSectionFromType(t.id as SectionTypeUi))}
            >
              + {t.short}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {state.sections.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Add at least one section.</p>
        ) : (
          state.sections.map((s) => {
            const t = SEC_TYPES.find((x) => x.id === s.type);
            return (
              <div
                key={s.localId}
                className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-[1fr_72px_72px_72px_100px_36px]"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-1 rounded-full" style={{ background: t?.color }} />
                  <Input
                    value={s.label}
                    onChange={(e) =>
                      dispatch({ type: 'UPDATE_SECTION', localId: s.localId, patch: { label: e.target.value } })
                    }
                    className="h-9 border-slate-200 text-sm font-semibold"
                  />
                </div>
                <Input
                  type="number"
                  className="h-9 border-slate-200 text-center text-sm"
                  value={s.count}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_SECTION',
                      localId: s.localId,
                      patch: { count: Number(e.target.value) || 0 },
                    })
                  }
                />
                <Input
                  type="number"
                  step="0.25"
                  className="h-9 border-slate-200 text-center text-sm"
                  value={s.marks}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_SECTION',
                      localId: s.localId,
                      patch: { marks: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  type="number"
                  step="0.25"
                  className="h-9 border-slate-200 text-center text-sm"
                  value={s.neg}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_SECTION',
                      localId: s.localId,
                      patch: { neg: Number(e.target.value) },
                    })
                  }
                />
                <Select
                  value={s.difficulty}
                  onValueChange={(v) =>
                    dispatch({
                      type: 'UPDATE_SECTION',
                      localId: s.localId,
                      patch: { difficulty: v as WizardSection['difficulty'] },
                    })
                  }
                >
                  <SelectTrigger className="h-9 border-slate-200 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MIXED">Mixed</SelectItem>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-rose-600"
                  onClick={() => dispatch({ type: 'REMOVE_SECTION', localId: s.localId })}
                >
                  ✕
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
