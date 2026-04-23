'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FolderOpen, Folder, ChevronRight, ChevronDown, Search,
  Plus, Trash2, Sparkles, Loader2, X, Check, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  getExamById, createExamSet,
  addQuestionsToSet, removeQuestionFromSet,
} from '@/lib/api/exams';
import { getQuestionFolderTree, getQuestions } from '@/lib/api/question-bank';
import type { FolderTreeNode } from '@/lib/api/question-bank';
import type { Exam, ExamSet, ExamQuestion } from '@/types/exam';
import type { Question } from '@/types/question';

const NAVY = '#1e3a5f';

const DIFF_CFG = {
  EASY:   { label: 'Easy', tc: 'text-emerald-700', bg: 'bg-emerald-100' },
  MEDIUM: { label: 'Med',  tc: 'text-amber-700',   bg: 'bg-amber-100'   },
  HARD:   { label: 'Hard', tc: 'text-rose-700',    bg: 'bg-rose-100'    },
} as const;

// ─── FOLDER TREE NODE ─────────────────────────────────────────────────────────

function FolderNode({
  folder, depth, active, onSelect,
}: {
  folder: FolderTreeNode;
  depth: number;
  active: string | null;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = (folder.children?.length ?? 0) > 0;

  return (
    <div>
      <button
        onClick={() => {
          onSelect(folder.id);
          if (hasChildren) setExpanded(e => !e);
        }}
        className={cn(
          'w-full flex items-center gap-1.5 text-left py-2 rounded-lg text-xs font-semibold transition-all',
          active === folder.id ? 'bg-blue-50 text-blue-800' : 'text-slate-600 hover:bg-slate-100',
        )}
        style={{ paddingLeft: `${10 + depth * 14}px`, paddingRight: '8px' }}
      >
        {hasChildren ? (
          expanded
            ? <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
            : <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
        ) : (
          <span className="w-3 h-3 shrink-0" />
        )}
        {active === folder.id
          ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-blue-600" />
          : <Folder className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
        <span className="flex-1 truncate">{folder.name}</span>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full shrink-0 ml-1">
          {folder.questionCount}
        </span>
      </button>
      {expanded && folder.children?.map(c => (
        <FolderNode key={c.id} folder={c} depth={depth + 1} active={active} onSelect={onSelect} />
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function QuestionBankTab({
  exam,
  onExamChange,
}: {
  exam: Exam;
  onExamChange: (exam: Exam) => void;
}) {
  const { toast } = useToast();

  // Folder tree
  const [folders, setFolders]               = useState<FolderTreeNode[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [foldersLoading, setFoldersLoading] = useState(true);

  // Bank questions
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [bankLoading, setBankLoading]     = useState(false);
  const [search, setSearch]               = useState('');
  const [diffFilter, setDiffFilter]       = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');
  const [selectedIds, setSelectedIds]     = useState<string[]>([]);

  // Set management
  const [activeSetIdx, setActiveSetIdx] = useState(0);
  const [adding, setAdding]             = useState(false);

  // Auto-pick config
  const [autoCount, setAutoCount]     = useState(50);
  const [autoAllSets, setAutoAllSets] = useState(true);
  const [doShuffle, setDoShuffle]     = useState(true);

  // New set creation
  const [creatingSet, setCreatingSet] = useState(false);
  const [newSetName, setNewSetName]   = useState('');
  const [showNewSet, setShowNewSet]   = useState(false);

  const sets: ExamSet[]           = exam.sets ?? [];
  const activeSet: ExamSet | null = sets[activeSetIdx] ?? null;

  // Target set count: prefer exam.totalSets (the configured count) over the number
  // of already-created sets, so auto-pick can create missing sets via the backend.
  const targetSetCount = autoAllSets
    ? Math.max(sets.length, exam.totalSets ?? 1)
    : 1;

  // ── Load folder tree (already hierarchical — no manual tree-building needed) ──
  useEffect(() => {
    setFoldersLoading(true);
    getQuestionFolderTree(exam.courseId).then(r => {
      if (r.success && r.data) setFolders(r.data);
      setFoldersLoading(false);
    });
  }, [exam.courseId]);

  // ── Load questions when folder / difficulty filter changes ──
  useEffect(() => {
    setBankLoading(true);
    const diff = diffFilter !== 'ALL' ? diffFilter : undefined;
    getQuestions(activeFolderId ?? undefined, undefined, diff).then(r => {
      if (r.success && r.data) setBankQuestions(r.data);
      setBankLoading(false);
    });
    setSelectedIds([]);
  }, [activeFolderId, diffFilter]);

  const filteredBank = search
    ? bankQuestions.filter(q => q.prompt.toLowerCase().includes(search.toLowerCase()))
    : bankQuestions;

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () => {
    const ids    = filteredBank.map(q => q.id);
    const allSel = ids.every(id => selectedIds.includes(id));
    setSelectedIds(allSel ? selectedIds.filter(id => !ids.includes(id)) : [...new Set([...selectedIds, ...ids])]);
  };

  const refreshExam = useCallback(async () => {
    const r = await getExamById(exam.id);
    if (r.success && r.data) onExamChange(r.data);
  }, [exam.id, onExamChange]);

  // ── Add manually selected questions to the active set ──
  const handleAddSelected = async () => {
    if (!activeSet || !selectedIds.length) return;
    setAdding(true);
    const res = await addQuestionsToSet({ examSetId: activeSet.id, questionIds: selectedIds });
    setAdding(false);
    if (res.success) {
      toast({ description: `${res.data?.addedCount ?? selectedIds.length} question(s) added.` });
      setSelectedIds([]);
      await refreshExam();
    } else {
      toast({ description: 'Failed to add questions.', variant: 'destructive' });
    }
  };

  // ── Auto-pick: single set OR all sets via autoSetCount ──
  // When autoSetCount > 1, backend creates/reuses all sets (A, B, C…) and
  // distributes shuffled questions non-overlappingly across them.
  const handleAutoPick = async () => {
    if (!sets.length || !activeFolderId) {
      toast({ description: 'Select a folder first.', variant: 'destructive' });
      return;
    }
    const baseSet = sets[0]; // backend determines exam from this set's examId
    setAdding(true);

    const payload: Parameters<typeof addQuestionsToSet>[0] = {
      examSetId: baseSet.id,
      folderId: activeFolderId,
      count: autoCount,
      shuffleQuestions: doShuffle,
    };
    if (targetSetCount > 1) {
      payload.autoSetCount = targetSetCount;
    }

    const res = await addQuestionsToSet(payload);
    setAdding(false);

    if (res.success) {
      if (res.data?.perSet?.length) {
        const details = res.data.perSet.map(s => `${s.setName}: ${s.addedCount}`).join(' · ');
        toast({ description: `Distributed — ${details}` });
      } else {
        toast({ description: `${res.data?.addedCount ?? autoCount} question(s) added to ${targetSetCount} set(s).` });
      }
      await refreshExam();
    } else {
      toast({ description: 'Auto-pick failed. Not enough unique questions?', variant: 'destructive' });
    }
  };

  const handleRemove = async (examQuestionId: string) => {
    const res = await removeQuestionFromSet(examQuestionId);
    if (res.success) {
      toast({ description: 'Question removed.' });
      await refreshExam();
    }
  };

  const handleCreateSet = async () => {
    const name = newSetName.trim() || String.fromCharCode(65 + sets.length);
    setCreatingSet(true);
    const res = await createExamSet({ examId: exam.id, name });
    setCreatingSet(false);
    if (res.success) {
      toast({ description: `Set "${name}" created.` });
      setNewSetName('');
      setShowNewSet(false);
      await refreshExam();
      setActiveSetIdx(sets.length);
    }
  };

  const totalSetMarks = activeSet?.questions?.reduce((s, q) => s + (q.marks ?? 1), 0) ?? 0;
  const targetQCount  = (exam.settings as Record<string, unknown>)?.questionCount as number ?? 0;

  return (
    <div className="flex gap-0 -m-5 overflow-hidden rounded-b-xl" style={{ height: 580 }}>

      {/* ── Panel 1: Folder Tree + Auto-Pick Config ── */}
      <div className="w-52 shrink-0 border-r border-slate-100 bg-slate-50 flex flex-col overflow-hidden">
        <div className="px-3 py-2.5 border-b border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question Folders</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-1 space-y-0.5">
          <button
            onClick={() => setActiveFolderId(null)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-semibold transition-all',
              !activeFolderId ? 'bg-blue-50 text-blue-800' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            <FolderOpen className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left">All Questions</span>
          </button>

          {foldersLoading ? (
            <div className="px-3 py-3 flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </div>
          ) : folders.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">No folders for this course.</div>
          ) : (
            folders.map(f => (
              <FolderNode
                key={f.id}
                folder={f}
                depth={0}
                active={activeFolderId}
                onSelect={setActiveFolderId}
              />
            ))
          )}
        </div>

        {/* Auto-pick footer */}
        <div className="p-2.5 border-t border-slate-100 space-y-2 bg-white">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Auto-Pick</p>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1} max={500}
              value={autoCount}
              onChange={e => setAutoCount(Math.max(1, +e.target.value))}
              className="w-16 text-center text-xs border border-slate-200 rounded-lg py-1.5 px-1 font-bold bg-white"
            />
            <span className="text-[11px] text-slate-400">q / set</span>
          </div>

          {(sets.length > 1 || (exam.totalSets ?? 1) > 1) && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoAllSets}
                onChange={e => setAutoAllSets(e.target.checked)}
                className="w-3.5 h-3.5 rounded"
                style={{ accentColor: NAVY }}
              />
              <span className="text-[11px] text-slate-600 font-semibold">All {Math.max(sets.length, exam.totalSets ?? 1)} sets</span>
            </label>
          )}

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={doShuffle}
              onChange={e => setDoShuffle(e.target.checked)}
              className="w-3.5 h-3.5 rounded"
              style={{ accentColor: NAVY }}
            />
            <span className="text-[11px] text-slate-600 font-semibold">Shuffle</span>
          </label>

          <button
            onClick={handleAutoPick}
            disabled={adding || !activeFolderId || !sets.length}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold text-white transition-colors disabled:opacity-40"
            style={{ background: NAVY }}
          >
            {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {autoAllSets && targetSetCount > 1 ? `Generate ${targetSetCount} Sets` : 'Auto-Pick'}
          </button>

          {!activeFolderId && (
            <p className="text-[10px] text-slate-400 text-center">↑ Select a folder first</p>
          )}
        </div>
      </div>

      {/* ── Panel 2: Bank Question List ── */}
      <div className="w-80 shrink-0 border-r border-slate-100 flex flex-col overflow-hidden bg-white">
        <div className="px-3 py-2 border-b border-slate-100 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search questions…"
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-1">
            {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDiffFilter(d)}
                className={cn(
                  'px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all',
                  diffFilter === d
                    ? 'border-blue-700 bg-blue-50 text-blue-800'
                    : 'border-slate-200 text-slate-400 hover:border-slate-300',
                )}
              >
                {d === 'ALL' ? 'All' : DIFF_CFG[d].label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-3 py-1.5 border-b border-slate-50 bg-slate-50 flex items-center justify-between">
          <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              style={{ accentColor: NAVY }}
              checked={filteredBank.length > 0 && filteredBank.every(q => selectedIds.includes(q.id))}
              onChange={toggleAll}
            />
            Select all ({filteredBank.length})
          </label>
          <span className="text-[11px] font-bold" style={{ color: NAVY }}>{selectedIds.length} selected</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {bankLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : filteredBank.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">No questions found.</div>
          ) : (
            filteredBank.map(q => {
              const isSelected = selectedIds.includes(q.id);
              const correct    = q.options?.find(o => o.isCorrect);
              const diff       = q.difficulty ? DIFF_CFG[q.difficulty] : null;
              return (
                <label
                  key={q.id}
                  className={cn(
                    'flex items-start gap-2.5 px-3 py-2.5 border-b border-slate-50 cursor-pointer transition-colors',
                    isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(q.id)}
                    style={{ accentColor: NAVY }}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      {diff && (
                        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', diff.bg, diff.tc)}>
                          {diff.label}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">{q.type}</span>
                      {q.year && <span className="text-[10px] text-slate-400">{q.year}</span>}
                    </div>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed line-clamp-2">{q.prompt}</p>
                    {correct && (
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                        ✓ {correct.label}. {correct.text}
                      </p>
                    )}
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
          <Button
            size="sm"
            className="w-full gap-1.5 text-xs text-white"
            style={{ background: NAVY }}
            disabled={!selectedIds.length || !activeSet || adding}
            onClick={handleAddSelected}
          >
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add {selectedIds.length > 0 ? selectedIds.length : ''} to &quot;{activeSet?.name ?? 'Set'}&quot;
          </Button>
        </div>
      </div>

      {/* ── Panel 3: Current Set Viewer ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Set tabs */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 overflow-x-auto">
          {sets.map((set, idx) => (
            <button
              key={set.id}
              onClick={() => setActiveSetIdx(idx)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all',
                activeSetIdx !== idx && 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
              style={activeSetIdx === idx ? { background: NAVY, color: '#fff' } : undefined}
            >
              {set.name}
              {(set.questions?.length ?? 0) > 0 && (
                <span className="ml-1.5 opacity-80 font-semibold">{set.questions!.length}q</span>
              )}
            </button>
          ))}

          {showNewSet ? (
            <div className="flex items-center gap-1 ml-1">
              <input
                autoFocus
                value={newSetName}
                onChange={e => setNewSetName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateSet();
                  if (e.key === 'Escape') setShowNewSet(false);
                }}
                placeholder={String.fromCharCode(65 + sets.length)}
                className="w-16 text-xs border border-slate-200 rounded-md px-2 py-1"
              />
              <button onClick={handleCreateSet} disabled={creatingSet} className="text-emerald-600 hover:text-emerald-800">
                {creatingSet ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => setShowNewSet(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewSet(true)}
              className="px-2 py-1 rounded-lg text-xs font-bold text-slate-500 border border-dashed border-slate-300 hover:border-slate-400 hover:text-slate-700 transition-all whitespace-nowrap ml-1"
            >
              + Set
            </button>
          )}

          {activeSet && targetQCount > 0 && (
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-slate-400">
                <span className="font-bold text-slate-700">{activeSet.questions?.length ?? 0}</span>/{targetQCount}
              </span>
              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    background: NAVY,
                    width: `${Math.min(100, ((activeSet.questions?.length ?? 0) / targetQCount) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Set question list */}
        <div className="flex-1 overflow-y-auto">
          {sets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <p className="text-sm font-semibold text-slate-600 mb-1">No sets yet</p>
              <p className="text-xs text-slate-400">Click &quot;+ Set&quot; above to create your first set</p>
            </div>
          ) : !activeSet?.questions?.length ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-2">
              <p className="text-sm font-semibold text-slate-600">No questions in {activeSet?.name}</p>
              {sets.length > 1 ? (
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Select a folder on the left, then click <strong>Generate {sets.length} Sets</strong> to fill all sets at once with non-overlapping shuffled questions.
                </p>
              ) : (
                <p className="text-xs text-slate-400">Select questions from the bank and click &quot;Add to Set&quot;</p>
              )}
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase w-8">#</th>
                  <th className="px-2 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Question</th>
                  <th className="px-2 py-2 text-center text-[10px] font-bold text-slate-400 uppercase w-16">Diff</th>
                  <th className="px-2 py-2 text-center text-[10px] font-bold text-slate-400 uppercase w-12">Marks</th>
                  <th className="px-2 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {activeSet.questions.map((eq: ExamQuestion, i: number) => {
                  const diff    = (eq.question?.meta?.difficulty ?? (eq.question as any)?.difficulty) as keyof typeof DIFF_CFG | undefined;
                  const diffCfg = diff ? DIFF_CFG[diff] : null;
                  return (
                    <tr key={eq.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                      <td className="px-3 py-2.5 text-slate-400 font-bold text-[11px]">{i + 1}</td>
                      <td className="px-2 py-2.5">
                        <p className="text-slate-800 font-medium truncate max-w-[230px]">{eq.question?.prompt ?? '—'}</p>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        {diffCfg
                          ? <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', diffCfg.bg, diffCfg.tc)}>{diffCfg.label}</span>
                          : '—'}
                      </td>
                      <td className="px-2 py-2.5 text-center font-bold text-slate-700">{eq.marks}</td>
                      <td className="px-2 py-2.5">
                        <button
                          onClick={() => handleRemove(eq.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-rose-50 hover:bg-rose-100 text-rose-600 rounded p-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {activeSet && (activeSet.questions?.length ?? 0) > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>Marks: <strong className="text-slate-800">{totalSetMarks}</strong></span>
              <span>Questions: <strong className="text-slate-800">{activeSet.questions?.length ?? 0}</strong></span>
            </div>
            <button
              onClick={refreshExam}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
