'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { getQuestions } from '@/lib/api/question-bank';
import type { Question } from '@/types/question';
import type { SelectionMode } from '@/types/exam';
import { cn } from '@/lib/utils';

type SingleFolderInit = { excludedQuestionIds: string[]; pinnedQuestionIds: string[] };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Single-folder mode (legacy). Required unless `folderIds` is set. */
  folderId?: string;
  folderName?: string;
  /**
   * Multi-folder mode. When supplied, the modal loads questions across all
   * folders, exposes a folder filter chip row, and emits per-folder save
   * payloads via {@link onSaveMulti}. Falls back to single-folder behaviour
   * when only `folderId` is set.
   */
  folderIds?: string[];
  folderLookup?: Record<string, { name: string; initial?: SingleFolderInit }>;
  questionType: 'MCQ' | 'CQ' | 'SHORT';
  excludedIds?: string[];
  pinnedIds?: string[];
  onSave?: (next: { excludedQuestionIds: string[]; pinnedQuestionIds: string[]; selectionMode: SelectionMode }) => void;
  onSaveMulti?: (
    rows: Array<{
      folderId: string;
      excludedQuestionIds: string[];
      pinnedQuestionIds: string[];
      selectionMode: SelectionMode;
    }>,
  ) => void;
};

function stripHtml(s: string, max = 160) {
  const t = s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

/** Expand partial passage pins to all MCQs under the same passage (stable id order). */
function mergePassagePinsInto(ids: string[], pool: Question[]): string[] {
  const out: string[] = [];
  const seenPassage = new Set<string>();
  const added = new Set<string>();
  const byId = new Map(pool.map((q) => [q.id, q]));
  for (const id of ids) {
    const q = byId.get(id);
    if (!q || q.type !== 'MCQ') continue;
    if (q.passageId) {
      if (seenPassage.has(q.passageId)) continue;
      seenPassage.add(q.passageId);
      pool
        .filter((x) => x.passageId === q.passageId && x.type === 'MCQ')
        .sort((a, b) => a.id.localeCompare(b.id))
        .forEach((x) => {
          if (!added.has(x.id)) {
            added.add(x.id);
            out.push(x.id);
          }
        });
    } else if (!added.has(q.id)) {
      added.add(q.id);
      out.push(q.id);
    }
  }
  return out;
}

export function QuestionPickerModal({
  open,
  onOpenChange,
  folderId,
  folderName,
  folderIds,
  folderLookup,
  questionType,
  excludedIds = [],
  pinnedIds = [],
  onSave,
  onSaveMulti,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState('');
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [pinned, setPinned] = useState<string[]>([]);
  const [tab, setTab] = useState<'exclude' | 'pin'>('exclude');
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const passageMergeDone = useRef(false);

  const isMulti = Array.isArray(folderIds) && folderIds.length > 0;
  const activeFolderIds = isMulti ? folderIds! : folderId ? [folderId] : [];
  const folderIdsKey = activeFolderIds.join('|');

  const load = useCallback(async () => {
    if (activeFolderIds.length === 0) return;
    setLoading(true);
    try {
      const res = isMulti
        ? await getQuestions(undefined, questionType, undefined, undefined, undefined, undefined, undefined, activeFolderIds)
        : await getQuestions(activeFolderIds[0], questionType);
      if (res.success && res.data) setQuestions(res.data);
      else setQuestions([]);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [folderIdsKey, isMulti, questionType]);

  useEffect(() => {
    if (!open) passageMergeDone.current = false;
  }, [open]);

  useEffect(() => {
    passageMergeDone.current = false;
  }, [folderIdsKey]);

  useEffect(() => {
    if (open && activeFolderIds.length > 0) {
      // In multi mode, hydrate from each folder's per-folder init list so we
      // don't lose existing pins/excludes when bulk-editing.
      if (isMulti && folderLookup) {
        const excludedMerged = new Set<string>();
        const pinnedMerged: string[] = [];
        for (const id of activeFolderIds) {
          const init = folderLookup[id]?.initial;
          init?.excludedQuestionIds?.forEach((qid) => excludedMerged.add(qid));
          init?.pinnedQuestionIds?.forEach((qid) => {
            if (!pinnedMerged.includes(qid)) pinnedMerged.push(qid);
          });
        }
        setExcluded(excludedMerged);
        setPinned(pinnedMerged);
      } else {
        setExcluded(new Set(excludedIds));
        setPinned([...pinnedIds]);
      }
      setSearch('');
      setTab('exclude');
      setFolderFilter(null);
      void load();
    }
  }, [open, folderIdsKey, excludedIds, pinnedIds, isMulti, folderLookup, load]);

  /** After questions load, expand any passage pins once so the list matches server generation rules. */
  useEffect(() => {
    if (!open || questionType !== 'MCQ' || questions.length === 0 || passageMergeDone.current) return;
    passageMergeDone.current = true;
    setPinned((prev) => mergePassagePinsInto([...prev], questions));
  }, [open, questionType, questions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const scoped = folderFilter
      ? questions.filter((x) => x.folderId === folderFilter)
      : questions;
    if (!q) return scoped;
    return scoped.filter((x) => stripHtml(x.prompt, 500).toLowerCase().includes(q));
  }, [questions, search, folderFilter]);

  const folderChips = useMemo(() => {
    if (!isMulti) return [] as Array<{ id: string; label: string; count: number }>;
    const counts = new Map<string, number>();
    for (const q of questions) counts.set(q.folderId, (counts.get(q.folderId) ?? 0) + 1);
    return activeFolderIds.map((id) => ({
      id,
      label: folderLookup?.[id]?.name ?? id.slice(0, 6),
      count: counts.get(id) ?? 0,
    }));
  }, [isMulti, questions, activeFolderIds, folderLookup]);

  const toggleExclude = (id: string) => {
    setExcluded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const togglePin = (id: string) => {
    const q = questions.find((x) => x.id === id);
    setPinned((prev) => {
      if (questionType === 'MCQ' && q?.passageId) {
        const sibIds = questions
          .filter((x) => x.passageId === q.passageId && x.type === 'MCQ')
          .map((x) => x.id);
        const isOn = sibIds.some((sid) => prev.includes(sid));
        if (isOn) {
          return prev.filter((x) => !sibIds.includes(x));
        }
        const merged = [...prev.filter((x) => !sibIds.includes(x))];
        const orderedSibs = questions
          .filter((x) => x.passageId === q.passageId && x.type === 'MCQ')
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((x) => x.id);
        for (const sid of orderedSibs) {
          if (!merged.includes(sid)) merged.push(sid);
        }
        return merged;
      }
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  const handleSave = () => {
    const mode: SelectionMode = pinned.length > 0 ? 'MANUAL_PICK' : 'RANDOM_COUNT';
    if (isMulti && onSaveMulti) {
      // Partition the user's selections back per-folder so each underlying
      // rule keeps its own pin/exclude lists.
      const byFolder = new Map<string, { excluded: string[]; pinned: string[] }>();
      for (const id of activeFolderIds) byFolder.set(id, { excluded: [], pinned: [] });
      const qById = new Map(questions.map((q) => [q.id, q]));
      for (const qid of excluded) {
        const folder = qById.get(qid)?.folderId;
        if (folder && byFolder.has(folder)) byFolder.get(folder)!.excluded.push(qid);
      }
      for (const qid of pinned) {
        const folder = qById.get(qid)?.folderId;
        if (folder && byFolder.has(folder)) byFolder.get(folder)!.pinned.push(qid);
      }
      onSaveMulti(
        activeFolderIds.map((id) => {
          const row = byFolder.get(id)!;
          return {
            folderId: id,
            excludedQuestionIds: row.excluded,
            pinnedQuestionIds: row.pinned,
            selectionMode: row.pinned.length > 0 ? ('MANUAL_PICK' as SelectionMode) : ('RANDOM_COUNT' as SelectionMode),
          };
        }),
      );
    } else {
      onSave?.({
        excludedQuestionIds: [...excluded],
        pinnedQuestionIds: pinned,
        selectionMode: mode,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border border-slate-200 bg-[#fafbfc] shadow-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-[#0D1B35]">
            Questions in folder
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            {folderName ? `${folderName} · ` : ''}
            Remove unwanted items from the random pool, or pin an exact ordered set for offline papers.
            {questionType === 'MCQ' ? (
              <>
                {' '}
                Passage MCQs are always taken as a full block in generated sets. Edit passages in{' '}
                <Link href="/admin/questions" className="font-medium text-[#0D1B35] underline underline-offset-2">
                  Question bank
                </Link>
                .
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'exclude' | 'pin')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100">
            <TabsTrigger value="exclude" className="data-[state=active]:bg-[#0D1B35] data-[state=active]:text-[#E2C98A]">
              Exclude from random
            </TabsTrigger>
            <TabsTrigger value="pin" className="data-[state=active]:bg-[#0D1B35] data-[state=active]:text-[#E2C98A]">
              Pin exact set
            </TabsTrigger>
          </TabsList>
          <div className="mt-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by prompt text…"
              className="mt-1 border-slate-200 focus-visible:ring-[#C8A96E]/40"
            />
          </div>
          {isMulti && folderChips.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFolderFilter(null)}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors',
                  folderFilter === null
                    ? 'border-[#0D1B35] bg-[#0D1B35] text-[#E2C98A]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400',
                )}
              >
                All · {questions.length}
              </button>
              {folderChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setFolderFilter(chip.id)}
                  className={cn(
                    'max-w-[200px] truncate rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors',
                    folderFilter === chip.id
                      ? 'border-[#0D1B35] bg-[#0D1B35] text-[#E2C98A]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400',
                  )}
                  title={chip.label}
                >
                  {chip.label} · {chip.count}
                </button>
              ))}
            </div>
          ) : null}
          <TabsContent value="exclude" className="mt-2 space-y-0">
            <div className="max-h-[min(52vh,360px)] overflow-y-auto rounded-md border border-slate-200 bg-white p-2">
              {loading ? (
                <p className="p-4 text-center text-sm text-slate-500">Loading…</p>
              ) : filtered.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-500">No questions found.</p>
              ) : (
                <ul className="space-y-2">
                  {filtered.map((q) => (
                    <li
                      key={q.id}
                      className={cn(
                        'flex gap-2 rounded-lg border p-2.5 text-left transition-colors',
                        excluded.has(q.id)
                          ? 'border-rose-200 bg-rose-50/80'
                          : 'border-slate-100 bg-slate-50/50 hover:border-[#C8A96E]/50',
                      )}
                    >
                      <Checkbox
                        checked={excluded.has(q.id)}
                        onCheckedChange={() => toggleExclude(q.id)}
                        className="mt-0.5 border-slate-400 data-[state=checked]:border-[#0D1B35] data-[state=checked]:bg-[#0D1B35]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="font-mono text-[10px] text-slate-600">
                            {q.type}
                          </Badge>
                          {q.difficulty && (
                            <Badge variant="secondary" className="text-[10px]">
                              {q.difficulty}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-800">
                          {stripHtml(q.prompt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Checked questions are never drawn for this folder rule in random mode.
            </p>
          </TabsContent>
          <TabsContent value="pin" className="mt-2 space-y-0">
            <div className="max-h-[min(52vh,360px)] overflow-y-auto rounded-md border border-slate-200 bg-white p-2">
              {loading ? (
                <p className="p-4 text-center text-sm text-slate-500">Loading…</p>
              ) : filtered.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-500">No questions found.</p>
              ) : (
                <ul className="space-y-2">
                  {filtered.map((q) => (
                    <li
                      key={q.id}
                      className={cn(
                        'flex gap-2 rounded-lg border p-2.5 text-left transition-colors',
                        pinned.includes(q.id)
                          ? 'border-emerald-300 bg-emerald-50/80'
                          : 'border-slate-100 bg-slate-50/50 hover:border-[#C8A96E]/50',
                      )}
                    >
                      <Checkbox
                        checked={pinned.includes(q.id)}
                        onCheckedChange={() => togglePin(q.id)}
                        className="mt-0.5 border-slate-400 data-[state=checked]:border-emerald-700 data-[state=checked]:bg-emerald-700"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-1">
                          {q.passageId ? (
                            <Badge variant="outline" className="text-[10px] text-amber-900">
                              {q.type === 'CQ' ? 'Grouped creative CQ' : 'Passage'}
                            </Badge>
                          ) : q.type === 'CQ' ? (
                            <Badge variant="outline" className="text-[10px] text-indigo-700">
                              Standalone CQ
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-800">{stripHtml(q.prompt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Order follows your selection order. Saving with pins switches this rule to manual selection for generators that support it.
              {questionType === 'MCQ'
                ? ' Pinning one passage question selects every MCQ under that passage.'
                : questionType === 'CQ'
                  ? ' Grouped creative CQ is generated as one stimulus with ক-ঘ together.'
                : null}
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[#0D1B35] text-[#E2C98A] hover:bg-[#1E2F55]"
            onClick={handleSave}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
