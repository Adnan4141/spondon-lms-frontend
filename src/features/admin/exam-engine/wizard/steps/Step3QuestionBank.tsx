'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Eye, FileText, Folder, Search, Wand2, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { FolderTreeNode, MergedFolderTreeResponse } from '@/lib/api/question-bank';
import type { ExamWizardState, FolderRuleDraft, WizardSection, WizardSubject } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import { SEC_TYPES } from '../constants';
import {
  buildRollupCountsMap,
  folderCapacityForType,
  sectionAllocatedTotal,
  sectionMcqPassageGoal,
  type FolderCounts,
} from '../wizardHelpers';
import { SelectedFoldersSummary, type SectionLike } from '../components/SelectedFoldersSummary';
import { FolderSamplePreviewModal } from '../components/FolderSamplePreviewModal';

type PickerTarget = { sectionLocalId: string; rule: FolderRuleDraft } | null;
type SectionTarget = { kind: 'section'; section: WizardSection } | { kind: 'subject'; subject: WizardSubject };

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
  /** Flat list of root nodes across all linked courses (legacy single-tree view). */
  tree: FolderTreeNode[];
  /** Per-course grouped trees. Falls back to a single synthetic group when absent. */
  trees?: MergedFolderTreeResponse['trees'];
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

/** Folders that the picker can attach a rule to — anything with at least one direct question. */
function selectableFoldersFor(node: FolderTreeNode): FolderTreeNode[] {
  const own = (node.questionCount ?? node.counts?.total ?? 0) > 0 ? [node] : [];
  return [...own, ...(node.children ?? []).flatMap((child) => selectableFoldersFor(child))];
}

function flattenAllFolders(nodes: FolderTreeNode[]): FolderTreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenAllFolders(node.children ?? [])]);
}

/** Type-specific capacity for a single folder's own questions (no descendants). */
function ownCapacityForType(folder: FolderTreeNode | undefined, type: 'MCQ' | 'CQ' | 'SHORT'): number {
  if (!folder) return 0;
  if (type === 'MCQ') return (folder.counts?.mcqSingle ?? 0) + (folder.counts?.mcqPassage ?? 0);
  if (type === 'CQ') return folder.counts?.cq ?? 0;
  return folder.counts?.short ?? 0;
}

function availabilityText(folder: FolderTreeNode | undefined, type: 'MCQ' | 'CQ' | 'SHORT'): string {
  if (!folder) return 'Availability unknown';
  if (type === 'MCQ') {
    return `Single MCQ ${folder.counts?.mcqSingle ?? 0} · Passage MCQ ${folder.counts?.mcqPassage ?? 0}`;
  }
  if (type === 'CQ') return `Creative/CQ ${folder.counts?.cq ?? 0}`;
  return `Short Qs ${folder.counts?.short ?? 0}`;
}

/**
 * Native checkbox with a controlled `indeterminate` flag — used for parent
 * folder rows when only some descendants are picked. Wraps the existing
 * `Checkbox` UI primitive to keep visual styling consistent.
 */
function TriCheckbox({
  checked,
  indeterminate,
  onCheckedChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange: (next: boolean) => void;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <Checkbox
      ref={ref}
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={ariaLabel}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

export function Step3QuestionBank({
  state,
  dispatch,
  tree,
  trees,
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
  const [collapsedCourses, setCollapsedCourses] = useState<Record<string, boolean>>({});
  const [sampleTarget, setSampleTarget] = useState<{
    label: string;
    type: 'MCQ' | 'CQ' | 'SHORT';
    folderIds: string[];
  } | null>(null);

  const activeSection = state.sections.find((s) => s.localId === activeSectionId) ?? state.sections[0];
  const activeSubject = state.subjects.find((s) => s.localId === activeSectionId) ?? state.subjects[0];

  const groupedTrees = useMemo(() => {
    if (trees && trees.length > 0) return trees;
    return [{ courseId: '', courseName: null, roots: tree }];
  }, [trees, tree]);

  const foldersById = useMemo(
    () => new Map(flattenAllFolders(tree).map((folder) => [folder.id, folder])),
    [tree],
  );

  /** rollup map: folder id → cumulative MCQ/CQ/SHORT/total counts across descendants. */
  const rollupMap = useMemo(() => buildRollupCountsMap(tree), [tree]);

  const subjectQuestionType = (subject: WizardSubject): 'MCQ' | 'CQ' | 'SHORT' => {
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
    () => (state.productType === 'MULTI' ? activeSubject?.folderRules ?? [] : activeSection?.folderRules ?? []),
    [activeSection?.folderRules, activeSubject?.folderRules, state.productType],
  );
  const selectedFolderIds = useMemo(() => new Set(activeRules.map((r) => r.folderId)), [activeRules]);

  const filteredGroupedTrees = useMemo(
    () => groupedTrees.map((g) => ({ ...g, roots: filterFolderTree(g.roots, folderSearch) })),
    [groupedTrees, folderSearch],
  );
  const visibleSelectableFolders = useMemo(() => {
    const byId = new Map<string, FolderTreeNode>();
    filteredGroupedTrees.forEach((g) =>
      g.roots.flatMap((node) => selectableFoldersFor(node)).forEach((folder) => byId.set(folder.id, folder)),
    );
    return [...byId.values()];
  }, [filteredGroupedTrees]);

  const setFolderSelected = (folder: FolderTreeNode, shouldSelect: boolean, selectedIds = selectedFolderIds) => {
    const selected = selectedIds.has(folder.id);
    if (selected === shouldSelect) return;
    if (state.productType === 'MULTI') {
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
        defaultCount: Math.min(
          remaining,
          Math.max(1, ownCapacityForType(folder, subjectQuestionType(activeSubject)) || folder.questionCount || 1),
        ),
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
        defaultCount: Math.min(
          remaining,
          Math.max(1, ownCapacityForType(folder, activeSection.type) || folder.questionCount || 1),
        ),
      });
    }
  };

  const autoBalanceSection = (
    sectionLocalId: string,
    type: 'MCQ' | 'CQ' | 'SHORT',
    target: number,
    rules: FolderRuleDraft[],
  ) => {
    let remaining = Math.max(0, target);
    rules.forEach((rule, index) => {
      const cap = ownCapacityForType(foldersById.get(rule.folderId), type);
      const count = index === rules.length - 1 ? Math.max(1, remaining) : Math.max(1, Math.min(remaining, cap || target));
      updateRuleCount(sectionLocalId, rule.folderId, count);
      remaining = Math.max(0, remaining - count);
    });
  };

  const autoBalanceSubject = (
    subjectLocalId: string,
    type: 'MCQ' | 'CQ' | 'SHORT',
    target: number,
    rules: FolderRuleDraft[],
  ) => {
    let remaining = Math.max(0, target);
    rules.forEach((rule, index) => {
      const cap = ownCapacityForType(foldersById.get(rule.folderId), type);
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

  /**
   * Quick textual sanity check kept for fast feedback. The real preview is the
   * sampler modal — opened separately so admins can scroll through actual
   * questions before committing.
   */
  const previewSection = (label: string, type: 'MCQ' | 'CQ' | 'SHORT', target: number, rules: FolderRuleDraft[]) => {
    if (!rules.length) {
      setPreviewMessage(`${label}: select at least one folder first.`);
      return;
    }
    const gaps = rules
      .map((rule) => {
        const folder = foldersById.get(rule.folderId);
        const cap = ownCapacityForType(folder, type);
        return { rule, cap, text: availabilityText(folder, type) };
      })
      .filter((row) => row.rule.questionCount > row.cap);
    const allocated = rules.reduce((sum, rule) => sum + Number(rule.questionCount || 0), 0);
    if (gaps.length) {
      setPreviewMessage(
        `${label}: ${gaps[0].rule.folderName ?? gaps[0].rule.folderId} requests ${gaps[0].rule.questionCount}, but ${gaps[0].text}.`,
      );
      return;
    }
    if (allocated !== target) {
      setPreviewMessage(`${label}: allocation is ${allocated}/${target}. Balance it before generating.`);
      return;
    }
    setPreviewMessage(`${label}: allocation matches. Open "Sample preview" to see real questions.`);
  };

  const openSampleModal = (label: string, type: 'MCQ' | 'CQ' | 'SHORT', rules: FolderRuleDraft[]) => {
    if (!rules.length) {
      setPreviewMessage(`${label}: select at least one folder first.`);
      return;
    }
    setSampleTarget({ label, type, folderIds: rules.map((r) => r.folderId) });
  };

  const selectVisibleFolders = (shouldSelect: boolean) => {
    const selectedIds = new Set(activeRules.map((r) => r.folderId));
    visibleSelectableFolders.forEach((folder) => setFolderSelected(folder, shouldSelect, selectedIds));
  };
  const visibleSelectedCount = visibleSelectableFolders.filter((folder) => selectedFolderIds.has(folder.id)).length;

  const expandVisibleFolders = (open: boolean) => {
    const ids = filteredGroupedTrees.flatMap((g) => collectFolderIds(g.roots));
    setExpanded((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = open;
      });
      return next;
    });
  };

  const renderTreeControls = () => (
    <div className="space-y-3 mt-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={folderSearch}
          onChange={(e) => setFolderSearch(e.target.value)}
          placeholder="Search nested folders..."
          className="h-10 border-slate-200 bg-slate-50/50 pl-9 pr-4 text-xs rounded-xl transition-all duration-300 focus:bg-white focus:ring-1 focus:ring-slate-400"
        />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-[10px] font-semibold border-slate-200 hover:bg-slate-50 rounded-lg"
          onClick={() => expandVisibleFolders(true)}
        >
          Expand all
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-[10px] font-semibold border-slate-200 hover:bg-slate-50 rounded-lg"
          onClick={() => expandVisibleFolders(false)}
        >
          Collapse all
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-[10px] font-semibold border-slate-200 hover:bg-slate-50 rounded-lg"
          disabled={visibleSelectableFolders.length === 0}
          onClick={() => selectVisibleFolders(true)}
        >
          Select visible
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[10px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg"
          disabled={visibleSelectedCount === 0}
          onClick={() => selectVisibleFolders(false)}
        >
          Clear visible
        </Button>
        <Badge variant="outline" className="ml-auto text-[10px] font-semibold border-slate-200 bg-slate-50/30 text-slate-600 px-2 h-6 flex items-center">
          {visibleSelectedCount}/{visibleSelectableFolders.length} visible
        </Badge>
      </div>
    </div>
  );

  const activeType: 'MCQ' | 'CQ' | 'SHORT' =
    state.productType === 'MULTI'
      ? activeSubject
        ? subjectQuestionType(activeSubject)
        : 'MCQ'
      : activeSection?.type ?? 'MCQ';

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

  const renderFolderRow = (node: FolderTreeNode, depth: number, path: string[] = []): ReactNode => {
    const hasKids = Boolean(node.children?.length);
    const open = folderSearch.trim() ? true : expanded[node.id] ?? depth < 1;
    const nextPath = [...path, node.name];
    const fullPath = nextPath.join(' / ');
    const indent = Math.min(8 + depth * 14, 112);
    const selectable = selectableFoldersFor(node);
    const selectedCount = selectable.filter((folder) => selectedFolderIds.has(folder.id)).length;
    const isSelected = selectable.length > 0 && selectedCount === selectable.length;
    const isPartial = selectedCount > 0 && !isSelected;
    const rollup = rollupMap.get(node.id);
    const totalCount = rollup?.total ?? node.questionCount ?? node.counts?.total ?? 0;
    const typeFit = folderCapacityForType(rollup, activeType);

    if (hasKids) {
      return (
        <div key={node.id}>
          <div
            className={cn(
              'flex w-full min-w-0 items-center gap-2 rounded-lg border border-transparent pr-3 py-1 text-left text-xs font-semibold text-slate-800 transition-all duration-300',
              isSelected
                ? 'border-indigo-100 bg-indigo-50/50 text-indigo-900 shadow-sm'
                : isPartial
                  ? 'border-amber-100 bg-amber-50/50 text-amber-900 shadow-sm'
                  : 'hover:bg-slate-50',
            )}
            style={{ paddingLeft: indent }}
            title={fullPath}
          >
            <button
              type="button"
              className="flex h-7 w-5 shrink-0 items-center justify-center text-slate-400 hover:text-slate-600"
              onClick={() => setExpanded((e) => ({ ...e, [node.id]: !open }))}
              title={open ? 'Collapse folder' : 'Expand folder'}
            >
              {open ? <ChevronDown className="h-3.5 w-3.5 transition-transform" /> : <ChevronRight className="h-3.5 w-3.5 transition-transform" />}
            </button>
            <TriCheckbox
              checked={isSelected}
              indeterminate={isPartial}
              onCheckedChange={() => toggleFolderGroup(node)}
              ariaLabel={`Select ${fullPath}`}
            />
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left"
              onClick={() => setExpanded((e) => ({ ...e, [node.id]: !open }))}
            >
              <Folder className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span className="truncate">{node.name}</span>
            </button>
            <Badge variant="secondary" className="ml-auto text-[9px] font-bold bg-slate-100 border border-slate-200/40 text-slate-600 px-1.5 h-5 flex items-center" title="Total questions in folder + descendants">
              {totalCount}Q
            </Badge>
            <Badge
              variant="outline"
              className={cn('text-[9px] font-bold px-1.5 h-5 flex items-center', typeFit === 0 ? 'border-slate-100 bg-slate-50 text-slate-400' : 'border-emerald-100 bg-emerald-50/70 text-emerald-700')}
              title={`Fits ${typeFit} ${activeType} question(s) including descendants`}
            >
              fit {typeFit}
            </Badge>
            {selectable.length > 1 ? (
              <Badge variant="outline" className="text-[9px] font-bold bg-slate-50 border-slate-200 text-slate-500 px-1 h-5 flex items-center">
                {selectedCount}/{selectable.length}
              </Badge>
            ) : null}
          </div>
          {open ? node.children!.map((c) => renderFolderRow(c, depth + 1, nextPath)) : null}
        </div>
      );
    }
    const sel = selectedFolderIds.has(node.id);
    return (
      <div
        key={node.id}
        className={cn(
          'flex w-full min-w-0 items-center gap-2 rounded-lg border border-transparent px-3 py-1.5 text-left text-xs transition-all duration-300',
          sel ? 'border-indigo-100 bg-indigo-50/30 text-indigo-900 shadow-sm' : 'hover:bg-slate-50/70',
        )}
        style={{ paddingLeft: indent + 20 }}
        title={fullPath}
      >
        <Checkbox
          checked={sel}
          onCheckedChange={(next) => setFolderSelected(node, next)}
          aria-label={`Select ${fullPath}`}
        />
        <FileText className="h-3.5 w-3.5 shrink-0 text-indigo-500/80" />
        <span className="flex-1 truncate text-slate-700">{node.name}</span>
        <Badge variant="outline" className="shrink-0 text-[9px] font-bold bg-slate-50 border-slate-200 text-slate-500 px-1.5 h-5 flex items-center">
          {totalCount}Q
        </Badge>
        <Badge
          variant="outline"
          className={cn('text-[9px] font-bold px-1.5 h-5 flex items-center', typeFit === 0 ? 'border-slate-100 bg-slate-50 text-slate-400' : 'border-emerald-100 bg-emerald-50/70 text-emerald-700')}
          title={`Fits ${typeFit} ${activeType} question(s)`}
        >
          fit {typeFit}
        </Badge>
      </div>
    );
  };

  const toggleCourseAll = (entry: { courseId: string; roots: FolderTreeNode[] }, shouldSelect: boolean) => {
    const allFolders = entry.roots.flatMap((root) => selectableFoldersFor(root));
    allFolders.forEach((folder) => setFolderSelected(folder, shouldSelect));
  };

  const renderCourseGroup = (entry: MergedFolderTreeResponse['trees'][number]) => {
    const collapsedKey = entry.courseId || 'all';
    const isCollapsed = collapsedCourses[collapsedKey] ?? false;
    const allFolders = entry.roots.flatMap((r) => selectableFoldersFor(r));
    const selected = allFolders.filter((f) => selectedFolderIds.has(f.id)).length;
    const isAllSelected = allFolders.length > 0 && selected === allFolders.length;
    const isPartial = selected > 0 && !isAllSelected;

    return (
      <div key={collapsedKey} className="border-b border-slate-100 last:border-b-0">
        {groupedTrees.length > 1 ? (
          <div className="flex items-center gap-2 bg-slate-50/80 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <button
              type="button"
              className="flex h-5 w-5 items-center justify-center text-slate-400 hover:text-slate-600"
              onClick={() => setCollapsedCourses((c) => ({ ...c, [collapsedKey]: !isCollapsed }))}
              title={isCollapsed ? 'Expand course' : 'Collapse course'}
            >
              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            <TriCheckbox
              checked={isAllSelected}
              indeterminate={isPartial}
              onCheckedChange={(next) => toggleCourseAll(entry, next)}
              ariaLabel={`Select all in ${entry.courseName ?? 'course'}`}
            />
            <span className="flex-1 truncate text-slate-800">
              {entry.courseName ?? (entry.courseId ? entry.courseId : 'Question bank')}
            </span>
            <Badge variant="outline" className="text-[10px] font-semibold bg-white border-slate-200">
              {selected}/{allFolders.length}
            </Badge>
          </div>
        ) : null}
        {!isCollapsed
          ? entry.roots.length === 0
            ? (
                <p className="px-4 py-3 text-[11px] text-slate-400 italic">No folders for this course yet.</p>
              )
            : entry.roots.map((root) => renderFolderRow(root, 0))
          : null}
      </div>
    );
  };

  /** Build SectionLike[] from sections OR subjects for the SelectedFoldersSummary. */
  const summarySections: SectionLike[] = useMemo(() => {
    if (state.productType === 'MULTI') {
      return state.subjects.map((s) => ({
        localId: s.localId,
        label: s.name || 'Subject',
        type: subjectQuestionType(s),
        count: s.count,
        marks: s.marks,
        neg: s.neg,
        folderRules: s.folderRules,
      }));
    }
    return state.sections.map((s) => ({
      localId: s.localId,
      label: s.label || s.type,
      type: s.type,
      count: s.count,
      marks: s.marks,
      neg: s.neg,
      folderRules: s.folderRules,
    }));
  }, [state.productType, state.sections, state.subjects]);

  const sampleHeader = (
    <div className="space-y-3">
      <SelectedFoldersSummary
        title="Selected folders (all sections)"
        sections={summarySections}
        leaves={leaves}
        rollupCounts={rollupMap}
        state={state}
      />
    </div>
  );

  const sectionTargetForActive: SectionTarget | null =
    state.productType === 'MULTI'
      ? activeSubject
        ? { kind: 'subject', subject: activeSubject }
        : null
      : activeSection
        ? { kind: 'section', section: activeSection }
        : null;

  const sampleModal = sampleTarget ? (
    <FolderSamplePreviewModal
      open={Boolean(sampleTarget)}
      onClose={() => setSampleTarget(null)}
      label={sampleTarget.label}
      questionType={sampleTarget.type}
      folderIds={sampleTarget.folderIds}
      leaves={leaves}
    />
  ) : null;

  if (state.productType === 'MULTI') {
    return (
      <div className="space-y-4">
        {sampleHeader}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-slate-100 shadow-md shadow-slate-100/40 rounded-2xl overflow-hidden">
            <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/20">
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-sm font-bold text-[#0D1B35]">Question bank folders</CardTitle>
              </div>
              {folderFallbackAll ? (
                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-[11px] font-medium text-amber-950">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    No folders are linked to the selected courses, so all question-bank folders are shown.
                  </div>
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Active Subject:</span>
                {state.subjects.map((s) => {
                  const on = s.localId === (activeSectionId ?? activeSubject?.localId);
                  return (
                    <Button
                      key={s.localId}
                      type="button"
                      size="sm"
                      variant={on ? 'default' : 'outline'}
                      className={cn(
                        "h-8 text-xs font-bold rounded-lg transition-all duration-300",
                        on 
                          ? "bg-[#0D1B35] text-[#E2C98A] shadow-sm hover:bg-[#1E2F55]" 
                          : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                      onClick={() => setActiveSectionId(s.localId)}
                    >
                      {s.name || 'Subject'}
                    </Button>
                  );
                })}
              </div>
              {renderTreeControls()}
            </CardHeader>
            <CardContent className="p-3">
              {!state.courseId ? (
                <p className="p-8 text-center text-xs text-slate-400 italic">Select at least one course in step 1 to load folders.</p>
              ) : folderLoading ? (
                <p className="p-8 text-center text-xs text-slate-400 italic animate-pulse">Loading folders…</p>
              ) : (
                <div className="max-h-[min(420px,55vh)] overflow-y-auto rounded-xl border border-slate-100 bg-white p-2">
                  {filteredGroupedTrees.some((g) => g.roots.length > 0)
                    ? filteredGroupedTrees.map((entry) => renderCourseGroup(entry))
                    : (
                        <p className="p-8 text-center text-xs text-slate-400 italic">
                          {folderSearch.trim() ? 'No folders match your search.' : 'No folders are available.'}
                        </p>
                      )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {state.subjects.map((s) => {
              const allocated = s.folderRules.reduce((sum, r) => sum + Number(r.questionCount || 0), 0);
              const shortage = Math.max(0, s.count - allocated);
              const questionType = subjectQuestionType(s);
              return (
                <Card key={s.localId} className="border-slate-100 shadow-md shadow-slate-100/40 rounded-2xl overflow-hidden">
                  <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/20">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold text-[#0D1B35]">{s.name || 'Subject'}</CardTitle>
                        <p className="mt-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          MCQ {(s.mcqSingleCount || 0) + (s.mcqPassageCount || 0)} · CQ {s.cqCount || 0} · SHORT{' '}
                          {s.shortCount || 0}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={shortage ? 'destructive' : 'secondary'} className="text-[10px] font-semibold">
                          Allocated {allocated}/{s.count}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-semibold border-slate-200 bg-slate-50/30">
                          {s.folderRules.length} folders
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 px-3 text-[11px] font-semibold border-indigo-200 bg-indigo-50/30 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 rounded-lg shadow-sm"
                        disabled={!s.folderRules.length}
                        onClick={() => autoBalanceSubject(s.localId, questionType, s.count, s.folderRules)}
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                        Auto balance
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                        disabled={!s.folderRules.length}
                        onClick={() => previewSection(s.name || 'Subject', questionType, s.count, s.folderRules)}
                      >
                        Validate
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 px-3 text-[11px] font-semibold border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-sm"
                        disabled={!s.folderRules.length}
                        onClick={() => openSampleModal(s.name || 'Subject', questionType, s.folderRules)}
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        Sample preview
                      </Button>
                    </div>
                  </CardHeader>
                  {previewMessage ? (
                    <div className="flex items-start gap-2 border-b border-indigo-100 bg-indigo-50/40 px-5 py-2.5 text-[11px] font-medium text-indigo-900">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-indigo-600 mt-0.5" />
                      <div>{previewMessage}</div>
                    </div>
                  ) : null}
                  {shortage ? (
                    <div className="flex items-start gap-2 border-b border-amber-100 bg-amber-50/60 px-5 py-2.5 text-[11px] font-semibold text-amber-950">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />
                      <div>Add {shortage} more question allocation before finalizing.</div>
                    </div>
                  ) : null}
                  <CardContent className="space-y-3 p-4">
                    {s.folderRules.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 px-4 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <Folder className="h-6 w-6" />
                        </div>
                        <h4 className="mt-3 text-xs font-bold text-slate-700">No folders selected</h4>
                        <p className="mt-1 max-w-xs text-[11px] text-slate-500 leading-normal">
                          Select folders from the tree on the left to define question rules for this subject.
                        </p>
                      </div>
                    ) : (
                      s.folderRules.map((r) => {
                        const leafQ = leaves.find((l) => l.id === r.folderId)?.q ?? 0;
                        const folder = foldersById.get(r.folderId);
                        const fitCapacity = ownCapacityForType(folder, questionType);
                        const overPool = fitCapacity > 0 && r.questionCount > fitCapacity;
                        return (
                          <div
                            key={r.folderId}
                            className={cn(
                              "relative flex flex-col gap-3 rounded-xl border p-4 transition-all duration-300 md:flex-row md:items-center",
                              overPool
                                ? "border-rose-200 bg-rose-50/30 hover:border-rose-300"
                                : "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:shadow-sm"
                            )}
                          >
                            <div
                              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-indigo-600"
                              style={{ background: overPool ? '#EF4444' : '#6366F1' }}
                            />

                            <div className="min-w-0 flex-1 pl-2">
                              <div className="flex items-center flex-wrap gap-1.5">
                                <span className="font-bold text-xs text-slate-800 truncate" title={r.folderName}>
                                  {leaves.find((l) => l.id === r.folderId)?.path.split('/').pop() ?? r.folderName ?? r.folderId}
                                </span>
                                <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-semibold bg-white border-slate-200 text-slate-600">
                                  {leafQ} in bank
                                </Badge>
                              </div>
                              
                              <p className="mt-1 text-[10px] text-slate-400 truncate">
                                {leaves.find((l) => l.id === r.folderId)?.path ?? r.folderId}
                              </p>

                              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                                <span className="text-slate-500 font-medium bg-white/80 border border-slate-100 px-1.5 py-0.5 rounded">
                                  {availabilityText(folder, questionType)}
                                </span>
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded font-bold border",
                                  overPool 
                                    ? "bg-rose-100/50 border-rose-200 text-rose-700" 
                                    : "bg-emerald-50 border-emerald-100 text-emerald-700"
                                )}>
                                  Fit: {fitCapacity}
                                </span>
                                {overPool ? (
                                  <span className="flex items-center gap-1 font-semibold text-rose-600">
                                    <AlertTriangle className="h-3 w-3" />
                                    Exceeds capacity
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 md:shrink-0">
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 md:hidden">Pull Mode</span>
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
                                  <SelectTrigger className="h-8 w-32 border-slate-200 bg-white text-xs font-medium focus:ring-1 focus:ring-slate-400">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ALL_FROM_FOLDER">Select all</SelectItem>
                                    <SelectItem value="RANDOM_COUNT">Random N</SelectItem>
                                    <SelectItem value="MANUAL_PICK">Manual pick</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex flex-col gap-1 w-16">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 md:hidden">Count</span>
                                <Input
                                  type="number"
                                  className="h-8 border-slate-200 bg-white text-center text-xs font-semibold focus:ring-1 focus:ring-slate-400"
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
                              </div>

                              <div className="flex items-center gap-1.5 pt-4 md:pt-0">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-indigo-200 bg-indigo-50/40 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 text-[11px] font-semibold gap-1"
                                  onClick={() =>
                                    setPicker({
                                      sectionLocalId: s.localId,
                                      rule: { ...r },
                                    })
                                  }
                                >
                                  {questionType} picker
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-lg p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  onClick={() =>
                                    dispatch({
                                      type: 'REMOVE_SUBJECT_FOLDER_RULE',
                                      subjectLocalId: s.localId,
                                      folderId: r.folderId,
                                    })
                                  }
                                  title="Remove rule"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
        {sampleModal}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sampleHeader}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-100 shadow-md shadow-slate-100/40 rounded-2xl overflow-hidden">
          <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/20">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-sm font-bold text-[#0D1B35]">Question bank folders</CardTitle>
            </div>
            {folderFallbackAll ? (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-[11px] font-medium text-amber-950">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  No folders are linked to the selected course, so all question-bank folders are shown.
                </div>
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Active Section:</span>
              {state.sections.map((s) => {
                const t = SEC_TYPES.find((x) => x.id === s.type);
                const on = s.localId === (activeSectionId ?? activeSection?.localId);
                return (
                  <Button
                    key={s.localId}
                    type="button"
                    size="sm"
                    variant={on ? 'default' : 'outline'}
                    className={cn(
                      "h-8 text-xs font-bold rounded-lg transition-all duration-300",
                      on 
                        ? "shadow-sm hover:opacity-90" 
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                    style={on ? { backgroundColor: t?.color || '#3B82F6', color: '#fff', borderColor: t?.color || '#3B82F6' } : {}}
                    onClick={() => setActiveSectionId(s.localId)}
                  >
                    {t?.short || s.type}
                  </Button>
                );
              })}
            </div>
            {renderTreeControls()}
          </CardHeader>
          <CardContent className="p-3">
            {!state.courseId ? (
              <p className="p-8 text-center text-xs text-slate-400 italic">Select a course in step 1 to load folders.</p>
            ) : folderLoading ? (
              <p className="p-8 text-center text-xs text-slate-400 italic animate-pulse">Loading folders…</p>
            ) : (
              <div className="max-h-[min(400px,50vh)] overflow-y-auto rounded-xl border border-slate-100 bg-white p-2">
                {filteredGroupedTrees.some((g) => g.roots.length > 0)
                  ? filteredGroupedTrees.map((entry) => renderCourseGroup(entry))
                  : (
                      <p className="p-8 text-center text-xs text-slate-400 italic">
                        {folderSearch.trim() ? 'No folders match your search.' : 'No folders are available.'}
                      </p>
                    )}
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          {state.sections.map((s) => {
            const t = SEC_TYPES.find((x) => x.id === s.type);
            const allocated = sectionAllocatedTotal(s);
            const match = allocated === s.count;
            return (
              <Card key={s.localId} className="border-slate-100 shadow-md shadow-slate-100/40 rounded-2xl overflow-hidden">
                <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/20">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-1 rounded-full" style={{ background: t?.color || '#3B82F6' }} />
                      <CardTitle className="text-sm font-bold text-[#0D1B35]">
                        {t?.short || s.type} — target {s.count}Q
                        {s.type === 'MCQ' && sectionMcqPassageGoal(s) > 0 ? (
                          <span className="font-normal text-slate-400"> · ≤{sectionMcqPassageGoal(s)} blocks</span>
                        ) : null}
                      </CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={match ? 'secondary' : 'destructive'} className="text-[10px] font-semibold">
                        Allocated {allocated}/{s.count}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-semibold border-slate-200 bg-slate-50/30">
                        {s.folderRules.length} folders
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 px-3 text-[11px] font-semibold border-indigo-200 bg-indigo-50/30 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 rounded-lg shadow-sm"
                      disabled={!s.folderRules.length}
                      onClick={() => autoBalanceSection(s.localId, s.type, s.count, s.folderRules)}
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      Auto balance
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                      disabled={!s.folderRules.length}
                      onClick={() => previewSection(s.label || s.type, s.type, s.count, s.folderRules)}
                    >
                      Validate
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 px-3 text-[11px] font-semibold border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-sm"
                      disabled={!s.folderRules.length}
                      onClick={() => openSampleModal(s.label || s.type, s.type, s.folderRules)}
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      Sample preview
                    </Button>
                  </div>
                </CardHeader>
                {previewMessage ? (
                  <div className="flex items-start gap-2 border-b border-indigo-100 bg-indigo-50/40 px-5 py-2.5 text-[11px] font-medium text-indigo-900">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-indigo-600 mt-0.5" />
                    <div>{previewMessage}</div>
                  </div>
                ) : null}
                {!match && s.folderRules.length > 0 ? (
                  <div className="flex items-start gap-2 border-b border-amber-100 bg-amber-50/60 px-5 py-2.5 text-[11px] font-semibold text-amber-950">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />
                    <div>Totals should match the section target before generating sets (pins may need manual counts).</div>
                  </div>
                ) : null}
                <CardContent className="space-y-3 p-4">
                  {s.folderRules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 px-4 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <Folder className="h-6 w-6" />
                      </div>
                      <h4 className="mt-3 text-xs font-bold text-slate-700">No folders selected</h4>
                      <p className="mt-1 max-w-xs text-[11px] text-slate-500 leading-normal">
                        Select one or more folders from the Question Bank tree on the left to begin pulling questions.
                      </p>
                    </div>
                  ) : (
                    s.folderRules.map((r) => {
                      const leafQ = leaves.find((l) => l.id === r.folderId)?.q ?? 0;
                      const folder = foldersById.get(r.folderId);
                      const fitCapacity = ownCapacityForType(folder, s.type);
                      const overPool = fitCapacity > 0 && r.questionCount > fitCapacity;
                      return (
                        <div
                          key={r.folderId}
                          className={cn(
                            "relative flex flex-col gap-3 rounded-xl border p-4 transition-all duration-300 md:flex-row md:items-center",
                            overPool
                              ? "border-rose-200 bg-rose-50/30 hover:border-rose-300"
                              : "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:shadow-sm"
                          )}
                        >
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                            style={{ background: overPool ? '#EF4444' : t?.color || '#3B82F6' }}
                          />

                          <div className="min-w-0 flex-1 pl-2">
                            <div className="flex items-center flex-wrap gap-1.5">
                              <span className="font-bold text-xs text-slate-800 truncate" title={r.folderName}>
                                {leaves.find((l) => l.id === r.folderId)?.path.split('/').pop() ?? r.folderName ?? r.folderId}
                              </span>
                              <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-semibold bg-white border-slate-200 text-slate-600">
                                {leafQ} in bank
                              </Badge>
                            </div>
                            
                            <p className="mt-1 text-[10px] text-slate-400 truncate">
                              {leaves.find((l) => l.id === r.folderId)?.path ?? r.folderId}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className="text-slate-500 font-medium bg-white/80 border border-slate-100 px-1.5 py-0.5 rounded">
                                {availabilityText(folder, s.type)}
                              </span>
                              <span className={cn(
                                "px-1.5 py-0.5 rounded font-bold border",
                                overPool 
                                  ? "bg-rose-100/50 border-rose-200 text-rose-700" 
                                  : "bg-emerald-50 border-emerald-100 text-emerald-700"
                              )}>
                                Fit: {fitCapacity}
                              </span>
                              {overPool ? (
                                <span className="flex items-center gap-1 font-semibold text-rose-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  Exceeds capacity
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 md:shrink-0">
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 md:hidden">Pull Mode</span>
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
                                <SelectTrigger className="h-8 w-32 border-slate-200 bg-white text-xs font-medium focus:ring-1 focus:ring-slate-400">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ALL_FROM_FOLDER">Select all</SelectItem>
                                  <SelectItem value="RANDOM_COUNT">Random N</SelectItem>
                                  <SelectItem value="MANUAL_PICK">Manual pick</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex flex-col gap-1 w-16">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 md:hidden">Count</span>
                              <Input
                                type="number"
                                className="h-8 border-slate-200 bg-white text-center text-xs font-semibold focus:ring-1 focus:ring-slate-400"
                                value={r.questionCount}
                                min={1}
                                disabled={r.selectionMode === 'ALL_FROM_FOLDER'}
                                onChange={(e) => updateRuleCount(s.localId, r.folderId, Number(e.target.value))}
                              />
                            </div>

                            <div className="flex items-center gap-1.5 pt-4 md:pt-0">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 border-indigo-200 bg-indigo-50/40 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 text-[11px] font-semibold gap-1"
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
                                className="h-8 w-8 rounded-lg p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                onClick={() =>
                                  dispatch({ type: 'REMOVE_FOLDER_RULE', sectionLocalId: s.localId, folderId: r.folderId })
                                }
                                title="Remove rule"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
      {sampleModal}
    </div>
  );
}

export type { FolderCounts, SectionTarget };
