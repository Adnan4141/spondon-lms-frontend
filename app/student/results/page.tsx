'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Download, FileText, Loader2 } from 'lucide-react';
import { getStudentResults } from '@/lib/api/student-portal';
import type { StudentResults, OnlineExamAttempt } from '@/types/academic';
import { getExamPdfDownloadUrl } from '@/lib/api/exams';

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
        if (res.success && res.data) setData(res.data);
      } catch (e: any) {
        setError(e.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-black text-slate-900">Results</h1>
        <Card className="rounded-2xl p-12 text-center border-rose-100 bg-rose-50/30">
          <p className="font-bold text-rose-600">{error}</p>
        </Card>
      </div>
    );
  }

  const attempts = data?.onlineAttempts ?? [];
  const offlineResults = data?.offlineResults ?? [];
  const hasResults = attempts.length > 0 || offlineResults.length > 0;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-slate-900">Results</h1>

      {!hasResults ? (
        <Card className="rounded-2xl p-12 text-center">
          <Award className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="font-bold text-slate-500">No results yet</p>
          <p className="text-sm text-slate-400 mt-1">Complete exams to see your results</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {attempts.length > 0 && (
            <div>
              <h2 className="text-lg font-black text-slate-800 mb-4">Online Exam Attempts</h2>
              <div className="space-y-4">
                {attempts.map((attempt: OnlineExamAttempt) => (
                  <Card key={attempt.id} className="rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h3 className="font-black text-slate-900">{attempt.exam?.title || 'Exam'}</h3>
                          <p className="text-sm text-slate-500 mt-1">
                            {attempt.exam?.type} • {attempt.exam?.mode}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm font-bold">
                            <span>
                              Score: {attempt.obtainedMarks ?? '—'} / {attempt.totalMarks ?? '—'}
                            </span>
                            <span className="text-slate-400">
                              {attempt.submittedAt
                                ? new Date(attempt.submittedAt).toLocaleDateString()
                                : new Date(attempt.startedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {attempt.exam?.solveSheetUrl && (
                          <a
                            href={getExamPdfDownloadUrl(attempt.exam.solveSheetUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            Download Solve Sheet
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {offlineResults.length > 0 && (
            <div>
              <h2 className="text-lg font-black text-slate-800 mb-4">Offline Exam Results</h2>
              <div className="space-y-4">
                {offlineResults.map((r: any) => (
                  <Card key={r.id} className="rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-black text-slate-900">{r.subject || 'Offline Exam'}</h3>
                          <p className="text-sm text-slate-500 mt-1">Roll: {r.rollNo}</p>
                          <p className="text-sm font-bold mt-1">
                            Score: {r.obtainedMarks ?? '—'} / {r.totalMarks ?? '—'}
                            {r.meritPosition != null && ` • Position: ${r.meritPosition}`}
                          </p>
                        </div>
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
