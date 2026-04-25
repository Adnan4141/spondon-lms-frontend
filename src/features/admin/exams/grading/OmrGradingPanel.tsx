'use client';

import { useState } from 'react';
import { gradeOmrAttempt } from '@/lib/api/exams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCheck, Loader2 } from 'lucide-react';

interface OmrGradingPanelProps {
  examId: string;
}

export function OmrGradingPanel({ examId }: OmrGradingPanelProps) {
  const { toast } = useToast();
  const [studentUserId, setStudentUserId] = useState('');
  const [omrUploadUrl, setOmrUploadUrl] = useState('');
  const [answersJson, setAnswersJson] = useState('[]');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    const sid = studentUserId.trim();
    if (!sid) {
      toast({ title: 'Student required', description: 'Enter student user ID.', variant: 'destructive' });
      return;
    }
    let answers: unknown = undefined;
    if (answersJson.trim()) {
      try {
        answers = JSON.parse(answersJson);
      } catch {
        toast({ title: 'Invalid JSON', description: 'Answers must be valid JSON.', variant: 'destructive' });
        return;
      }
    }
    setBusy(true);
    try {
      const res = await gradeOmrAttempt(examId, {
        studentUserId: sid,
        omrUploadUrl: omrUploadUrl.trim() || undefined,
        answers,
      });
      if (res.success && res.data) {
        toast({
          title: 'Recorded',
          description: `Attempt ${res.data.attemptId} — ${res.data.status}`,
          variant: 'success',
        });
      } else {
        toast({ title: 'Failed', description: res.message || 'Could not grade', variant: 'destructive' });
      }
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Request failed',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <ClipboardCheck className="h-4 w-4 text-violet-600" />
        Manual OMR record (phase 1)
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        Creates or updates an attempt, stores optional scan URL and answer payload, marks OMR as graded. Wire real
        scoring in a later phase.
      </p>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Student user ID</label>
          <Input
            className="h-11 rounded-xl"
            value={studentUserId}
            onChange={(e) => setStudentUserId(e.target.value)}
            placeholder="cuid…"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Scan URL (optional)
          </label>
          <Input
            className="h-11 rounded-xl"
            value={omrUploadUrl}
            onChange={(e) => setOmrUploadUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Answers JSON (optional)
          </label>
          <textarea
            className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 font-mono text-xs"
            value={answersJson}
            onChange={(e) => setAnswersJson(e.target.value)}
            spellCheck={false}
          />
        </div>
      </div>
      <Button type="button" className="h-11 rounded-xl" disabled={busy} onClick={handleSubmit}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit OMR record'}
      </Button>
    </div>
  );
}
