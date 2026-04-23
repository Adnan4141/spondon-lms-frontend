'use client';

import { useState } from 'react';
import {
  FileText, FileDown, RefreshCw, Loader2, CalendarClock,
  Eye, EyeOff, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { regenerateSolveSheet, updateExam, getExamPdfDownloadUrl } from '@/lib/api/exams';
import type { Exam } from '@/types/exam';

type Visibility = 'IMMEDIATELY' | 'AFTER_CLOSE' | 'SCHEDULED';

const VIS_OPTIONS: { val: Visibility; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    val: 'IMMEDIATELY',
    label: 'Immediately',
    desc: 'Available as soon as submitted',
    icon: <Eye className="h-4 w-4" />,
  },
  {
    val: 'AFTER_CLOSE',
    label: 'After Exam Closes',
    desc: 'Available when exam status is Closed',
    icon: <EyeOff className="h-4 w-4" />,
  },
  {
    val: 'SCHEDULED',
    label: 'Scheduled',
    desc: 'Show on a specific date & time',
    icon: <CalendarClock className="h-4 w-4" />,
  },
];

export function SolveSheetTab({
  exam,
  onExamChange,
}: {
  exam: Exam;
  onExamChange: (exam: Exam) => void;
}) {
  const { toast } = useToast();

  const [visibility, setVisibility]     = useState<Visibility>(
    (exam.solveSheetVisibility as Visibility) ?? 'AFTER_CLOSE',
  );
  const [scheduledAt, setScheduledAt]   = useState<string>(
    exam.solveSheetScheduledAt
      ? new Date(exam.solveSheetScheduledAt).toISOString().slice(0, 16)
      : '',
  );
  const [saving, setSaving]             = useState(false);
  const [generating, setGenerating]     = useState(false);
  const [solveUrl, setSolveUrl]         = useState(exam.solveSheetUrl ?? null);

  const handleSaveVisibility = async () => {
    setSaving(true);
    const payload: Partial<Exam> = { solveSheetVisibility: visibility };
    if (visibility === 'SCHEDULED' && scheduledAt) {
      payload.solveSheetScheduledAt = scheduledAt;
    }
    const res = await updateExam(exam.id, payload);
    setSaving(false);
    if (res.success && res.data) {
      onExamChange(res.data);
      toast({ description: 'Solve sheet settings saved.' });
    } else {
      toast({ description: 'Failed to save.', variant: 'destructive' });
    }
  };

  const handleRegenerate = async () => {
    setGenerating(true);
    const res = await regenerateSolveSheet(exam.id);
    setGenerating(false);
    if (res.success && res.data?.solveSheetUrl) {
      setSolveUrl(res.data.solveSheetUrl);
      toast({ description: 'Solve sheet generated!' });
    } else {
      toast({ description: 'Failed to generate solve sheet.', variant: 'destructive' });
    }
  };

  const handleDownload = () => {
    if (!solveUrl) return;
    const fullUrl = getExamPdfDownloadUrl(solveUrl);
    window.open(fullUrl, '_blank');
  };

  // Preview: first set's questions with correct answer highlighted
  const firstSet = exam.sets?.[0];
  const previewQuestions = firstSet?.questions?.slice(0, 20) ?? [];

  return (
    <div className="space-y-6">

      {/* ── Visibility control ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="font-bold text-slate-800">Solve Sheet Visibility</p>
          <p className="text-xs text-slate-400 mt-0.5">Control when students can view the answer key</p>
        </div>

        <div className="px-5 py-4 space-y-3">
          {VIS_OPTIONS.map(opt => (
            <label
              key={opt.val}
              className={cn(
                'flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all',
                visibility === opt.val
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-100 hover:border-slate-200',
              )}
            >
              <input
                type="radio"
                name="solveVisibility"
                value={opt.val}
                checked={visibility === opt.val}
                onChange={() => setVisibility(opt.val)}
                className="mt-0.5 accent-slate-900"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm', visibility === opt.val ? 'text-slate-900' : 'text-slate-500')}>
                    {opt.icon}
                  </span>
                  <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                  {exam.solveSheetVisibility === opt.val && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>

                {opt.val === 'SCHEDULED' && visibility === 'SCHEDULED' && (
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    className="mt-2 text-xs border border-slate-200 rounded-lg px-3 py-1.5 block w-full max-w-xs"
                  />
                )}
              </div>
            </label>
          ))}

          <div className="flex justify-end pt-1">
            <Button
              size="sm"
              className="text-white gap-1.5"
              style={{ background: '#1e3a5f' }}
              disabled={saving}
              onClick={handleSaveVisibility}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      {/* ── Generate / Download ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-800">Solve Sheet PDF</p>
            <p className="text-xs text-slate-400 mt-0.5">Auto-generated answer key for all sets</p>
          </div>
          {solveUrl && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5" /> Ready
            </span>
          )}
        </div>

        <div className="px-5 py-4 flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="gap-2"
            disabled={generating}
            onClick={handleRegenerate}
          >
            {generating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <><RefreshCw className="h-4 w-4" /> Regenerate</>
            )}
          </Button>

          <Button
            className="text-white hover:opacity-90 gap-2"
            style={{ background: '#1e3a5f' }}
            disabled={!solveUrl}
            onClick={handleDownload}
          >
            <FileDown className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* ── Answer Key Preview ── */}
      {previewQuestions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <p className="font-bold text-slate-800">
              Answer Key Preview — {firstSet?.name}
            </p>
            {previewQuestions.length < (firstSet?.questions?.length ?? 0) && (
              <span className="text-xs text-slate-400">(showing first {previewQuestions.length})</span>
            )}
          </div>

          <div className="divide-y divide-slate-50">
            {previewQuestions.map((eq, i) => {
              const opts = eq.question?.options ?? [];
              return (
                <div key={eq.id} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-black text-slate-400 mt-0.5 w-5 shrink-0">{i + 1}.</span>
                    <p className="text-sm text-slate-700 font-medium flex-1 leading-relaxed">{eq.question?.prompt ?? '—'}</p>
                  </div>
                  {opts.length > 0 && (
                    <div className="mt-2 ml-8 flex flex-wrap gap-2">
                      {opts.map(opt => (
                        <span
                          key={opt.id}
                          className={cn(
                            'px-2.5 py-1 rounded-lg text-xs font-semibold border',
                            opt.isCorrect
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                              : 'bg-slate-50 text-slate-500 border-slate-100',
                          )}
                        >
                          {opt.label}. {opt.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
