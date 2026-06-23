'use client';

import { ClipboardCheck, Trash2 } from 'lucide-react';
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

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
  onAddSection: (section: ReturnType<typeof buildSectionFromType>) => void;
  deliveryMode: 'ONLINE' | 'OFFLINE';
  /** Merged folder trees (per linked course) — used by the "Add subjects from folder roots" shortcut. */
  folderTrees?: any;
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
    deliveryMode === 'OFFLINE' &&
    !state.resultInputModes.includes('AUTOMATED') &&
    !state.resultInputModes.includes('OMR_SCAN');

  if (isManualOffline) {
    return (
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-[24px]">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-[#5C2D91]" />
        <CardContent className="py-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <p className="font-bold text-slate-700">Manual Entry Offline Exam</p>
          <p className="mt-1 max-w-md text-xs text-slate-400 leading-relaxed">
            Manual-entry exams do not require online sections. Teachers will mark scripts outside the LMS, then enter
            results from the Results page using single entry, bulk manual rows, or Excel import.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden rounded-[24px]">
      {/* Accent Header Bar */}
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-[#5C2D91]" />

      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b border-slate-100 py-5">
        <div>
          <CardTitle className="font-serif text-lg text-[#0D1B35]">Section builder</CardTitle>
          <p className="mt-0.5 text-xs text-slate-400">Define the composition structure of your exam paper.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SEC_TYPES.map((t) => (
            <Button
              key={t.id}
              type="button"
              size="sm"
              variant="outline"
              className="h-9 border-slate-200 text-xs px-3 font-bold rounded-xl transition-all duration-200 hover:scale-103"
              style={{ borderColor: `${t.color}33`, color: t.color, backgroundColor: `${t.color}05` }}
              onClick={() => onAddSection(buildSectionFromType(t.id as SectionTypeUi))}
            >
              + Add {t.short}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-5 pb-6">
        {state.sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 px-4 text-center bg-slate-50/20">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
              <ClipboardCheck className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No exam sections yet</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm leading-normal">
              Define the structure of your exam by adding MCQ, CQ (Creative), or Short Answer sections.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 justify-center">
              {SEC_TYPES.map((t) => (
                <Button
                  key={t.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 border-slate-200 text-xs px-3 font-semibold rounded-xl"
                  style={{ borderColor: `${t.color}33`, color: t.color, backgroundColor: `${t.color}05` }}
                  onClick={() => onAddSection(buildSectionFromType(t.id as SectionTypeUi))}
                >
                  + Add {t.short}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          state.sections.map((s) => {
            const t = SEC_TYPES.find((x) => x.id === s.type);
            const isMcq = s.type === 'MCQ';

            return (
              <div
                key={s.localId}
                className="space-y-4 rounded-[20px] border border-slate-100 bg-gradient-to-r from-white to-slate-50/30 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-200/80"
                style={{ borderLeftColor: t?.color || '#cbd5e1', borderLeftWidth: '4px' }}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5 flex-1">
                    <span
                      className="text-[10px] font-black px-2 py-1 rounded-md text-white select-none shrink-0"
                      style={{ backgroundColor: t?.color || '#94a3b8' }}
                    >
                      {t?.short || 'SEC'}
                    </span>
                    <Input
                      value={s.label}
                      onChange={(e) =>
                        dispatch({ type: 'UPDATE_SECTION', localId: s.localId, patch: { label: e.target.value } })
                      }
                      className="h-10 border-slate-200 bg-white text-sm font-bold text-slate-800 rounded-xl focus-visible:ring-indigo-500 max-w-xs"
                      placeholder="Section Title"
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                    onClick={() => dispatch({ type: 'REMOVE_SECTION', localId: s.localId })}
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </Button>
                </div>

                {isMcq ? (
                  <>
                    <p className="text-[11px] leading-snug text-slate-500 font-semibold px-0.5">{mcqCompositionLine(s)}</p>
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 items-end">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Slots</span>
                        <Input
                          type="number"
                          min={1}
                          className="h-10 border-slate-200 bg-white text-sm font-semibold text-slate-700 rounded-xl"
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
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Passage Blocks (max)</span>
                        <Input
                          type="number"
                          min={0}
                          title="0 = greedy: pack as many whole passages as fit. Otherwise cap distinct passage groups."
                          className="h-10 border-slate-200 bg-white text-sm font-semibold text-slate-700 rounded-xl"
                          value={sectionMcqPassageGoal(s)}
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
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Marks per Q</span>
                        <Input
                          type="number"
                          step="0.25"
                          className="h-10 border-slate-200 bg-white text-sm font-semibold text-slate-700 rounded-xl"
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
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Neg Marks</span>
                        <Input
                          type="number"
                          step="0.25"
                          className="h-10 border-slate-200 bg-white text-sm font-semibold text-slate-700 rounded-xl"
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
                      <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Difficulty Mix</span>
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
                          <SelectTrigger className="h-10 border-slate-200 bg-white text-xs font-semibold text-slate-700 rounded-xl">
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
                  </>
                ) : (
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 items-end">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {s.type === 'CQ' ? 'CQ Count' : 'SAQ Count'}
                      </span>
                      <Input
                        type="number"
                        className="h-10 border-slate-200 bg-white text-sm font-semibold text-slate-700 rounded-xl"
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
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Marks per Q</span>
                      <Input
                        type="number"
                        step="0.25"
                        className="h-10 border-slate-200 bg-white text-sm font-semibold text-slate-700 rounded-xl"
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
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Negative Marks</span>
                      <Input
                        type="number"
                        step="0.25"
                        className="h-10 border-slate-200 bg-white text-sm font-semibold text-slate-700 rounded-xl"
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
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Difficulty</span>
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
                        <SelectTrigger className="h-10 border-slate-200 bg-white text-xs font-semibold text-slate-700 rounded-xl">
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
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
