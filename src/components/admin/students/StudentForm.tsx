'use client';

import { useState, useEffect } from 'react';
import { updateStudent } from '@/lib/api/students';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import type { Student, CreateStudentDto, UpdateStudentDto, UserStatus, Branch, Institute, SmsAlertTo } from '@/types/student';
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
import { CalendarIcon, User, Phone, Mail, Lock, MapPin, Building2, ShieldCheck, HeartPulse, Fingerprint, Info, GraduationCap, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

export function InstituteCombobox({
  institutes,
  value,
  onSelect,
  placeholder = 'Search...',
}: {
  institutes: Institute[];
  value: string;
  onSelect: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = institutes.find((i) => i.id === value);
  const filtered = institutes.filter(
    (i) =>
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.eiin && i.eiin.includes(search))
  );
  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(''); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-12 w-full justify-between rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner"
        >
          <span className={selected ? '' : 'text-slate-400'}>{selected?.name || placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-slate-200 shadow-xl" align="start">
        <div className="p-2 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or EIIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 rounded-xl border-slate-200"
            />
          </div>
        </div>
        <div className="max-h-[240px] overflow-y-auto p-1">
          <button
            type="button"
            onClick={() => {
              onSelect('');
              setOpen(false);
            }}
            className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-slate-100"
          >
            None
          </button>
          {filtered.map((ins) => (
            <button
              key={ins.id}
              type="button"
              onClick={() => {
                onSelect(ins.id);
                setOpen(false);
              }}
              className={cn(
                'w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-slate-100 flex items-center justify-between',
                value === ins.id && 'bg-indigo-50 text-indigo-700'
              )}
            >
              <span>{ins.name}</span>
              {ins.eiin && <span className="text-xs text-slate-400 font-mono">{ins.eiin}</span>}
            </button>
          ))}
          {filtered.length === 0 && search && (
            <p className="py-4 text-center text-sm text-slate-400">No institute found</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner outline-none';
const sectionLabel = 'text-xs font-bold text-slate-500 mb-2 block';

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
  student: Student;
  onSuccess: () => Promise<void>;
}

type EditFormState = Omit<CreateStudentDto, 'registrationNumber'>;

export function StudentForm({ branches, institutes, student, onSuccess }: StudentFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();

  const [form, setForm] = useState<EditFormState>({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    branchId: '',
    status: 'ACTIVE',
    fatherName: '',
    motherName: '',
    fatherMobile: '',
    motherMobile: '',
    dob: '',
    bloodGroup: '',
    gender: '',
    primaryMobile: '',
    secondaryMobile: '',
    address: '',
    instituteId: '',
    smsAlertTo: [],
    sscInfo: undefined,
    hscInfo: undefined,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      fullName: student.fullName,
      email: student.email || '',
      mobile: student.mobile,
      password: '',
      branchId: student.branchId || '',
      status: student.status,
      fatherName: student.studentProfile?.fatherName || '',
      motherName: student.studentProfile?.motherName || '',
      fatherMobile: student.studentProfile?.fatherMobile || '',
      motherMobile: student.studentProfile?.motherMobile || '',
      dob: student.studentProfile?.dob || '',
      bloodGroup: student.studentProfile?.bloodGroup || '',
      gender: student.studentProfile?.gender || '',
      primaryMobile: student.studentProfile?.primaryMobile || '',
      secondaryMobile: student.studentProfile?.secondaryMobile || '',
      address: student.studentProfile?.address || '',
      instituteId: student.studentProfile?.instituteId || '',
      smsAlertTo: (student.studentProfile?.smsAlertTo as SmsAlertTo[] | undefined) || [],
      sscInfo: student.studentProfile?.sscInfo,
      hscInfo: student.studentProfile?.hscInfo,
    });
  }, [student]);

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.mobile.trim()) {
      setError('Name and mobile are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const { password, ...rest } = form;
      const payload: UpdateStudentDto = {
        ...rest,
        password: password?.trim() ? password : undefined,
      };
      await updateStudent(student.id, payload);

      toast({
        title: 'Success',
        description: 'Student updated successfully',
        variant: 'success',
      });

      closeModal();
      await onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Processing failed';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
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
              { label: 'Account', value: 'account', icon: ShieldCheck },
              { label: 'Branch & Institute', value: 'institutional', icon: Building2 },
              { label: 'Personal', value: 'personal', icon: Fingerprint },
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
                   <h3 className="text-base font-black text-slate-800">Account</h3>
                   <p className="text-xs text-slate-400">Login & contact</p>
                </div>
             </div>
             
             <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-2">
                   <label className={sectionLabel}>Name</label>
                   <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <Input className={cn(inputClass, "pl-11")} value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="Student name" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Mobile</label>
                   <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <Input className={cn(inputClass, "pl-11")} value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} placeholder="01XXX-XXXXXX" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Email</label>
                   <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input className={cn(inputClass, "pl-11")} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Email (optional)" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Password</label>
                   <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                      <Input className={cn(inputClass, "pl-11")} type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Leave blank to keep current password" />
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
                   <h3 className="text-base font-black text-slate-800">Branch & Institute</h3>
                   <p className="text-xs text-slate-400">Roll / registration is assigned by the system</p>
                </div>
             </div>

             <div className="grid gap-8 sm:grid-cols-2">
                {student.studentProfile?.registrationNumber ? (
                  <div className="space-y-2 sm:col-span-2">
                    <label className={sectionLabel}>Roll / registration no.</label>
                    <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-100/80 px-4 font-mono text-base font-black tracking-widest text-slate-800">
                      {student.studentProfile.registrationNumber}
                    </div>
                  </div>
                ) : null}
                <div className="space-y-2">
                   <label className={sectionLabel}>Branch</label>
                   <Select value={form.branchId} onValueChange={v => setForm(p => ({ ...p, branchId: v }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                         <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         {branches.map(b => <SelectItem key={b.id} value={b.id} className="text-sm font-medium">{b.name}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Status</label>
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
                <div className="space-y-2 sm:col-span-2">
                   <label className={sectionLabel}>Institute</label>
                    <InstituteCombobox
                      institutes={institutes}
                      value={form.instituteId ?? ''}
                     onSelect={(v) => setForm(p => ({ ...p, instituteId: v }))}
                     placeholder="Search institute..."
                   />
                </div>
             </div>
          </TabsContent>

          <TabsContent value="personal" className="m-0 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-2">
                   <label className={sectionLabel}>Father's Name</label>
                   <Input className={inputClass} value={form.fatherName} onChange={e => setForm(p => ({ ...p, fatherName: e.target.value }))} placeholder="Father's name" />
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Mother's Name</label>
                   <Input className={inputClass} value={form.motherName} onChange={e => setForm(p => ({ ...p, motherName: e.target.value }))} placeholder="Mother's name" />
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Father's Mobile</label>
                   <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input className={cn(inputClass, "pl-11")} value={form.fatherMobile} onChange={e => setForm(p => ({ ...p, fatherMobile: e.target.value }))} placeholder="01XXX-XXXXXX" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Mother's Mobile</label>
                   <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input className={cn(inputClass, "pl-11")} value={form.motherMobile} onChange={e => setForm(p => ({ ...p, motherMobile: e.target.value }))} placeholder="01XXX-XXXXXX" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={sectionLabel}>Date of Birth</label>
                   <Popover>
                      <PopoverTrigger asChild>
                         <Button variant="outline" className={cn("w-full h-12 justify-start rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700", !form.dob && "text-slate-400")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.dob ? format(parseDateInput(form.dob)!, 'dd-MM-yyyy') : 'Select date'}
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
                      <Select value={form.bloodGroup} onValueChange={v => setForm(p => ({ ...p, bloodGroup: v }))}>
                         <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                            <SelectValue placeholder="Select blood group" />
                         </SelectTrigger>
                         <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                            <SelectItem value="A+" className="text-sm font-medium">A+</SelectItem>
                            <SelectItem value="A-" className="text-sm font-medium">A-</SelectItem>
                            <SelectItem value="B+" className="text-sm font-medium">B+</SelectItem>
                            <SelectItem value="B-" className="text-sm font-medium">B-</SelectItem>
                            <SelectItem value="AB+" className="text-sm font-medium">AB+</SelectItem>
                            <SelectItem value="AB-" className="text-sm font-medium">AB-</SelectItem>
                            <SelectItem value="O+" className="text-sm font-medium">O+</SelectItem>
                            <SelectItem value="O-" className="text-sm font-medium">O-</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-6 sm:col-span-2">
                   <div className="space-y-2">
                     <label className={sectionLabel}>SSC Result (GPA)</label>
                     <Input className={inputClass} value={(typeof form.sscInfo === 'object' && form.sscInfo?.gpa != null ? String(form.sscInfo.gpa) : '') || ''} onChange={e => setForm(p => ({ ...p, sscInfo: { ...(typeof p.sscInfo === 'object' && p.sscInfo ? p.sscInfo : {}), gpa: e.target.value || undefined } }))} placeholder="e.g. 5.00" />
                   </div>
                   <div className="space-y-2">
                     <label className={sectionLabel}>HSC Result (GPA)</label>
                     <Input className={inputClass} value={(typeof form.hscInfo === 'object' && form.hscInfo?.gpa != null ? String(form.hscInfo.gpa) : '') || ''} onChange={e => setForm(p => ({ ...p, hscInfo: { ...(typeof p.hscInfo === 'object' && p.hscInfo ? p.hscInfo : {}), gpa: e.target.value || undefined } }))} placeholder="e.g. 5.00" />
                   </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                   <label className={sectionLabel}>SMS alerts to (attendance, results)</label>
                   <div className="flex flex-wrap gap-6">
                     {(['SELF', 'FATHER', 'MOTHER'] as const).map(opt => (
                       <label key={opt} className="flex items-center gap-2 cursor-pointer">
                         <Checkbox
                           checked={form.smsAlertTo?.includes(opt)}
                           onCheckedChange={(checked) => setForm(p => ({ ...p, smsAlertTo: checked ? [...(p.smsAlertTo || []), opt] : (p.smsAlertTo || []).filter(x => x !== opt) }))}
                         />
                         <span className="text-sm font-bold text-slate-700">{opt}</span>
                       </label>
                     ))}
                   </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                   <label className={sectionLabel}>Address</label>
                   <textarea 
                     className="w-full rounded-[24px] border border-slate-200 bg-slate-50/50 px-5 py-4 text-base font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner" 
                     rows={3} 
                     value={form.address} 
                     onChange={e => setForm(p => ({ ...p, address: e.target.value }))} 
                     placeholder="Address" 
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
              className="flex-1 h-14 rounded-2xl border-slate-700 bg-slate-800 font-black uppercase tracking-[0.2em] text-[11px] text-white hover:bg-slate-900 hover:text-white transition-all shadow-sm"
              onClick={closeModal}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-[2] h-14 rounded-2xl bg-slate-900 font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {submitting ? 'Saving...' : 'Update'}
            </Button>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
