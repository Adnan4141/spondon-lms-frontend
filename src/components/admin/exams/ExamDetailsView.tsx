'use client';

import type { ComponentType, ReactNode } from 'react';
import { Exam } from '@/types/exam';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  Layers,
  ShieldCheck,
  Activity,
  User,
  History,
  Info,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  FileText,
  Download,
  Upload,
  Image,
  FileSpreadsheet,
  XCircle,
  Trophy,
  ChevronRight,
  Monitor,
  PencilLine,
} from 'lucide-react';
import { getExamById, regenerateExamPdf, regenerateSolveSheet, getExamPdfDownloadUrl } from '@/lib/api/exams';
import {
  getOmrScans,
  uploadOmrScan,
  getOmrScanDownloadUrl,
  importOfflineResults,
  getOfflineResults,
  approveOfflineResult,
  rejectOfflineResult,
  type OmrScan,
} from '@/lib/api/exam-results';
import { useState, useEffect, useMemo } from 'react';
import { ExamQuestionBuilder } from './ExamQuestionBuilder';
import { ExamLeaderboard } from './ExamLeaderboard';

interface ExamDetailsViewProps {
  exam: Exam;
}

function getStatusBadgeClass(status: string) {
  if (status === 'PUBLISHED') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'CLOSED') return 'bg-rose-100 text-rose-800 border-rose-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function formatDateTime(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SectionCard({
  title,
  description,
  icon: Icon,
  iconClass,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon: ComponentType<{ className?: string }>;
  iconClass?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden',
        className,
      )}
    >
      <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm',
              iconClass,
            )}
          >
            <Icon className="h-5 w-5 text-slate-700" />
          </div>
          <div className="min-w-0 pt-0.5">
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>
            {description ? <p className="mt-1 text-sm text-slate-500 leading-relaxed">{description}</p> : null}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function ExamDetailsView({ exam: initialExam }: ExamDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'questions' | 'leaderboard'>('info');
  const [exam, setExam] = useState(initialExam);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [solveSheetLoading, setSolveSheetLoading] = useState(false);
  const sheetLang: 'bn' | 'en' = exam.language === 'en' ? 'en' : 'bn';

  const questionMix = useMemo(() => {
    let mcq = 0;
    let cq = 0;
    for (const s of exam.sets || []) {
      for (const eq of s.questions || []) {
        if (eq.question?.type === 'CQ') cq += 1;
        else mcq += 1;
      }
    }
    return { mcq, cq, total: mcq + cq };
  }, [exam.sets]);

  const [omrScans, setOmrScans] = useState<OmrScan[]>([]);
  const [omrUploading, setOmrUploading] = useState(false);
  const [excelImporting, setExcelImporting] = useState(false);
  const [offlineResults, setOfflineResults] = useState<any[]>([]);

  const fetchExamData = async () => {
    const res = await getExamById(exam.id);
    if (res.success && res.data) setExam(res.data);
  };

  const fetchOmrScans = async () => {
    const res = await getOmrScans(exam.id);
    if (res.success && res.data) setOmrScans(res.data);
  };

  useEffect(() => {
    if (exam.mode === 'OFFLINE') {
      fetchOmrScans();
      getOfflineResults(exam.id).then((r) => r.success && r.data && setOfflineResults(r.data));
    }
  }, [exam.id, exam.mode]);

  const handleApproveResult = async (id: string) => {
    try {
      const res = await approveOfflineResult(id);
      if (res.success)
        setOfflineResults((prev) => prev.map((r) => (r.id === id ? { ...r, approvalStatus: 'APPROVED' } : r)));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleRejectResult = async (id: string) => {
    try {
      const res = await rejectOfflineResult(id);
      if (res.success)
        setOfflineResults((prev) => prev.map((r) => (r.id === id ? { ...r, approvalStatus: 'REJECTED' } : r)));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleOmrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOmrUploading(true);
    try {
      const res = await uploadOmrScan(exam.id, file);
      if (res.success && res.data) setOmrScans((prev) => [res.data!, ...prev]);
    } finally {
      setOmrUploading(false);
      e.target.value = '';
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelImporting(true);
    try {
      const res = await importOfflineResults(exam.id, file);
      if (res.success && res.data) {
        alert(`Imported ${res.data.count} results successfully.`);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setExcelImporting(false);
      e.target.value = '';
    }
  };

  const handleRegeneratePdf = async () => {
    setPdfLoading(true);
    try {
      const res = await regenerateExamPdf(exam.id);
      if (res.success && res.data?.pdfUrl) {
        setExam((prev) => ({ ...prev, pdfUrl: res.data!.pdfUrl }));
        window.open(getExamPdfDownloadUrl(res.data!.pdfUrl), '_blank');
      }
    } finally {
      setPdfLoading(false);
    }
  };

  const handleRegenerateSolveSheet = async () => {
    setSolveSheetLoading(true);
    try {
      const res = await regenerateSolveSheet(exam.id);
      if (res.success && res.data?.solveSheetUrl) {
        setExam((prev) => ({ ...prev, solveSheetUrl: res.data!.solveSheetUrl }));
        window.open(getExamPdfDownloadUrl(res.data!.solveSheetUrl), '_blank');
      }
    } finally {
      setSolveSheetLoading(false);
    }
  };

  const tabs = [
    { id: 'info' as const, label: 'Overview', icon: Info },
    { id: 'questions' as const, label: 'Questions & sets', icon: FileSearch },
    { id: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy },
  ];

  const startLabel = formatDateTime(exam.startAt) ?? 'No start — open when published';
  const endLabel = formatDateTime(exam.endAt) ?? 'No end date';

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50/50">
      {/* Sticky tab bar — readable, touch-friendly */}
      <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200/90 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const on = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all',
                  on
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900',
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {activeTab === 'info' ? (
            <>
              {/* Title strip */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-indigo-100 bg-linear-to-br from-indigo-50/90 via-white to-violet-50/40 px-5 py-6 sm:px-6 sm:py-7">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn('rounded-md border px-2.5 py-0.5 text-xs font-semibold', getStatusBadgeClass(exam.status))}>
                          {exam.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-md border px-2.5 py-0.5 text-xs font-semibold',
                            exam.mode === 'ONLINE'
                              ? 'border-sky-200 bg-sky-50 text-sky-800'
                              : 'border-amber-200 bg-amber-50 text-amber-900',
                          )}
                        >
                          {exam.mode === 'ONLINE' ? 'Online' : 'Offline hall'}
                        </Badge>
                        <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]" title={exam.id}>
                          {exam.id.slice(0, 14)}…
                        </span>
                      </div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl leading-snug">
                        {exam.title}
                      </h2>
                      <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
                        <span className="inline-flex items-center gap-2">
                          <BookOpen className="h-4 w-4 shrink-0 text-indigo-500" />
                          <span className="font-medium text-slate-800">{exam.course?.name ?? '—'}</span>
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0 text-rose-500" />
                          {exam.branch?.name ?? '—'}
                        </span>
                        {exam.batch?.name ? (
                          <span className="inline-flex items-center gap-2">
                            <Layers className="h-4 w-4 shrink-0 text-amber-600" />
                            {exam.batch.name}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                      <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-right shadow-sm">
                        <p className="text-xs font-medium text-slate-500">Attempts</p>
                        <p className="text-lg font-bold tabular-nums text-slate-900">
                          {exam._count?.attempts ?? 0}
                          <span className="text-sm font-normal text-slate-400"> / allowed {exam.allowedAttempts}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick stats — readable labels */}
                <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
                  {[
                    {
                      label: 'Type',
                      value: exam.type.replace(/_/g, ' '),
                      icon: ShieldCheck,
                      tone: 'text-violet-600',
                    },
                    {
                      label: 'Duration',
                      value: exam.durationMinutes != null ? `${exam.durationMinutes} min` : 'Not set',
                      icon: Clock,
                      tone: 'text-blue-600',
                    },
                    {
                      label: 'Question sets',
                      value: String(exam.sets?.length ?? exam._count?.sets ?? 0),
                      icon: Layers,
                      tone: 'text-emerald-600',
                    },
                    {
                      label: 'Language',
                      value: exam.language === 'en' ? 'English' : 'Bangla',
                      icon: Activity,
                      tone: 'text-orange-600',
                    },
                  ].map((row) => (
                    <div key={row.label} className="bg-white px-4 py-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <row.icon className={cn('h-3.5 w-3.5', row.tone)} />
                        {row.label}
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-slate-900 capitalize">{row.value}</p>
                    </div>
                  ))}
                </div>

                {questionMix.total > 0 ? (
                  <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-4 sm:px-6">
                    <span className="text-xs font-medium text-slate-500">Question mix</span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-900 ring-1 ring-sky-100">
                      <Monitor className="h-3.5 w-3.5" />
                      {questionMix.mcq} MCQ
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-900 ring-1 ring-violet-100">
                      <PencilLine className="h-3.5 w-3.5" />
                      {questionMix.cq} written
                    </span>
                    <span className="text-xs text-slate-400">{questionMix.total} total</span>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Schedule"
                  description="When students can access this exam in the portal."
                  icon={Calendar}
                >
                  <div className="space-y-3">
                    <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
                        <ChevronRight className="h-4 w-4 -rotate-90 text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Opens</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900">{startLabel}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
                        <ChevronRight className="h-4 w-4 rotate-90 text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Closes</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900">{endLabel}</p>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Recent attempts"
                  description="Latest student activity for this exam."
                  icon={History}
                  iconClass="[&_svg]:text-rose-600"
                >
                  {exam.attempts && exam.attempts.length > 0 ? (
                    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                      {exam.attempts.slice(0, 6).map((attempt) => (
                        <li
                          key={attempt.id}
                          className="flex items-center justify-between gap-3 bg-white px-4 py-3.5 hover:bg-slate-50/80"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                              <User className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {attempt.student?.fullName ?? 'Student'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(attempt.startedAt).toLocaleString(undefined, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'shrink-0 text-[11px] font-semibold',
                              attempt.status === 'SUBMITTED'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-amber-200 bg-amber-50 text-amber-800',
                            )}
                          >
                            {attempt.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
                      <AlertCircle className="mb-2 h-9 w-9 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">No attempts yet</p>
                      <p className="mt-1 max-w-xs text-xs text-slate-500">
                        Attempts appear here after students start or submit the online exam.
                      </p>
                    </div>
                  )}
                </SectionCard>
              </div>

              {(exam.sets && exam.sets.length > 0) || exam.mode === 'OFFLINE' ? (
                <SectionCard
                  title="PDFs & sets"
                  description="Generate hall papers and solution sheets. Sets are also managed under the Questions tab."
                  icon={FileText}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto justify-start gap-3 rounded-xl border-slate-200 py-3 px-4 text-left font-normal hover:bg-indigo-50/50 hover:border-indigo-200"
                      onClick={exam.pdfUrl ? () => window.open(getExamPdfDownloadUrl(exam.pdfUrl!), '_blank') : handleRegeneratePdf}
                      disabled={pdfLoading}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                        <Download className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">
                          {pdfLoading
                            ? 'Working…'
                            : exam.pdfUrl
                              ? sheetLang === 'en'
                                ? 'Open exam PDF'
                                : 'পরীক্ষার PDF'
                              : sheetLang === 'en'
                                ? 'Generate exam PDF'
                                : 'PDF তৈরি করুন'}
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5">
                          {exam.pdfUrl ? 'Download or print for students' : 'Creates from current sets'}
                        </span>
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto justify-start gap-3 rounded-xl border-slate-200 py-3 px-4 text-left font-normal hover:bg-violet-50/50 hover:border-violet-200"
                      onClick={
                        exam.solveSheetUrl
                          ? () => window.open(getExamPdfDownloadUrl(exam.solveSheetUrl!), '_blank')
                          : handleRegenerateSolveSheet
                      }
                      disabled={solveSheetLoading}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                        <Download className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">
                          {solveSheetLoading
                            ? 'Working…'
                            : exam.solveSheetUrl
                              ? sheetLang === 'en'
                                ? 'Open solution PDF'
                                : 'সমাধান PDF'
                              : sheetLang === 'en'
                                ? 'Generate solution PDF'
                                : 'সমাধান তৈরি'}
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5">For teachers / marking</span>
                      </span>
                    </Button>
                  </div>

                  {exam.sets && exam.sets.length > 0 ? (
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <p className="text-xs font-medium text-slate-500 mb-3">Active sets</p>
                      <ul className="space-y-2">
                        {exam.sets.map((set) => (
                          <li
                            key={set.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
                          >
                            <span className="text-sm font-medium text-slate-800">{set.name}</span>
                            <span className="text-xs font-medium tabular-nums text-slate-500">
                              {set.questions?.length ?? 0} questions
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </SectionCard>
              ) : null}

              {exam.mode === 'OFFLINE' ? (
                <SectionCard
                  title="Offline results & OMR"
                  description="Upload scanned sheets or import marks from Excel. Approve rows before they affect records."
                  icon={Image}
                  iconClass="[&_svg]:text-amber-600"
                >
                  <div className="flex flex-wrap gap-3">
                    <label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={handleOmrUpload}
                        disabled={omrUploading}
                      />
                      <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                        <Upload className="h-4 w-4" />
                        {omrUploading ? 'Uploading…' : 'Upload OMR / scan'}
                      </span>
                    </label>
                    <label>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={handleExcelImport}
                        disabled={excelImporting}
                      />
                      <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100">
                        <FileSpreadsheet className="h-4 w-4" />
                        {excelImporting ? 'Importing…' : 'Import Excel'}
                      </span>
                    </label>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    Excel columns: <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">rollNo</code>,{' '}
                    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">subject</code>,{' '}
                    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">totalMarks</code>,{' '}
                    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">obtainedMarks</code>,{' '}
                    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">meritPosition</code>
                  </p>

                  {offlineResults.length > 0 ? (
                    <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                        <span className="text-xs font-semibold text-slate-700">Imported rows</span>
                        <span className="text-xs text-slate-500">
                          {offlineResults.filter((r) => r.approvalStatus === 'PENDING').length} pending
                        </span>
                      </div>
                      <div className="max-h-52 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-white text-left text-xs font-medium text-slate-500 shadow-sm">
                            <tr className="border-b border-slate-100">
                              <th className="px-4 py-2">Roll</th>
                              <th className="px-4 py-2">Score</th>
                              <th className="px-4 py-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {offlineResults.slice(0, 15).map((r) => (
                              <tr key={r.id} className="bg-white hover:bg-slate-50/80">
                                <td className="px-4 py-2.5 font-medium text-slate-900">{r.rollNo}</td>
                                <td className="px-4 py-2.5 text-slate-600 tabular-nums">
                                  {r.obtainedMarks ?? '—'} / {r.totalMarks ?? '—'}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  {r.approvalStatus === 'PENDING' ? (
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                                        onClick={() => handleApproveResult(r.id)}
                                        title="Approve"
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                                        onClick={() => handleRejectResult(r.id)}
                                        title="Reject"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : r.approvalStatus === 'APPROVED' ? (
                                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Approved</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-rose-100 text-rose-800">
                                      Rejected
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {offlineResults.length > 15 ? (
                        <p className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-xs text-slate-500">
                          +{offlineResults.length - 15} more rows
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {omrScans.length > 0 ? (
                    <ul className="mt-6 space-y-2 border-t border-slate-100 pt-5">
                      <p className="text-xs font-medium text-slate-500 mb-2">Uploaded files</p>
                      {omrScans.map((scan) => (
                        <li
                          key={scan.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2.5"
                        >
                          <span className="truncate text-sm text-slate-700">{scan.fileName || 'Scan'}</span>
                          <a
                            href={getOmrScanDownloadUrl(scan.fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-sm font-medium text-indigo-600 hover:underline"
                          >
                            Open
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </SectionCard>
              ) : null}
            </>
          ) : activeTab === 'leaderboard' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              <ExamLeaderboard examId={exam.id} showLeaderboard={exam.showLeaderboard} />
            </div>
          ) : (
            <ExamQuestionBuilder examId={exam.id} exam={exam} sets={exam.sets || []} onRefresh={fetchExamData} />
          )}
        </div>
      </div>
    </div>
  );
}
