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
import { sectionMcqPassageGoal } from '../wizardHelpers';
import { MultiSubjectBuilder } from '../components/MultiSubjectBuilder';
import type { MergedFolderTreeResponse } from '@/lib/api/question-bank';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
  onAddSection: (section: ReturnType<typeof buildSectionFromType>) => void;
  deliveryMode: 'ONLINE' | 'OFFLINE';
  /** Merged folder trees (per linked course) — used by the "Add subjects from folder roots" shortcut. */
  folderTrees?: MergedFolderTreeResponse['trees'];
};

function mcqCompositionLine(s: WizardSection): string {
  const total = Math.max(0, s.count);
  const pg = sectionMcqPassageGoal(s);
  if (pg <= 0) {
    return `Up to ${total} MCQ slots — whole passages fill first (greedy), then standalone items.`;
  }
  return `Up to ${pg} whole passage block(s) within ${total} total slots; remaining slots use standalone MCQs.`;
}

export function Step2Sections({ state, dispatch, onAddSection, deliveryMode, folderTrees }: Props) {
  if (state.productType === 'MULTI') {
    return <MultiSubjectBuilder state={state} dispatch={dispatch} folderTrees={folderTrees} />;
  }

  const isManualOffline =
    deliveryMode === 'OFFLINE'
    && !state.resultInputModes.includes('AUTOMATED')
    && !state.resultInputModes.includes('OMR_SCAN');

  if (isManualOffline) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="py-8 text-center text-sm text-slate-600">
          Manual-entry exams do not need online sections. Teachers will mark scripts outside LMS, then enter
          results from the Results page using single entry, bulk manual rows, or Excel import.
        </CardContent>
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
                className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-[1fr_88px_88px_88px_112px_36px]"
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
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {s.type === 'CQ' ? 'Creative/CQ' : 'Short'} count
                  </span>
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
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Marks</span>
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
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Negative</span>
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
                </div>
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
