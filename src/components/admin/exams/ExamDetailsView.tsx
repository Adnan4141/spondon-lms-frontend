'use client';

import type { ComponentType, ReactNode } from 'react';
import { Exam } from '@/types/exam';
import { Badge } from '@/components/ui/badge';
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
  GraduationCap,
  ScanLine,
  ClipboardCheck,
  BarChart3,
} from 'lucide-react';
import {
  getExamById,
  regenerateExamPdf,
  regenerateSolveSheet,
  getExamPdfDownloadUrl,
} from '@/lib/api/exams';
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
import { useState, useEffect, useMemo, useCallback } from 'react';
import { ExamQuestionBuilder } from './ExamQuestionBuilder';
import { ExamLeaderboard } from './ExamLeaderboard';
import { WrittenEvaluationPanel } from './WrittenEvaluationPanel';
import { AnswerSheetUploadPanel } from './AnswerSheetUploadPanel';
import { ExamCoursesPanel } from './ExamCoursesPanel';
import { OmrSheetPreview } from './OmrSheetPreview';
import { OmrGradingPanel } from './OmrGradingPanel';
import { ExamResultBatchesPanel } from './ExamResultBatchesPanel';
import { MeritListsTab } from './MeritListsTab';

interface ExamDetailsViewProps {
  exam: Exam;
}

// ─── helpers ────────────────────────────────────────────────────────────────

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

// ─── SectionCard ────────────────────────────────────────────────────────────

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
        'rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden',
        className,
      )}
    >
      <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm',
            iconClass,
          )}
        >
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

// ─── StatCell ───────────────────────────────────────────────────────────────

function StatCell({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <div className="bg-white px-4 py-4">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        <Icon className={cn('h-3.5 w-3.5', tone)} />
        {label}
      </div>
      <p className="mt-1.5 text-sm font-semibold text-slate-900 capitalize">{value}</p>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ExamDetailsView({ exam: initialExam }: ExamDetailsViewProps) {
  type TabId =
    | 'info'
    | 'courses'
    | 'omr'
    | 'questions'
    | 'results'
    | 'merit'
    | 'leaderboard'
    | 'evaluate'
    | 'answer-sheets';

  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [exam, setExam] = useState(initialExam);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [solveSheetLoading, setSolveSheetLoading] = useState(false);
  const sheetLang: 'bn' | 'en' = exam.language === 'en' ? 'en' : 'bn';

  // ── derived ──────────────────────────────────────────────────────────────

  const leaderboardCourseOptions = useMemo(() => {
    const o: { id: string; name: string }[] = [];
    if (exam.courseId) {
      o.push({ id: exam.courseId, name: exam.course?.name ?? 'Primary course' });
    }
    for (const ec of exam.examCourses || []) {
      o.push({ id: ec.courseId, name: ec.course?.name ?? ec.courseId });
    }
    return o;
  }, [exam.courseId, exam.course?.name, exam.examCourses]);

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

  const setsCount = useMemo(() => {
    return (exam.sets?.length ?? exam._count?.sets ?? 0);
  }, [exam.sets, exam._count]);

  const attemptsCount = useMemo(() => {
    return (exam._count?.attempts ?? (exam.attempts?.length ?? 0));
  }, [exam._count, exam.attempts]);

  // ── OMR / offline state ──────────────────────────────────────────────────

  const [omrScans, setOmrScans] = useState<OmrScan[]>([]);
  const [omrPreviews, setOmrPreviews] = useState<
    { id: string; url: string; fileName: string }[]
  >([]);
  const [omrUploading, setOmrUploading] = useState(false);
  const [excelImporting, setExcelImporting] = useState(false);
  const [offlineResults, setOfflineResults] = useState<
    {
      id: string;
      rollNo: string;
      approvalStatus: string;
      obtainedMarks?: number;
      totalMarks?: number;
    }[]
  >([]);
  const [selectedOmrPreview, setSelectedOmrPreview] = useState<{
    url: string;
    fileName: string;
  } | null>(null);

  // ── data fetching ────────────────────────────────────────────────────────

  const fetchExamData = async () => {
    const res = await getExamById(exam.id);
    if (res.success && res.data) setExam(res.data);
  };

  const fetchOmrScans = useCallback(async () => {
    const res = await getOmrScans(exam.id);
    if (res.success && res.data) setOmrScans(res.data);
  }, [exam.id]);

  useEffect(() => {
    if (exam.mode === 'OFFLINE') {
      fetchOmrScans();
      getOfflineResults(exam.id).then(
        (r) => r.success && r.data && setOfflineResults(r.data),
      );
    }
  }, [exam.id, exam.mode, fetchOmrScans]);

  const showOmrTab = exam.examEngine === 'OMR_BOOK' || exam.mode === 'OFFLINE';

  useEffect(() => {
    if (activeTab === 'omr' && !showOmrTab) setActiveTab('info');
  }, [exam.examEngine, exam.mode, activeTab, showOmrTab]);

  // ── handlers ─────────────────────────────────────────────────────────────

  const handleApproveResult = async (id: string) => {
    try {
      const res = await approveOfflineResult(id);
      if (res.success)
        setOfflineResults((prev) =>
          prev.map((r) => (r.id === id ? { ...r, approvalStatus: 'APPROVED' } : r)),
        );
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleRejectResult = async (id: string) => {
    try {
      const res = await rejectOfflineResult(id);
      if (res.success)
        setOfflineResults((prev) =>
          prev.map((r) => (r.id === id ? { ...r, approvalStatus: 'REJECTED' } : r)),
        );
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleOmrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOmrUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileUrl = event.target?.result as string;
        const uniqueId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setOmrPreviews((prev) => [...prev, { id: uniqueId, url: fileUrl, fileName: file.name }]);
      };
      reader.readAsDataURL(file);
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
      if (res.success && res.data) alert(`Imported ${res.data.count} results successfully.`);
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

  // ── tabs config ──────────────────────────────────────────────────────────

  const tabs: { id: TabId; label: string; icon: typeof Info }[] = [
    { id: 'info', label: 'Overview', icon: Info },
    { id: 'courses', label: 'Courses', icon: GraduationCap },
    ...(showOmrTab ? [{ id: 'omr' as const, label: 'OMR', icon: ScanLine }] : []),
    { id: 'questions', label: 'Questions & sets', icon: FileSearch },
    { id: 'results', label: 'Results', icon: ClipboardCheck },
    { id: 'merit', label: 'Merit', icon: BarChart3 },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    ...(exam.mode === 'WRITTEN'
      ? [{ id: 'evaluate' as const, label: 'Evaluate', icon: PencilLine }]
      : []),
    ...(exam.mode === 'OFFLINE'
      ? [{ id: 'answer-sheets' as const, label: 'Answer Sheets', icon: FileSearch }]
      : []),
  ];

  const startLabel = formatDateTime(exam.startAt) ?? 'Open when published';
  const endLabel = formatDateTime(exam.endAt) ?? 'No end date';

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50">
      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        {/* scrollable row — no wrapping, works on all screen sizes */}
        <div className="flex overflow-x-auto gap-1 px-4 py-2.5 sm:px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const on = activeTab === tab.id;
            const count =
              tab.id === 'questions'
                ? setsCount
                : tab.id === 'results'
                ? attemptsCount
                : tab.id === 'omr'
                ? omrScans.length
                : undefined;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all whitespace-nowrap',
                  on
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {tab.label}
                {typeof count === 'number' ? (
                  <span
                    className={cn(
                      'ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums',
                      on ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700',
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-4xl space-y-5">

          {/* ══════════════════════════════════════════════════════════════
              INFO TAB
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'info' ? (
            <>
              {/* Hero card */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Header */}
                <div className="bg-linear-to-br from-indigo-50 via-white to-violet-50 px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left: title + meta */}
                    <div className="min-w-0 space-y-2.5">
                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-md border px-2 py-0.5 text-xs font-semibold',
                            getStatusBadgeClass(exam.status),
                          )}
                        >
                          {exam.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-md border px-2 py-0.5 text-xs font-semibold',
                            exam.mode === 'ONLINE'
                              ? 'border-sky-200 bg-sky-50 text-sky-800'
                              : 'border-amber-200 bg-amber-50 text-amber-900',
                          )}
                        >
                          {exam.mode === 'ONLINE' ? 'Online' : 'Offline hall'}
                        </Badge>
                        {exam.examEngine && exam.examEngine !== 'REGULAR' ? (
                          <Badge
                            variant="outline"
                            className="rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-900"
                          >
                            {exam.examEngine.replace(/_/g, ' ')}
                          </Badge>
                        ) : null}
                        <span
                          className="font-mono text-[11px] text-slate-400 truncate max-w-[140px]"
                          title={exam.id}
                        >
                          {exam.id.slice(0, 14)}…
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl leading-snug">
                        {exam.title}
                      </h2>

                      {/* Course / branch / batch */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span className="font-medium text-slate-800">
                            {exam.course?.name ?? '—'}
                          </span>
                        </span>
                        {!(exam.mode === 'ONLINE' && !exam.branchId) ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                            {exam.branch?.name ?? '—'}
                          </span>
                        ) : null}
                        {!(exam.mode === 'ONLINE' && !exam.branchId) && exam.batch?.name ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            {exam.batch.name}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Right: attempts counter */}
                    <div className="shrink-0 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-center shadow-sm sm:text-right">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Attempts
                      </p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 leading-none">
                        {exam._count?.attempts ?? 0}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        of {exam.allowedAttempts} allowed
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick stats strip */}
                <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-t border-slate-100 sm:grid-cols-4 sm:divide-y-0">
                  <StatCell
                    label="Type"
                    value={exam.type.replace(/_/g, ' ')}
                    icon={ShieldCheck}
                    tone="text-violet-500"
                  />
                  <StatCell
                    label="Duration"
                    value={exam.durationMinutes != null ? `${exam.durationMinutes} min` : 'Not set'}
                    icon={Clock}
                    tone="text-blue-500"
                  />
                  <StatCell
                    label="Sets"
                    value={String(exam.sets?.length ?? exam._count?.sets ?? 0)}
                    icon={Layers}
                    tone="text-emerald-500"
                  />
                  <StatCell
                    label="Language"
                    value={exam.language === 'en' ? 'English' : 'Bangla'}
                    icon={Activity}
                    tone="text-orange-500"
                  />
                </div>

                {/* Question mix footer */}
                {questionMix.total > 0 ? (
                  <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3">
                    <span className="text-xs text-slate-500">Question mix</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-100">
                      <Monitor className="h-3 w-3" />
                      {questionMix.mcq} MCQ
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800 ring-1 ring-violet-100">
                      <PencilLine className="h-3 w-3" />
                      {questionMix.cq} written
                    </span>
                    <span className="text-xs text-slate-400">{questionMix.total} total</span>
                  </div>
                ) : null}
              </div>

              {/* Schedule + Recent attempts */}
              <div className="grid gap-5 lg:grid-cols-2">
                {/* Schedule */}
                <SectionCard
                  title="Schedule"
                  description="When students can access this exam."
                  icon={Calendar}
                >
                  <div className="space-y-2.5">
                    {[
                      { label: 'Opens', value: startLabel, color: 'text-emerald-500' },
                      { label: 'Closes', value: endLabel, color: 'text-rose-500' },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
                          <ChevronRight
                            className={cn(
                              'h-4 w-4',
                              row.label === 'Opens' ? '-rotate-90' : 'rotate-90',
                              row.color,
                            )}
                          />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            {row.label}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-900">{row.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Recent attempts */}
                <SectionCard
                  title="Recent attempts"
                  description="Latest student activity for this exam."
                  icon={History}
                >
                  {exam.attempts && exam.attempts.length > 0 ? (
                    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                      {exam.attempts.slice(0, 6).map((attempt) => (
                        <li
                          key={attempt.id}
                          className="flex items-center justify-between gap-3 bg-white px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {attempt.student?.fullName ?? 'Student'}
                              </p>
                              <p className="text-[11px] text-slate-400">
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
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
                      <AlertCircle className="mb-2 h-8 w-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">No attempts yet</p>
                      <p className="mt-1 max-w-xs text-xs text-slate-400">
                        Attempts appear here after students start or submit the exam.
                      </p>
                    </div>
                  )}
                </SectionCard>
              </div>

              {/* PDFs & sets */}
              {(exam.sets && exam.sets.length > 0) || exam.mode === 'OFFLINE' ? (
                <SectionCard
                  title="PDFs & sets"
                  description="Generate hall papers and solution sheets."
                  icon={FileText}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {/* Exam PDF */}
                    <button
                      type="button"
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/40 disabled:opacity-60"
                      onClick={
                        exam.pdfUrl
                          ? () => window.open(getExamPdfDownloadUrl(exam.pdfUrl!), '_blank')
                          : handleRegeneratePdf
                      }
                      disabled={pdfLoading}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 shrink-0">
                        <Download className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">
                          {pdfLoading
                            ? 'Generating…'
                            : exam.pdfUrl
                              ? sheetLang === 'en'
                                ? 'Open exam PDF'
                                : 'পরীক্ষার PDF'
                              : sheetLang === 'en'
                                ? 'Generate exam PDF'
                                : 'PDF তৈরি করুন'}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          {exam.pdfUrl ? 'Download or print for students' : 'Creates from current sets'}
                        </span>
                      </span>
                    </button>

                    {/* Solution PDF */}
                    <button
                      type="button"
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left transition-colors hover:border-violet-200 hover:bg-violet-50/40 disabled:opacity-60"
                      onClick={
                        exam.solveSheetUrl
                          ? () =>
                              window.open(getExamPdfDownloadUrl(exam.solveSheetUrl!), '_blank')
                          : handleRegenerateSolveSheet
                      }
                      disabled={solveSheetLoading}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600 shrink-0">
                        <Download className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">
                          {solveSheetLoading
                            ? 'Generating…'
                            : exam.solveSheetUrl
                              ? sheetLang === 'en'
                                ? 'Open solution PDF'
                                : 'সমাধান PDF'
                              : sheetLang === 'en'
                                ? 'Generate solution PDF'
                                : 'সমাধান তৈরি'}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          For teachers / marking
                        </span>
                      </span>
                    </button>
                  </div>

                  {/* Sets list */}
                  {exam.sets && exam.sets.length > 0 ? (
                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Active sets
                      </p>
                      <ul className="space-y-2">
                        {exam.sets.map((set) => (
                          <li
                            key={set.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5"
                          >
                            <span className="text-sm font-medium text-slate-800">{set.name}</span>
                            <span className="text-xs tabular-nums text-slate-400">
                              {set.questions?.length ?? 0} questions
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </SectionCard>
              ) : null}

              {/* Offline results & OMR */}
              {exam.mode === 'OFFLINE' ? (
                <SectionCard
                  title="Offline results & OMR"
                  description="Upload scanned sheets or import marks from Excel. Approve rows before they affect records."
                  icon={Image}
                >
                  {/* Note about OMR tab */}
                  <p className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-3.5 py-2.5 text-xs text-blue-800 leading-relaxed">
                    For a printable bubble layout and manual grading, open the{' '}
                    <strong>OMR</strong> tab above.
                  </p>

                  {/* Upload actions */}
                  <div className="flex flex-wrap gap-2.5">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="sr-only"
                        onChange={handleOmrUpload}
                        disabled={omrUploading}
                      />
                      <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 aria-disabled:opacity-60">
                        <Upload className="h-4 w-4" />
                        {omrUploading ? 'Uploading…' : 'Upload OMR scan'}
                      </span>
                    </label>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        className="sr-only"
                        onChange={handleExcelImport}
                        disabled={excelImporting}
                      />
                      <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100 aria-disabled:opacity-60">
                        <FileSpreadsheet className="h-4 w-4" />
                        {excelImporting ? 'Importing…' : 'Import Excel'}
                      </span>
                    </label>
                  </div>

                  {/* Excel format hint */}
                  <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
                    Required columns:{' '}
                    {['rollNo', 'subject', 'totalMarks', 'obtainedMarks', 'meritPosition'].map(
                      (col, i, arr) => (
                        <span key={col}>
                          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-slate-600">
                            {col}
                          </code>
                          {i < arr.length - 1 ? ', ' : ''}
                        </span>
                      ),
                    )}
                  </p>

                  {/* Imported results table */}
                  {offlineResults.length > 0 ? (
                    <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                        <span className="text-xs font-semibold text-slate-700">
                          Imported rows
                        </span>
                        <span className="text-xs text-slate-400">
                          {offlineResults.filter((r) => r.approvalStatus === 'PENDING').length}{' '}
                          pending
                        </span>
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-white">
                            <tr className="border-b border-slate-100 text-left">
                              <th className="px-4 py-2 text-xs font-semibold text-slate-500">Roll</th>
                              <th className="px-4 py-2 text-xs font-semibold text-slate-500">Score</th>
                              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {offlineResults.slice(0, 15).map((r) => (
                              <tr key={r.id} className="bg-white hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-2.5 font-medium text-slate-900">
                                  {r.rollNo}
                                </td>
                                <td className="px-4 py-2.5 tabular-nums text-slate-500">
                                  {r.obtainedMarks ?? '—'} / {r.totalMarks ?? '—'}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  {r.approvalStatus === 'PENDING' ? (
                                    <div className="flex justify-end gap-1">
                                      <button
                                        type="button"
                                        className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50"
                                        onClick={() => handleApproveResult(r.id)}
                                        title="Approve"
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                      </button>
                                      <button
                                        type="button"
                                        className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50"
                                        onClick={() => handleRejectResult(r.id)}
                                        title="Reject"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ) : r.approvalStatus === 'APPROVED' ? (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Approved
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                                      <XCircle className="h-3 w-3" />
                                      Rejected
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {offlineResults.length > 15 ? (
                        <p className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-xs text-slate-400">
                          +{offlineResults.length - 15} more rows
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {/* OMR file previews */}
                  {(omrScans.length > 0 || omrPreviews.length > 0) ? (
                    <div className="mt-5 border-t border-slate-100 pt-5 space-y-5">
                      {/* Local previews */}
                      {omrPreviews.length > 0 ? (
                        <div>
                          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Local uploads ({omrPreviews.length})
                          </p>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {omrPreviews.map((preview) => (
                              <button
                                key={preview.id}
                                type="button"
                                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-all hover:border-indigo-300 hover:shadow-md"
                                onClick={() => setSelectedOmrPreview(preview)}
                              >
                                {preview.url.startsWith('data:image') ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={preview.url}
                                    alt={preview.fileName}
                                    className="h-40 w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-40 w-full flex-col items-center justify-center bg-slate-100">
                                    <FileText className="mb-1.5 h-10 w-10 text-slate-300" />
                                    <p className="text-xs text-slate-500">PDF</p>
                                  </div>
                                )}
                                {/* Hover overlay */}
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/35 group-hover:opacity-100">
                                  <span className="rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-900">
                                    View
                                  </span>
                                </div>
                                {/* Filename bar */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-2">
                                  <p className="truncate text-[10px] font-medium text-white">
                                    {preview.fileName}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Server-hosted scans */}
                      {omrScans.length > 0 ? (
                        <div>
                          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Server files ({omrScans.length})
                          </p>
                          <ul className="space-y-1.5">
                            {omrScans.map((scan) => (
                              <li
                                key={scan.id}
                                className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3.5 py-2.5"
                              >
                                <span className="truncate text-sm text-slate-700">
                                  {scan.fileName || 'Scan'}
                                </span>
                                <a
                                  href={getOmrScanDownloadUrl(scan.fileUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 text-xs font-semibold text-indigo-600 hover:underline"
                                >
                                  Download
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </SectionCard>
              ) : null}
            </>

          ) : activeTab === 'courses' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <ExamCoursesPanel
                examId={exam.id}
                primaryCourseId={exam.courseId}
                primaryCourseName={exam.course?.name}
                initialLinks={exam.examCourses}
                onChanged={fetchExamData}
              />
            </div>

          ) : activeTab === 'omr' ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-slate-900">Sheet preview</h3>
                <OmrSheetPreview examId={exam.id} />
              </div>
              <OmrGradingPanel examId={exam.id} />
            </div>

          ) : activeTab === 'results' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <ExamResultBatchesPanel examId={exam.id} branchId={exam.branchId} />
            </div>

          ) : activeTab === 'merit' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <MeritListsTab examId={exam.id} />
            </div>

          ) : activeTab === 'leaderboard' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              <ExamLeaderboard
                examId={exam.id}
                showLeaderboard={exam.showLeaderboard}
                courseOptions={leaderboardCourseOptions}
              />
            </div>

          ) : activeTab === 'evaluate' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <WrittenEvaluationPanel examId={exam.id} teacherUserId="admin" />
            </div>

          ) : activeTab === 'answer-sheets' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <AnswerSheetUploadPanel examId={exam.id} />
            </div>

          ) : (
            <ExamQuestionBuilder
              examId={exam.id}
              exam={exam}
              sets={exam.sets || []}
              onRefresh={fetchExamData}
            />
          )}
        </div>
      </div>

      {/* ── OMR Preview Modal ──────────────────────────────────────────── */}
      {selectedOmrPreview ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
          onClick={() => setSelectedOmrPreview(null)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            style={{ maxHeight: '90dvh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5">
              <p className="truncate text-sm font-semibold text-slate-900 max-w-[calc(100%-2.5rem)]">
                {selectedOmrPreview.fileName}
              </p>
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setSelectedOmrPreview(null)}
                aria-label="Close"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex max-h-[80dvh] items-center justify-center overflow-auto bg-slate-950 p-4">
              {selectedOmrPreview.url.startsWith('data:image') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedOmrPreview.url}
                  alt={selectedOmrPreview.fileName}
                  className="max-h-full w-auto object-contain"
                />
              ) : (
                <div className="flex flex-col items-center py-16 text-slate-400">
                  <FileText className="mb-3 h-14 w-14 opacity-40" />
                  <p className="text-sm">PDF preview not available</p>
                  <p className="mt-1 text-xs opacity-60">{selectedOmrPreview.fileName}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}