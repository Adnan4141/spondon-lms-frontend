'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { uploadAnswerSheet, removeAnswerSheetScan, listWrittenAttempts, getWrittenAttempt } from '@/lib/api/exams';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { API_ORIGIN } from '@/lib/api';
import {
  Upload,
  X,
  ChevronLeft,
  User,
  Image as ImageIcon,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  ZoomIn,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnswerSheetUploadPanelProps {
  examId: string;
}

interface AttemptSummary {
  id: string;
  student: { id: string; fullName: string; mobile: string } | null;
  status: string;
  submittedAt: string | null;
  totalMarks: number | null;
  evaluationStatus: string;
}

interface QuestionWithAnswer {
  examQuestionId: string;
  questionId: string;
  marks: number;
  orderIndex: number;
  question: { id: string; type: string; prompt: string; meta: unknown };
  studentAnswer: {
    id: string;
    answer: Record<string, unknown>;
    scanUrls: string[] | null;
    obtainedMarks: number | null;
  } | null;
}

interface AttemptDetail {
  attempt: { id: string; status: string; submittedAt: string | null };
  student: { id: string; fullName: string; mobile: string } | null;
  questions: QuestionWithAnswer[];
}

export function AnswerSheetUploadPanel({ examId }: AnswerSheetUploadPanelProps) {
  const { toast } = useToast();
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [selected, setSelected] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const loadAttempts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listWrittenAttempts(examId);
      if (res.success && res.data) setAttempts(res.data as AttemptSummary[]);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [examId]);

  useEffect(() => { loadAttempts(); }, [loadAttempts]);

  const openAttempt = async (attemptId: string) => {
    setDetailLoading(true);
    try {
      const res = await getWrittenAttempt(examId, attemptId);
      if (res.success && res.data) setSelected(res.data as AttemptDetail);
    } catch { /* ignore */ } finally { setDetailLoading(false); }
  };

  const handleUpload = async (questionId: string, files: FileList | null) => {
    if (!files || files.length === 0 || !selected) return;
    const key = questionId;
    setUploading(p => ({ ...p, [key]: true }));
    try {
      const res = await uploadAnswerSheet(examId, {
        attemptId: selected.attempt.id,
        questionId,
        files: Array.from(files),
      });
      if (res.success) {
        toast({ title: 'Uploaded', description: `${files.length} file(s) uploaded`, variant: 'success' });
        // Refresh detail
        await openAttempt(selected.attempt.id);
      } else {
        toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(p => ({ ...p, [key]: false }));
    }
  };

  const handleRemoveScan = async (questionId: string, scanUrl: string) => {
    if (!selected) return;
    try {
      const res = await removeAnswerSheetScan(examId, {
        attemptId: selected.attempt.id,
        questionId,
        scanUrl,
      });
      if (res.success) {
        toast({ title: 'Removed', variant: 'success' });
        await openAttempt(selected.attempt.id);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to remove', variant: 'destructive' });
    }
  };

  const getScanFullUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${API_ORIGIN}${url}`;
  };

  // ─── Detail View: per-question scan upload ──────────────────────────────
  if (selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setSelected(null)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <p className="font-black text-slate-900 text-base">{selected.student?.fullName ?? 'Unknown'}</p>
            <p className="text-xs text-slate-400">{selected.student?.mobile ?? '—'}</p>
          </div>
        </div>

        <div className="space-y-4">
          {selected.questions.map((q, qi) => {
            const scanUrls = (q.studentAnswer?.scanUrls ?? []) as string[];
            const isUploading = uploading[q.questionId] ?? false;

            return (
              <div key={q.examQuestionId} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Question header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-xl bg-amber-600 text-white text-xs font-black flex items-center justify-center">{qi + 1}</span>
                    <Badge variant="outline" className={cn(
                      'text-[9px] font-black uppercase',
                      q.question.type === 'CQ' ? 'border-violet-200 text-violet-700 bg-violet-50' : 'border-blue-200 text-blue-700 bg-blue-50',
                    )}>
                      {q.question.type}
                    </Badge>
                    <span className="text-xs text-slate-500 font-medium">{Number(q.marks)} marks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {scanUrls.length > 0 && (
                      <Badge variant="outline" className="text-[9px] font-black bg-emerald-50 text-emerald-700 border-emerald-200">
                        <ImageIcon className="h-3 w-3 mr-1" />{scanUrls.length} scan{scanUrls.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 space-y-4">
                  {/* Question prompt (truncated) */}
                  <div className="text-sm text-slate-600 line-clamp-2" dangerouslySetInnerHTML={{ __html: q.question.prompt }} />

                  {/* Existing scans */}
                  {scanUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {scanUrls.map((url, si) => {
                        const fullUrl = getScanFullUrl(url);
                        const isPdf = url.endsWith('.pdf');
                        return (
                          <div key={si} className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                            {isPdf ? (
                              <div className="h-28 flex items-center justify-center">
                                <FileText className="h-8 w-8 text-slate-400" />
                              </div>
                            ) : (
                              <img
                                src={fullUrl}
                                alt={`Scan ${si + 1}`}
                                className="h-28 w-full object-cover"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                              <button
                                type="button"
                                className="h-8 w-8 rounded-lg bg-white/90 flex items-center justify-center text-slate-700 hover:bg-white"
                                onClick={() => setPreviewUrl(fullUrl)}
                              >
                                <ZoomIn className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="h-8 w-8 rounded-lg bg-rose-500/90 flex items-center justify-center text-white hover:bg-rose-600"
                                onClick={() => handleRemoveScan(q.questionId, url)}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Upload button */}
                  <div>
                    <input
                      ref={(el) => { fileInputRefs.current[q.questionId] = el; }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      multiple
                      className="hidden"
                      onChange={(e) => handleUpload(q.questionId, e.target.files)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-bold text-xs border-dashed border-slate-300 text-slate-500 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50"
                      onClick={() => fileInputRefs.current[q.questionId]?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Uploading...</>
                      ) : (
                        <><Upload className="h-3.5 w-3.5 mr-1.5" /> Upload scan{scanUrls.length > 0 ? ' (add more)' : ''}</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Image preview lightbox */}
        {previewUrl && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setPreviewUrl(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-600 hover:text-rose-600 z-10"
                onClick={() => setPreviewUrl(null)}
              >
                <X className="h-4 w-4" />
              </button>
              {previewUrl.endsWith('.pdf') ? (
                <iframe src={previewUrl} className="w-full h-[85vh] rounded-2xl bg-white" />
              ) : (
                <img src={previewUrl} alt="Preview" className="w-full max-h-[85vh] object-contain rounded-2xl bg-white" />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Attempts List ──────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Offline Answer Sheets</p>
          <p className="text-xs text-slate-400 mt-1">Upload scanned answer sheets per student, per question</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl font-black text-xs" onClick={loadAttempts}>Refresh</Button>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mx-auto" />
        </div>
      ) : attempts.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400 font-medium">
          <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          No student attempts found. Create offline attempts first.
        </div>
      ) : (
        <div className="space-y-2">
          {attempts.map(a => (
            <button
              key={a.id}
              onClick={() => openAttempt(a.id)}
              disabled={detailLoading}
              className="w-full rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-amber-200 transition-all px-6 py-4 flex items-center gap-4 text-left shadow-sm"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-slate-900 truncate">{a.student?.fullName ?? 'Unknown'}</p>
                <p className="text-xs text-slate-400">{a.student?.mobile ?? '—'}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {a.evaluationStatus === 'EVALUATED' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                {a.evaluationStatus === 'PENDING' && <AlertCircle className="h-4 w-4 text-rose-400" />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
