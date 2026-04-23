'use client';

import { useState, useEffect } from 'react';
import {
  FileDown, FileText, Loader2, RefreshCw,
  CheckCircle2, AlertCircle, Columns2, Columns3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  regenerateExamPdf, generateSetPdf, getExamPdfDownloadUrl,
  regenerateSolveSheet, getExamById,
} from '@/lib/api/exams';
import type { Exam, ExamSet } from '@/types/exam';

const NAVY = '#1e3a5f';

function DownloadBtn({
  label, url, icon, accent,
}: {
  label: string;
  url: string | undefined;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const fullUrl = getExamPdfDownloadUrl(url);
      window.open(fullUrl, '_blank');
    } catch {
      toast({ description: 'Download failed.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={!url || loading}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border',
        accent
          ? 'text-white border-transparent hover:opacity-90'
          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50',
        (!url || loading) && 'opacity-50 cursor-not-allowed',
      )}
      style={accent ? { background: NAVY } : undefined}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {label}
    </button>
  );
}

export function PaperGenerationTab({
  exam,
  onExamChange,
}: {
  exam: Exam;
  onExamChange: (exam: Exam) => void;
}) {
  const { toast } = useToast();
  const sets: ExamSet[] = exam.sets ?? [];

  const [columns, setColumns]         = useState<1 | 2>(2);
  const [generating, setGenerating]   = useState(false);
  const [genSolve, setGenSolve]       = useState(false);
  const [genSetId, setGenSetId]       = useState<string | null>(null);
  const [lastPdf, setLastPdf]         = useState<string | null>(exam.pdfUrl ?? null);
  const [lastSolve, setLastSolve]     = useState<string | null>(exam.solveSheetUrl ?? null);

  useEffect(() => {
    setLastPdf(exam.pdfUrl ?? null);
    setLastSolve(exam.solveSheetUrl ?? null);
  }, [exam.pdfUrl, exam.solveSheetUrl]);

  const refreshExam = async () => {
    const r = await getExamById(exam.id);
    if (r.success && r.data) onExamChange(r.data);
  };

  const handleGenerateAll = async () => {
    setGenerating(true);
    const res = await regenerateExamPdf(exam.id, columns);
    setGenerating(false);
    if (res.success && res.data?.pdfUrl) {
      setLastPdf(res.data.pdfUrl);
      toast({ description: 'PDF generated successfully!' });
      await refreshExam();
    } else {
      toast({ description: 'PDF generation failed.', variant: 'destructive' });
    }
  };

  const handleGenerateSet = async (setId: string) => {
    setGenSetId(setId);
    const res = await generateSetPdf(exam.id, setId, columns);
    setGenSetId(null);
    if (res.success && res.data?.pdfUrl) {
      toast({ description: 'Set PDF ready!' });
      await refreshExam();
    } else {
      toast({ description: 'Failed to generate set PDF.', variant: 'destructive' });
    }
  };

  const handleSolveSheet = async () => {
    setGenSolve(true);
    const res = await regenerateSolveSheet(exam.id);
    setGenSolve(false);
    if (res.success && res.data?.solveSheetUrl) {
      setLastSolve(res.data.solveSheetUrl);
      toast({ description: 'Solve sheet generated!' });
      await refreshExam();
    } else {
      toast({ description: 'Failed to generate solve sheet.', variant: 'destructive' });
    }
  };

  const totalQuestions = sets.reduce((s, set) => s + (set.questions?.length ?? 0), 0);
  const totalMarks      = sets
    .flatMap(s => s.questions ?? [])
    .reduce((s, q) => s + (q.marks ?? 1), 0);

  return (
    <div className="space-y-6">

      {/* ── Summary chips ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Sets',       value: sets.length           },
          { label: 'Questions',  value: totalQuestions        },
          { label: 'Total Marks',value: totalMarks            },
          { label: 'Duration',   value: `${exam.durationMinutes ?? '—'} min` },
        ].map(chip => (
          <div key={chip.label} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{chip.label}</p>
            <p className="text-xl font-black text-slate-800">{chip.value}</p>
          </div>
        ))}
      </div>

      {/* ── Column layout selector ── */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">PDF Layout</p>
        <div className="flex gap-2">
          {([
            { val: 1 as const, label: '1 Column', icon: <Columns2 className="h-5 w-5" /> },
            { val: 2 as const, label: '2 Columns', icon: <Columns3 className="h-5 w-5" /> },
          ] as const).map(opt => (
            <button
              key={opt.val}
              onClick={() => setColumns(opt.val)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all',
                columns === opt.val
                  ? 'border-transparent text-white'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300',
              )}
              style={columns === opt.val ? { background: NAVY } : undefined}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Generate all papers ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-800">Question Papers</p>
            <p className="text-xs text-slate-400 mt-0.5">Generate combined PDF with all sets</p>
          </div>
          {lastPdf ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5" /> Generated
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              <AlertCircle className="h-3.5 w-3.5" /> Not generated
            </span>
          )}
        </div>

        <div className="px-5 py-4 flex flex-wrap items-center gap-3">
          <Button
            className="text-white gap-2"
            style={{ background: NAVY }}
            disabled={generating || !totalQuestions}
            onClick={handleGenerateAll}
          >
            {generating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <><RefreshCw className="h-4 w-4" /> Generate All</>
            )}
          </Button>

          <DownloadBtn
            label="Download Combined PDF"
            url={lastPdf ?? undefined}
            icon={<FileDown className="h-4 w-4" />}
            accent
          />
        </div>
      </div>

      {/* ── Per-set papers ── */}
      {sets.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="font-bold text-slate-800">Individual Set PDFs</p>
            <p className="text-xs text-slate-400 mt-0.5">Generate and download each set separately</p>
          </div>
          <div className="divide-y divide-slate-50">
            {sets.map(set => (
              <div key={set.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700">{set.name}</p>
                  <p className="text-xs text-slate-400">{set.questions?.length ?? 0} questions</p>
                </div>
                <div className="flex items-center gap-2">
                  {(set.questions?.length ?? 0) === 0 ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircle className="h-3 w-3" /> No questions
                    </span>
                  ) : (
                    <button
                      onClick={() => handleGenerateSet(set.id)}
                      disabled={genSetId === set.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                    >
                      {genSetId === set.id ? (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Generating…</>
                      ) : (
                        <><RefreshCw className="h-3 w-3" /> Generate</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Solve sheet ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-800">Solve Sheet</p>
            <p className="text-xs text-slate-400 mt-0.5">Answer key with correct options per set</p>
          </div>
          {lastSolve ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5" /> Generated
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              <AlertCircle className="h-3.5 w-3.5" /> Not generated
            </span>
          )}
        </div>

        <div className="px-5 py-4 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            disabled={genSolve}
            onClick={handleSolveSheet}
          >
            {genSolve ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <><RefreshCw className="h-4 w-4" /> Generate Solve Sheet</>
            )}
          </Button>

          <DownloadBtn
            label="Download Solve Sheet"
            url={lastSolve ?? undefined}
            icon={<FileText className="h-4 w-4" />}
          />
        </div>
      </div>
    </div>
  );
}
