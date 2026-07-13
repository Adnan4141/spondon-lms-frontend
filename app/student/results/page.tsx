'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Download, FileText, Loader2, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { getStudentResults } from '@/lib/api/student-portal';
import type { StudentResults, OnlineExamAttempt, OfficialExamResult } from '@/types/academic';
import { getSolveSheetDownloadUrl } from '@/lib/api/exams';
import { cn } from '@/lib/utils';

interface OfflineResult {
  id: string;
  examId?: string;
  subject?: string;
  rollNo?: string;
  obtainedMarks?: number;
  totalMarks?: number;
  meritPosition?: number;
}

function canShowSolveSheet(exam?: OnlineExamAttempt['exam']): boolean {
  if (!exam) return false;
  const vis = exam.solveSheetVisibility;
  if (vis === 'HIDDEN' || !vis) return false;
  if (vis === 'IMMEDIATELY') return true;
  if (vis === 'SCHEDULED' && exam.solveSheetScheduledAt) {
    return new Date() >= new Date(exam.solveSheetScheduledAt);
  }
  return false;
}

function getProvisionalMcqFromAttempt(attempt: OnlineExamAttempt): number | null {
  if (attempt.obtainedMarks != null || !attempt.answers?.length) return null;
  const graded = attempt.answers.filter((answer) => answer.obtainedMarks != null);
  if (!graded.length) return null;
  const obtained = graded.reduce((sum, answer) => sum + Number(answer.obtainedMarks ?? 0), 0);
  return Math.max(0, obtained);
}

export default function StudentResultsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (typeof window === 'undefined') return;
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setError('Please log in to view results');
        setLoading(false);
        return;
      }
      try {
        const user = JSON.parse(userStr);
        const res = await getStudentResults(user.id);
        if (res.success && res.data) {
          setData(res.data);
        } else if (!res.success) {
          setError(res.message || 'Failed to load results');
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-slate-500 font-bold animate-pulse">Loading exam results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-10">
        <Card className="rounded-[2.5rem] border-none bg-rose-50 p-12 text-center">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <p className="text-xl font-black text-rose-900">{error}</p>
        </Card>
      </div>
    );
  }

  const attempts = data?.onlineAttempts ?? [];
  const offlineResults: OfflineResult[] = (data?.offlineResults as OfflineResult[]) ?? [];
  const academicRecords = (data?.academicRecords as any[]) ?? [];
  const officialExamResults: OfficialExamResult[] = data?.officialExamResults ?? [];
  const visibleOfficial = officialExamResults.filter(
    (r) => r.batchApprovalStatus === 'APPROVED_BY_CENTRAL',
  );
  const officialExamIds = new Set(visibleOfficial.map((r) => r.examId).filter(Boolean));
  const visibleLegacyOffline = offlineResults.filter((r) => !r.examId || !officialExamIds.has(r.examId));
  const hasResults =
    attempts.length > 0 ||
    visibleLegacyOffline.length > 0 ||
    academicRecords.length > 0 ||
    visibleOfficial.length > 0;

  // Dynamically calculate overall statistics
  let totalObtained = 0;
  let totalMax = 0;
  let attemptCount = 0;
  let starCount = 0;

  attempts.forEach(a => {
    if (a.obtainedMarks != null && a.totalMarks != null) {
      const o = Number(a.obtainedMarks);
      const m = Number(a.totalMarks);
      totalObtained += o;
      totalMax += m;
      attemptCount++;
      if (m > 0 && (o / m) >= 0.8) starCount++;
    }
  });

  visibleOfficial.forEach(r => {
    if (r.marks != null && r.totalMarks != null) {
      const o = Number(r.marks);
      const m = Number(r.totalMarks);
      totalObtained += o;
      totalMax += m;
      attemptCount++;
      if (m > 0 && (o / m) >= 0.8) starCount++;
    }
  });

  visibleLegacyOffline.forEach(r => {
    if (r.obtainedMarks != null && r.totalMarks != null) {
      const o = Number(r.obtainedMarks);
      const m = Number(r.totalMarks);
      totalObtained += o;
      totalMax += m;
      attemptCount++;
      if (m > 0 && (o / m) >= 0.8) starCount++;
    }
  });

  const overallAvgPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

  return (
    <div className="space-y-8 pb-12 max-w-full">
      {/* Banner card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-900 text-white p-8 sm:p-10 shadow-md border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
              <Award className="h-3.5 w-3.5" />
              Academic Performance
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Your Exam Analytics</h1>
            <p className="text-sm font-medium text-slate-300 leading-relaxed">
              Track your scores, view solutions, and monitor your progress across all online and offline examinations.
            </p>
          </div>
          
          {hasResults && (
            <div className="flex flex-wrap items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
              <div className="text-center px-4 py-2 border-r border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Average</p>
                <p className="text-2xl font-black text-emerald-450">{overallAvgPercentage.toFixed(1)}%</p>
              </div>
              <div className="text-center px-4 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Exams Taken</p>
                <p className="text-2xl font-black text-indigo-300">{attemptCount}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {!hasResults ? (
        <Card className="rounded-[2.5rem] border-none bg-white p-20 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">No Results Yet</h3>
          <p className="text-slate-500 font-medium max-w-sm mx-auto">
            Your results will appear here after completing online exams. Official marks are shown after central approval.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/student/exams"
              className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-6 py-3 text-sm font-black text-white shadow-md hover:shadow-lg transition-all border-0"
            >
              View Exams
            </Link>
            <Link
              href="/student/academic-record"
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              Academic Record
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-10">
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Card 1: Average Score */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex items-center gap-5 transition hover:shadow-md">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Average Score</p>
                <p className="text-2xl font-black text-slate-900 leading-none">{overallAvgPercentage.toFixed(1)}%</p>
              </div>
            </div>

            {/* Card 2: Exams Taken */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex items-center gap-5 transition hover:shadow-md">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total Exams Taken</p>
                <p className="text-2xl font-black text-slate-900 leading-none">{attemptCount}</p>
              </div>
            </div>

            {/* Card 3: Star Performances */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex items-center gap-5 transition hover:shadow-md">
              <div className="h-12 w-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Excellent Scores (80%+)</p>
                <p className="text-2xl font-black text-slate-900 leading-none">{starCount} Exams</p>
              </div>
            </div>
          </div>

          {/* Official Results Section */}
          {visibleOfficial.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-650">
                  <Award className="h-5 w-5" />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Official Results</h2>
              </div>
              <div className="grid gap-6">
                {visibleOfficial.map((r) => {
                  const percentage = Number(r.percentage);
                  return (
                    <Card
                      key={r.id}
                      className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xs hover:shadow-md transition-all duration-300"
                    >
                      <CardContent className="p-6 sm:p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="space-y-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-[10px] font-black uppercase tracking-widest">
                              Centrally Approved
                            </span>
                            <h3 className="text-xl font-black text-slate-900 leading-snug">{r.exam?.title ?? 'Exam'}</h3>
                            <p className="text-xs font-bold text-slate-400">
                              Roll Number: <span className="text-slate-600">{r.rollNo}</span>
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Marks Obtained</p>
                              <div className="flex items-baseline justify-end gap-1.5">
                                <span className="text-3xl font-black text-violet-600">{Number(r.marks)}</span>
                                <span className="text-sm font-bold text-slate-400">/ {Number(r.totalMarks)}</span>
                              </div>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-750 font-black text-sm shrink-0">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-6 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Score distribution</span>
                            <span className="text-slate-600">{percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-violet-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(percentage, 100)}%` }} 
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Online Exams Section */}
          {attempts.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <CheckCircle2 className="h-5 w-5" />
                 </div>
                 <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Online Exams</h2>
              </div>
              <div className="grid gap-6">
                {attempts.map((attempt: OnlineExamAttempt) => {
                  const obtained = attempt.obtainedMarks != null ? Number(attempt.obtainedMarks) : null;
                  const provisionalMcq = getProvisionalMcqFromAttempt(attempt);
                  const total = attempt.totalMarks != null ? Number(attempt.totalMarks) : null;
                  const percentage = (obtained != null && total != null && total > 0) ? (obtained / total) * 100 : null;
                  const pendingWrittenEvaluation = obtained == null && provisionalMcq != null;
                  return (
                    <Card key={attempt.id} className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xs hover:shadow-md transition-all duration-300">
                      <CardContent className="p-6 sm:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          <div className="flex items-start gap-5">
                             <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 transition-colors">
                                <FileText className="h-7 w-7 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                             </div>
                             <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-wider">
                                    {attempt.exam?.type || 'Exam'}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[9px] font-black uppercase tracking-wider">
                                    {attempt.exam?.mode || 'Online'}
                                  </span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 leading-snug">{attempt.exam?.title || 'Exam'}</h3>
                                <p className="text-xs font-bold text-slate-400">
                                  Submitted on {attempt.submittedAt
                                    ? new Date(attempt.submittedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                    : new Date(attempt.startedAt).toLocaleDateString()}
                                </p>
                             </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-6 shrink-0 w-full lg:w-auto">
                             <div className="text-center px-6 py-3 rounded-2xl bg-slate-50 group-hover:bg-indigo-50/50 transition-colors w-full sm:w-36">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">
                                  {pendingWrittenEvaluation ? 'Provisional MCQ' : 'Obtained Marks'}
                                </p>
                                <p className="text-2xl font-black text-indigo-600">
                                  {pendingWrittenEvaluation
                                    ? provisionalMcq
                                    : attempt.obtainedMarks ?? '—'}
                                  {!pendingWrittenEvaluation ? (
                                    <span className="text-slate-300 text-lg"> / </span>
                                  ) : null}
                                  {!pendingWrittenEvaluation ? (attempt.totalMarks ?? '—') : null}
                                </p>
                                {pendingWrittenEvaluation ? (
                                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                                    Written evaluation pending
                                  </p>
                                ) : null}
                             </div>
                             
                             {canShowSolveSheet(attempt.exam) && attempt.examId && (
                               <a
                                 href={getSolveSheetDownloadUrl(attempt.examId)}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs hover:shadow-lg transition-all duration-200 border-0 shadow-sm shadow-orange-100"
                               >
                                 <Download className="h-4 w-4" />
                                 View Solution
                               </a>
                             )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {percentage !== null && (
                          <div className="mt-6 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <span>Score percentage</span>
                              <span className="text-slate-600">{percentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(percentage, 100)}%` }} 
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legacy Offline Results Section */}
          {visibleLegacyOffline.length > 0 && (
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Award className="h-5 w-5" />
                 </div>
                 <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Legacy Offline Results</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {visibleLegacyOffline.map((r: OfflineResult) => {
                  const percentage = (r.obtainedMarks != null && r.totalMarks != null && r.totalMarks > 0) ? (r.obtainedMarks / r.totalMarks) * 100 : null;
                  return (
                    <Card key={r.id} className="group rounded-3xl border border-slate-100 bg-white shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden">
                      <CardContent className="p-6 sm:p-8">
                        <div className="flex items-start justify-between mb-6 gap-4">
                          <div className="space-y-1">
                            <h3 className="text-lg font-black text-slate-900 leading-snug">{r.subject || 'Offline Exam'}</h3>
                            <p className="text-xs font-bold text-slate-400">Roll: {r.rollNo}</p>
                          </div>
                          {r.meritPosition != null && (
                             <div className="h-12 w-12 rounded-2xl bg-amber-50 flex flex-col items-center justify-center text-amber-600 shrink-0">
                                <span className="text-[9px] font-black leading-none">POS</span>
                                <span className="text-lg font-black">{r.meritPosition}</span>
                             </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Obtained Marks</p>
                              <p className="text-xl font-black text-slate-900">
                                {r.obtainedMarks ?? '—'} <span className="text-slate-300">/</span> {r.totalMarks ?? '—'}
                              </p>
                           </div>
                           <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <CheckCircle2 className="h-6 w-6" />
                           </div>
                        </div>

                        {percentage !== null && (
                          <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(percentage, 100)}%` }} 
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Academic Records Section */}
          {academicRecords.length > 0 && (
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-650">
                    <FileText className="h-5 w-5" />
                 </div>
                 <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Academic Record</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {academicRecords.map((r: any) => (
                  <Card key={r.id} className="group rounded-3xl border border-slate-100 bg-white shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden">
                    <CardContent className="p-6 sm:p-8">
                      <div className="flex items-start justify-between mb-6 gap-4">
                        <div className="space-y-1">
                          <h3 className="text-lg font-black text-slate-900 leading-snug">{r.recordType || 'Record'}</h3>
                          {r.remarks && <p className="text-xs font-bold text-slate-400 leading-relaxed">{r.remarks}</p>}
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
                          <span className="text-base font-black">{r.score ?? '—'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                        <span className="text-xs font-bold text-slate-500">{r.grade ? `Grade: ${r.grade}` : ''}</span>
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
