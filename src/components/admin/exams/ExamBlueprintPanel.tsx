'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { generateExamPaper, validateExamBlueprint, type PaperBlueprint, type PaperBlueprintSubject } from '@/lib/api/exams';
import { Layers, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

const subjectTypes: PaperBlueprintSubject['type'][] = ['MCQ', 'CQ', 'Short', 'MCQ+CQ', 'MCQ+Short'];

function defaultSubject(courseId: string): PaperBlueprintSubject {
  return {
    subjectId: courseId,
    type: 'MCQ',
    setSequence: 0,
    totalMCQ: 20,
    singleMCQ: 10,
    passageMCQ: 10,
  };
}

export function ExamBlueprintPanel({
  examId,
  primaryCourseId,
  courseOptions,
  existingSetCount,
  actingTeacherUserId,
  onGenerated,
}: {
  examId: string;
  primaryCourseId: string;
  courseOptions: { id: string; name: string }[];
  existingSetCount: number;
  actingTeacherUserId?: string | null;
  onGenerated: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [sets, setSets] = useState(2);
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [negativeMarking, setNegativeMarking] = useState(0);
  const [subjects, setSubjects] = useState<PaperBlueprintSubject[]>(() => [defaultSubject(primaryCourseId)]);
  const [validating, setValidating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastValidation, setLastValidation] = useState<{ valid: boolean; errors: string[]; warnings: string[] } | null>(
    null,
  );

  const buildBlueprint = useCallback((): PaperBlueprint => {
    return {
      sets,
      marksPerQuestion,
      negativeMarking: negativeMarking || undefined,
      subjects: subjects.map((s, i) => ({ ...s, setSequence: s.setSequence ?? i })),
    };
  }, [sets, marksPerQuestion, negativeMarking, subjects]);

  const runValidate = useCallback(async (): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null> => {
    const blueprint = buildBlueprint();
    setValidating(true);
    try {
      const res = await validateExamBlueprint({
        blueprint,
        teacherUserId: actingTeacherUserId || undefined,
      });
      if (res.success && res.data) {
        const v = {
          valid: res.data.valid,
          errors: res.data.errors || [],
          warnings: res.data.warnings || [],
        };
        setLastValidation(v);
        return v;
      }
      return null;
    } catch (e: unknown) {
      toast({
        title: 'Validation failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
      return null;
    } finally {
      setValidating(false);
    }
  }, [actingTeacherUserId, buildBlueprint, toast]);

  const handleGenerate = async () => {
    const v = await runValidate();
    const blueprint = buildBlueprint();
    if (!v?.valid) {
      toast({ title: 'Fix blueprint errors first', variant: 'destructive' });
      return;
    }
    if (existingSetCount > 0) {
      const ok = window.confirm(
        'This replaces all existing question sets for this exam. Published attempts may be affected. Continue?',
      );
      if (!ok) return;
    }
    setGenerating(true);
    try {
      const res = await generateExamPaper(examId, {
        blueprint,
        teacherUserId: actingTeacherUserId || undefined,
      });
      if (res.success) {
        toast({ title: 'Paper generated', description: 'Sets and questions were updated.', variant: 'success' });
        await onGenerated();
      } else {
        toast({
          title: 'Generation failed',
          description: res.message || res.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (e: unknown) {
      toast({
        title: 'Generation failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const updateSubject = (index: number, patch: Partial<PaperBlueprintSubject>) => {
    setSubjects((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addSubject = () => {
    const id = courseOptions[0]?.id || primaryCourseId;
    setSubjects((prev) => [...prev, defaultSubject(id)]);
  };

  const removeSubject = (index: number) => {
    setSubjects((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  return (
    <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-200 bg-white shadow-sm">
            <Sparkles className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Blueprint paper generator</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Define subjects (courses), MCQ split, CQ or Short counts, and number of sets A/B/… Replaces all sets when you
              generate.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-indigo-700">
          <Layers className="h-4 w-4" />
          <span className="text-xs font-bold">{existingSetCount} set(s) now</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Sets (max 26)</label>
          <Input
            type="number"
            min={1}
            max={26}
            className="h-11 rounded-xl"
            value={sets}
            onChange={(e) => setSets(Math.min(26, Math.max(1, Number(e.target.value) || 1)))}
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Marks / Q (default)</label>
          <Input
            type="number"
            min={0}
            className="h-11 rounded-xl"
            value={marksPerQuestion}
            onChange={(e) => setMarksPerQuestion(Number(e.target.value) || 1)}
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Negative (MCQ)</label>
          <Input
            type="number"
            min={0}
            step={0.25}
            className="h-11 rounded-xl"
            value={negativeMarking}
            onChange={(e) => setNegativeMarking(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {subjects.map((sub, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-200 bg-white p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-12 items-end"
          >
            <div className="lg:col-span-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Course</label>
              <Select value={sub.subjectId} onValueChange={(v) => updateSubject(idx, { subjectId: v })}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {courseOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Type</label>
              <Select value={sub.type} onValueChange={(v) => updateSubject(idx, { type: v as PaperBlueprintSubject['type'] })}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subjectTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(sub.type === 'MCQ' || sub.type === 'MCQ+CQ' || sub.type === 'MCQ+Short') && (
              <>
                <div className="lg:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Total MCQ</label>
                  <Input
                    type="number"
                    min={1}
                    className="h-11 rounded-xl"
                    value={sub.totalMCQ ?? ''}
                    onChange={(e) => updateSubject(idx, { totalMCQ: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Single</label>
                  <Input
                    type="number"
                    min={0}
                    className="h-11 rounded-xl"
                    value={sub.singleMCQ ?? ''}
                    onChange={(e) => updateSubject(idx, { singleMCQ: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Passage</label>
                  <Input
                    type="number"
                    min={0}
                    className="h-11 rounded-xl"
                    value={sub.passageMCQ ?? ''}
                    onChange={(e) => updateSubject(idx, { passageMCQ: Number(e.target.value) || 0 })}
                  />
                </div>
              </>
            )}
            {(sub.type === 'CQ' || sub.type === 'MCQ+CQ') && (
              <div className="lg:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">CQ count</label>
                <Input
                  type="number"
                  min={1}
                  className="h-11 rounded-xl"
                  value={sub.creativeSets ?? ''}
                  onChange={(e) => updateSubject(idx, { creativeSets: Number(e.target.value) || 0 })}
                />
              </div>
            )}
            {(sub.type === 'Short' || sub.type === 'MCQ+Short') && (
              <div className="lg:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Short count</label>
                <Input
                  type="number"
                  min={1}
                  className="h-11 rounded-xl"
                  value={sub.shortCount ?? ''}
                  onChange={(e) => updateSubject(idx, { shortCount: Number(e.target.value) || 0 })}
                />
              </div>
            )}
            <div className="lg:col-span-1 flex gap-2">
              <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => removeSubject(idx)}>
                −
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" className="rounded-xl" onClick={addSubject}>
          + Add subject block
        </Button>
      </div>

      {lastValidation ? (
        <div
          className={cn(
            'rounded-xl border p-4 mb-4 text-sm',
            lastValidation.valid ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50',
          )}
        >
          <div className="flex items-center gap-2 font-bold mb-2">
            {lastValidation.valid ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            {lastValidation.valid ? 'Blueprint structure OK' : 'Fix errors before generating'}
          </div>
          {lastValidation.errors.length > 0 ? (
            <ul className="list-disc pl-5 text-rose-800 space-y-1">
              {lastValidation.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          ) : null}
          {lastValidation.warnings.length > 0 ? (
            <ul className="list-disc pl-5 text-amber-900 space-y-1 mt-2">
              {lastValidation.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" className="rounded-xl" disabled={validating} onClick={() => runValidate()}>
          {validating ? 'Checking…' : 'Validate now'}
        </Button>
        <Button
          type="button"
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
          disabled={generating || (lastValidation && !lastValidation.valid)}
          onClick={handleGenerate}
        >
          {generating ? 'Generating…' : 'Generate paper'}
        </Button>
      </div>
    </section>
  );
}
