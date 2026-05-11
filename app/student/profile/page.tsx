'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Phone, ShieldCheck, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getInstitutes } from '@/lib/api/institutes';
import {
  getMyStudentProfile,
  updateMyStudentProfile,
  type SmsAlertTo,
} from '@/lib/api/student-profiles';
import { uploadMyProfileImage } from '@/lib/api/users';
import { InstituteCombobox } from '@/features/admin/shared';
import type { Institute } from '@/types/student';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner outline-none';
const sectionLabel = 'text-xs font-bold text-slate-500 mb-2 block';

type LocalUser = { id: string; fullName?: string; mobile?: string; role?: string };

function dateOnly(value?: string | null): string {
  return value ? value.slice(0, 10) : '';
}

export default function StudentProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [loginMobile, setLoginMobile] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [branchName, setBranchName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [registrationNumber, setRegistrationNumber] = useState<string | null>(null);

  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [fatherMobile, setFatherMobile] = useState('');
  const [motherMobile, setMotherMobile] = useState('');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [instituteId, setInstituteId] = useState('');
  const [smsAlertTo, setSmsAlertTo] = useState<SmsAlertTo[]>([]);
  const [sscGpa, setSscGpa] = useState('');
  const [hscGpa, setHscGpa] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [insRes, profileRes] = await Promise.all([
        getInstitutes({ limit: 500 }),
        getMyStudentProfile().catch(() => ({ success: false as const, data: undefined })),
      ]);
      if (insRes.success && insRes.data) setInstitutes(insRes.data);

      if (profileRes.success && profileRes.data) {
        const p = profileRes.data;
        setFullName(p.user?.fullName || '');
        setLoginMobile(p.user?.mobile || '');
        setAccountStatus(p.user?.status || 'ACTIVE');
        setBranchName(p.user?.branch?.name || '');
        setProfileImage(p.user?.profileImage || null);
        setRegistrationNumber(p.registrationNumber ?? null);
        setFatherName(p.fatherName || '');
        setMotherName(p.motherName || '');
        setFatherMobile(p.fatherMobile || '');
        setMotherMobile(p.motherMobile || '');
        setDob(dateOnly(typeof p.dob === 'string' ? p.dob : null));
        setBloodGroup(p.bloodGroup || '');
        setGender((p.gender || '').toUpperCase());
        setAddress(p.address || '');
        setInstituteId(p.instituteId || '');
        setSmsAlertTo((p.smsAlertTo as SmsAlertTo[] | null) || []);
        const ssc = p.sscInfo as { gpa?: string } | undefined;
        const hsc = p.hscInfo as { gpa?: string } | undefined;
        setSscGpa(ssc?.gpa != null ? String(ssc.gpa) : '');
        setHscGpa(hsc?.gpa != null ? String(hsc.gpa) : '');
      }
    } catch (error) {
      toast({ title: 'Load failed', description: error instanceof Error ? error.message : undefined, variant: 'destructive' });
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
    let user: LocalUser;
    try {
      user = JSON.parse(raw) as LocalUser;
    } catch {
      router.replace(`/login?redirect=${encodeURIComponent('/student/profile')}`);
      return;
    }
    if (!user.id) {
      router.replace(`/login?redirect=${encodeURIComponent('/student/profile')}`);
      return;
    }
    if (String(user.role || '').toUpperCase() !== 'STUDENT') {
      router.replace('/student/community');
      return;
    }
    setUserId(user.id);
    setFullName(user.fullName || '');
    setLoginMobile((user.mobile || '').trim());
    void load();
  }, [router, load]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const res = await updateMyStudentProfile({
        dob: dob || undefined,
        bloodGroup: bloodGroup || undefined,
        gender: gender || undefined,
        address: address || undefined,
        instituteId: instituteId || undefined,
        sscInfo: sscGpa.trim() ? { gpa: sscGpa.trim() } : undefined,
        hscInfo: hscGpa.trim() ? { gpa: hscGpa.trim() } : undefined,
      });
      if (res.success) {
        toast({ title: 'Profile saved', variant: 'success' });
      } else {
        toast({ title: 'Save failed', description: res.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Save failed', description: error instanceof Error ? error.message : undefined, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file?: File | null) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await uploadMyProfileImage(file);
      if (res.success) {
        setProfileImage(res.data?.profileImage || null);
        toast({ title: 'Profile photo updated', variant: 'success' });
      } else {
        toast({ title: 'Upload failed', description: res.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Upload failed', description: error instanceof Error ? error.message : undefined, variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
  };

  if (!userId && !loading) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-indigo-50 text-indigo-600">
          {profileImage ? (
            <img src={profileImage} alt={fullName || 'Student'} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UserCircle className="h-10 w-10" />
            </div>
          )}
          <label className="absolute inset-x-0 bottom-0 flex cursor-pointer items-center justify-center bg-slate-950/70 py-1 text-white">
            {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => void handleImageUpload(event.target.files?.[0])} />
          </label>
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Profile Information</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Update your personal, academic, and contact information. Guardian phone and SMS alert settings are managed by the admin team.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <span className="font-bold">Loading...</span>
        </div>
      ) : (
        <div className="space-y-10 rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-indigo-600">
              <ShieldCheck className="h-4 w-4" />
              Account
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <ReadOnlyField label="Full Name" value={fullName || '-'} />
              <ReadOnlyField label="Registration Number" value={registrationNumber || '-'} mono />
              <ReadOnlyField label="Login Mobile" value={loginMobile || '-'} />
              <ReadOnlyField label="Branch" value={branchName || '-'} />
              <ReadOnlyField label="Account Status" value={accountStatus || 'ACTIVE'} />
            </div>
          </section>

          <section>
            <h2 className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-indigo-600">
              <ShieldCheck className="h-4 w-4" />
              Guardian And Contact
            </h2>
            <p className="mb-5 text-[11px] font-semibold text-slate-400">This information is managed by the admin team and cannot be edited here.</p>
            <div className="grid gap-6 sm:grid-cols-2">
              <ReadOnlyField label="Father's Name" value={fatherName || '-'} />
              <ReadOnlyField label="Mother's Name" value={motherName || '-'} />
              <PhoneField label="Father's Mobile" value={fatherMobile} />
              <PhoneField label="Mother's Mobile" value={motherMobile} />
            </div>
          </section>

          <section>
            <h2 className="mb-6 text-sm font-black uppercase tracking-widest text-indigo-600">Personal</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className={sectionLabel}>Date of Birth</Label>
                <Input type="date" className={inputClass} value={dob} onChange={(event) => setDob(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className={sectionLabel}>Gender</Label>
                <Select value={gender || undefined} onValueChange={setGender}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={sectionLabel}>Blood Group</Label>
                <Select value={bloodGroup || undefined} onValueChange={setBloodGroup}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className={sectionLabel}>Institute</Label>
                <InstituteCombobox institutes={institutes} value={instituteId} onSelect={setInstituteId} placeholder="Search by name or EIIN..." />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className={sectionLabel}>Address</Label>
                <textarea
                  className="min-h-[100px] w-full rounded-[24px] border border-slate-200 bg-slate-50/50 px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-indigo-500/40 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-6 text-sm font-black uppercase tracking-widest text-indigo-600">Academic Summary And SMS</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <TextField label="SSC GPA" value={sscGpa} onChange={setSscGpa} placeholder="Example: 5.00" />
              <TextField label="HSC GPA" value={hscGpa} onChange={setHscGpa} placeholder="Example: 5.00" />
              <div className="space-y-3 sm:col-span-2">
                <Label className={sectionLabel}>SMS Alerts</Label>
                <div className="flex flex-wrap gap-6">
                  {(['SELF', 'FATHER', 'MOTHER'] as const).map((opt) => (
                    <label key={opt} className="flex cursor-not-allowed items-center gap-2">
                      <Checkbox checked={smsAlertTo.includes(opt)} disabled />
                      <span className="text-sm font-bold text-slate-700">{opt}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[11px] font-semibold text-slate-400">SMS recipients are controlled by the admin team.</p>
              </div>
            </div>
          </section>

          <Button
            type="button"
            className="h-12 w-full rounded-2xl bg-slate-900 font-black uppercase tracking-widest text-xs text-white hover:bg-indigo-600 hover:text-white sm:w-auto sm:px-12"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      )}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label className={sectionLabel}>{label}</Label>
      <Input className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function PhoneField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <Label className={sectionLabel}>{label}</Label>
      <div className="relative">
        <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input className={cn(inputClass, 'pl-11')} value={value} readOnly placeholder="01XXX-XXXXXX" />
      </div>
      <p className="text-[11px] font-semibold text-slate-400">Managed by admin.</p>
    </div>
  );
}

function ReadOnlyField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-2">
      <Label className={sectionLabel}>{label}</Label>
      <div className={cn(
        'flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-100/80 px-4 text-sm font-black text-slate-800',
        mono && 'font-mono tracking-widest',
      )}>
        {value}
      </div>
    </div>
  );
}
