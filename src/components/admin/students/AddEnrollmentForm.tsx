'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useModalStore } from '@/store/modalStore';
import { getCourses, type Course } from '@/lib/api/courses';
import { getBranches, type Branch } from '@/lib/api/branches';
import { getBatches, type Batch } from '@/lib/api/batches';
import { getPrograms, getProgramById, type Program } from '@/lib/api/programs';
import { createEnrollment, type EnrollmentStatusType } from '@/lib/api/enrollments';
import { GraduationCap, Building2, Users, Calendar, Check, Library, Layers, BookOpen, CheckCircle2 } from 'lucide-react';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner outline-none';
const sectionLabel = 'text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1';

interface AddEnrollmentFormProps {
  studentId: string;
  defaultBranchId?: string;
  onSuccess: () => Promise<void>;
}

export function AddEnrollmentForm({ studentId, defaultBranchId, onSuccess }: AddEnrollmentFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [programCourses, setProgramCourses] = useState<Course[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    programId: '',
    branchId: defaultBranchId || '',
    status: 'ACTIVE' as EnrollmentStatusType,
    billingStartMonth: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [progRes, branchRes] = await Promise.all([
          getPrograms(),
          getBranches(),
        ]);
        if (progRes.success && progRes.data) setPrograms(progRes.data);
        if (branchRes.success && branchRes.data) setBranches(branchRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadProgramCourses = async () => {
      if (!form.programId) {
        setProgramCourses([]);
        setSelectedCourseIds([]);
        return;
      }
      try {
        setLoadingCourses(true);
        const res = await getProgramById(form.programId);
        if (res.success && res.data?.courses) {
          setProgramCourses(res.data.courses);
          // Select all by default
          setSelectedCourseIds(res.data.courses.map((c: any) => c.id));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCourses(false);
      }
    };
    loadProgramCourses();
  }, [form.programId]);

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const toggleAll = () => {
    if (selectedCourseIds.length === programCourses.length) {
      setSelectedCourseIds([]);
    } else {
      setSelectedCourseIds(programCourses.map((c) => c.id));
    }
  };

  const handleSubmit = async () => {
    if (selectedCourseIds.length === 0 || !form.branchId) {
      setError('Please select at least one course and a branch');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      
      const enrollments = selectedCourseIds.map(courseId => 
        createEnrollment({
          studentUserId: studentId,
          courseId: courseId,
          branchId: form.branchId,
          status: form.status,
          billingStartMonth: form.billingStartMonth || undefined,
        })
      );

      await Promise.all(enrollments);
      
      toast({ 
        title: 'Success', 
        description: `Enrolled student in ${selectedCourseIds.length} course${selectedCourseIds.length > 1 ? 's' : ''}`, 
        variant: 'success' 
      });
      closeModal();
      await onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to complete enrollment process');
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex items-center justify-between px-8 pt-6">
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Add Course</div>
        <Button variant="ghost" className="h-9 px-3 text-sm font-bold text-slate-500" onClick={closeModal}>
          Back
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 no-scrollbar space-y-10">
        {/* Program Selection */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Library className="h-5 w-5 text-indigo-600" />
             </div>
             <div>
                <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Academic Program</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select a program to view available courses</p>
             </div>
          </div>
          
          <div className="space-y-2">
            <label className={sectionLabel}>Program</label>
            <Select value={form.programId} onValueChange={(v) => setForm((p) => ({ ...p, programId: v }))}>
              <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 px-5 font-bold text-slate-700 shadow-inner">
                <SelectValue placeholder="Choose Academic Program" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-sm font-medium">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Course Selection Area */}
        {form.programId && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-emerald-600" />
                 </div>
                 <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Available Courses</h3>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleAll}
                className="h-8 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest px-4"
              >
                {selectedCourseIds.length === programCourses.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {loadingCourses ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
              </div>
            ) : (
              <div className="grid gap-3">
                {programCourses.length === 0 ? (
                  <div className="p-8 text-center rounded-3xl border border-dashed border-slate-200">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No courses found in this program</p>
                  </div>
                ) : (
                  programCourses.map((course) => {
                    const isSelected = selectedCourseIds.includes(course.id);
                    return (
                      <div 
                        key={course.id}
                        onClick={() => toggleCourse(course.id)}
                        className={cn(
                          "group flex items-center justify-between p-5 rounded-3xl border transition-all cursor-pointer",
                          isSelected 
                            ? "bg-indigo-50/50 border-indigo-200 shadow-sm" 
                            : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                            isSelected ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-300"
                          )}>
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className={cn("text-base font-black transition-colors", isSelected ? "text-indigo-900" : "text-slate-700")}>
                              {course.name}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CODE: {course.code}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </section>
        )}

        {/* Branch & Settings */}
        <section className="space-y-8 border-t border-slate-100 pt-10">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-rose-600" />
             </div>
             <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Enrollment Settings</h3>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-2">
              <label className={sectionLabel}>Campus Branch</label>
              <Select
                value={form.branchId}
                onValueChange={(v) => setForm((p) => ({ ...p, branchId: v, batchId: '' }))}
              >
                <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 px-5 font-bold text-slate-700 shadow-inner">
                  <SelectValue placeholder="Choose branch" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-sm font-medium">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className={sectionLabel}>Billing Month (YYYY-MM)</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  className={cn(inputClass, 'pl-11 h-14')}
                  value={form.billingStartMonth}
                  onChange={(e) => setForm((p) => ({ ...p, billingStartMonth: e.target.value }))}
                  placeholder="e.g., 2026-03"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
              <label className={sectionLabel}>Initial Account Status</label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as EnrollmentStatusType }))}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 px-5 font-bold text-slate-700 shadow-inner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                  <SelectItem value="ACTIVE" className="text-sm font-medium">ACTIVE</SelectItem>
                  <SelectItem value="PAUSED" className="text-sm font-medium">PAUSED</SelectItem>
                  <SelectItem value="CANCELLED" className="text-sm font-medium">CANCELLED</SelectItem>
                  <SelectItem value="COMPLETED" className="text-sm font-medium">COMPLETED</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </section>

        {error && (
          <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-5 flex items-center gap-3 animate-in shake-in duration-300">
             <div className="h-2 w-2 rounded-full bg-rose-500" />
             <p className="text-[11px] font-black uppercase tracking-widest text-rose-600">{error}</p>
          </div>
        )}
      </div>

      <div className="mt-auto shrink-0 border-t border-slate-100 bg-slate-50/30 px-8 pb-8 pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            className="flex-1 h-14 rounded-2xl border-slate-200 bg-white font-black uppercase tracking-[0.2em] text-[11px] text-slate-400 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm"
            onClick={closeModal}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || selectedCourseIds.length === 0}
            className="flex-[2] h-14 rounded-2xl bg-slate-900 font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {submitting ? 'Enrolling...' : `Complete ${selectedCourseIds.length} Enrollment${selectedCourseIds.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
