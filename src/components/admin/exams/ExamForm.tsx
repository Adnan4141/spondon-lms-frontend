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
import { Calendar, Clock, BookOpen, MapPin, Layers, Settings2, ShieldCheck, Activity, Trophy, FileText, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const examTypeOptions: ExamType[] = ['PRACTICE', 'SCHEDULED', 'MODEL', 'TALENT_HUNT', 'UNIVERSITY'];
const examModeOptions: ExamMode[] = ['ONLINE', 'OFFLINE', 'WRITTEN'];
const examStatusOptions: ExamStatus[] = ['DRAFT', 'PUBLISHED', 'CLOSED'];
const solveSheetOptions = [
  { value: 'HIDDEN', label: 'Hidden' },
  { value: 'IMMEDIATELY', label: 'Immediately after exam' },
  { value: 'SCHEDULED', label: 'Scheduled time' },
];

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
    settings: {},
    showLeaderboard: false,
    solveSheetVisibility: 'HIDDEN',
    solveSheetScheduledAt: undefined,
    language: 'bn',
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
        settings: exam.settings || {},
        showLeaderboard: exam.showLeaderboard ?? false,
        solveSheetVisibility: exam.solveSheetVisibility || 'HIDDEN',
        solveSheetScheduledAt: exam.solveSheetScheduledAt ? new Date(exam.solveSheetScheduledAt).toISOString().slice(0, 16) : undefined,
        language: exam.language || 'bn',
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
      setError('Title, Course, and Branch are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const payload: any = {
        ...form,
        title: form.title.trim(),
        startAt: form.startAt || undefined,
        endAt: form.endAt || undefined,
        solveSheetScheduledAt: form.solveSheetVisibility === 'SCHEDULED' && form.solveSheetScheduledAt ? form.solveSheetScheduledAt : undefined,
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
    <div className="flex min-h-0 max-h-[min(88vh,calc(92vh-7rem))] flex-1 flex-col bg-white text-slate-900">
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8 no-scrollbar">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Identity */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-2">
              <label className={sectionLabel}>Exam Title</label>
              <Input
                className={cn(inputClass, "h-14 text-lg")}
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Weekly Model Test - Physics"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
               <div className="space-y-2">
                  <label className={sectionLabel}><Calendar className="inline h-3 w-3 mr-1" /> Start Date & Time</label>
                  <DateTimePicker
                    date={form.startAt ? new Date(form.startAt) : undefined}
                    setDate={(date) => setForm((p) => ({ ...p, startAt: date ? date.toISOString() : '' }))}
                    placeholder="Set start time..."
                  />
               </div>
               <div className="space-y-2">
                  <label className={sectionLabel}><Calendar className="inline h-3 w-3 mr-1" /> End Date & Time</label>
                  <DateTimePicker
                    date={form.endAt ? new Date(form.endAt) : undefined}
                    setDate={(date) => setForm((p) => ({ ...p, endAt: date ? date.toISOString() : '' }))}
                    placeholder="Set end time..."
                  />
               </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
               <div className="space-y-2">
                  <label className={sectionLabel}><Clock className="inline h-3 w-3 mr-1" /> Duration (Minutes)</label>
                  <Input 
                    type="number" 
                    className={inputClass} 
                    value={form.durationMinutes || ''} 
                    onChange={(e) => setForm((p) => ({ ...p, durationMinutes: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="e.g., 60"
                  />
               </div>
               <div className="space-y-2">
                  <label className={sectionLabel}><ShieldCheck className="inline h-3 w-3 mr-1" /> Allowed Attempts</label>
                  <Input 
                    type="number" 
                    className={inputClass} 
                    value={form.allowedAttempts ?? 1} 
                    onChange={(e) => setForm((p) => ({ ...p, allowedAttempts: Number(e.target.value) || 1 }))}
                    min={1}
                  />
               </div>
               <div className="space-y-2">
                  <label className={sectionLabel}><Activity className="inline h-3 w-3 mr-1" /> Status</label>
                  <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as ExamStatus }))}>
                     <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner"><SelectValue /></SelectTrigger>
                     <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                        {examStatusOptions.map(o => <SelectItem key={o} value={o} className="font-bold text-sm py-3">{o}</SelectItem>)}
                     </SelectContent>
                  </Select>
               </div>
            </div>

            {/* Solve Sheet & Leaderboard Section */}
            <div className="rounded-2xl border border-slate-200 p-6 space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-2">
                <Eye className="h-3.5 w-3.5" /> Solution Sheet & Leaderboard
              </h3>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={sectionLabel}><FileText className="inline h-3 w-3 mr-1" /> Solve Sheet Visibility</label>
                  <Select 
                    value={form.solveSheetVisibility || 'HIDDEN'} 
                    onValueChange={(v) => setForm((p) => ({ ...p, solveSheetVisibility: v }))}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                      {solveSheetOptions.map(o => <SelectItem key={o.value} value={o.value} className="font-bold text-sm py-3">{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {form.solveSheetVisibility === 'SCHEDULED' && (
                  <div className="space-y-2">
                    <label className={sectionLabel}><Calendar className="inline h-3 w-3 mr-1" /> Solve Sheet Date</label>
                    <DateTimePicker
                      date={form.solveSheetScheduledAt ? new Date(form.solveSheetScheduledAt) : undefined}
                      setDate={(date) => setForm((p) => ({ ...p, solveSheetScheduledAt: date ? date.toISOString() : undefined }))}
                      placeholder="When to show solutions..."
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <div>
                    <span className="text-sm font-black text-slate-700">Leaderboard</span>
                    <p className="text-xs text-slate-400">Show ranking to students after exam</p>
                  </div>
                </div>
                <Switch
                  checked={form.showLeaderboard ?? false}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, showLeaderboard: v }))}
                />
              </div>
            </div>
          </div>

          {/* Configuration Sidebar */}
          <div className="space-y-8 lg:border-l lg:pl-8 border-slate-100">
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className={sectionLabel}><BookOpen className="inline h-3 w-3 mr-1" /> Course</label>
                   <Select value={form.courseId} onValueChange={(v) => setForm((p) => ({ ...p, courseId: v, batchId: undefined }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                         <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         {courses.map(c => <SelectItem key={c.id} value={c.id} className="text-sm font-medium">{c.name}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                   <label className={sectionLabel}><MapPin className="inline h-3 w-3 mr-1" /> Branch</label>
                   <Select value={form.branchId} onValueChange={(v) => setForm((p) => ({ ...p, branchId: v, batchId: undefined }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                         <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         {branches.map(b => <SelectItem key={b.id} value={b.id} className="text-sm font-medium">{b.name}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                   <label className={sectionLabel}><Layers className="inline h-3 w-3 mr-1" /> Batch</label>
                   <Select 
                     value={form.batchId || 'all'} 
                     onValueChange={(v) => setForm((p) => ({ ...p, batchId: v === 'all' ? undefined : v }))}
                     disabled={!form.courseId || !form.branchId}
                   >
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
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
                      <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as ExamType }))}>
                         <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner"><SelectValue /></SelectTrigger>
                         <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                            {examTypeOptions.map(o => <SelectItem key={o} value={o} className="font-bold text-xs uppercase py-3">{o.replace('_', ' ')}</SelectItem>)}
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                      <label className={sectionLabel}>Mode</label>
                      <Select value={form.mode} onValueChange={(v) => setForm((p) => ({ ...p, mode: v as ExamMode }))}>
                         <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner"><SelectValue /></SelectTrigger>
                         <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                            {examModeOptions.map(o => <SelectItem key={o} value={o} className="font-bold text-xs uppercase py-3">{o}</SelectItem>)}
                         </SelectContent>
                      </Select>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className={sectionLabel}>🌐 Question Language</label>
                   <Select value={form.language || 'bn'} onValueChange={(v) => setForm((p) => ({ ...p, language: v }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         <SelectItem value="bn" className="font-bold text-sm py-3">বাংলা (Bangla)</SelectItem>
                         <SelectItem value="en" className="font-bold text-sm py-3">English</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             </div>

             {/* Info Box */}
             <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Exam Setup Guide</p>
                <ul className="space-y-2 text-sm font-medium text-slate-300">
                  <li>• <strong className="text-white">ONLINE</strong> — Browser exam: MCQ auto-graded; CQ (written) typed and pending teacher marks</li>
                  <li>• <strong className="text-white">OFFLINE</strong> — Hall exam: PDF includes MCQ + written parts; portal shows download + instructions</li>
                  <li>• <strong className="text-white">TALENT HUNT</strong> — Multiple sets, mixed subjects</li>
                  <li>• <strong className="text-white">UNIVERSITY</strong> — Model test style sets</li>
                </ul>
             </div>
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-600 flex items-center gap-3">
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
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-[2] h-12 rounded-2xl bg-slate-900 font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {submitting ? 'Saving...' : isEdit ? 'Update Exam' : 'Create Exam'}
          </Button>
        </div>
      </div>
    </div>
  );
}
