'use client';

import { useMemo, useState, useEffect } from 'react';
import type { Exam } from '@/types/exam';
import { cn } from '@/lib/utils';
import { getExamAnalytics, type ExamAnalytics } from '@/lib/api/exams';
import {
  Calendar,
  Clock,
  Layers,
  Users,
  CheckCircle2,
  AlertCircle,
  User,
  BookOpen,
  MapPin,
  FileText,
  ExternalLink,
  RefreshCw,
  Download,
  BarChart3,
  Monitor,
  PencilLine,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getExamPdfDownloadUrl,
  regenerateExamPdf,
  regenerateSolveSheet,
} from '@/lib/api/exams';
import { useToast } from '@/hooks/use-toast';

interface ExamOverviewPanelProps {
  exam: Exam;
  onRefresh: () => void;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof Users;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl border bg-slate-50', tone ?? 'border-slate-200')}>
        <Icon className="h-4.5 w-4.5 text-slate-600" />
      </div>
      <p className="mt-2 text-2xl font-black tabular-nums text-slate-900">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

function formatDT(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function countdown(iso?: string | null) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h remaining`;
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

export function ExamOverviewPanel({ exam, onRefresh }: ExamOverviewPanelProps) {
  const { toast } = useToast();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [solveLoading, setSolveLoading] = useState(false);
  const [analytics, setAnalytics] = useState<ExamAnalytics | null>(null);

  useEffect(() => {
    getExamAnalytics(exam.id).then((r) => { if (r.success && r.data) setAnalytics(r.data); });
  }, [exam.id]);

  const questionMix = useMemo(() => {
    let mcq = 0, cq = 0;
    for (const s of exam.sets || []) {
      for (const eq of s.questions || []) {
        if (eq.question?.type === 'CQ') cq++;
        else mcq++;
      }
    }
    return { mcq, cq, total: mcq + cq };
  }, [exam.sets]);

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      const r = await regenerateExamPdf(exam.id);
      if (r.success && r.data?.pdfUrl) window.open(getExamPdfDownloadUrl(r.data.pdfUrl), '_blank');
    } finally { setPdfLoading(false); }
  };

  const handleSolve = async () => {
    setSolveLoading(true);
    try {
      const r = await regenerateSolveSheet(exam.id);
      if (r.success && r.data?.solveSheetUrl) window.open(getExamPdfDownloadUrl(r.data.solveSheetUrl), '_blank');
    } finally { setSolveLoading(false); }
  };

  const startLabel = formatDT(exam.startAt);
  const endLabel = formatDT(exam.endAt);
  const startCountdown = countdown(exam.startAt);

  return (
    <div className="space-y-6">
      {/* ── Hero card ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-indigo-100 bg-linear-to-br from-indigo-50/90 via-white to-violet-50/40 px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'rounded-md border px-2.5 py-0.5 text-xs font-semibold',
                    exam.status === 'PUBLISHED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : exam.status === 'CLOSED'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200',
                  )}
                >
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
                  {exam.mode}
                </Badge>
                {exam.examEngine && exam.examEngine !== 'REGULAR' && (
                  <Badge variant="outline" className="rounded-md border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-900">
                    {exam.examEngine.replace(/_/g, ' ')}
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-snug">{exam.title}</h2>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-500">
                {exam.course?.name && (
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-indigo-400" />
                    {exam.course.name}
                  </span>
                )}
                {exam.branch?.name && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-rose-400" />
                    {exam.branch.name}
                  </span>
                )}
                {exam.batch?.name && (
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-amber-500" />
                    {exam.batch.name}
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 text-center shadow-sm shrink-0">
              <p className="text-xs font-semibold text-slate-500">Attempts</p>
              <p className="text-3xl font-black tabular-nums text-slate-900">{exam._count?.attempts ?? 0}</p>
              <p className="text-xs text-slate-400">of {exam.allowedAttempts} allowed</p>
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 sm:grid-cols-4">
          {[
            { label: 'Type', value: exam.type.replace(/_/g, ' ') },
            { label: 'Duration', value: exam.durationMinutes != null ? `${exam.durationMinutes} min` : 'Not set' },
            { label: 'Sets', value: exam.sets?.length ?? exam._count?.sets ?? 0 },
            { label: 'Language', value: exam.language === 'en' ? 'English' : 'Bangla' },
          ].map((r) => (
            <div key={r.label} className="px-4 py-3.5 bg-white">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{r.label}</p>
              <p className="mt-0.5 text-sm font-bold text-slate-900 capitalize">{r.value}</p>
            </div>
          ))}
        </div>

        {/* Question mix bar */}
        {questionMix.total > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
            <span className="text-xs font-semibold text-slate-500">Questions</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-900 ring-1 ring-sky-100">
              <Monitor className="h-3.5 w-3.5" />
              {questionMix.mcq} MCQ
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-900 ring-1 ring-violet-100">
              <PencilLine className="h-3.5 w-3.5" />
              {questionMix.cq} Written
            </span>
            <span className="text-xs text-slate-400">{questionMix.total} total</span>
          </div>
        )}
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Attempts" value={exam._count?.attempts ?? 0} icon={Users} tone="border-indigo-100" />
        <StatCard label="Question Sets" value={exam.sets?.length ?? exam._count?.sets ?? 0} icon={Layers} tone="border-violet-100" />
        <StatCard
          label="Avg Score"
          value={analytics ? `${analytics.average}/${analytics.totalMarks}` : '—'}
          icon={BarChart3}
          tone="border-emerald-100"
        />
        <StatCard
          label="Pass Rate"
          value={analytics ? `${analytics.passFail.passRate}%` : '—'}
          icon={CheckCircle2}
          tone="border-amber-100"
        />
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Schedule */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-semibold text-slate-800">Schedule</span>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
                <ChevronRight className="h-4 w-4 -rotate-90 text-indigo-500" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Opens</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{startLabel ?? 'Open when published'}</p>
                {startCountdown && <p className="text-xs text-indigo-600 mt-0.5 font-medium">{startCountdown}</p>}
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
                <ChevronRight className="h-4 w-4 rotate-90 text-rose-500" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Closes</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{endLabel ?? 'No end date'}</p>
              </div>
            </div>
            {exam.durationMinutes && (
              <div className="flex items-center gap-2 px-1 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {exam.durationMinutes} minutes per attempt
              </div>
            )}
          </div>
        </div>

        {/* Recent attempts */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 flex items-center gap-2">
            <Users className="h-4 w-4 text-rose-500" />
            <span className="text-sm font-semibold text-slate-800">Recent Attempts</span>
          </div>
          <div className="p-3">
            {exam.attempts && exam.attempts.length > 0 ? (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                {exam.attempts.slice(0, 5).map((attempt) => (
                  <li key={attempt.id} className="flex items-center justify-between gap-3 bg-white px-4 py-3 hover:bg-slate-50/80">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                        <User className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {attempt.student?.fullName ?? 'Student'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(attempt.startedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'shrink-0 text-[10px] font-semibold',
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
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-500">No attempts yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Attempts appear after students start the exam</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PDFs ── */}
      {(exam.sets && exam.sets.length > 0) || exam.mode === 'OFFLINE' ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-800">PDFs & Documents</span>
          </div>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            {/* Exam paper */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">Exam Paper</p>
                  <Badge
                    className={cn('mt-1 text-[10px] font-semibold', exam.pdfUrl ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200')}
                    variant="outline"
                  >
                    {exam.pdfUrl ? 'Generated' : 'Not generated'}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {exam.pdfUrl && (
                  <Button size="sm" className="gap-1.5 h-8 rounded-xl" onClick={() => window.open(getExamPdfDownloadUrl(exam.pdfUrl!), '_blank')}>
                    <ExternalLink className="h-3.5 w-3.5" />Open
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1.5 h-8 rounded-xl" disabled={pdfLoading} onClick={handlePdf}>
                  {pdfLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  {pdfLoading ? 'Generating…' : exam.pdfUrl ? 'Regenerate' : 'Generate PDF'}
                </Button>
              </div>
            </div>

            {/* Solution sheet */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">Solution Sheet</p>
                  <Badge
                    className={cn('mt-1 text-[10px] font-semibold', exam.solveSheetUrl ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200')}
                    variant="outline"
                  >
                    {exam.solveSheetUrl ? 'Generated' : 'Not generated'}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {exam.solveSheetUrl && (
                  <Button size="sm" className="gap-1.5 h-8 rounded-xl bg-violet-600 hover:bg-violet-700" onClick={() => window.open(getExamPdfDownloadUrl(exam.solveSheetUrl!), '_blank')}>
                    <ExternalLink className="h-3.5 w-3.5" />Open
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1.5 h-8 rounded-xl" disabled={solveLoading} onClick={handleSolve}>
                  {solveLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  {solveLoading ? 'Generating…' : exam.solveSheetUrl ? 'Regenerate' : 'Generate PDF'}
                </Button>
              </div>
            </div>
          </div>

          {/* Sets summary */}
          {exam.sets && exam.sets.length > 0 && (
            <div className="border-t border-slate-100 px-5 pb-5 pt-4">
              <p className="mb-3 text-xs font-semibold text-slate-500">Active Sets ({exam.sets.length})</p>
              <ul className="space-y-2">
                {exam.sets.map((set) => {
                  let mcqCount = 0, cqCount = 0;
                  for (const eq of set.questions || []) {
                    if (eq.question?.type === 'CQ') cqCount++;
                    else mcqCount++;
                  }
                  return (
                    <li key={set.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5">
                      <span className="text-sm font-medium text-slate-800">{set.name}</span>
                      <div className="flex items-center gap-1.5">
                        {mcqCount > 0 && <Badge variant="secondary" className="text-[10px]">{mcqCount} MCQ</Badge>}
                        {cqCount > 0 && <Badge variant="outline" className="text-[10px]">{cqCount} CQ</Badge>}
                        <span className="text-xs font-medium tabular-nums text-slate-500">{(set.questions?.length ?? 0)} total</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
