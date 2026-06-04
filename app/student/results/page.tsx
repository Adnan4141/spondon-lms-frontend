'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Download, FileText, Loader2, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { getStudentResults } from '@/lib/api/student-portal';
import type { StudentResults, OnlineExamAttempt, OfficialExamResult } from '@/types/academic';
import { getExamPdfDownloadUrl } from '@/lib/api/exams';

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
  if (!exam?.solveSheetUrl) return false;
  const vis = exam.solveSheetVisibility;
  if (vis === 'HIDDEN') return false;
  if (vis === 'IMMEDIATELY') return true;
  if (vis === 'SCHEDULED' && exam.solveSheetScheduledAt) {
    return new Date() >= new Date(exam.solveSheetScheduledAt);
  }
  return true;
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
          <p className="text-slate-500 font-bold animate-pulse">Loading...</p>
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

  return (
    <div className="space-y-10">
      <div className="flex justify-end">
        <div className="flex items-center gap-3">
           <div className="px-5 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-black text-slate-900">Avg: 84%</span>
           </div>
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
              className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg hover:bg-indigo-700"
            >
              View Exams
            </Link>
            <Link
              href="/student/academic-record"
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Academic Record
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-10">
          {visibleOfficial.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Award className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Official Results</h2>
              </div>
              <div className="grid gap-6">
                {visibleOfficial.map((r) => (
                  <Card
                    key={r.id}
                    className="overflow-hidden rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                  >
                    <CardContent className="p-8">
                      <h3 className="text-xl font-black text-slate-900">{r.exam?.title ?? 'Exam'}</h3>
                      <p className="mt-2 text-sm font-bold text-slate-400">
                        Roll: {r.rollNo} · Centrally Approved
                      </p>
                      <div className="mt-6 flex items-baseline gap-2">
                        <span className="text-4xl font-black text-violet-600">{Number(r.marks)}</span>
                        <span className="text-xl font-bold text-slate-400">/ {Number(r.totalMarks)}</span>
                        <span className="ml-4 rounded-full bg-violet-50 px-4 py-1 text-sm font-black text-violet-800">
                          {Number(r.percentage).toFixed(1)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {attempts.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <CheckCircle2 className="h-5 w-5" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Online Exams</h2>
              </div>
              <div className="grid gap-6">
                {attempts.map((attempt: OnlineExamAttempt) => (
                  <Card key={attempt.id} className="group overflow-hidden rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500">
                    <CardContent className="p-8">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="flex items-start gap-6">
                           <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 transition-colors">
                              <FileText className="h-8 w-8 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                           </div>
                           <div className="space-y-1">
                              <h3 className="text-xl font-black text-slate-900">{attempt.exam?.title || 'Exam'}</h3>
                              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                {attempt.exam?.type} • {attempt.exam?.mode}
                              </p>
                              <div className="flex items-center gap-4 mt-3">
                                 <span className="text-sm font-bold text-slate-500">
                                    {attempt.submittedAt
                                      ? new Date(attempt.submittedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                      : new Date(attempt.startedAt).toLocaleDateString()}
                                 </span>
                              </div>
                           </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-6">
                           <div className="text-center px-8 py-4 rounded-3xl bg-slate-50 group-hover:bg-indigo-50/50 transition-colors">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Marks</p>
                              <p className="text-3xl font-black text-indigo-600">
                                {attempt.obtainedMarks ?? '—'} <span className="text-slate-300 text-xl">/</span> {attempt.totalMarks ?? '—'}
                              </p>
                           </div>
                           
                           {canShowSolveSheet(attempt.exam) && (
                             <a
                               href={getExamPdfDownloadUrl(attempt.exam!.solveSheetUrl!)}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
                             >
                               <Download className="h-4 w-4" />
                               View Solution
                             </a>
                           )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {visibleLegacyOffline.length > 0 && (
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Award className="h-5 w-5" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Legacy Offline Results</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {visibleLegacyOffline.map((r: OfflineResult) => (
                  <Card key={r.id} className="group rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden">
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-slate-900">{r.subject || 'Offline Exam'}</h3>
                          <p className="text-sm font-bold text-slate-400">Roll: {r.rollNo}</p>
                        </div>
                        {r.meritPosition != null && (
                           <div className="h-12 w-12 rounded-2xl bg-amber-50 flex flex-col items-center justify-center text-amber-600">
                              <span className="text-[10px] font-black leading-none">POS</span>
                              <span className="text-lg font-black">{r.meritPosition}</span>
                           </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Marks</p>
                            <p className="text-2xl font-black text-slate-900">
                              {r.obtainedMarks ?? '—'} <span className="text-slate-300">/</span> {r.totalMarks ?? '—'}
                            </p>
                         </div>
                         <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="h-6 w-6" />
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {academicRecords.length > 0 && (
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <FileText className="h-5 w-5" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Academic Record</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {academicRecords.map((r: any) => (
                  <Card key={r.id} className="group rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden">
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-slate-900">{r.recordType || 'Record'}</h3>
                          {r.remarks && <p className="text-sm font-bold text-slate-400">{r.remarks}</p>}
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <span className="text-lg font-black">{r.score ?? '—'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <span className="text-sm font-bold text-slate-500">{r.grade ? `Grade: ${r.grade}` : ''}</span>
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
