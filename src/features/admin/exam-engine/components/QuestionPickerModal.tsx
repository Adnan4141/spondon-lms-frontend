'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  folderId: string;
  folderName?: string;
  questionType: 'MCQ' | 'CQ' | 'SHORT';
  excludedIds: string[];
  pinnedIds: string[];
  onSave: (next: { excludedQuestionIds: string[]; pinnedQuestionIds: string[]; selectionMode: 'RANDOM' | 'MANUAL' }) => void;
};

function stripHtml(s: string, max = 160) {
  const t = s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export function QuestionPickerModal({
  open,
  onOpenChange,
  folderId,
  folderName,
  questionType,
  excludedIds,
  pinnedIds,
  onSave,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState('');
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [pinned, setPinned] = useState<string[]>([]);
  const [tab, setTab] = useState<'exclude' | 'pin'>('exclude');

  const load = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    try {
      const res = await getQuestions(folderId, questionType);
      if (res.success && res.data) setQuestions(res.data);
      else setQuestions([]);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [folderId, questionType]);

  useEffect(() => {
    if (open && folderId) {
      setExcluded(new Set(excludedIds));
      setPinned([...pinnedIds]);
      setSearch('');
      setTab('exclude');
      void load();
    }
  }, [open, folderId, excludedIds, pinnedIds, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter((x) => stripHtml(x.prompt, 500).toLowerCase().includes(q));
  }, [questions, search]);

  const toggleExclude = (id: string) => {
    setExcluded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const togglePin = (id: string) => {
    setPinned((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = () => {
    const mode = pinned.length > 0 ? 'MANUAL' : 'RANDOM';
    onSave({
      excludedQuestionIds: [...excluded],
      pinnedQuestionIds: pinned,
      selectionMode: mode,
    });
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
                        <p className="line-clamp-3 text-xs leading-relaxed text-slate-800">{stripHtml(q.prompt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Order follows your selection order. Saving with pins switches this rule to manual selection for generators that support it.
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
