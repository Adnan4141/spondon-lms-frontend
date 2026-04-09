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
  GraduationCap,
  ScanLine,
  ClipboardCheck,
  BarChart3,
  Eye,
  RefreshCw,
  ExternalLink,
  ListChecks,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ExamQuestionBuilder } from './ExamQuestionBuilder';
import { ExamLeaderboard } from './ExamLeaderboard';
import { WrittenEvaluationPanel } from './WrittenEvaluationPanel';
import { ExamCoursesPanel } from './ExamCoursesPanel';
import { OmrSheetPreview } from './OmrSheetPreview';
import { OmrGradingPanel } from './OmrGradingPanel';
import { ExamResultBatchesPanel } from './ExamResultBatchesPanel';
import { MeritListsTab } from './MeritListsTab';
import { ExamFolderRules } from './ExamFolderRules';

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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<
    'info' | 'courses' | 'omr' | 'questions' | 'folder-rules' | 'results' | 'merit' | 'leaderboard' | 'evaluate'
  >('info');
  const [exam, setExam] = useState(initialExam);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [solveSheetLoading, setSolveSheetLoading] = useState(false);
  const sheetLang: 'bn' | 'en' = exam.language === 'en' ? 'en' : 'bn';

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

  const [omrScans, setOmrScans] = useState<OmrScan[]>([]);
  const [omrPreviews, setOmrPreviews] = useState<{ id: string; url: string; fileName: string }[]>([]);
  const [omrUploading, setOmrUploading] = useState(false);
  const [excelImporting, setExcelImporting] = useState(false);
  const [offlineResults, setOfflineResults] = useState<Array<{ id: string; rollNo: string; approvalStatus: string; obtainedMarks?: number; totalMarks?: number }>>([]);
  const [selectedOmrPreview, setSelectedOmrPreview] = useState<{ url: string; fileName: string } | null>(null);
  const omrFileInputRef = useRef<HTMLInputElement>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

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
      getOfflineResults(exam.id).then((r) => r.success && r.data && setOfflineResults(r.data));
    }
  }, [exam.id, exam.mode, fetchOmrScans]);

  const showOmrTab = exam.examEngine === 'OMR_BOOK' || exam.mode === 'OFFLINE';

  useEffect(() => {
    if (activeTab === 'omr' && !showOmrTab) {
      setActiveTab('info');
    }
  }, [exam.examEngine, exam.mode, activeTab, showOmrTab]);

  const handleApproveResult = async (id: string) => {
    try {
      const res = await approveOfflineResult(id);
      if (res.success) {
        setOfflineResults((prev) => prev.map((r) => (r.id === id ? { ...r, approvalStatus: 'APPROVED' } : r)));
        toast({ title: 'Approved', description: 'Result has been approved.', variant: 'success' });
      } else {
        toast({ title: 'Error', description: (res as { message?: string }).message ?? 'Approval failed', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const handleRejectResult = async (id: string) => {
    try {
      const res = await rejectOfflineResult(id);
      if (res.success) {
        setOfflineResults((prev) => prev.map((r) => (r.id === id ? { ...r, approvalStatus: 'REJECTED' } : r)));
        toast({ title: 'Rejected', description: 'Result has been rejected.', variant: 'default' });
      } else {
        toast({ title: 'Error', description: (res as { message?: string }).message ?? 'Rejection failed', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
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
        
        // Add to local previews
        setOmrPreviews((prev) => [
          ...prev,
          { id: uniqueId, url: fileUrl, fileName: file.name },
        ]);
      };
      reader.readAsDataURL(file);

      // Also upload to server
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
        toast({ title: 'Import successful', description: `${res.data.count} result${res.data.count !== 1 ? 's' : ''} imported.`, variant: 'success' });
        getOfflineResults(exam.id).then((r) => r.success && r.data && setOfflineResults(r.data));
      } else {
        toast({ title: 'Import failed', description: (res as { message?: string }).message ?? 'Unknown error', variant: 'destructive' });
      }
    } catch (err: unknown) {
      toast({ title: 'Import failed', description: err instanceof Error ? err.message : 'Import failed', variant: 'destructive' });
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

  const tabs: {
    id: 'info' | 'courses' | 'omr' | 'questions' | 'folder-rules' | 'results' | 'merit' | 'leaderboard' | 'evaluate';
    label: string;
    icon: typeof Info;
  }[] = [
    { id: 'info', label: 'Overview', icon: Info },
    { id: 'courses', label: 'Courses', icon: GraduationCap },
    ...(showOmrTab ? [{ id: 'omr' as const, label: 'OMR', icon: ScanLine }] : []),
    { id: 'questions', label: 'Questions & sets', icon: FileSearch },
    { id: 'folder-rules', label: 'Folder Rules', icon: BookOpen },
    { id: 'results', label: 'Results', icon: ClipboardCheck },
    { id: 'merit', label: 'Merit', icon: BarChart3 },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    ...(exam.mode === 'WRITTEN' ? [{ id: 'evaluate' as const, label: 'Evaluate', icon: PencilLine }] : []),
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
                        {exam.examEngine && exam.examEngine !== 'REGULAR' ? (
                          <Badge
                            variant="outline"
                            className="rounded-md border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-900"
                          >
                            {exam.examEngine.replace(/_/g, ' ')}
                          </Badge>
                        ) : null}
                        <span className="text-xs text-slate-500 font-mono truncate max-w-50" title={exam.id}>
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
                  {/* Document cards */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Exam paper card */}
                    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                          <FileText className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {sheetLang === 'en' ? 'Exam paper' : 'পরীক্ষার পেপার'}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">Hall copy for students</p>
                          <Badge
                            className={cn(
                              'mt-1.5 text-[10px] font-semibold',
                              exam.pdfUrl
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            )}
                            variant="outline"
                          >
                            {exam.pdfUrl ? 'Generated' : 'Not generated'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {exam.pdfUrl ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => window.open(getExamPdfDownloadUrl(exam.pdfUrl!), '_blank')}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open PDF
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              disabled={pdfLoading}
                              onClick={handleRegeneratePdf}
                            >
                              {pdfLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                              Regenerate
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            className="gap-1.5"
                            disabled={pdfLoading}
                            onClick={handleRegeneratePdf}
                          >
                            {pdfLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                            {pdfLoading ? 'Generating…' : 'Generate PDF'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Solution sheet card */}
                    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                          <CheckCircle2 className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {sheetLang === 'en' ? 'Solution sheet' : 'সমাধান শিট'}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">For teachers / marking</p>
                          <Badge
                            className={cn(
                              'mt-1.5 text-[10px] font-semibold',
                              exam.solveSheetUrl
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            )}
                            variant="outline"
                          >
                            {exam.solveSheetUrl ? 'Generated' : 'Not generated'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {exam.solveSheetUrl ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              className="gap-1.5 bg-violet-600 hover:bg-violet-700"
                              onClick={() => window.open(getExamPdfDownloadUrl(exam.solveSheetUrl!), '_blank')}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open PDF
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              disabled={solveSheetLoading}
                              onClick={handleRegenerateSolveSheet}
                            >
                              {solveSheetLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                              Regenerate
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            className="gap-1.5 bg-violet-600 hover:bg-violet-700"
                            disabled={solveSheetLoading}
                            onClick={handleRegenerateSolveSheet}
                          >
                            {solveSheetLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                            {solveSheetLoading ? 'Generating…' : 'Generate PDF'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {exam.sets && exam.sets.length > 0 ? (
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-slate-500">Active sets ({exam.sets.length})</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 text-xs text-indigo-600 hover:text-indigo-700"
                          onClick={() => setActiveTab('questions')}
                        >
                          <ListChecks className="h-3.5 w-3.5" />
                          Manage in Questions tab
                        </Button>
                      </div>
                      <ul className="space-y-2">
                        {exam.sets.map((set) => {
                          let mcqCount = 0;
                          let cqCount = 0;
                          for (const eq of set.questions || []) {
                            if (eq.question?.type === 'CQ') cqCount++;
                            else mcqCount++;
                          }
                          return (
                            <li
                              key={set.id}
                              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
                            >
                              <span className="text-sm font-medium text-slate-800">{set.name}</span>
                              <div className="flex items-center gap-1.5">
                                {mcqCount > 0 && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {mcqCount} MCQ
                                  </Badge>
                                )}
                                {cqCount > 0 && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {cqCount} CQ
                                  </Badge>
                                )}
                                <span className="text-xs font-medium tabular-nums text-slate-500">
                                  {(set.questions?.length ?? 0)} total
                                </span>
                              </div>
                            </li>
                          );
                        })}
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
                  <p className="mb-4 text-sm text-slate-600 leading-relaxed">
                    For a printable bubble layout and manual answer entry (OMR sample + grading), open the{' '}
                    <strong className="text-slate-800">OMR</strong> tab above.
                  </p>

                  {/* File upload buttons */}
                  <div className="flex flex-wrap gap-3">
                    {/* OMR scan upload */}
                    <input
                      ref={omrFileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={handleOmrUpload}
                      disabled={omrUploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 rounded-xl border-slate-200"
                      disabled={omrUploading}
                      onClick={() => omrFileInputRef.current?.click()}
                    >
                      {omrUploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {omrUploading ? 'Uploading…' : 'Upload OMR / scan'}
                    </Button>

                    {/* Excel import */}
                    <input
                      ref={excelFileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleExcelImport}
                      disabled={excelImporting}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 rounded-xl border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300"
                      disabled={excelImporting}
                      onClick={() => excelFileInputRef.current?.click()}
                    >
                      {excelImporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                      {excelImporting ? 'Importing…' : 'Import Excel'}
                    </Button>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    Excel columns: <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">rollNo</code>,{' '}
                    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">subject</code>,{' '}
                    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">totalMarks</code>,{' '}
                    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">obtainedMarks</code>,{' '}
                    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">meritPosition</code>
                  </p>

                  {/* Imported results table */}
                  {offlineResults.length > 0 ? (
                    <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                        <span className="text-xs font-semibold text-slate-700">
                          Imported rows ({offlineResults.length})
                        </span>
                        <span className="text-xs text-slate-500">
                          {offlineResults.filter((r) => r.approvalStatus === 'PENDING').length} pending
                        </span>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="sticky top-0 bg-white">
                              <TableHead className="text-xs">Roll</TableHead>
                              <TableHead className="text-xs">Score</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                              <TableHead className="text-right text-xs">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {offlineResults.map((r) => (
                              <TableRow key={r.id}>
                                <TableCell className="font-medium text-slate-900">{r.rollNo}</TableCell>
                                <TableCell className="tabular-nums text-slate-600">
                                  {r.obtainedMarks ?? '—'} / {r.totalMarks ?? '—'}
                                </TableCell>
                                <TableCell>
                                  {r.approvalStatus === 'APPROVED' ? (
                                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]" variant="outline">Approved</Badge>
                                  ) : r.approvalStatus === 'REJECTED' ? (
                                    <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px]" variant="outline">Rejected</Badge>
                                  ) : (
                                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]" variant="outline">Pending</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {r.approvalStatus === 'PENDING' ? (
                                    <div className="flex justify-end gap-1">
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" title="Approve">
                                            <CheckCircle2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Approve this result?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Roll <strong>{r.rollNo}</strong> — score{' '}
                                              <strong>{r.obtainedMarks ?? '?'}/{r.totalMarks ?? '?'}</strong> will be approved and affect leaderboard records.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              className="bg-emerald-600 hover:bg-emerald-700"
                                              onClick={() => void handleApproveResult(r.id)}
                                            >
                                              Approve
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:bg-rose-50" title="Reject">
                                            <XCircle className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Reject this result?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Roll <strong>{r.rollNo}</strong> will be marked as rejected and excluded from records.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              className="bg-rose-600 hover:bg-rose-700"
                                              onClick={() => void handleRejectResult(r.id)}
                                            >
                                              Reject
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  ) : null}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : null}

                  {/* OMR file grid */}
                  {omrScans.length > 0 || omrPreviews.length > 0 ? (
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <p className="text-xs font-medium text-slate-500 mb-3">
                        Uploaded files ({omrPreviews.length} local, {omrScans.length} synced)
                      </p>

                      {omrPreviews.length > 0 ? (
                        <div className="mb-6">
                          <p className="text-xs font-medium text-slate-600 mb-3">Local Uploads</p>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {omrPreviews.map((preview) => (
                              <div
                                key={preview.id}
                                className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
                              >
                                {preview.url.startsWith('data:image') ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={preview.url}
                                    alt={preview.fileName}
                                    className="h-48 w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-48 w-full flex flex-col items-center justify-center bg-slate-100">
                                    <FileText className="h-12 w-12 text-slate-400 mb-2" />
                                    <p className="text-xs text-slate-600 text-center px-2">PDF</p>
                                  </div>
                                )}
                                {/* Hover overlay with Eye button */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="secondary"
                                    className="h-10 w-10 rounded-xl"
                                    onClick={() => setSelectedOmrPreview(preview)}
                                  >
                                    <Eye className="h-5 w-5" />
                                  </Button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-2 text-white text-[10px] truncate">
                                  {preview.fileName}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {omrScans.length > 0 ? (
                        <div>
                          <p className="text-xs font-medium text-slate-600 mb-3">Server Files</p>
                          <ul className="space-y-2">
                            {omrScans.map((scan) => (
                              <li
                                key={scan.id}
                                className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2.5 hover:bg-slate-50"
                              >
                                <span className="truncate text-sm text-slate-700">{scan.fileName || 'Scan'}</span>
                                <a
                                  href={getOmrScanDownloadUrl(scan.fileUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 text-sm font-medium text-indigo-600 hover:underline"
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
            <div className="space-y-6">
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
          ) : activeTab === 'folder-rules' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <ExamFolderRules
                examId={exam.id}
                sets={exam.sets ?? []}
                onGenerated={fetchExamData}
              />
            </div>
          ) : activeTab === 'evaluate' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <WrittenEvaluationPanel examId={exam.id} teacherUserId="admin" />
            </div>
          ) : (
            <ExamQuestionBuilder examId={exam.id} exam={exam} sets={exam.sets || []} onRefresh={fetchExamData} />
          )}
        </div>
      </div>

      {/* OMR Preview Dialog */}
      <Dialog open={!!selectedOmrPreview} onOpenChange={(open) => { if (!open) setSelectedOmrPreview(null); }}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <DialogTitle className="truncate text-sm font-semibold text-slate-900">
              {selectedOmrPreview?.fileName ?? 'OMR Preview'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center bg-black p-4 min-h-[300px]">
            {selectedOmrPreview?.url.startsWith('data:image') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedOmrPreview.url}
                alt={selectedOmrPreview.fileName}
                className="max-h-[calc(90vh-160px)] w-auto object-contain"
              />
            ) : selectedOmrPreview ? (
              <div className="flex flex-col items-center justify-center text-white py-12">
                <FileText className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-sm">PDF file preview not available</p>
                <p className="text-xs text-slate-400 mt-2">File: {selectedOmrPreview.fileName}</p>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
