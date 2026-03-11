'use client';

import { useState, useEffect } from 'react';
import { updateEnrollment, type Enrollment, type EnrollmentStatusType, type UpdateEnrollmentDto } from '@/lib/api/enrollments';
import { getBatches, type Batch } from '@/lib/api/batches';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShieldCheck, Calendar, Activity, GraduationCap, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1';

interface EnrollmentFormProps {
  enrollment: Enrollment;
  onSuccess: () => Promise<void>;
}

export function EnrollmentForm({ enrollment, onSuccess }: EnrollmentFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [form, setForm] = useState<{
    status: EnrollmentStatusType;
    billingStartMonth: string;
    batchId: string;
  }>({
    status: (enrollment.status as EnrollmentStatusType) || 'ACTIVE',
    billingStartMonth: enrollment.billingStartMonth || '',
    batchId: enrollment.batchId || '',
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBatches = async () => {
      try {
        setLoadingBatches(true);
        const response = await getBatches({
          courseId: enrollment.courseId,
          branchId: enrollment.branchId,
        });
        if (response.success && response.data) {
          setBatches(response.data);
        }
      } catch (err) {
        console.error('Failed to load batches:', err);
      } finally {
        setLoadingBatches(false);
      }
    };
    loadBatches();
  }, [enrollment.courseId, enrollment.branchId]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      const payload: UpdateEnrollmentDto = {
        status: form.status,
        billingStartMonth: form.billingStartMonth || undefined,
        batchId: form.batchId || undefined,
      };

      await updateEnrollment(enrollment.id, payload);
      
      toast({
        title: 'Success',
        description: 'Enrollment updated successfully',
        variant: 'success',
      });
      
      closeModal();
      await onSuccess();
    } catch (err: any) {
      setError(err.message || 'Processing failed');
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 no-scrollbar">
        <div className="space-y-10">
          {/* Header Info (Read-Only) */}
          <section className="rounded-[32px] border border-slate-100 bg-slate-50/50 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">{enrollment.student?.fullName}</h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{enrollment.course?.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Current Branch</span>
                  <span className="text-base font-bold text-slate-700">{enrollment.branch?.name}</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">ID Reference</span>
                  <span className="text-base font-mono font-bold text-indigo-600">{enrollment.id.slice(0, 12)}</span>
               </div>
            </div>
          </section>

          {/* Status & Lifecycle */}
          <section className="space-y-6">
             <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-600" />
                <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Lifecycle Control</h3>
             </div>
             <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                   <label className={sectionLabel}>Enrollment Status</label>
                   <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as EnrollmentStatusType }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         <SelectItem value="ACTIVE" className="text-sm font-medium">ACTIVE</SelectItem>
                         <SelectItem value="PAUSED" className="text-sm font-medium">PAUSED</SelectItem>
                         <SelectItem value="CANCELLED" className="text-sm font-medium">CANCELLED</SelectItem>
                         <SelectItem value="COMPLETED" className="text-sm font-medium">COMPLETED</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Batch Assignment</label>
                   <Select value={form.batchId} onValueChange={v => setForm(p => ({ ...p, batchId: v }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                         <SelectValue placeholder={loadingBatches ? "Loading..." : "Select Batch"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         {batches.map(b => (
                           <SelectItem key={b.id} value={b.id} className="text-sm font-medium">
                             {b.name}
                           </SelectItem>
                         ))}
                      </SelectContent>
                   </Select>
                </div>
             </div>
          </section>

          {/* Billing Configuration */}
          <section className="space-y-6">
             <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Financial Identity</h3>
             </div>
             <div className="space-y-2">
                <label className={sectionLabel}>Billing Cycle Start (YYYY-MM)</label>
                <div className="relative group">
                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                   <Input 
                     className={cn(inputClass, "pl-11")} 
                     value={form.billingStartMonth} 
                     onChange={e => setForm(p => ({ ...p, billingStartMonth: e.target.value }))} 
                     placeholder="e.g., 2026-03" 
                   />
                </div>
                <p className="text-[10px] font-bold text-slate-400 px-1 italic">Determines the first month for invoice generation.</p>
             </div>
          </section>
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
            {submitting ? 'Processing...' : 'Commit Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
