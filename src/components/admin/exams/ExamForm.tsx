'use client';

import { useState, useEffect } from 'react';
import { createExam, updateExam } from '@/lib/api/exams';
import { type Exam, type ExamType, type ExamMode, type ExamStatus, type CreateExamDto, type UpdateExamDto } from '@/types/exam';
import { getBatches, type Batch } from '@/lib/api/batches';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { Calendar, Clock, BookOpen, MapPin, Layers, Settings2, ShieldCheck, Activity, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const examTypeOptions: ExamType[] = ['PRACTICE', 'SCHEDULED', 'MODEL', 'TALENT_HUNT', 'UNIVERSITY'];
const examModeOptions: ExamMode[] = ['ONLINE', 'OFFLINE'];
const examStatusOptions: ExamStatus[] = ['DRAFT', 'PUBLISHED', 'CLOSED'];

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block';

interface ExamFormProps {
  courses: Course[];
  branches: Branch[];
  exam?: Exam | null;
  onSuccess: () => Promise<void>;
}

export function ExamForm({ courses, branches, exam, onSuccess }: ExamFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  const [form, setForm] = useState<CreateExamDto>({
    courseId: '',
    branchId: '',
    batchId: undefined,
    title: '',
    type: 'PRACTICE',
    mode: 'ONLINE',
    startAt: '',
    endAt: '',
    durationMinutes: undefined,
    allowedAttempts: 1,
    status: 'DRAFT',
    settings: { leaderboardEnabled: false },
  });
  const [batches, setBatches] = useState<Batch[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!exam;

  useEffect(() => {
    if (exam) {
      setForm({
        courseId: exam.courseId,
        branchId: exam.branchId,
        batchId: exam.batchId || undefined,
        title: exam.title,
        type: exam.type,
        mode: exam.mode,
        startAt: exam.startAt ? new Date(exam.startAt).toISOString().slice(0, 16) : '',
        endAt: exam.endAt ? new Date(exam.endAt).toISOString().slice(0, 16) : '',
        durationMinutes: exam.durationMinutes || undefined,
        allowedAttempts: exam.allowedAttempts,
        status: exam.status,
        settings: exam.settings || { leaderboardEnabled: false },
      });
    }
  }, [exam]);

  useEffect(() => {
    const loadBatches = async () => {
      if (form.courseId && form.branchId) {
        try {
          const res = await getBatches({ courseId: form.courseId, branchId: form.branchId });
          if (res.success && res.data) setBatches(res.data);
        } catch (err) { console.error(err); }
      } else {
        setBatches([]);
      }
    };
    loadBatches();
  }, [form.courseId, form.branchId]);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.courseId || !form.branchId) {
      setError('Title, Course, and Branch are required identifiers.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const payload = {
        ...form,
        title: form.title.trim(),
        startAt: form.startAt || undefined,
        endAt: form.endAt || undefined,
        settings: { leaderboardEnabled: (form as any).settings?.leaderboardEnabled ?? false },
      };

      if (isEdit && exam) {
        await updateExam(exam.id, payload as UpdateExamDto);
      } else {
        await createExam(payload as CreateExamDto);
      }
      
      toast({
        title: 'Success',
        description: `Exam ${isEdit ? 'updated' : 'created'} successfully`,
        variant: 'success',
      });
      
      closeModal();
      await onSuccess();
    } catch (err: any) {
      const errorMsg = err.message || `Failed to process exam`;
      setError(errorMsg);
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 no-scrollbar">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Identity */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-2">
              <label className={sectionLabel}>Exam Identity & Title</label>
              <Input
                className={cn(inputClass, "h-14 text-lg")}
                value={form.title}
                onChange={(e) => setForm((prev: CreateExamDto) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Weekly Model Test - Physics"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
               <div className="space-y-2">
                  <label className={sectionLabel}><Calendar className="inline h-3 w-3 mr-1" /> Start Date & Time</label>
                  <DateTimePicker
                    date={form.startAt ? new Date(form.startAt) : undefined}
                    setDate={(date) => {
                      setForm((p: CreateExamDto) => ({ ...p, startAt: date ? date.toISOString() : '' }));
                    }}
                    placeholder="Set commencement..."
                  />
               </div>
               <div className="space-y-2">
                  <label className={sectionLabel}><Calendar className="inline h-3 w-3 mr-1" /> Conclusion Date & Time</label>
                  <DateTimePicker
                    date={form.endAt ? new Date(form.endAt) : undefined}
                    setDate={(date) => {
                      setForm((p: CreateExamDto) => ({ ...p, endAt: date ? date.toISOString() : '' }));
                    }}
                    placeholder="Set expiration..."
                  />
               </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
               <div className="space-y-2">
                  <label className={sectionLabel}><Clock className="inline h-3 w-3 mr-1" /> Duration (Minutes)</label>
                  <Input 
                    type="number" 
                    className={inputClass} 
                    value={form.durationMinutes || ''} 
                    onChange={(e) => setForm((p: CreateExamDto) => ({ ...p, durationMinutes: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="e.g., 60"
                  />
               </div>
               <div className="space-y-2">
                  <label className={sectionLabel}><ShieldCheck className="inline h-3 w-3 mr-1" /> Allowed Attempts</label>
                  <Input 
                    type="number" 
                    className={inputClass} 
                    value={form.allowedAttempts} 
                    onChange={(e) => setForm((p: CreateExamDto) => ({ ...p, allowedAttempts: Number(e.target.value) }))}
                  />
               </div>
            </div>
          </div>

          {/* Configuration Sidebar */}
          <div className="space-y-8 lg:border-l lg:pl-8 border-slate-100">
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className={sectionLabel}><BookOpen className="inline h-3 w-3 mr-1" /> Course</label>
                   <Select value={form.courseId} onValueChange={(v) => setForm((p: CreateExamDto) => ({ ...p, courseId: v, batchId: undefined }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700">
                         <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         {courses.map(c => <SelectItem key={c.id} value={c.id} className="text-sm font-medium">{c.name}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                   <label className={sectionLabel}><MapPin className="inline h-3 w-3 mr-1" /> Branch</label>
                   <Select value={form.branchId} onValueChange={(v) => setForm((p: CreateExamDto) => ({ ...p, branchId: v, batchId: undefined }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700">
                         <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         {branches.map(b => <SelectItem key={b.id} value={b.id} className="text-sm font-medium">{b.name}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                   <label className={sectionLabel}><Layers className="inline h-3 w-3 mr-1" /> Batch (Targeted)</label>
                   <Select 
                     value={form.batchId || 'all'} 
                     onValueChange={(v) => setForm((p: CreateExamDto) => ({ ...p, batchId: v === 'all' ? undefined : v }))}
                     disabled={!form.courseId || !form.branchId}
                   >
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700">
                         <SelectValue placeholder="All Batches" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         <SelectItem value="all" className="text-sm font-medium">All Batches</SelectItem>
                         {batches.map(b => <SelectItem key={b.id} value={b.id} className="text-sm font-medium">{b.name}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className={sectionLabel}>Type</label>
                      <Select value={form.type} onValueChange={(v) => setForm((p: CreateExamDto) => ({ ...p, type: v as ExamType }))}>
                         <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700"><SelectValue /></SelectTrigger>
                         <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                            {examTypeOptions.map(o => <SelectItem key={o} value={o} className="font-bold text-[10px] uppercase tracking-widest py-3">{o}</SelectItem>)}
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                      <label className={sectionLabel}>Mode</label>
                      <Select value={form.mode} onValueChange={(v) => setForm((p: CreateExamDto) => ({ ...p, mode: v as ExamMode }))}>
                         <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700"><SelectValue /></SelectTrigger>
                         <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                            {examModeOptions.map(o => <SelectItem key={o} value={o} className="font-bold text-[10px] uppercase tracking-widest py-3">{o}</SelectItem>)}
                         </SelectContent>
                      </Select>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className={sectionLabel}><Activity className="inline h-3 w-3 mr-1" /> Lifecycle Status</label>
                   <Select value={form.status} onValueChange={(v) => setForm((p: CreateExamDto) => ({ ...p, status: v as ExamStatus }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         {examStatusOptions.map(o => <SelectItem key={o} value={o} className="font-bold text-[10px] uppercase tracking-widest py-3">{o}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3">
                   <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">Leaderboard</span>
                   </div>
                   <Switch
                     checked={(form as any).settings?.leaderboardEnabled ?? false}
                     onCheckedChange={(v) => setForm((p: CreateExamDto) => ({
                       ...p,
                       settings: { ...(p as any).settings, leaderboardEnabled: v },
                     }))}
                   />
                </div>
             </div>

             <div className="rounded-[28px] bg-slate-900 p-6 text-white shadow-xl shadow-slate-200">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Scheduler Context</p>
                <p className="text-base font-bold leading-relaxed text-slate-300">
                  Configure exam visibility and access rules. Start and End times control when students can enter the assessment.
                </p>
             </div>
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-base font-bold text-rose-600 uppercase tracking-widest flex items-center gap-3">
             <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
             {error}
          </div>
        )}
      </div>

      <div className="mt-auto shrink-0 border-t border-slate-100 bg-slate-50/80 px-8 pb-8 pt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-2xl border-slate-200 bg-white font-black uppercase tracking-[0.2em] text-[11px] text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all"
            onClick={closeModal}
          >
            Discard
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-[2] h-12 rounded-2xl bg-slate-900 font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {submitting ? 'Processing...' : isEdit ? 'Update Baseline' : 'Authorize Exam'}
          </Button>
        </div>
      </div>
    </div>
  );
}
