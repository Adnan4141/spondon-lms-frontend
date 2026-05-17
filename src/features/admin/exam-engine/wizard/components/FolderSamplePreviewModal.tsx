'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sampleQuestionsFromFolders, type FolderSampleRow } from '@/lib/api/question-bank';

interface Props {
  open: boolean;
  onClose: () => void;
  label: string;
  questionType: 'MCQ' | 'CQ' | 'SHORT';
  folderIds: string[];
  leaves: { id: string; path: string }[];
}

/**
 * Pulls a random per-folder sample from `/question-bank/folders/sample` so
 * admins can eyeball real questions before locking the exam. "Regenerate" is
 * deliberately cheap — each click re-randomises via Postgres `ORDER BY
 * random()` server-side.
 */
export function FolderSamplePreviewModal({ open, onClose, label, questionType, folderIds, leaves }: Props) {
  const [perFolder, setPerFolder] = useState(5);
  const [rows, setRows] = useState<FolderSampleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const folderPathById = useMemo(() => new Map(leaves.map((l) => [l.id, l.path])), [leaves]);

  const fetchSample = useCallback(async () => {
    if (folderIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const response = await sampleQuestionsFromFolders({ folderIds, questionType, perFolder });
      if (response.success && response.data) {
        setRows(response.data);
      } else {
        setError(response.message ?? 'Sample failed');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Sample failed');
    } finally {
      setLoading(false);
    }
  }, [folderIds, questionType, perFolder]);

  useEffect(() => {
    if (open) void fetchSample();
  }, [open, fetchSample, nonce]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-[#0D1B35]">
            Sample preview · {label}
          </DialogTitle>
          <DialogDescription>
            Random {questionType} pull across {folderIds.length} selected folder{folderIds.length === 1 ? '' : 's'}.
            Use this to spot empty folders, off-topic questions, or duplicates before generating sets.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Per folder
            </Label>
            <Input
              type="number"
              min={1}
              max={50}
              className="h-8 w-20 text-xs"
              value={perFolder}
              onChange={(e) => setPerFolder(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => setNonce((n) => n + 1)}
            className="h-8 gap-1.5"
          >
            <RefreshCw className={loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
            Regenerate
          </Button>
          {error ? <span className="text-xs font-semibold text-rose-600">{error}</span> : null}
        </div>

        <div className="-mx-2 max-h-[55vh] overflow-y-auto px-2">
          {loading && rows.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-xs text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading sample…
            </div>
          ) : rows.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-400">No questions returned for this selection.</p>
          ) : (
            <ul className="space-y-4 py-3">
              {rows.map((row) => {
                const path = folderPathById.get(row.folderId) ?? row.folderId;
                return (
                  <li key={row.folderId} className="rounded-md border border-slate-100 bg-white">
                    <header className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[#0D1B35]">{path}</p>
                      </div>
                      <Badge
                        variant={row.sample.length === 0 ? 'destructive' : 'outline'}
                        className="text-[10px]"
                      >
                        {row.sample.length} of {perFolder}
                      </Badge>
                    </header>
                    {row.sample.length === 0 ? (
                      <p className="px-3 py-3 text-[11px] text-rose-600">
                        Folder has no {questionType} questions — random pulls will fail.
                      </p>
                    ) : (
                      <ol className="divide-y divide-slate-100">
                        {row.sample.map((q, idx) => (
                          <li key={q.id} className="flex items-start gap-2 px-3 py-2 text-xs text-slate-700">
                            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-3 whitespace-pre-wrap text-[12px] leading-snug">
                                <span className="mr-1 font-bold text-slate-400">{idx + 1}.</span>
                                {q.prompt || <span className="italic text-slate-400">No prompt text.</span>}
                              </p>
                              <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">
                                {q.type}
                                {q.mcqType ? ` · ${q.mcqType.toLowerCase()}` : ''}
                                {q.difficulty ? ` · ${q.difficulty.toLowerCase()}` : ''}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
