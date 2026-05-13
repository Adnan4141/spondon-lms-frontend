'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, Check, ChevronDown, ChevronRight, FileText, Folder, Search, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  folderFallbackAll?: boolean;
};

function filterFolderTree(nodes: FolderTreeNode[], rawQuery: string): FolderTreeNode[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return nodes;
  return nodes
    .map((node) => {
      const children = filterFolderTree(node.children ?? [], query);
      const selfMatch = node.name.toLowerCase().includes(query);
      if (!selfMatch && children.length === 0) return null;
      return { ...node, children: selfMatch ? node.children ?? [] : children };
    })
    .filter(Boolean) as FolderTreeNode[];
}

function collectFolderIds(nodes: FolderTreeNode[]): string[] {
  return nodes.flatMap((node) => [node.id, ...collectFolderIds(node.children ?? [])]);
}

function selectableFoldersFor(node: FolderTreeNode): FolderTreeNode[] {
  const own = (node.questionCount ?? node.counts?.total ?? 0) > 0 ? [node] : [];
  return [...own, ...(node.children ?? []).flatMap((child) => selectableFoldersFor(child))];
}

function flattenFolders(nodes: FolderTreeNode[]): FolderTreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenFolders(node.children ?? [])]);
}

function capacityForType(folder: FolderTreeNode | undefined, type: 'MCQ' | 'CQ' | 'SHORT'): number {
  if (!folder) return 0;
  if (type === 'MCQ') return (folder.counts?.mcqSingle ?? 0) + (folder.counts?.mcqPassage ?? 0);
  if (type === 'CQ') return folder.counts?.cq ?? 0;
  return folder.counts?.short ?? 0;
}

function availabilityText(folder: FolderTreeNode | undefined, type: 'MCQ' | 'CQ' | 'SHORT'): string {
  if (!folder) return 'Availability unknown';
  if (type === 'MCQ') {
    return `Standalone ${folder.counts?.mcqSingle ?? 0} · Passage MCQ ${folder.counts?.mcqPassage ?? 0} · Blocks ${folder.passageCount ?? 0}`;
  }
  if (type === 'CQ') return `Creative/CQ ${folder.counts?.cq ?? 0}`;
  return `Short ${folder.counts?.short ?? 0}`;
}

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
  folderFallbackAll = false,
}: Props) {
  const [folderSearch, setFolderSearch] = useState('');
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const activeSection = state.sections.find((s) => s.localId === activeSectionId) ?? state.sections[0];
  const activeSubject = state.subjects.find((s) => s.localId === activeSectionId) ?? state.subjects[0];
  const foldersById = useMemo(() => new Map(flattenFolders(tree).map((folder) => [folder.id, folder])), [tree]);

  const subjectQuestionType = (subject: NonNullable<typeof activeSubject>): 'MCQ' | 'CQ' | 'SHORT' => {
    if ((subject.mcqSingleCount || 0) + (subject.mcqPassageCount || 0) > 0) return 'MCQ';
    if ((subject.cqCount || 0) > 0) return 'CQ';
    return 'SHORT';
  };

  const updateRuleCount = (sectionLocalId: string, folderId: string, n: number) => {
    dispatch({ type: 'UPDATE_RULE_COUNT', sectionLocalId, folderId, count: n });
  };

  const updateRuleMode = (
    sectionLocalId: string,
    folderId: string,
    selectionMode: FolderRuleDraft['selectionMode'],
  ) => {
    dispatch({ type: 'UPDATE_RULE_MODE', sectionLocalId, folderId, selectionMode });
  };

  const activeRules = useMemo(
    () => (state.uiCategory === 'MULTI' ? activeSubject?.folderRules ?? [] : activeSection?.folderRules ?? []),
    [activeSection?.folderRules, activeSubject?.folderRules, state.uiCategory],
  );
  const selectedFolderIds = useMemo(() => new Set(activeRules.map((r) => r.folderId)), [activeRules]);
  const filteredTree = useMemo(() => filterFolderTree(tree, folderSearch), [folderSearch, tree]);
  const visibleSelectableFolders = useMemo(() => {
    const byId = new Map<string, FolderTreeNode>();
    filteredTree.flatMap((node) => selectableFoldersFor(node)).forEach((folder) => byId.set(folder.id, folder));
    return [...byId.values()];
  }, [filteredTree]);

  const setFolderSelected = (folder: FolderTreeNode, shouldSelect: boolean, selectedIds = selectedFolderIds) => {
    const selected = selectedIds.has(folder.id);
    if (selected === shouldSelect) return;
    if (state.uiCategory === 'MULTI') {
      if (!activeSubject) return;
      const remaining = Math.max(
        1,
        activeSubject.count - activeSubject.folderRules.reduce((sum, r) => sum + Number(r.questionCount || 0), 0),
      );
      dispatch({
        type: 'TOGGLE_SUBJECT_FOLDER',
        subjectLocalId: activeSubject.localId,
        folderId: folder.id,
        folderName: folder.name,
        defaultCount: Math.min(remaining, Math.max(1, capacityForType(folder, subjectQuestionType(activeSubject)) || folder.questionCount || 1)),
      });
    } else if (activeSection) {
      const remaining = Math.max(
        1,
        activeSection.count - activeSection.folderRules.reduce((sum, r) => sum + Number(r.questionCount || 0), 0),
      );
      dispatch({
        type: 'TOGGLE_FOLDER',
        sectionLocalId: activeSection.localId,
        folderId: folder.id,
        folderName: folder.name,
        defaultCount: Math.min(remaining, Math.max(1, capacityForType(folder, activeSection.type) || folder.questionCount || 1)),
      });
    }
  };

  const autoBalanceSection = (sectionLocalId: string, type: 'MCQ' | 'CQ' | 'SHORT', target: number, rules: FolderRuleDraft[]) => {
    let remaining = Math.max(0, target);
    rules.forEach((rule, index) => {
      const cap = capacityForType(foldersById.get(rule.folderId), type);
      const count = index === rules.length - 1 ? Math.max(1, remaining) : Math.max(1, Math.min(remaining, cap || target));
      updateRuleCount(sectionLocalId, rule.folderId, count);
      remaining = Math.max(0, remaining - count);
    });
  };

  const autoBalanceSubject = (subjectLocalId: string, type: 'MCQ' | 'CQ' | 'SHORT', target: number, rules: FolderRuleDraft[]) => {
    let remaining = Math.max(0, target);
    rules.forEach((rule, index) => {
      const cap = capacityForType(foldersById.get(rule.folderId), type);
      const count = index === rules.length - 1 ? Math.max(1, remaining) : Math.max(1, Math.min(remaining, cap || target));
      dispatch({
        type: 'UPDATE_SUBJECT_RULE_COUNT',
        subjectLocalId,
        folderId: rule.folderId,
        count,
      });
      remaining = Math.max(0, remaining - count);
    });
  };

  const previewSection = (label: string, type: 'MCQ' | 'CQ' | 'SHORT', target: number, rules: FolderRuleDraft[]) => {
    if (!rules.length) {
      setPreviewMessage(`${label}: select at least one folder first.`);
      return;
    }
    const gaps = rules
      .map((rule) => {
        const folder = foldersById.get(rule.folderId);
        const cap = capacityForType(folder, type);
        return { rule, cap, text: availabilityText(folder, type) };
      })
      .filter((row) => row.rule.questionCount > row.cap);
    const allocated = rules.reduce((sum, rule) => sum + Number(rule.questionCount || 0), 0);
    if (gaps.length) {
      setPreviewMessage(`${label}: ${gaps[0].rule.folderName ?? gaps[0].rule.folderId} requests ${gaps[0].rule.questionCount}, but ${gaps[0].text}.`);
      return;
    }
    if (allocated !== target) {
      setPreviewMessage(`${label}: allocation is ${allocated}/${target}. Balance it before generating.`);
      return;
    }
    setPreviewMessage(`${label}: allocation preview looks good. Backend will still verify exact passage grouping before writing sets.`);
  };

  const selectVisibleFolders = (shouldSelect: boolean) => {
    const selectedIds = new Set(activeRules.map((r) => r.folderId));
    visibleSelectableFolders.forEach((folder) => setFolderSelected(folder, shouldSelect, selectedIds));
  };
  const visibleSelectedCount = visibleSelectableFolders.filter((folder) => selectedFolderIds.has(folder.id)).length;
  const expandVisibleFolders = (open: boolean) => {
    const ids = collectFolderIds(filteredTree);
    setExpanded((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = open;
      });
      return next;
    });
  };

  const renderTreeControls = () => (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          value={folderSearch}
          onChange={(e) => setFolderSearch(e.target.value)}
          placeholder="Search nested folders"
          className="h-9 border-slate-200 pl-9 text-xs"
        />
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => expandVisibleFolders(true)}>
          Expand all
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => expandVisibleFolders(false)}>
          Collapse all
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-[10px]"
          disabled={visibleSelectableFolders.length === 0}
          onClick={() => selectVisibleFolders(true)}
        >
          Select visible
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[10px] text-slate-500"
          disabled={visibleSelectedCount === 0}
          onClick={() => selectVisibleFolders(false)}
        >
          Clear visible
        </Button>
        <Badge variant="outline" className="ml-auto text-[10px]">
          {visibleSelectedCount}/{visibleSelectableFolders.length} visible
        </Badge>
      </div>
    </div>
  );

  const toggleFolderGroup = (node: FolderTreeNode) => {
    const folders = selectableFoldersFor(node);
    if (!folders.length) {
      setExpanded((e) => ({ ...e, [node.id]: !(e[node.id] ?? true) }));
      return;
    }
    const allSelected = folders.every((folder) => selectedFolderIds.has(folder.id));
    for (const folder of folders) {
      const selected = selectedFolderIds.has(folder.id);
      if (allSelected && selected) {
        setFolderSelected(folder, false);
      } else if (!allSelected && !selected) {
        setFolderSelected(folder, true);
      }
    }
  };

  const toggleActiveLeaf = (node: FolderTreeNode) => {
    setFolderSelected(node, !selectedFolderIds.has(node.id));
  };

  const renderFolderRow = (node: FolderTreeNode, depth: number, path: string[] = []): ReactNode => {
    const hasKids = Boolean(node.children?.length);
    const open = folderSearch.trim() ? true : expanded[node.id] ?? depth < 1;
    const nextPath = [...path, node.name];
    const fullPath = nextPath.join(' / ');
    const indent = Math.min(8 + depth * 14, 112);
    const selectable = selectableFoldersFor(node);
    const selectedCount = selectable.filter((folder) => activeRules.some((r) => r.folderId === folder.id)).length;
    const isSelected = selectable.length > 0 && selectedCount === selectable.length;
    const isPartial = selectedCount > 0 && !isSelected;
    if (hasKids) {
      return (
        <div key={node.id}>
          <div
            className={cn(
              'flex w-full min-w-0 items-center gap-1 rounded-md border border-transparent pr-2 text-left text-xs font-semibold text-slate-800 transition-colors',
              isSelected ? 'border-slate-300 bg-[#0D1B35]/5' : isPartial ? 'border-amber-200 bg-amber-50/60' : 'hover:bg-slate-100',
            )}
            style={{ paddingLeft: indent }}
            title={fullPath}
          >
            <button
              type="button"
              className="flex h-7 w-5 shrink-0 items-center justify-center text-slate-400"
              onClick={() => setExpanded((e) => ({ ...e, [node.id]: !open }))}
              title={open ? 'Collapse folder' : 'Expand folder'}
            >
              {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-1 py-1.5 text-left"
              onClick={() => toggleFolderGroup(node)}
              title={selectable.length ? 'Select this folder group' : 'Open folder'}
            >
              <Folder className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{node.name}</span>
              {selectedCount > 0 ? <Check className="h-3.5 w-3.5 shrink-0 text-[#C8A96E]" /> : null}
            </button>
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {node.questionCount ?? node.counts?.total ?? 0}Q
            </Badge>
            {selectable.length > 1 ? (
              <Badge variant="outline" className="text-[10px]">
                {selectedCount}/{selectable.length}
              </Badge>
            ) : null}
          </div>
          {open ? node.children!.map((c) => renderFolderRow(c, depth + 1, nextPath)) : null}
        </div>
      );
    }
    const sel = activeRules.some((r) => r.folderId === node.id);
    return (
      <button
        key={node.id}
        type="button"
        className={cn(
          'flex w-full min-w-0 items-center gap-1 rounded-md border border-transparent px-2 py-1 text-left text-xs transition-colors',
          sel ? 'border-slate-300 bg-[#0D1B35]/5' : 'hover:bg-slate-50',
        )}
        style={{ paddingLeft: indent + 20 }}
        onClick={() => toggleActiveLeaf(node)}
        title={fullPath}
      >
        <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="flex-1 truncate text-slate-700">{node.name}</span>
        <Badge variant="outline" className="shrink-0 text-[10px]">
          {node.questionCount ?? 0}
        </Badge>
        {sel ? <Check className="h-3.5 w-3.5 shrink-0 text-[#C8A96E]" /> : null}
      </button>
    );
  };

  if (state.uiCategory === 'MULTI') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-semibold text-[#0D1B35]">Question bank</CardTitle>
            {folderFallbackAll ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-900">
                No folders are linked to the selected course, so all question-bank folders are shown.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-1">
              {state.subjects.map((s) => {
                const on = s.localId === (activeSectionId ?? activeSubject?.localId);
                return (
                  <Button
                    key={s.localId}
                    type="button"
                    size="sm"
                    variant={on ? 'default' : 'secondary'}
                    className={on ? 'bg-[#0D1B35] text-[#E2C98A]' : ''}
                    onClick={() => setActiveSectionId(s.localId)}
                  >
                    {s.name || 'Subject'}
                  </Button>
                );
              })}
            </div>
            {renderTreeControls()}
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {!state.courseId ? (
              <p className="p-4 text-center text-xs text-slate-500">Select a course in step 1 to load folders.</p>
            ) : folderLoading ? (
              <p className="p-4 text-center text-xs text-slate-500">Loading folders...</p>
            ) : (
              <div className="max-h-[min(420px,55vh)] overflow-y-auto rounded-md border border-slate-100 bg-white p-1">
                {filteredTree.length ? filteredTree.map((n) => renderFolderRow(n, 0)) : (
                  <p className="p-4 text-center text-xs text-slate-500">
                    {folderSearch.trim() ? 'No folders match your search.' : 'No folders are available.'}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {state.subjects.map((s) => {
            const allocated = s.folderRules.reduce((sum, r) => sum + Number(r.questionCount || 0), 0);
            const shortage = Math.max(0, s.count - allocated);
            const questionType = subjectQuestionType(s);
            return (
              <Card key={s.localId} className="border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <CardTitle className="text-sm font-bold text-[#0D1B35]">{s.name || 'Subject'}</CardTitle>
                    <p className="mt-1 text-[11px] text-slate-500">
                      MCQ {(s.mcqSingleCount || 0) + (s.mcqPassageCount || 0)} · CQ {s.cqCount || 0} · SHORT {s.shortCount || 0}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={shortage ? 'destructive' : 'secondary'} className="text-[10px]">
                      Allocated {allocated}/{s.count}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {s.folderRules.length} folders
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 px-2 text-[10px]"
                      disabled={!s.folderRules.length}
                      onClick={() => autoBalanceSubject(s.localId, questionType, s.count, s.folderRules)}
                    >
                      <Wand2 className="h-3 w-3" />
                      Auto balance
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[10px]"
                      disabled={!s.folderRules.length}
                      onClick={() => previewSection(s.name || 'Subject', questionType, s.count, s.folderRules)}
                    >
                      Preview generation
                    </Button>
                  </div>
                </CardHeader>
                {previewMessage ? (
                  <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-700">
                    {previewMessage}
                  </p>
                ) : null}
                {shortage ? (
                  <p className="border-b border-amber-100 bg-amber-50/80 px-4 py-2 text-[11px] text-amber-950">
                    Add {shortage} more question allocation before finalizing.
                  </p>
                ) : null}
                <CardContent className="space-y-2">
                  {s.folderRules.length === 0 ? (
                    <p className="text-center text-xs text-slate-500">Select folders in the tree for this subject.</p>
                  ) : (
                    s.folderRules.map((r) => {
                      const leafQ = leaves.find((l) => l.id === r.folderId)?.q ?? 0;
                      const folder = foldersById.get(r.folderId);
                      const fitCapacity = capacityForType(folder, questionType);
                      const overPool = fitCapacity > 0 && r.questionCount > fitCapacity;
                      return (
                        <div
                          key={r.folderId}
                          className="grid grid-cols-1 items-center gap-2 rounded-md border border-slate-100 bg-slate-50/80 p-2 md:grid-cols-[1fr_176px_64px_auto]"
                        >
                          <div className="min-w-0 text-[11px] leading-snug text-slate-800">
                            {leaves.find((l) => l.id === r.folderId)?.path ?? r.folderName ?? r.folderId}
                            <span className="text-slate-400">
                              {' '}
                              ({r.questionCount}Q{leafQ ? ` / ${leafQ} in bank` : ''})
                            </span>
                            <span className={cn('mt-0.5 block text-[10px]', overPool ? 'font-semibold text-rose-600' : 'text-slate-500')}>
                              {availabilityText(folder, questionType)} · Fit {fitCapacity}
                            </span>
                          </div>
                          <Select
                            value={r.selectionMode || 'RANDOM_COUNT'}
                            onValueChange={(v) => {
                              const mode = v as FolderRuleDraft['selectionMode'];
                              dispatch({
                                type: 'UPDATE_SUBJECT_RULE_MODE',
                                subjectLocalId: s.localId,
                                folderId: r.folderId,
                                selectionMode: mode,
                              });
                              if (mode === 'ALL_FROM_FOLDER' && leafQ > 0) {
                                dispatch({
                                  type: 'UPDATE_SUBJECT_RULE_COUNT',
                                  subjectLocalId: s.localId,
                                  folderId: r.folderId,
                                  count: leafQ,
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 border-slate-200 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL_FROM_FOLDER">Select all</SelectItem>
                              <SelectItem value="RANDOM_COUNT">Random N</SelectItem>
                              <SelectItem value="MANUAL_PICK">Manual pick</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            className="h-8 border-slate-200 text-center text-xs"
                            value={r.questionCount}
                            min={1}
                            disabled={r.selectionMode === 'ALL_FROM_FOLDER'}
                            onChange={(e) =>
                              dispatch({
                                type: 'UPDATE_SUBJECT_RULE_COUNT',
                                subjectLocalId: s.localId,
                                folderId: r.folderId,
                                count: Number(e.target.value),
                              })
                            }
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
                              {subjectQuestionType(s)} picker
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-rose-600"
                              onClick={() =>
                                dispatch({
                                  type: 'REMOVE_SUBJECT_FOLDER_RULE',
                                  subjectLocalId: s.localId,
                                  folderId: r.folderId,
                                })
                              }
                            >
                              x
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

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-slate-200 shadow-sm">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-semibold text-[#0D1B35]">Question bank</CardTitle>
            {folderFallbackAll ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-900">
                No folders are linked to the selected course, so all question-bank folders are shown.
              </p>
            ) : null}
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
          {renderTreeControls()}
        </CardHeader>
        <CardContent className="px-2 pb-3">
          {!state.courseId ? (
            <p className="p-4 text-center text-xs text-slate-500">Select a course in step 1 to load folders.</p>
          ) : folderLoading ? (
            <p className="p-4 text-center text-xs text-slate-500">Loading folders…</p>
          ) : (
            <div className="max-h-[min(400px,50vh)] overflow-y-auto rounded-md border border-slate-100 bg-white p-1">
              {filteredTree.length ? (
                filteredTree.map((n) => renderFolderRow(n, 0))
              ) : (
                <p className="p-4 text-center text-xs text-slate-500">
                  {folderSearch.trim() ? 'No folders match your search.' : 'No folders are available.'}
                </p>
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
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 px-2 text-[10px]"
                    disabled={!s.folderRules.length}
                    onClick={() => autoBalanceSection(s.localId, s.type, s.count, s.folderRules)}
                  >
                    <Wand2 className="h-3 w-3" />
                    Auto balance
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[10px]"
                    disabled={!s.folderRules.length}
                    onClick={() => previewSection(s.label || s.type, s.type, s.count, s.folderRules)}
                  >
                    Preview generation
                  </Button>
                </div>
              </CardHeader>
              {previewMessage ? (
                <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-700">
                  {previewMessage}
                </p>
              ) : null}
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
                    const folder = foldersById.get(r.folderId);
                    const fitCapacity = capacityForType(folder, s.type);
                    const overPool = fitCapacity > 0 && r.questionCount > fitCapacity;
                    return (
                      <div
                        key={r.folderId}
                        className="grid grid-cols-1 items-center gap-2 rounded-md border border-slate-100 bg-slate-50/80 p-2 md:grid-cols-[1fr_176px_64px_auto]"
                      >
                        <div className="min-w-0 text-[11px] leading-snug text-slate-800">
                          {leaves.find((l) => l.id === r.folderId)?.path ?? r.folderName ?? r.folderId}
                          <span className="text-slate-400">
                            {' '}
                            ({r.questionCount}Q{leafQ ? ` / ${leafQ} in bank` : ''})
                          </span>
                          <span className={cn('mt-0.5 block text-[10px]', overPool ? 'font-semibold text-rose-600' : 'text-slate-500')}>
                            {availabilityText(folder, s.type)} · Fit {fitCapacity}
                          </span>
                          {overPool ? (
                            <span className="ml-1 inline-flex items-center gap-1 font-medium text-rose-600">
                              <AlertTriangle className="h-3 w-3" />
                              Exceeds type capacity
                            </span>
                          ) : null}
                        </div>
                        <Select
                          value={r.selectionMode || 'RANDOM_COUNT'}
                          onValueChange={(v) => {
                            const mode = v as FolderRuleDraft['selectionMode'];
                            updateRuleMode(s.localId, r.folderId, mode);
                            if (mode === 'ALL_FROM_FOLDER' && leafQ > 0) {
                              updateRuleCount(s.localId, r.folderId, leafQ);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 border-slate-200 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL_FROM_FOLDER">Select all</SelectItem>
                            <SelectItem value="RANDOM_COUNT">Random N</SelectItem>
                            <SelectItem value="MANUAL_PICK">Manual pick</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          className="h-8 border-slate-200 text-center text-xs"
                          value={r.questionCount}
                          min={1}
                          disabled={r.selectionMode === 'ALL_FROM_FOLDER'}
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
