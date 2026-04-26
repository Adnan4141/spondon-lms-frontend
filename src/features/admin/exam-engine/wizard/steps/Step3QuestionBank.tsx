'use client';

import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FolderTreeNode } from '@/lib/api/question-bank';
import type { ExamWizardState, FolderRuleDraft } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import { SEC_TYPES } from '../constants';
import { sectionAllocatedTotal, sectionMcqPassageGoal } from '../wizardHelpers';

type PickerTarget = { sectionLocalId: string; rule: FolderRuleDraft } | null;

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
  tree: FolderTreeNode[];
  leaves: { id: string; path: string; q: number }[];
  activeSectionId: string | null;
  setActiveSectionId: (id: string | null) => void;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setPicker: (p: PickerTarget) => void;
  folderLoading: boolean;
};

export function Step3QuestionBank({
  state,
  dispatch,
  tree,
  leaves,
  activeSectionId,
  setActiveSectionId,
  expanded,
  setExpanded,
  setPicker,
  folderLoading,
}: Props) {
  const activeSection = state.sections.find((s) => s.localId === activeSectionId) ?? state.sections[0];

  const toggleFolderForActiveSection = (folderId: string, name: string) => {
    if (!activeSection) return;
    dispatch({ type: 'TOGGLE_FOLDER', sectionLocalId: activeSection.localId, folderId, folderName: name });
  };

  const updateRuleCount = (sectionLocalId: string, folderId: string, n: number) => {
    dispatch({ type: 'UPDATE_RULE_COUNT', sectionLocalId, folderId, count: n });
  };

  const renderFolderRow = (node: FolderTreeNode, depth: number): ReactNode => {
    const hasKids = Boolean(node.children?.length);
    const open = expanded[node.id] ?? depth < 1;
    if (hasKids) {
      return (
        <div key={node.id}>
          <button
            type="button"
            className="flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-100"
            style={{ paddingLeft: 8 + depth * 12 }}
            onClick={() => setExpanded((e) => ({ ...e, [node.id]: !open }))}
          >
            <span className="w-2 text-slate-400">{open ? '▾' : '▸'}</span>
            <span>{node.name}</span>
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {node.questionCount ?? node.counts?.total ?? 0}Q
            </Badge>
          </button>
          {open ? node.children!.map((c) => renderFolderRow(c, depth + 1)) : null}
        </div>
      );
    }
    const sel = activeSection?.folderRules.some((r) => r.folderId === node.id);
    return (
      <button
        key={node.id}
        type="button"
        className={cn(
          'flex w-full items-center gap-1 rounded-md border border-transparent px-2 py-1 text-left text-xs transition-colors',
          sel ? 'border-slate-300 bg-[#0D1B35]/5' : 'hover:bg-slate-50',
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
        onClick={() => toggleFolderForActiveSection(node.id, node.name)}
      >
        <span className="text-slate-400">📄</span>
        <span className="flex-1 truncate text-slate-700">{node.name}</span>
        <Badge variant="outline" className="shrink-0 text-[10px]">
          {node.questionCount ?? 0}
        </Badge>
        {sel ? <Check className="h-3.5 w-3.5 shrink-0 text-[#C8A96E]" /> : null}
      </button>
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-semibold text-[#0D1B35]">Question bank</CardTitle>
          <div className="flex flex-wrap gap-1">
            {state.sections.map((s) => {
              const t = SEC_TYPES.find((x) => x.id === s.type);
              const on = s.localId === (activeSectionId ?? activeSection?.localId);
              return (
                <Button
                  key={s.localId}
                  type="button"
                  size="sm"
                  variant={on ? 'default' : 'secondary'}
                  className={on ? 'font-bold' : ''}
                  style={on ? { backgroundColor: t?.color, color: '#fff' } : {}}
                  onClick={() => setActiveSectionId(s.localId)}
                >
                  {t?.short}
                </Button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          {!state.courseId ? (
            <p className="p-4 text-center text-xs text-slate-500">Select a course in step 1 to load folders.</p>
          ) : folderLoading ? (
            <p className="p-4 text-center text-xs text-slate-500">Loading folders…</p>
          ) : (
            <div className="max-h-[min(400px,50vh)] overflow-y-auto rounded-md border border-slate-100 bg-white p-1">
              {tree.length ? (
                tree.map((n) => renderFolderRow(n, 0))
              ) : (
                <p className="p-4 text-center text-xs text-slate-500">No folders for this course.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <div className="space-y-3">
        {state.sections.map((s) => {
          const t = SEC_TYPES.find((x) => x.id === s.type);
          const allocated = sectionAllocatedTotal(s);
          const match = allocated === s.count;
          return (
            <Card key={s.localId} className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-1 rounded-full" style={{ background: t?.color }} />
                  <CardTitle className="text-sm font-bold">
                    {t?.short} — target {s.count}Q
                    {s.type === 'MCQ' && sectionMcqPassageGoal(s) > 0 ? (
                      <span className="font-normal text-slate-500"> · ≤{sectionMcqPassageGoal(s)} passage block(s)</span>
                    ) : null}
                  </CardTitle>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={match ? 'secondary' : 'destructive'} className="text-[10px]">
                    Allocated {allocated}/{s.count}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {s.folderRules.length} folders
                  </Badge>
                </div>
              </CardHeader>
              {!match && s.folderRules.length > 0 ? (
                <p className="border-b border-amber-100 bg-amber-50/80 px-4 py-2 text-[11px] text-amber-950">
                  Totals should match the section target before generating sets (pins may need manual counts).
                </p>
              ) : null}
              <CardContent className="space-y-2">
                {s.folderRules.length === 0 ? (
                  <p className="text-center text-xs text-slate-500">Select folders in the tree (active section).</p>
                ) : (
                  s.folderRules.map((r) => {
                    const leafQ = leaves.find((l) => l.id === r.folderId)?.q ?? 0;
                    const overPool = leafQ > 0 && r.questionCount > leafQ;
                    return (
                      <div
                        key={r.folderId}
                        className="grid grid-cols-[1fr_64px_auto] items-center gap-2 rounded-md border border-slate-100 bg-slate-50/80 p-2"
                      >
                        <div className="min-w-0 text-[11px] leading-snug text-slate-800">
                          {leaves.find((l) => l.id === r.folderId)?.path ?? r.folderName ?? r.folderId}
                          <span className="text-slate-400">
                            {' '}
                            ({r.questionCount}Q{leafQ ? ` / ${leafQ} in bank` : ''})
                          </span>
                          {overPool ? (
                            <span className="ml-1 font-medium text-rose-600">Exceeds bank</span>
                          ) : null}
                        </div>
                        <Input
                          type="number"
                          className="h-8 border-slate-200 text-center text-xs"
                          value={r.questionCount}
                          min={1}
                          onChange={(e) => updateRuleCount(s.localId, r.folderId, Number(e.target.value))}
                        />
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 shrink-0 px-2 text-[10px]"
                            onClick={() =>
                              setPicker({
                                sectionLocalId: s.localId,
                                rule: { ...r },
                              })
                            }
                          >
                            Questions
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-rose-600"
                            onClick={() =>
                              dispatch({ type: 'REMOVE_FOLDER_RULE', sectionLocalId: s.localId, folderId: r.folderId })
                            }
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
