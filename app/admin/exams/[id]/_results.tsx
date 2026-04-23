'use client';

import { useState, useEffect } from 'react';
import {
  Users, Trophy, TrendingUp, BarChart2, AlertCircle,
  Loader2, CheckCircle2, XCircle, Upload, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getExamAnalytics, getExamLeaderboard, updateExam, listWrittenAttempts } from '@/lib/api/exams';
import type { ExamAnalytics } from '@/lib/api/exams';
import { getOmrScans, uploadOmrScan, getOfflineResults, approveOfflineResult, rejectOfflineResult } from '@/lib/api/exam-results';
import type { Exam, ExamLeaderboardRow } from '@/types/exam';

function Chip({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 text-center">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function BarChart({ data }: { data: { range: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-24 px-1">
      {data.map(d => (
        <div key={d.range} className="flex-1 flex flex-col items-center gap-1 group">
          <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold">{d.count}</span>
          <div
            className="w-full rounded-t-sm bg-rose-400 transition-all"
            style={{ height: `${Math.max((d.count / max) * 72, d.count > 0 ? 4 : 0)}px` }}
          />
          <span className="text-[9px] text-slate-400 leading-none">{d.range}</span>
        </div>
      ))}
    </div>
  );
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function ResultsTab({
  exam,
  onExamChange,
}: {
  exam: Exam;
  onExamChange: (exam: Exam) => void;
}) {
  const { toast } = useToast();

  const [analytics, setAnalytics]         = useState<ExamAnalytics | null>(null);
  const [leaderboard, setLeaderboard]     = useState<ExamLeaderboardRow[]>([]);
  const [lbTotal, setLbTotal]             = useState(0);
  const [loadingAnalytics, setLoadingA]   = useState(true);
  const [loadingLb, setLoadingLb]         = useState(true);

  // Engine-conditional states
  const [writtenAttempts, setWrittenAttempts] = useState<any[]>([]);
  const [omrScans, setOmrScans]               = useState<any[]>([]);
  const [offlineResults, setOfflineResults]   = useState<any[]>([]);
  const [omrUploading, setOmrUploading]       = useState(false);
  const [processingId, setProcessingId]       = useState<string | null>(null);

  const isOMR        = exam.examEngine === 'OMR_BOOK';
  const isWritten    = exam.mode === 'WRITTEN' || exam.examEngine === 'COMPETITIVE';

  useEffect(() => {
    // Analytics
    getExamAnalytics(exam.id).then(r => {
      if (r.success && r.data) setAnalytics(r.data);
      setLoadingA(false);
    });

    // Leaderboard
    getExamLeaderboard(exam.id).then(r => {
      if (r.success && r.data) {
        setLeaderboard(r.data.rows);
        setLbTotal(r.data.count);
      }
      setLoadingLb(false);
    });

    // Engine-specific
    if (isWritten) {
      listWrittenAttempts(exam.id).then(r => {
        if (r.success && r.data) setWrittenAttempts(r.data);
      });
    }
    if (isOMR) {
      getOmrScans(exam.id).then(r => {
        if (r.success && r.data) setOmrScans(r.data);
      });
    }
    getOfflineResults(exam.id).then(r => {
      if (r.success && r.data) setOfflineResults(r.data);
    });
  }, [exam.id, isOMR, isWritten]);

  const handleOmrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOmrUploading(true);
    const r = await uploadOmrScan(exam.id, file);
    setOmrUploading(false);
    if (r.success) {
      toast({ description: 'OMR scan uploaded.' });
      const res = await getOmrScans(exam.id);
      if (res.success && res.data) setOmrScans(res.data);
    } else {
      toast({ description: 'Upload failed.', variant: 'destructive' });
    }
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    const r = await approveOfflineResult(id);
    setProcessingId(null);
    if (r.success) {
      toast({ description: 'Result approved.' });
      const res = await getOfflineResults(exam.id);
      if (res.success && res.data) setOfflineResults(res.data);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    const r = await rejectOfflineResult(id);
    setProcessingId(null);
    if (r.success) {
      toast({ description: 'Result rejected.' });
      const res = await getOfflineResults(exam.id);
      if (res.success && res.data) setOfflineResults(res.data);
    }
  };

  const toggleHideResult = async () => {
    const cur = (exam.settings as any)?.hideResult ?? false;
    const next = !cur;
    const res = await updateExam(exam.id, {
      settings: { ...((exam.settings as object) ?? {}), hideResult: next },
    });
    if (res.success && res.data) {
      onExamChange(res.data);
      toast({ description: next ? 'Results hidden from students.' : 'Results shown to students.' });
    }
  };

  const passRate = analytics?.passFail.passRate ?? null;

  return (
    <div className="space-y-6">

      {/* ── Top stat chips ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {loadingAnalytics ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl h-20 animate-pulse" />
          ))
        ) : (
          <>
            <Chip label="Attempts"  value={analytics?.totalAttempts ?? 0} />
            <Chip label="Pass Rate" value={passRate !== null ? `${passRate.toFixed(1)}%` : '—'} />
            <Chip label="Average"   value={analytics?.average?.toFixed(1) ?? '—'} />
            <Chip label="Highest"   value={analytics?.highest ?? '—'} />
            <Chip label="Lowest"    value={analytics?.lowest ?? '—'} />
          </>
        )}
      </div>

      {/* ── Score Distribution ── */}
      {analytics?.scoreDistribution?.length ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-4 w-4 text-slate-400" />
            <p className="font-bold text-slate-800 text-sm">Score Distribution</p>
          </div>
          <BarChart data={analytics.scoreDistribution} />
        </div>
      ) : null}

      {/* ── Leaderboard ── */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <p className="font-bold text-slate-800 text-sm">Leaderboard</p>
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{lbTotal} students</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5"
              onClick={toggleHideResult}
            >
              {(exam.settings as any)?.hideResult ? (
                <><AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Results Hidden</>
              ) : (
                <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Results Visible</>
              )}
            </Button>
          </div>
        </div>

        {loadingLb ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">No attempts yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase w-12">Rank</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase">Student</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase">Reg No.</th>
                  <th className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase">Score</th>
                  <th className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase">Percentile</th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leaderboard.map(row => {
                  const pass = row.obtainedMarks / row.totalMarks >= 0.33;
                  return (
                    <tr key={row.studentUserId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-black text-slate-700">
                        {MEDAL[row.rank] ?? `#${row.rank}`}
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-800">{row.fullName}</td>
                      <td className="px-3 py-3 text-xs text-slate-500">{row.registrationNumber ?? '—'}</td>
                      <td className="px-3 py-3 text-right font-bold text-slate-800">
                        {row.obtainedMarks}
                        <span className="text-slate-400 font-normal">/{row.totalMarks}</span>
                      </td>
                      <td className="px-3 py-3 text-right text-slate-500 text-xs">
                        {row.percentile != null ? `${row.percentile.toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full',
                          pass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                        )}>
                          {pass ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── OMR Scans (OMR_BOOK engine only) ── */}
      {isOMR && (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              <p className="font-bold text-slate-800 text-sm">OMR Scans</p>
              <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{omrScans.length}</span>
            </div>
            <label className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
              {omrUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Upload Scan
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleOmrUpload} disabled={omrUploading} />
            </label>
          </div>

          {omrScans.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">No OMR scans uploaded yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Student</th>
                  <th className="px-3 py-2 text-center text-[10px] font-bold text-slate-400 uppercase">Status</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-400 uppercase">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {omrScans.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{s.studentName ?? s.studentUserId ?? '—'}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{s.status ?? '—'}</span>
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-slate-700">{s.score ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Written Attempts ── */}
      {isWritten && writtenAttempts.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <p className="font-bold text-slate-800 text-sm">Written Submissions ({writtenAttempts.length})</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Student</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {writtenAttempts.map((a: any) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{a.studentName ?? a.studentUserId ?? '—'}</td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {a.evaluationStatus ?? 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Offline Results ── */}
      {offlineResults.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <p className="font-bold text-slate-800 text-sm">Offline Results ({offlineResults.length})</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Student</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-400 uppercase">Marks</th>
                <th className="px-3 py-2 text-center text-[10px] font-bold text-slate-400 uppercase">Status</th>
                <th className="px-3 py-2 text-center text-[10px] font-bold text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {offlineResults.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.studentName ?? r.studentUserId ?? '—'}</td>
                  <td className="px-3 py-3 text-right font-bold text-slate-700">{r.obtainedMarks ?? '—'}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      r.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      r.approvalStatus === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700',
                    )}>
                      {r.approvalStatus ?? 'PENDING'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {r.approvalStatus === 'PENDING' && (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleApprove(r.id)}
                          disabled={processingId === r.id}
                          className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          {processingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleReject(r.id)}
                          disabled={processingId === r.id}
                          className="p-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
