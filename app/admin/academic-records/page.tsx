'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getStudentById, lookupStudentUser } from '@/lib/api/students';
import { getStudentResults } from '@/lib/api/student-portal';
import type { Student } from '@/types/student';
import type { OfficialExamResult, StudentResults } from '@/types/academic';
import { AcademicRecordsExplorer } from '@/components/admin/academic-records/AcademicRecordsExplorer';
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
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { 
  Search, 
  RefreshCw, 
  BarChart3, 
  User, 
  GraduationCap, 
  Layers, 
  BookOpen, 
  FileText, 
  Trophy,
  History,
  Activity,
  ArrowRight,
  AlertTriangle,
  Printer,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { cn } from '@/lib/utils';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl text-sm">
      <p className="font-black text-slate-700 truncate max-w-50">{label}</p>
      <p className="mt-1 font-black text-indigo-600">{Number(payload[0]?.value ?? 0).toFixed(1)}%</p>
    </div>
  );
}

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl text-sm">
      <p className="font-black text-slate-700 truncate max-w-50">{label}</p>
      <p className="mt-1 font-black text-indigo-600">Avg {Number(payload[0]?.value ?? 0).toFixed(1)}%</p>
    </div>
  );
}

function AcademicRecordsPageContent() {
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();
  const searchParams = useSearchParams();
  const autoLoadAttempted = useRef(false);

  const [studentIdInput, setStudentIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [results, setResults] = useState<StudentResults | null>(null);

  // --- URL param auto-load: ?studentId=xxx ---
  const handleLoadRecordsForId = async (raw: string) => {
    if (!raw) return;
    try {
      setLoading(true);
      setError(null);
      setStudent(null);
      setResults(null);
      let resolvedId = raw;
      try {
        const lookup = await lookupStudentUser(raw);
        if (lookup.success && lookup.data?.id) {
          resolvedId = lookup.data.id;
          if (lookup.data.matchedBy !== 'id') {
            const label = lookup.data.matchedBy === 'registrationNumber' ? 'registration no.' : 'mobile';
            toast({ title: 'Student matched', description: `${lookup.data.fullName} — via ${label}`, variant: 'success' });
          }
        }
      } catch { resolvedId = raw; }
      const [studentResp, resultsResp] = await Promise.all([
        getStudentById(resolvedId),
        getStudentResults(resolvedId),
      ]);
      if (!studentResp.success || !studentResp.data) throw new Error(studentResp.message || 'Failed to load student');
      if (studentResp.data.role !== 'STUDENT') {
        throw new Error('This user is not a student. Use a student account, registration no., or mobile.');
      }
      setStudent(studentResp.data);
      if (!resultsResp.success || !resultsResp.data) {
        throw new Error(resultsResp.message || 'Failed to load academic records');
      }
      setResults(resultsResp.data);
    } catch (err: unknown) {
      const msg = getErrorMessage(err) || 'Failed to load academic records';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-load from URL param on first render
  useEffect(() => {
    if (autoLoadAttempted.current) return;
    const sid = searchParams?.get('studentId');
    if (sid) {
      autoLoadAttempted.current = true;
      setStudentIdInput(sid);
      handleLoadRecordsForId(sid);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleLoadRecords = async () => {
    const raw = studentIdInput.trim();
    if (!raw) {
      toast({
        title: 'Error',
        description: 'Enter user ID, registration number, or mobile',
        variant: 'destructive',
      });
      return;
    }
    await handleLoadRecordsForId(raw);
  };

  const handleViewAttempt = (attempt: any) => {
    openModal({
      title: 'Attempt Intelligence',
      description: 'Granular data for this specific exam attempt.',
      className: 'sm:max-w-2xl',
      content: (
        <div className="p-8 space-y-8 bg-white text-slate-900">
          <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-50/50 p-8 shadow-sm">
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-slate-200 text-indigo-600 shadow-sm">
                      <History className="h-5 w-5" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Exam Data</span>
                </div>
                <h3 className="text-2xl font-black tracking-tight">{attempt.exam?.title || attempt.examId}</h3>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             {[
               { label: 'Type', value: attempt.exam?.type || '-', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
               { label: 'Mode', value: attempt.exam?.mode || '-', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
               { label: 'Status', value: attempt.status, icon: Layers, color: 'text-violet-600', bg: 'bg-violet-50' },
               { label: 'Score', value: attempt.obtainedMarks !== null ? `${Number(attempt.obtainedMarks).toFixed(2)} / ${Number(attempt.totalMarks).toFixed(2)}` : '-', icon: Trophy, color: 'text-rose-600', bg: 'bg-rose-50' },
             ].map((stat, i) => (
               <div key={i} className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
                  <div className={cn("mb-3 flex h-9 w-9 items-center justify-center rounded-xl", stat.bg, stat.color)}>
                     <stat.icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-base font-bold text-slate-900">{stat.value}</p>
               </div>
             ))}
          </div>

          <div className="space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Timeline</h4>
             <div className="grid gap-3">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/30">
                   <span className="text-base font-bold text-slate-500">Commencement</span>
                   <span className="text-base font-black text-slate-900">{new Date(attempt.startedAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/30">
                   <span className="text-base font-bold text-slate-500">Submission</span>
                   <span className="text-base font-black text-slate-900">{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : 'Pending'}</span>
                </div>
             </div>
          </div>
        </div>
      )
    });
  };

  const onlineAttempts = results?.onlineAttempts || [];
  const offlineResults = results?.offlineResults || [];
  const academicRecords = results?.academicRecords || [];
  const officialExamResults: OfficialExamResult[] = results?.officialExamResults ?? [];

  // --- Chart data ---
  const trendData = useMemo(() =>
    onlineAttempts
      .filter((a) => a.submittedAt && a.obtainedMarks != null && a.totalMarks && Number(a.totalMarks) > 0)
      .sort((a, b) => new Date(a.submittedAt!).getTime() - new Date(b.submittedAt!).getTime())
      .map((a) => ({
        name: (a.exam?.title ?? a.examId).length > 22 ? (a.exam?.title ?? a.examId).slice(0, 20) + '…' : (a.exam?.title ?? a.examId),
        pct: Math.round(((Number(a.obtainedMarks) / Number(a.totalMarks)) * 100) * 10) / 10,
      })),
  [onlineAttempts]);

  // Compute overall at-risk flag
  const avgPctAll = useMemo(() => {
    const pcts: number[] = [];
    for (const a of onlineAttempts) {
      if (a.obtainedMarks != null && a.totalMarks && Number(a.totalMarks) > 0)
        pcts.push((Number(a.obtainedMarks) / Number(a.totalMarks)) * 100);
    }
    for (const r of officialExamResults) {
      if (r.percentage != null) pcts.push(Number(r.percentage));
    }
    return pcts.length > 0 ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null;
  }, [onlineAttempts, officialExamResults]);

  const isAtRisk = avgPctAll !== null && avgPctAll < 40;

  return (
    <div className="space-y-8 text-slate-900">
      {/* Search Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm print:hidden">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-75 flex-1">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block px-1">
              Student lookup
            </label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                placeholder="User ID, registration no., or mobile (01XXXXXXXXX)…"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLoadRecords()}
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
              />
            </div>
          </div>
          <Button 
            className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
            onClick={handleLoadRecords} 
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BarChart3 className="mr-2 h-4 w-4" />
            )}
            Audit Records
          </Button>
          {student && (
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-slate-200 gap-2 font-black text-[11px] uppercase tracking-widest print:hidden"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-base font-bold text-rose-600 uppercase tracking-widest flex items-center gap-3 print:hidden">
           <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
           {error}
        </div>
      )}

      {/* At-risk warning */}
      {student && isAtRisk && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-black text-amber-900">At-risk student</p>
            <p className="mt-0.5 text-xs font-semibold text-amber-800">
              Overall average score is <span className="font-black">{avgPctAll!.toFixed(1)}%</span> — below the 40% passing threshold.
            </p>
          </div>
        </div>
      )}

      {student && (
        <>
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/30">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
                    {student.fullName.charAt(0)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-white bg-emerald-500 shadow-sm" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">{student.fullName}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-base font-bold text-slate-400">
                    <span>{student.mobile}</span>
                    {student.studentProfile?.registrationNumber ? (
                      <>
                        <div className="h-1 w-1 rounded-full bg-slate-200" />
                        <span className="font-mono text-sm text-slate-600">
                          Reg: {student.studentProfile.registrationNumber}
                        </span>
                      </>
                    ) : null}
                    {student.email && (
                      <>
                        <div className="h-1 w-1 rounded-full bg-slate-200" />
                        <span>{student.email}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 flex items-center gap-3">
                  <GraduationCap className="h-4 w-4 text-indigo-500" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Enrollments</span>
                    <span className="text-base font-black text-slate-900">{student._count?.enrollments ?? 0}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 flex items-center gap-3">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Exam Attempts</span>
                    <span className="text-base font-black text-slate-900">{student._count?.examAttempts ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <AcademicRecordsExplorer
            studentUserId={student.id}
            enrollmentCourses={student.enrollments?.map((e) => ({
              id: e.courseId,
              name: e.course?.name ?? e.courseId,
            }))}
          />
        </>
      )}

      {results && (
        <div className="space-y-10">
          {/* Trend line chart */}
          {trendData.length >= 2 && (
            <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-8 py-5">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                <div>
                  <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Exam Score Trend</h2>
                  <p className="mt-0.5 text-base font-bold text-indigo-500">Online attempt performance over time</p>
                </div>
              </div>
              <div className="p-8">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<TrendTooltip />} />
                    <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
                    <Line type="monotone" dataKey="pct" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#4f46e5', strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="mt-2 text-[10px] font-semibold text-slate-400">
                  <span className="inline-block h-0.5 w-6 align-middle bg-amber-400 mr-1 rounded" />
                  40% passing threshold
                </p>
              </div>
            </section>
          )}

          {/* Online Attempts Table */}
          <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
              <div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Online Exam Attempts</h2>
                <p className="mt-0.5 text-base font-bold text-indigo-500">Portal synchronized data</p>
              </div>
            </div>

            {onlineAttempts.length === 0 ? (
              <div className="p-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">No attempts detected.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-b border-slate-100">
                      <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Exam Title</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Category</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Outcome</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Performance</TableHead>
                      <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onlineAttempts.map((attempt) => (
                      <TableRow 
                        key={attempt.id} 
                        className="group border-slate-100 transition-colors hover:bg-slate-50/80 cursor-pointer"
                        onClick={() => handleViewAttempt(attempt)}
                      >
                        <TableCell className="px-8 py-5">
                           <div className="flex flex-col">
                              <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{attempt.exam?.title || attempt.examId}</span>
                              <span className="text-[10px] font-medium text-slate-400">Ref: {attempt.id.slice(0, 8)}</span>
                           </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg bg-blue-50 border-blue-100 text-blue-700 font-black text-[9px] uppercase px-2 py-0.5 shadow-sm">
                            {attempt.exam?.type || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "rounded-lg font-black text-[9px] uppercase px-2 py-0.5 shadow-sm",
                              attempt.status === 'SUBMITTED' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'
                            )}
                          >
                            {attempt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <p className="text-base font-black text-slate-900">
                             {attempt.obtainedMarks !== null ? Number(attempt.obtainedMarks).toFixed(2) : '-'}
                           </p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total: {Number(attempt.totalMarks).toFixed(2)}</p>
                        </TableCell>
                        <TableCell className="px-8 text-right">
                           <span className="text-[10px] font-bold text-slate-500">{new Date(attempt.startedAt).toLocaleDateString()}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          {/* Official exam results (ResultBatch / ExamResult) */}
          {officialExamResults.length > 0 ? (
            <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
                <div>
                  <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Official results (batches)
                  </h2>
                  <p className="mt-0.5 text-base font-bold text-violet-600">
                    Published via result batches (branch → central)
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-b border-slate-100">
                      <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">
                        Exam
                      </TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">
                        Roll
                      </TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">
                        Status
                      </TableHead>
                      <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">
                        Score
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {officialExamResults.map((r) => (
                      <TableRow key={r.id} className="border-slate-100">
                        <TableCell className="px-8 py-4 font-bold text-slate-900">
                          {r.exam?.title ?? r.examId}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-black text-violet-600">{r.rollNo}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              'rounded-lg text-[9px] font-black uppercase',
                              r.batchApprovalStatus === 'APPROVED_BY_CENTRAL'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 bg-slate-50 text-slate-600',
                            )}
                          >
                            {r.batchApprovalStatus.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-8 text-right">
                          <span className="text-base font-black text-slate-900">
                            {Number(r.marks).toFixed(1)} / {Number(r.totalMarks).toFixed(1)}
                          </span>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                            {Number(r.percentage).toFixed(1)}%
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          ) : null}

          {/* Offline Results Table */}
          <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
              <div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Offline Exam Results</h2>
                <p className="mt-0.5 text-base font-bold text-rose-500">Physical evaluation data</p>
              </div>
            </div>

            {offlineResults.length === 0 ? (
              <div className="p-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">No physical records.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-b border-slate-100">
                      <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Exam ID</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Student Roll</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Subject</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Ranking</TableHead>
                      <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Total Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offlineResults.map((row) => (
                      <TableRow key={row.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                        <TableCell className="px-8 py-5 font-bold text-slate-900">{row.examId}</TableCell>
                        <TableCell className="font-mono text-base font-black text-indigo-600">{row.rollNo}</TableCell>
                        <TableCell className="text-base font-bold text-slate-500">{row.subject || '-'}</TableCell>
                        <TableCell>
                          {row.meritPosition !== null && row.meritPosition !== undefined ? (
                            <Badge variant="outline" className="rounded-lg bg-emerald-50 border-emerald-100 text-emerald-700 font-black text-[9px] uppercase px-2 py-0.5 shadow-sm">
                              Pos #{row.meritPosition}
                            </Badge>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="px-8 text-right py-5">
                           <p className="text-base font-black text-slate-900">
                             {row.obtainedMarks !== null ? Number(row.obtainedMarks).toFixed(2) : '-'}
                           </p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase">Max: {Number(row.totalMarks).toFixed(2)}</p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          {/* Academic Records Table */}
          <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
              <div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Consolidated Academic records</h2>
                <p className="mt-0.5 text-base font-bold text-amber-600">Normalized institutional records</p>
              </div>
            </div>

            {academicRecords.length === 0 ? (
              <div className="p-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">No consolidated records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-b border-slate-100">
                      <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Record Type</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Course Identifier</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Score</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Grade</TableHead>
                      <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academicRecords.map((rec) => (
                      <TableRow key={rec.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                        <TableCell className="px-8 py-5">
                          <Badge variant="outline" className="rounded-lg bg-slate-50 border-slate-200 text-slate-600 font-black text-[9px] uppercase px-2 py-0.5 shadow-sm">
                            {rec.recordType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-[10px] font-bold text-slate-400">{rec.courseId || '-'}</TableCell>
                        <TableCell className="text-center font-black text-slate-900">
                          {rec.score !== null ? Number(rec.score).toFixed(2) : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                           <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-base font-black text-indigo-600">
                             {rec.grade || '-'}
                           </span>
                        </TableCell>
                        <TableCell className="px-8 text-base font-medium text-slate-500 italic max-w-xs truncate">
                          {rec.remarks || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </div>
      )}

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default function AcademicRecordsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
          Loading academic records…
        </div>
      }
    >
      <AcademicRecordsPageContent />
    </Suspense>
  );
}
