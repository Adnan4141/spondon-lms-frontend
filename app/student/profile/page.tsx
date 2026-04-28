'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircle, Phone, Loader2, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getInstitutes } from '@/lib/api/institutes';
import {
  getStudentProfileByUserId,
  upsertStudentProfile,
  type SmsAlertTo,
} from '@/lib/api/student-profiles';
import { InstituteCombobox } from '@/features/admin/shared';
import type { Institute } from '@/types/student';

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

type LocalUser = { id: string; fullName?: string; mobile?: string; role?: string };

export default function StudentProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loginMobile, setLoginMobile] = useState('');
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [registrationNumber, setRegistrationNumber] = useState<string | null>(null);

  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [fatherMobile, setFatherMobile] = useState('');
  const [motherMobile, setMotherMobile] = useState('');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [gender, setGender] = useState('');
  const [secondaryMobile, setSecondaryMobile] = useState('');
  const [address, setAddress] = useState('');
  const [instituteId, setInstituteId] = useState('');
  const [smsAlertTo, setSmsAlertTo] = useState<SmsAlertTo[]>([]);
  const [sscGpa, setSscGpa] = useState('');
  const [hscGpa, setHscGpa] = useState('');

  const load = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const [insRes, profileRes] = await Promise.all([
        getInstitutes({ limit: 500 }),
        getStudentProfileByUserId(uid).catch(() => ({ success: false as const, data: undefined })),
      ]);
      if (insRes.success && insRes.data) setInstitutes(insRes.data);

      if (profileRes.success && profileRes.data) {
        const p = profileRes.data;
        setRegistrationNumber(p.registrationNumber ?? null);
        setFatherName(p.fatherName || '');
        setMotherName(p.motherName || '');
        setFatherMobile(p.fatherMobile || '');
        setMotherMobile(p.motherMobile || '');
        setDob(
          p.dob
            ? formatDateInput(parseDateInput(typeof p.dob === 'string' ? p.dob.slice(0, 10) : undefined))
            : ''
        );
        setBloodGroup(p.bloodGroup || '');
        const g = (p.gender || '').toUpperCase();
        setGender(g === 'MALE' || g === 'FEMALE' ? g : '');
        setSecondaryMobile(p.secondaryMobile || '');
        setAddress(p.address || '');
        setInstituteId(p.instituteId || '');
        setSmsAlertTo((p.smsAlertTo as SmsAlertTo[] | null) || []);
        const ssc = p.sscInfo as { gpa?: string } | undefined;
        const hsc = p.hscInfo as { gpa?: string } | undefined;
        setSscGpa(ssc?.gpa != null ? String(ssc.gpa) : '');
        setHscGpa(hsc?.gpa != null ? String(hsc.gpa) : '');
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'লোড ব্যর্থ', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!raw) {
      router.replace(`/login?redirect=${encodeURIComponent('/student/profile')}`);
      return;
    }
    let u: LocalUser;
    try {
      u = JSON.parse(raw) as LocalUser;
    } catch {
      router.replace(`/login?redirect=${encodeURIComponent('/student/profile')}`);
      return;
    }
    if (!u.id) {
      router.replace(`/login?redirect=${encodeURIComponent('/student/profile')}`);
      return;
    }
    if (String(u.role || '').toUpperCase() !== 'STUDENT') {
      router.replace('/student');
      return;
    }
    setUserId(u.id);
    setLoginMobile((u.mobile || '').trim());
    void load(u.id);
  }, [router, load]);

  const toggleSms = (opt: SmsAlertTo, checked: boolean) => {
    setSmsAlertTo((prev) =>
      checked ? [...prev, opt] : prev.filter((x) => x !== opt)
    );
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const res = await upsertStudentProfile({
        userId,
        fatherName: fatherName || undefined,
        motherName: motherName || undefined,
        fatherMobile: fatherMobile || undefined,
        motherMobile: motherMobile || undefined,
        dob: dob || undefined,
        bloodGroup: bloodGroup || undefined,
        gender: gender || undefined,
        secondaryMobile: secondaryMobile || undefined,
        address: address || undefined,
        instituteId: instituteId || undefined,
        registrationNumber: registrationNumber || undefined,
        smsAlertTo: smsAlertTo.length ? smsAlertTo : undefined,
        sscInfo: sscGpa.trim() ? { gpa: sscGpa.trim() } : undefined,
        hscInfo: hscGpa.trim() ? { gpa: hscGpa.trim() } : undefined,
      });
      if (res.success) {
        toast({ title: 'সংরক্ষিত হয়েছে', variant: 'success' });
        if (res.data?.registrationNumber) setRegistrationNumber(res.data.registrationNumber);
      } else {
        toast({
          title: 'সংরক্ষণ ব্যর্থ',
          description: (res as { message?: string }).message,
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: 'সংরক্ষণ ব্যর্থ',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!userId && !loading) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          <UserCircle className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">প্রোফাইল তথ্য</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            অভিভাবক, ঠিকানা ও একাডেমিক সংক্ষিপ্ত তথ্য আপডেট করুন—এটি অ্যাডমিনের &quot;Add student&quot; ফর্মের
            প্রোফাইল অংশের মতো।
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <span className="font-bold">লোড হচ্ছে…</span>
        </div>
      ) : (
        <div className="space-y-10 rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
          {registrationNumber ? (
            <div className="space-y-2">
              <Label className={sectionLabel}>রেজিস্ট্রেশন নম্বর</Label>
              <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-100/80 px-4 font-mono text-sm font-black tracking-widest text-slate-800">
                {registrationNumber}
              </div>
            </div>
          ) : null}

          <div>
            <h2 className="mb-6 text-sm font-black uppercase tracking-widest text-indigo-600">
              অভিভাবক ও যোগাযোগ
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className={sectionLabel}>পিতার নাম</label>
                <Input
                  className={inputClass}
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>মাতার নাম</label>
                <Input
                  className={inputClass}
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>পিতার মোবাইল</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className={cn(inputClass, 'pl-11')}
                    value={fatherMobile}
                    onChange={(e) => setFatherMobile(e.target.value)}
                    placeholder="01XXX-XXXXXX"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>মাতার মোবাইল</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className={cn(inputClass, 'pl-11')}
                    value={motherMobile}
                    onChange={(e) => setMotherMobile(e.target.value)}
                    placeholder="01XXX-XXXXXX"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>প্রাথমিক মোবাইল</label>
                <div
                  className={cn(
                    inputClass,
                    'flex cursor-default select-text items-center border-slate-200 bg-slate-100/90 text-slate-800'
                  )}
                  title="লগইন মোবাইল নম্বর"
                >
                  {loginMobile || '—'}
                </div>
                <p className="text-[11px] font-semibold text-slate-400">
                  লগইন নম্বর—এখান থেকে পরিবর্তন করা যাবে না।
                </p>
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>অন্য মোবাইল</label>
                <Input
                  className={inputClass}
                  value={secondaryMobile}
                  onChange={(e) => setSecondaryMobile(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-6 text-sm font-black uppercase tracking-widest text-indigo-600">
              ব্যক্তিগত
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className={sectionLabel}>জন্মতারিখ</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'h-12 w-full justify-start rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700',
                        !dob && 'text-slate-400'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dob ? format(parseDateInput(dob)!, 'dd-MM-yyyy') : 'তারিখ নির্বাচন'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto rounded-[28px] border border-slate-200 p-0 shadow-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={parseDateInput(dob)}
                      onSelect={(date) => setDob(formatDateInput(date))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>লিঙ্গ</label>
                <Select value={gender || undefined} onValueChange={setGender}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold">
                    <SelectValue placeholder="নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="MALE">ছাত্র</SelectItem>
                    <SelectItem value="FEMALE">ছাত্রী</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>রক্তের গ্রুপ</label>
                <Select value={bloodGroup} onValueChange={setBloodGroup}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold">
                    <SelectValue placeholder="নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className={sectionLabel}>প্রতিষ্ঠান</label>
                <InstituteCombobox
                  institutes={institutes}
                  value={instituteId}
                  onSelect={setInstituteId}
                  placeholder="নাম বা EIIN দিয়ে খুঁজুন..."
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className={sectionLabel}>ঠিকানা</label>
                <textarea
                  className="min-h-[100px] w-full rounded-[24px] border border-slate-200 bg-slate-50/50 px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-indigo-500/40 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-6 text-sm font-black uppercase tracking-widest text-indigo-600">
              একাডেমিক সংক্ষেপ ও SMS
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className={sectionLabel}>এসএসসি GPA</label>
                <Input
                  className={inputClass}
                  value={sscGpa}
                  onChange={(e) => setSscGpa(e.target.value)}
                  placeholder="যেমন 5.00"
                />
              </div>
              <div className="space-y-2">
                <label className={sectionLabel}>এইচএসসি GPA</label>
                <Input
                  className={inputClass}
                  value={hscGpa}
                  onChange={(e) => setHscGpa(e.target.value)}
                  placeholder="যেমন 5.00"
                />
              </div>
              <div className="space-y-3 sm:col-span-2">
                <label className={sectionLabel}>SMS অ্যালার্ট (উপস্থিতি, ফলাফল)</label>
                <div className="flex flex-wrap gap-6">
                  {(['SELF', 'FATHER', 'MOTHER'] as const).map((opt) => (
                    <label key={opt} className="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={smsAlertTo.includes(opt)}
                        onCheckedChange={(c) => toggleSms(opt, Boolean(c))}
                      />
                      <span className="text-sm font-bold text-slate-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Button
            type="button"
            className="h-12 w-full rounded-2xl bg-slate-900 font-black uppercase tracking-widest text-xs text-white hover:bg-indigo-600 hover:text-white sm:w-auto sm:px-12"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? 'সংরক্ষণ…' : 'সংরক্ষণ করুন'}
          </Button>
        </div>
      )}
    </div>
  );
}
