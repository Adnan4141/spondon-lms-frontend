'use client';

import React, { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Upload, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useModalStore } from '@/store/modalStore';
import { previewQuestionImport, queueQuestionImportJob } from '@/lib/api/question-bank';
import { useBulkImportJobsStore } from '@/store/bulkImportJobsStore';
import type { QuestionFolder, QuestionImportError, QuestionImportPreview } from '@/types/question';

interface BulkQuestionImportModalProps {
  folder: QuestionFolder;
}

const TEMPLATE_HEADERS = [
  'type',
  'prompt',
  'difficulty',
  'year',
  'tags',
  'explanation',
  'answer',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'correct_option',
  'cq_k_prompt',
  'cq_k_marks',
  'cq_k_answer',
  'cq_kh_prompt',
  'cq_kh_marks',
  'cq_kh_answer',
  'cq_g_prompt',
  'cq_g_marks',
  'cq_g_answer',
  'cq_gh_prompt',
  'cq_gh_marks',
  'cq_gh_answer',
  'passage_key',
  'passage_title',
  'passage_content',
];

const TEMPLATE_ROWS = [
  [
    'MCQ',
    'What is Newtons first law?',
    'EASY',
    '2026',
    'physics, motion',
    'Objects keep their state unless acted on by a force.',
    '',
    'Inertia',
    'Acceleration',
    'Momentum',
    'Impulse',
    'A',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ],
  [
    'SHORT',
    'Define photosynthesis.',
    'EASY',
    '2026',
    'biology',
    '',
    'Photosynthesis is the process by which green plants prepare food using sunlight.',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ],
  [
    'CQ',
    'Read the stimulus and answer the following creative questions.',
    'MEDIUM',
    '2026',
    'bangla,cq',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'What is shown in the stimulus?',
    '1',
    'Model answer for ক.',
    'Explain the main idea.',
    '2',
    'Model answer for খ.',
    'Apply the concept.',
    '3',
    'Model answer for গ.',
    'Evaluate the situation.',
    '4',
    'Model answer for ঘ.',
    '',
    '',
    '',
  ],
  [
    'PASSAGE_MCQ',
    'Which sentence best summarizes the passage?',
    'MEDIUM',
    '2026',
    'english,passage',
    '',
    '',
    'Option A',
    'Option B',
    'Option C',
    'Option D',
    'B',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'passage-1',
    'Sample Passage',
    'This sample passage is intentionally longer than fifty characters so validation succeeds.',
  ],
  [
    'PASSAGE_MCQ',
    'What is the tone of the passage?',
    'MEDIUM',
    '2026',
    'english,passage',
    '',
    '',
    'Option A',
    'Option B',
    'Option C',
    'Option D',
    'C',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'passage-1',
    'Sample Passage',
    'This sample passage is intentionally longer than fifty characters so validation succeeds.',
  ],
];

function csvEscape(value: unknown) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadCsv(filename: string, rows: unknown[][]) {
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadTemplate() {
  downloadCsv('question-import-template.csv', [TEMPLATE_HEADERS, ...TEMPLATE_ROWS]);
}

function downloadErrors(errors: QuestionImportError[]) {
  downloadCsv('question-import-errors.csv', [
    ['row_number', 'field', 'message'],
    ...errors.map((error) => [error.rowNumber, error.field, error.message]),
  ]);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error';
}

export function BulkQuestionImportModal({ folder }: BulkQuestionImportModalProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  const addJob = useBulkImportJobsStore((state) => state.addJob);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<QuestionImportPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);

  const errorsByRow = useMemo(() => {
    const map = new Map<number, QuestionImportError[]>();
    for (const error of preview?.errors ?? []) {
      map.set(error.rowNumber, [...(map.get(error.rowNumber) ?? []), error]);
    }
    return map;
  }, [preview]);

  const handlePreview = async () => {
    if (!file) {
      toast({ title: 'File required', description: 'Choose a CSV or Excel file first.', variant: 'destructive' });
      return;
    }

    try {
      setPreviewing(true);
      const res = await previewQuestionImport(folder.id, file);
      if (res.success && res.data) {
        setPreview(res.data);
        toast({
          title: 'Preview ready',
          description: `${res.data.validCount} valid row(s), ${res.data.invalidCount} invalid row(s).`,
          variant: res.data.invalidCount ? 'default' : 'success',
        });
      }
    } catch (err: unknown) {
      toast({ title: 'Preview failed', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!file || !preview?.rows.length) return;

    try {
      setImporting(true);
      const res = await queueQuestionImportJob(folder.id, file);
      if (res.success && res.data) {
        addJob({
          jobId: res.data.jobId,
          jobType: 'questions',
          totalRows: res.data.totalRows,
          originalName: file.name,
          folderId: folder.id,
        });
        toast({
          title: 'Import queued',
          description: 'Questions are being imported in the background. Progress appears at the bottom right.',
          variant: 'success',
        });
        closeModal();
      }
    } catch (err: unknown) {
      toast({ title: 'Import failed', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex max-h-[78vh] flex-col bg-white text-slate-900">
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Selected Folder</p>
              <p className="mt-1 text-base font-black text-slate-900">{folder.name}</p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Instructions</p>
              <div className="mt-3 space-y-2 text-sm font-medium leading-6 text-slate-600">
                <p>Use one row per question. For passage MCQ, use the same passage_key on 2 to 8 rows.</p>
                <p>Difficulty must be EASY, MEDIUM, or HARD. Correct option must be A, B, C, or D.</p>
                <p>For CQ rows, use `prompt` as the stimulus (উদ্দীপক) and include all four parts: cq_k, cq_kh, cq_g, and cq_gh.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={downloadTemplate}
                className="mt-4 h-9 rounded-xl border-indigo-200 bg-white text-xs font-black uppercase tracking-wider text-indigo-700 hover:bg-indigo-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Template CSV
              </Button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Upload File
              </label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setPreview(null);
                }}
                className="mt-3 h-11 rounded-xl border-slate-200 text-sm font-bold"
              />
              <Button
                type="button"
                onClick={handlePreview}
                disabled={!file || previewing}
                className="mt-4 h-10 w-full rounded-xl bg-slate-900 text-sm font-black text-white hover:bg-indigo-600"
              >
                <Upload className="mr-2 h-4 w-4" />
                {previewing ? 'Previewing...' : 'Preview Import'}
              </Button>
            </div>
          </section>

          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-black text-slate-900">Import Preview</p>
                <p className="text-xs font-medium text-slate-400">
                  {preview
                    ? `${preview.validCount} valid · ${preview.invalidCount} invalid`
                    : 'Upload a file to validate rows before queueing the import.'}
                </p>
              </div>
              {preview && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">
                    {preview.validCount} valid
                  </Badge>
                  <Badge className="bg-rose-50 text-rose-700 border-rose-100">
                    {preview.invalidCount} invalid
                  </Badge>
                </div>
              )}
            </div>

            <div className="max-h-[46vh] overflow-auto">
              {!preview ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <FileSpreadsheet className="h-8 w-8" />
                  <p className="mt-3 text-sm font-bold">No preview yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Row</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Difficulty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.map((row) => (
                      <TableRow key={`${row.rowNumber}-${row.type}`}>
                        <TableCell className="font-bold">{row.rowNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-black">
                            {row.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-90 truncate font-medium text-slate-700">
                          {row.promptPreview || row.prompt}
                        </TableCell>
                        <TableCell className="font-bold text-slate-500">{row.difficulty}</TableCell>
                      </TableRow>
                    ))}
                    {preview.rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-12 text-center text-sm font-bold text-slate-400">
                          No valid rows found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {preview && preview.errors.length > 0 && (
              <div className="border-t border-slate-100 bg-rose-50/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm font-black text-rose-700">
                    <XCircle className="h-4 w-4" />
                    Invalid Rows
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => downloadErrors(preview.errors)}
                    className="h-8 rounded-lg border-rose-200 bg-white text-xs font-black text-rose-700"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Error CSV
                  </Button>
                </div>
                <div className="max-h-32 overflow-auto space-y-1">
                  {Array.from(errorsByRow.entries()).map(([rowNumber, rowErrors]) => (
                    <p key={rowNumber} className="text-xs font-medium text-rose-700">
                      Row {rowNumber}: {rowErrors.map((error) => `${error.field} - ${error.message}`).join('; ')}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
        <Button type="button" variant="outline" onClick={closeModal} className="rounded-xl font-bold">
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleImport}
          disabled={!preview?.rows.length || importing}
          className="rounded-xl bg-emerald-600 font-black text-white hover:bg-emerald-700"
        >
          {importing ? 'Starting...' : `Start Import For ${preview?.validCount ?? 0} Valid Row(s)`}
        </Button>
      </div>
    </div>
  );
}
