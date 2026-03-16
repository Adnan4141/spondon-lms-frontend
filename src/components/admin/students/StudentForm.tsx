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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { CalendarIcon, User, Phone, Mail, Lock, MapPin, Building2, ShieldCheck, HeartPulse, Fingerprint, Info, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner outline-none';
const sectionLabel = 'text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1';

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
      setError('Name, mobile, and password are required.');
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
        description: `Student ${isEdit ? 'updated' : 'added'} successfully`,
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
      <Tabs defaultValue="account" className="flex-1 flex flex-col min-h-0">
        <div className="px-8 pt-6 border-b border-slate-100 bg-slate-50/30">
          <TabsList className="bg-transparent gap-8 h-14 p-0">
            {[
              { label: 'Account Info', value: 'account', icon: ShieldCheck },
              { label: 'Institutional', value: 'institutional', icon: Building2 },
              { label: 'Personal Details', value: 'personal', icon: Fingerprint },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="relative h-14 rounded-none bg-transparent px-2 text-sm font-black uppercase tracking-[0.2em] text-slate-400 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 border-none transition-all after:absolute after:bottom-0 after:left-0 after:h-1 after:w-full after:rounded-full after:bg-indigo-600 after:opacity-0 data-[state=active]:after:opacity-100"
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-10 no-scrollbar">
          <TabsContent value="account" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                   <Info className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                   <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Core Identity</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Authentication & Contact Credentials</p>
                </div>
             </div>
             
             <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-2">
                   <label className={sectionLabel}>Full Legal Name</label>
                   <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <Input className={cn(inputClass, "pl-11")} value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="e.g., Harper Nelson" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Primary Mobile</label>
                   <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <Input className={cn(inputClass, "pl-11")} value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} placeholder="01XXX-XXXXXX" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Email Address</label>
                   <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input className={cn(inputClass, "pl-11")} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="student@example.com" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>{isEdit ? 'New Password' : 'Password'}</label>
                   <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                      <Input className={cn(inputClass, "pl-11")} type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder={isEdit ? 'Leave blank to keep current' : '********'} />
                   </div>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="institutional" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                   <GraduationCap className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                   <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Academic Assignment</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Branch & Registration Data</p>
                </div>
             </div>

             <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-2">
                   <label className={sectionLabel}>Assigned Branch</label>
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
                         <SelectItem value="BLOCKED" className="text-sm font-medium text-rose-600">BLOCKED</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Internal Registration ID</label>
                   <div className="relative group">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input className={cn(inputClass, "pl-11")} value={form.registrationNumber} onChange={e => setForm(p => ({ ...p, registrationNumber: e.target.value }))} placeholder="e.g., SP-2026-001" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>External Affiliation</label>
                   <Select value={form.instituteId} onValueChange={v => setForm(p => ({ ...p, instituteId: v }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                         <SelectValue placeholder="Select Institute" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         {institutes.map(ins => <SelectItem key={ins.id} value={ins.id} className="text-sm font-medium">{ins.name}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="personal" className="m-0 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-2">
                   <label className={sectionLabel}>Father's Full Name</label>
                   <Input className={inputClass} value={form.fatherName} onChange={e => setForm(p => ({ ...p, fatherName: e.target.value }))} placeholder="Father's name" />
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Mother's Full Name</label>
                   <Input className={inputClass} value={form.motherName} onChange={e => setForm(p => ({ ...p, motherName: e.target.value }))} placeholder="Mother's name" />
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Date of Birth</label>
                   <Popover>
                      <PopoverTrigger asChild>
                         <Button variant="outline" className={cn("w-full h-12 justify-start rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700", !form.dob && "text-slate-400")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.dob ? format(parseDateInput(form.dob)!, 'dd-MM-yyyy') : 'Pick birth date'}
                         </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-[28px] border border-slate-200 bg-white shadow-2xl" align="start">
                         <Calendar selected={parseDateInput(form.dob)} onSelect={date => setForm(p => ({ ...p, dob: formatDateInput(date) }))} />
                      </PopoverContent>
                   </Popover>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className={sectionLabel}>Gender</label>
                      <Select value={form.gender} onValueChange={v => setForm(p => ({ ...p, gender: v }))}>
                         <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                            <SelectValue placeholder="Select Gender" />
                         </SelectTrigger>
                         <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                            <SelectItem value="MALE" className="text-sm font-medium">MALE</SelectItem>
                            <SelectItem value="FEMALE" className="text-sm font-medium">FEMALE</SelectItem>
                            <SelectItem value="OTHER" className="text-sm font-medium">OTHER</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                      <label className={sectionLabel}>Blood Group</label>
                      <Input className={inputClass} value={form.bloodGroup} onChange={e => setForm(p => ({ ...p, bloodGroup: e.target.value }))} placeholder="e.g., A+" />
                   </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                   <label className={sectionLabel}>Residential Address</label>
                   <textarea 
                     className="w-full rounded-[24px] border border-slate-200 bg-slate-50/50 px-5 py-4 text-base font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner" 
                     rows={3} 
                     value={form.address} 
                     onChange={e => setForm(p => ({ ...p, address: e.target.value }))} 
                     placeholder="Street, city, postal code" 
                   />
                </div>
             </div>
          </TabsContent>
        </div>

        {error && (
          <div className="mx-8 mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-3 animate-in shake-in duration-300">
             <div className="h-2 w-2 rounded-full bg-rose-500" />
             {error}
          </div>
        )}

        <div className="mt-auto shrink-0 border-t border-slate-100 bg-white px-8 pb-8 pt-6">
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
              disabled={submitting}
              className="flex-[2] h-14 rounded-2xl bg-slate-900 font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {submitting ? 'Processing...' : isEdit ? 'Update Student Record' : 'Create Student Account'}
            </Button>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
