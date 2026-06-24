'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getExamPdfDownloadUrl } from '@/lib/api/exams';
import {
  deleteAllOmrTestFiles,
  deleteOmrTestFile,
  getOmrTestStatus,
  listOmrTestFiles,
  previewOmrSheet,
  regenerateOmrTestFile,
  type OmrTestFileItem,
  type OmrTestGeometry,
  type OmrTestPrefillIssue,
  type OmrTestPreviewBody,
  type OmrTestPreviewResponse,
} from '@/lib/api/omr-test';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  FileText,
  FolderOpen,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react';

const STORAGE_KEY = 'omr-test-playground-v1';

const PRESETS: Array<{ label: string; questionCount: number; optionCount: 3 | 4 | 5 }> = [
  { label: '25Q / 4 opt', questionCount: 25, optionCount: 4 },
  { label: '50Q / 4 opt', questionCount: 50, optionCount: 4 },
  { label: '120Q / 4 opt', questionCount: 120, optionCount: 4 },
  { label: '200Q / 5 opt', questionCount: 200, optionCount: 5 },
];

const DEFAULT_FORM: OmrTestPreviewBody = {
  examTitle: 'HSC Model Test',
  instituteName: 'Spondon',
  questionCount: 50,
  optionCount: 4,
  setLabel: 'A',
  examId: 'omr-test-preview',
  examCode: '123456',
  studentUserId: 'omr-test-student-1',
  student: {
    studentPhone: '01812345678',
    branchCode: '07',
  },
};

function loadSavedForm(): OmrTestPreviewBody {
  if (typeof window === 'undefined') return DEFAULT_FORM;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FORM;
    const parsed = JSON.parse(raw) as Partial<OmrTestPreviewBody>;
    return {
      ...DEFAULT_FORM,
      ...parsed,
      student: { ...DEFAULT_FORM.student, ...parsed.student },
    };
  } catch {
    return DEFAULT_FORM;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function dateGroupLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function groupFilesByDate(files: OmrTestFileItem[]): Array<{ label: string; files: OmrTestFileItem[] }> {
  const map = new Map<string, OmrTestFileItem[]>();
  for (const file of files) {
    const label = dateGroupLabel(file.createdAt);
    const bucket = map.get(label) ?? [];
    bucket.push(file);
    map.set(label, bucket);
  }
  return Array.from(map.entries()).map(([label, groupFiles]) => ({ label, files: groupFiles }));
}

function fileSummary(file: OmrTestFileItem): string {
  const title = file.config.examTitle?.trim();
  const q = file.config.questionCount ?? file.geometry?.questionCount;
  const o = file.config.optionCount ?? file.geometry?.optionCount;
  if (title && q && o) return `${title} · ${q}Q/${o}opt`;
  if (q && o) return `${q} questions · ${o} options`;
  return file.filename;
}

function applyPreviewResult(
  data: OmrTestPreviewResponse,
  setters: {
    setPdfUrl: (v: string) => void;
    setSelectedId: (v: string) => void;
    setGeometry: (v: OmrTestGeometry | null) => void;
    setWarnings: (v: string[]) => void;
    setPrefillIssues: (v: OmrTestPrefillIssue[]) => void;
  },
  openTab = true,
) {
  const url = getExamPdfDownloadUrl(data.pdfUrl);
  setters.setPdfUrl(url);
  setters.setSelectedId(data.id);
  setters.setGeometry(data.geometry);
  setters.setWarnings(data.warnings ?? []);
  setters.setPrefillIssues(data.prefillIssues ?? []);
  if (openTab) window.open(url, '_blank', 'noopener,noreferrer');
}

export function OmrTestPlayground() {
  const [form, setForm] = useState<OmrTestPreviewBody>(DEFAULT_FORM);
  const [busy, setBusy] = useState(false);
  const [listBusy, setListBusy] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<OmrTestFileItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [geometry, setGeometry] = useState<OmrTestGeometry | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [prefillIssues, setPrefillIssues] = useState<OmrTestPrefillIssue[]>([]);

  const previewSetters = useMemo(
    () => ({ setPdfUrl, setSelectedId, setGeometry, setWarnings, setPrefillIssues }),
    [],
  );

  const groupedFiles = useMemo(() => groupFilesByDate(files), [files]);

  const refreshList = useCallback(async () => {
    if (enabled === false) return;
    setListBusy(true);
    try {
      const r = await listOmrTestFiles();
      if (r.success && r.data?.files) setFiles(r.data.files);
    } finally {
      setListBusy(false);
    }
  }, [enabled]);

  useEffect(() => {
    setForm(loadSavedForm());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    let cancelled = false;
    void getOmrTestStatus()
      .then((r) => {
        if (!cancelled) setEnabled(r.success && Boolean(r.data?.enabled));
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (enabled) void refreshList();
  }, [enabled, refreshList]);

  const updateStudent = useCallback((key: keyof OmrTestPreviewBody['student'], value: string) => {
    setForm((prev) => ({
      ...prev,
      student: { ...prev.student, [key]: value },
    }));
  }, []);

  const selectFile = useCallback((file: OmrTestFileItem, openTab = false) => {
    setSelectedId(file.id);
    setPdfUrl(getExamPdfDownloadUrl(file.pdfUrl));
    setGeometry(file.geometry?.questionCount ? file.geometry : null);
    setWarnings(file.warnings ?? []);
    setPrefillIssues(file.prefillIssues ?? []);
    if (openTab) window.open(getExamPdfDownloadUrl(file.pdfUrl), '_blank', 'noopener,noreferrer');
  }, []);

  const loadFileIntoForm = useCallback((file: OmrTestFileItem) => {
    if (!file.config?.questionCount) return;
    setForm({
      ...DEFAULT_FORM,
      ...file.config,
      student: { ...DEFAULT_FORM.student, ...file.config.student },
    });
    selectFile(file);
  }, [selectFile]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await previewOmrSheet(form);
      if (!r.success || !r.data?.pdfUrl) {
        setError(r.message ?? 'Generation failed. Check inputs and backend logs.');
        return;
      }
      applyPreviewResult(r.data, previewSetters);
      await refreshList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  const regenerateFile = async (file: OmrTestFileItem) => {
    setActionId(file.id);
    setError(null);
    try {
      const r = await regenerateOmrTestFile(file.id);
      if (!r.success || !r.data?.pdfUrl) {
        setError(r.message ?? 'Regenerate failed.');
        return;
      }
      applyPreviewResult(r.data, previewSetters);
      await refreshList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Regenerate failed');
    } finally {
      setActionId(null);
    }
  };

  const removeFile = async (file: OmrTestFileItem) => {
    setActionId(file.id);
    setError(null);
    try {
      const r = await deleteOmrTestFile(file.id);
      if (!r.success) {
        setError(r.message ?? 'Delete failed.');
        return;
      }
      if (selectedId === file.id) {
        setSelectedId(null);
        setPdfUrl(null);
        setGeometry(null);
        setWarnings([]);
        setPrefillIssues([]);
      }
      await refreshList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setActionId(null);
    }
  };

  const removeAllFiles = async () => {
    if (!files.length) return;
    if (!window.confirm(`Delete all ${files.length} generated OMR file(s)?`)) return;
    setListBusy(true);
    setError(null);
    try {
      const r = await deleteAllOmrTestFiles();
      if (!r.success) {
        setError(r.message ?? 'Delete all failed.');
        return;
      }
      setSelectedId(null);
      setPdfUrl(null);
      setGeometry(null);
      setWarnings([]);
      setPrefillIssues([]);
      await refreshList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete all failed');
    } finally {
      setListBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Dev tool</p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-slate-900">OMR sheet playground</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Generate, list, regenerate, and delete test OMR PDFs. Print at 300dpi with no scaling to verify layout.
          </p>
        </div>

        {enabled === false ? (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            OMR test API is disabled. Set <code className="rounded bg-rose-100 px-1">OMR_TEST_ENABLED=true</code>{' '}
            in backend <code className="rounded bg-rose-100 px-1">.env</code> and restart the server.
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)_minmax(0,1.1fr)]">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                <FolderOpen className="h-4 w-4 text-slate-500" />
                OMR list
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={listBusy || enabled === false}
                onClick={() => void refreshList()}
                title="Refresh list"
              >
                <RefreshCw className={cn('h-4 w-4', listBusy && 'animate-spin')} />
              </Button>
            </div>

            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                disabled={!files.length || listBusy || enabled === false}
                onClick={() => void removeAllFiles()}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete all
              </Button>
            </div>

            <p className="mt-2 text-xs text-slate-500">{files.length} file(s)</p>

            <div className="mt-3 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
              {listBusy && !files.length ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : null}

              {!listBusy && !files.length ? (
                <p className="py-6 text-center text-xs text-slate-500">No OMR files yet.</p>
              ) : null}

              {groupedFiles.map((group) => (
                <div key={group.label}>
                  <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <ChevronRight className="h-3 w-3" />
                    {group.label}
                  </p>
                  <ul className="space-y-1 border-l border-slate-200 pl-2">
                    {group.files.map((file) => {
                      const isSelected = selectedId === file.id;
                      const isBusy = actionId === file.id;
                      return (
                        <li key={file.id}>
                          <button
                            type="button"
                            onClick={() => selectFile(file)}
                            className={cn(
                              'w-full rounded-lg border px-2 py-2 text-left transition-colors',
                              isSelected
                                ? 'border-emerald-300 bg-emerald-50'
                                : 'border-transparent hover:border-slate-200 hover:bg-slate-50',
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-slate-800">
                                  {fileSummary(file)}
                                </p>
                                <p className="mt-0.5 text-[10px] text-slate-500">
                                  {formatTime(file.createdAt)} · {formatBytes(file.sizeBytes)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-[10px]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  loadFileIntoForm(file);
                                }}
                              >
                                Load
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-[10px]"
                                disabled={isBusy || enabled === false}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void regenerateFile(file);
                                }}
                              >
                                {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Regen'}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-[10px] text-rose-700 hover:text-rose-800"
                                disabled={isBusy || enabled === false}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void removeFile(file);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800">Sheet config</h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      questionCount: preset.questionCount,
                      optionCount: preset.optionCount,
                    }))
                  }
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="examTitle">Exam title</Label>
                <Input
                  id="examTitle"
                  value={form.examTitle}
                  onChange={(e) => setForm((p) => ({ ...p, examTitle: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="instituteName">Institute name</Label>
                <Input
                  id="instituteName"
                  value={form.instituteName ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, instituteName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="questionCount">Question count (25–200)</Label>
                <Input
                  id="questionCount"
                  type="number"
                  min={25}
                  max={200}
                  value={form.questionCount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, questionCount: Number(e.target.value) || 25 }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Option count</Label>
                <Select
                  value={String(form.optionCount)}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, optionCount: Number(v) as 3 | 4 | 5 }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 (A–C)</SelectItem>
                    <SelectItem value="4">4 (A–D)</SelectItem>
                    <SelectItem value="5">5 (A–E)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="setLabel">SET label (A–J)</Label>
                <Input
                  id="setLabel"
                  maxLength={1}
                  value={form.setLabel ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, setLabel: e.target.value.toUpperCase() }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="branchCode">Branch code (digit bubbles)</Label>
                <Input
                  id="branchCode"
                  value={form.student.branchCode ?? ''}
                  onChange={(e) => updateStudent('branchCode', e.target.value)}
                />
              </div>
            </div>

            <h2 className="mt-6 text-sm font-bold text-slate-800">Student prefill</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="studentPhone">Student phone (digit bubbles)</Label>
                <Input
                  id="studentPhone"
                  value={form.student.studentPhone ?? ''}
                  onChange={(e) => updateStudent('studentPhone', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="examCode">Exam code (digit bubbles)</Label>
                <Input
                  id="examCode"
                  value={form.examCode ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, examCode: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="examId">Exam ID (QR payload)</Label>
                <Input
                  id="examId"
                  value={form.examId ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, examId: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="studentUserId">Student user ID (QR payload)</Label>
                <Input
                  id="studentUserId"
                  value={form.studentUserId ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, studentUserId: e.target.value }))}
                />
              </div>
            </div>

            {error ? (
              <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {error}
              </p>
            ) : null}

            <Button
              type="button"
              className="mt-6 w-full"
              disabled={busy || enabled === false}
              onClick={() => void generate()}
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                'Generate OMR sheet'
              )}
            </Button>
          </section>

          <section className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-800">PDF preview</h2>
                {pdfUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
                  >
                    Open tab
                  </Button>
                ) : null}
              </div>
              {pdfUrl ? (
                <iframe
                  title="OMR preview"
                  src={pdfUrl}
                  className="mt-3 h-[420px] w-full rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Select from the list or generate a new sheet to preview here.
                </p>
              )}
            </div>

            {geometry?.questionCount ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-slate-800">Geometry</h2>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                  {JSON.stringify(geometry, null, 2)}
                </pre>
              </div>
            ) : null}

            {warnings.length > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Warnings</p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  {warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {prefillIssues.length > 0 ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                <p className="font-semibold">Prefill issues</p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  {prefillIssues.map((issue) => (
                    <li key={`${issue.field}-${issue.reason}`}>
                      <strong>{issue.field}:</strong> {issue.reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
