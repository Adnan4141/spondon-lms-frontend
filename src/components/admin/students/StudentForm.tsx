'use client';

import { useState, useEffect } from 'react';
import { createStudent, updateStudent } from '@/lib/api/students';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import type { Student, CreateStudentDto, UpdateStudentDto, UserStatus, Branch, Institute } from '@/types/student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, User, Phone, Mail, Lock, MapPin, Building2, ShieldCheck, HeartPulse, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1';

function parseDateInput(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDateInput(date?: Date): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface StudentFormProps {
  branches: Branch[];
  institutes: Institute[];
  student?: Student | null;
  onSuccess: () => Promise<void>;
}

export function StudentForm({ branches, institutes, student, onSuccess }: StudentFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  
  const [form, setForm] = useState<CreateStudentDto>({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    branchId: '',
    status: 'ACTIVE',
    fatherName: '',
    motherName: '',
    dob: '',
    bloodGroup: '',
    gender: '',
    primaryMobile: '',
    secondaryMobile: '',
    address: '',
    instituteId: '',
    registrationNumber: '',
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!student;

  useEffect(() => {
    if (student) {
      setForm({
        fullName: student.fullName,
        email: student.email || '',
        mobile: student.mobile,
        password: '',
        branchId: student.branchId || '',
        status: student.status,
        fatherName: student.studentProfile?.fatherName || '',
        motherName: student.studentProfile?.motherName || '',
        dob: student.studentProfile?.dob || '',
        bloodGroup: student.studentProfile?.bloodGroup || '',
        gender: student.studentProfile?.gender || '',
        primaryMobile: student.studentProfile?.primaryMobile || '',
        secondaryMobile: student.studentProfile?.secondaryMobile || '',
        address: student.studentProfile?.address || '',
        instituteId: student.studentProfile?.instituteId || '',
        registrationNumber: student.studentProfile?.registrationNumber || '',
      });
    }
  }, [student]);

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.mobile.trim() || (!isEdit && !form.password.trim())) {
      setError('Identity, mobile, and security credentials are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      if (isEdit && student) {
        const { password, ...updateData } = form;
        const payload: UpdateStudentDto = {
          ...updateData,
          password: password || undefined,
        };
        await updateStudent(student.id, payload);
      } else {
        await createStudent(form);
      }
      
      toast({
        title: 'Success',
        description: `Student account ${isEdit ? 'updated' : 'initialized'} successfully`,
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
          {/* Core Identity */}
          <section className="space-y-6">
             <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Account Credentials</h3>
             </div>
             <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                   <label className={sectionLabel}>Full Legal Name</label>
                   <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input className={cn(inputClass, "pl-11")} value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="e.g., Harper Nelson" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Primary Mobile</label>
                   <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input className={cn(inputClass, "pl-11")} value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} placeholder="01XXX-XXXXXX" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Email Address</label>
                   <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input className={cn(inputClass, "pl-11")} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="student@example.com" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>{isEdit ? 'Update Password' : 'Access Password'}</label>
                   <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input className={cn(inputClass, "pl-11")} type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder={isEdit ? 'Leave blank to retain' : '••••••••'} />
                   </div>
                </div>
             </div>
          </section>

          {/* Institutional Assignment */}
          <section className="space-y-6">
             <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Institutional Context</h3>
             </div>
             <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                   <label className={sectionLabel}>Branch Designation</label>
                   <Select value={form.branchId} onValueChange={v => setForm(p => ({ ...p, branchId: v }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                         <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         {branches.map(b => <SelectItem key={b.id} value={b.id} className="text-sm font-medium">{b.name}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Account Status</label>
                   <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as UserStatus }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         <SelectItem value="ACTIVE" className="text-sm font-medium">ACTIVE</SelectItem>
                         <SelectItem value="BLOCKED" className="text-sm font-medium">BLOCKED</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             </div>
          </section>

          {/* Extended Profile */}
          <section className="space-y-6 border-t border-slate-100 pt-10">
             <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-violet-600" />
                <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Extended Bio-Data</h3>
             </div>
             <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                   <label className={sectionLabel}>Father's Identity</label>
                   <Input className={inputClass} value={form.fatherName} onChange={e => setForm(p => ({ ...p, fatherName: e.target.value }))} placeholder="Legal father name" />
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Mother's Identity</label>
                   <Input className={inputClass} value={form.motherName} onChange={e => setForm(p => ({ ...p, motherName: e.target.value }))} placeholder="Legal mother name" />
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Date of Birth</label>
                   <Popover>
                      <PopoverTrigger asChild>
                         <Button variant="outline" className={cn("w-full h-12 justify-start rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700", !form.dob && "text-slate-400")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.dob ? parseDateInput(form.dob)?.toLocaleDateString() : 'Pick birth date'}
                         </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl border border-slate-200" align="start">
                         <Calendar selected={parseDateInput(form.dob)} onSelect={date => setForm(p => ({ ...p, dob: formatDateInput(date) }))} />
                      </PopoverContent>
                   </Popover>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className={sectionLabel}>Gender</label>
                      <Input className={inputClass} value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} placeholder="Gender" />
                   </div>
                   <div className="space-y-2">
                      <label className={sectionLabel}>Blood Group</label>
                      <Input className={inputClass} value={form.bloodGroup} onChange={e => setForm(p => ({ ...p, bloodGroup: e.target.value }))} placeholder="e.g., A+" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Registration Reference</label>
                   <Input className={inputClass} value={form.registrationNumber} onChange={e => setForm(p => ({ ...p, registrationNumber: e.target.value }))} placeholder="Institutional ID" />
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>External Institute</label>
                   <Select value={form.instituteId} onValueChange={v => setForm(p => ({ ...p, instituteId: v }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                         <SelectValue placeholder="Select Institute" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         {institutes.map(ins => <SelectItem key={ins.id} value={ins.id} className="text-sm font-medium">{ins.name}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                   <label className={sectionLabel}>Residential Address</label>
                   <textarea className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner" rows={3} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Complete physical address..." />
                </div>
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
            {submitting ? 'Processing...' : isEdit ? 'Commit Updates' : 'Authorize Student'}
          </Button>
        </div>
      </div>
    </div>
  );
}
