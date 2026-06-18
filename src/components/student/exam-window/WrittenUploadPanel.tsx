'use client';

import { useCallback, useState } from 'react';
import { ArrowDown, ArrowUp, FileText, Loader2, Upload } from 'lucide-react';
import { getExamPdfDownloadUrl, uploadWrittenSubmission, reorderWrittenSubmission, finalizeWrittenSubmissionPdf } from '@/lib/api/exams';
import type { WrittenSubmissionPage } from '@/types/exam';
import type { AnswerPayload } from './exam-taking-types';
import { compressImageFile, writtenFinalPdf, writtenPages } from './exam-display-utils';

export function WrittenUploadPanel({
  examId,
  attemptId,
  questionId,
  answer,
  onChange,
}: {
  examId: string;
  attemptId: string;
  questionId: string;
  answer?: AnswerPayload;
  onChange: (answer: AnswerPayload) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pages = writtenPages(answer);
  const finalPdfUrl = writtenFinalPdf(answer);

  const applyPages = useCallback(
    (nextPages: WrittenSubmissionPage[], nextPdf?: string | null) => {
      onChange({
        ...(answer || {}),
        writtenSubmission: {
          ...((answer?.writtenSubmission as Record<string, unknown> | undefined) || {}),
          pages: nextPages,
          finalPdfUrl: nextPdf ?? null,
          updatedAt: new Date().toISOString(),
        },
      });
    },
    [answer, onChange],
  );

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || busy) return;
    setBusy(true);
    setError(null);
    try {
      const prepared = await Promise.all(Array.from(files).map(compressImageFile));
      const uploaded = await uploadWrittenSubmission(examId, { attemptId, questionId, files: prepared });
      if (!uploaded.success || !uploaded.data) {
        throw new Error(uploaded.message || 'Upload failed');
      }
      applyPages(uploaded.data.pages, uploaded.data.finalPdfUrl ?? null);
      const finalized = await finalizeWrittenSubmissionPdf(examId, { attemptId, questionId });
      if (finalized.success && finalized.data) {
        applyPages(finalized.data.pages, finalized.data.finalPdfUrl);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const movePage = async (index: number, dir: -1 | 1) => {
    const next = [...pages];
    const target = index + dir;
    if (target < 0 || target >= next.length || busy) return;
    [next[index], next[target]] = [next[target], next[index]];
    const orderedUrls = next.map((p) => p.url);
    applyPages(next.map((p, i) => ({ ...p, pageNumber: i + 1 })), null);
    setBusy(true);
    try {
      const r = await reorderWrittenSubmission(examId, { attemptId, questionId, orderedUrls });
      if (r.success && r.data) applyPages(r.data.pages, null);
      const finalized = await finalizeWrittenSubmissionPdf(examId, { attemptId, questionId });
      if (finalized.success && finalized.data) applyPages(finalized.data.pages, finalized.data.finalPdfUrl);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-800">
            Handwritten answer upload
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Snap pages from your phone or upload a PDF. Images are compressed before upload.
          </p>
        </div>
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black uppercase tracking-wider text-white hover:bg-blue-700">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Add pages
          <input
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.currentTarget.value = '';
            }}
          />
        </label>
      </div>

      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{error}</p> : null}

      {pages.length ? (
        <div className="space-y-2">
          {pages.map((page, index) => (
            <div key={`${page.url}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-700">
                {index + 1}
              </span>
              <FileText className="h-4 w-4 text-blue-500" />
              <a
                href={getExamPdfDownloadUrl(page.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700 hover:text-blue-700"
              >
                {page.fileName || page.url.split('/').pop()}
              </a>
              <button
                type="button"
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 disabled:opacity-40"
                disabled={busy || index === 0}
                onClick={() => void movePage(index, -1)}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 disabled:opacity-40"
                disabled={busy || index === pages.length - 1}
                onClick={() => void movePage(index, 1)}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {finalPdfUrl ? (
            <a
              href={getExamPdfDownloadUrl(finalPdfUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-emerald-700"
            >
              <FileText className="h-4 w-4" />
                Open combined PDF
            </a>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-blue-200 bg-white/70 px-4 py-6 text-center text-xs font-medium text-slate-500">
            No handwritten pages uploaded yet.
        </div>
      )}
    </div>
  );
}
