'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { sectionMcqPassageGoal } from '../wizardHelpers';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
  onAddSection: (section: ReturnType<typeof buildSectionFromType>) => void;
};

function mcqCompositionLine(s: WizardSection): string {
  const total = Math.max(0, s.count);
  const pg = sectionMcqPassageGoal(s);
  if (pg <= 0) {
    return `Up to ${total} MCQ slots — whole passages fill first (greedy), then standalone items.`;
  }
  return `Up to ${pg} whole passage block(s) within ${total} total slots; remaining slots use standalone MCQs.`;
}

export function Step2Sections({ state, dispatch, onAddSection }: Props) {
  if (state.uiCategory === 'MULTI') {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="font-serif text-lg text-[#0D1B35]">Subjects & sections</CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              Build every subject here, then attach question folders in the next step.
            </p>
          </div>
          <Button type="button" size="sm" className="bg-[#0D1B35] text-[#E2C98A]" onClick={() => dispatch({ type: 'ADD_SUBJECT' })}>
            + Add subject
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          {state.subjects.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
              Add Physics, Chemistry, Math, or any subject needed for this exam.
            </p>
          ) : null}
          {state.subjects.map((sub, index) => {
            const total =
              Number(sub.mcqSingleCount || 0) +
              Number(sub.mcqPassageCount || 0) +
              Number(sub.cqCount || 0) +
              Number(sub.shortCount || 0);
            const patchCount = (patch: Partial<typeof sub>) => {
              const next = { ...sub, ...patch };
              const count =
                Number(next.mcqSingleCount || 0) +
                Number(next.mcqPassageCount || 0) +
                Number(next.cqCount || 0) +
                Number(next.shortCount || 0);
              dispatch({ type: 'UPDATE_SUBJECT', localId: sub.localId, patch: { ...patch, count } });
            };

            return (
              <div key={sub.localId} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0D1B35] text-xs font-black text-[#E2C98A]">
                    {index + 1}
                  </span>
                  <Input
                    placeholder="Subject name"
                    value={sub.name}
                    onChange={(e) =>
                      dispatch({ type: 'UPDATE_SUBJECT', localId: sub.localId, patch: { name: e.target.value } })
                    }
                    className="h-9 min-w-[180px] flex-1 border-slate-200 bg-white text-sm font-semibold"
                  />
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <Label className="text-[11px] font-bold text-slate-500">Mandatory</Label>
                    <Switch
                      checked={sub.compulsory}
                      onCheckedChange={(checked) =>
                        dispatch({ type: 'UPDATE_SUBJECT', localId: sub.localId, patch: { compulsory: checked } })
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-rose-600"
                    onClick={() => dispatch({ type: 'REMOVE_SUBJECT', localId: sub.localId })}
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
                        value={Number(sub[key as keyof typeof sub]) || 0}
                        onChange={(e) => patchCount({ [key]: Math.max(0, Number(e.target.value) || 0) })}
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Marks</span>
                    <Input
                      type="number"
                      step="0.25"
                      className="h-9 border-slate-200 bg-white text-sm"
                      value={sub.marks}
                      onChange={(e) =>
                        dispatch({ type: 'UPDATE_SUBJECT', localId: sub.localId, patch: { marks: Number(e.target.value) } })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Neg</span>
                    <Input
                      type="number"
                      step="0.25"
                      className="h-9 border-slate-200 bg-white text-sm"
                      value={sub.neg}
                      onChange={(e) =>
                        dispatch({ type: 'UPDATE_SUBJECT', localId: sub.localId, patch: { neg: Number(e.target.value) } })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Pass marks</span>
                    <Input
                      type="number"
                      step="0.25"
                      className="h-9 border-slate-200 bg-white text-sm"
                      value={sub.passMarks}
                      onChange={(e) =>
                        dispatch({ type: 'UPDATE_SUBJECT', localId: sub.localId, patch: { passMarks: e.target.value } })
                      }
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
          })}
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
            const isMcq = s.type === 'MCQ';

            if (isMcq) {
              const pg = sectionMcqPassageGoal(s);
              return (
                <div key={s.localId} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="h-7 w-1 shrink-0 rounded-full" style={{ background: t?.color }} />
                    <Input
                      value={s.label}
                      onChange={(e) =>
                        dispatch({ type: 'UPDATE_SECTION', localId: s.localId, patch: { label: e.target.value } })
                      }
                      className="h-9 min-w-[120px] flex-1 border-slate-200 text-sm font-semibold"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="shrink-0 text-rose-600"
                      onClick={() => dispatch({ type: 'REMOVE_SECTION', localId: s.localId })}
                    >
                      ✕
                    </Button>
                  </div>
                  <p className="text-[11px] leading-snug text-slate-600">{mcqCompositionLine(s)}</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total slots</span>
                      <Input
                        type="number"
                        min={1}
                        className="h-9 border-slate-200 text-sm"
                        value={s.count}
                        onChange={(e) =>
                          dispatch({
                            type: 'UPDATE_SECTION',
                            localId: s.localId,
                            patch: { count: Math.max(0, Number(e.target.value) || 0) },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Passage blocks (max)</span>
                      <Input
                        type="number"
                        min={0}
                        title="0 = greedy: pack as many whole passages as fit. Otherwise cap distinct passage groups."
                        className="h-9 border-slate-200 text-sm"
                        value={pg}
                        onChange={(e) => {
                          const raw = Math.max(0, Number(e.target.value) || 0);
                          const capped = Math.min(500, raw, Math.max(0, s.count));
                          dispatch({
                            type: 'UPDATE_SECTION',
                            localId: s.localId,
                            patch: { mcqPassageCount: capped },
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Marks</span>
                      <Input
                        type="number"
                        step="0.25"
                        className="h-9 border-slate-200 text-sm"
                        value={s.marks}
                        onChange={(e) =>
                          dispatch({
                            type: 'UPDATE_SECTION',
                            localId: s.localId,
                            patch: { marks: Number(e.target.value) },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Neg</span>
                      <Input
                        type="number"
                        step="0.25"
                        className="h-9 border-slate-200 text-sm"
                        value={s.neg}
                        onChange={(e) =>
                          dispatch({
                            type: 'UPDATE_SECTION',
                            localId: s.localId,
                            patch: { neg: Number(e.target.value) },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Difficulty mix</span>
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
                    </div>
                  </div>
                </div>
              );
            }

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
