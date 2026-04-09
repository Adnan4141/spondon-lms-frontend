'use client';

import { useState, useEffect } from 'react';
import {
  createUser,
  updateUser,
  uploadUserProfileImage,
  type User as TeacherUser,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '@/lib/api/users';
import type { Branch } from '@/lib/api/branches';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  User as UserIcon,
  Phone,
  Mail,
  Lock,
  Shield,
  ImagePlus,
  X,
  ShieldCheck,
  GraduationCap,
  Link2,
  Clock,
  Eye,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const inputClass =
  'h-12 rounded-xl border-slate-200 bg-slate-50/50 px-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all shadow-sm outline-none';

const BD_MOBILE = /^01[3-9]\d{8}$/;

// ─── Steps Config ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 0, label: 'Basic Info',     icon: UserIcon,      color: 'text-indigo-600', bg: 'bg-indigo-50',  ring: 'ring-indigo-300' },
  { id: 1, label: 'Photo',          icon: ImagePlus,     color: 'text-sky-600',    bg: 'bg-sky-50',     ring: 'ring-sky-300' },
  { id: 2, label: 'Teaching',       icon: GraduationCap, color: 'text-amber-600',  bg: 'bg-amber-50',   ring: 'ring-amber-300' },
  { id: 3, label: 'Access',         icon: Shield,        color: 'text-violet-600', bg: 'bg-violet-50',  ring: 'ring-violet-300' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type TeacherFormProps = {
  branches: Branch[];
  teacher?: TeacherUser | null;
  lockedBranchId?: string | null;
  onSuccess: () => Promise<void>;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TeacherForm({ branches, teacher, lockedBranchId, onSuccess }: TeacherFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  const isEdit = !!teacher;

  // ── State ──
  const [step, setStep] = useState(0);
  const [stepErrors, setStepErrors] = useState<Record<number, boolean>>({});

  // Step 1 — Basic Info
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');

  // Step 2 — Photo
  const [photoMode, setPhotoMode] = useState<'upload' | 'url'>('upload');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Step 3 — Teaching
  const [designation, setDesignation] = useState('');
  const [institute, setInstitute] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [demoClassUrl, setDemoClassUrl] = useState('');
  const [showMobile, setShowMobile] = useState(false);

  // Step 4 — Access
  const [branchId, setBranchId] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Populate on edit ──
  useEffect(() => {
    if (teacher) {
      setFullName(teacher.fullName);
      setMobile(teacher.mobile);
      setEmail(teacher.email || '');
      setBranchId(teacher.branchId || '');
      setStatus(teacher.status || 'ACTIVE');
      setPassword('');
      setPhotoUrl(teacher.profileImage || '');
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoMode(teacher.profileImage ? 'url' : 'upload');
      setDesignation(teacher.designation || '');
      setInstitute(teacher.institute || '');
      setExperienceYears(teacher.experienceYears != null ? String(teacher.experienceYears) : '');
      setDemoClassUrl(teacher.demoClassUrl || '');
      setShowMobile(teacher.showMobile ?? false);
    } else {
      setFullName(''); setMobile(''); setEmail('');
      setPassword(''); setBranchId(lockedBranchId || ''); setStatus('ACTIVE');
      setPhotoUrl(''); setPhotoFile(null); setPhotoPreview(null); setPhotoMode('upload');
      setDesignation(''); setInstitute(''); setExperienceYears(''); setDemoClassUrl(''); setShowMobile(false);
    }
    setStep(0);
    setError(null);
    setStepErrors({});
  }, [teacher, lockedBranchId]);

  // ── Validation per step ──
  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (!fullName.trim()) return 'Full name is required';
      if (!BD_MOBILE.test(mobile.trim())) return 'Enter a valid 11-digit Bangladesh mobile (e.g. 01712345678)';
    }
    if (s === 3) {
      if (password && password.length < 6) return 'Password must be at least 6 characters';
    }
    return null;
  };

  const goNext = () => {
    setError(null);
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setStepErrors((p) => ({ ...p, [step]: false }));
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => { setError(null); setStep((s) => Math.max(s - 1, 0)); };

  const jumpTo = (s: number) => {
    // Allow jumping freely in edit mode or to already-visited steps
    if (isEdit || s <= step) { setError(null); setStep(s); }
  };

  // ── Submit ──
  const handleSubmit = async () => {
    setError(null);
    const err = validateStep(step);
    if (err) { setError(err); return; }

    const name = fullName.trim();
    const mob  = mobile.trim();
    const em   = email.trim();
    const expYears = experienceYears.trim() ? parseInt(experienceYears.trim(), 10) : null;

    try {
      setSubmitting(true);

      if (isEdit && teacher) {
        const payload: UpdateUserPayload = {
          fullName: name,
          mobile: mob,
          email: em || undefined,
          status,
          profileImage: photoFile ? undefined : photoUrl || null,
          designation: designation.trim() || undefined,
          institute: institute.trim() || undefined,
          experienceYears: expYears,
          demoClassUrl: demoClassUrl.trim() || undefined,
          showMobile,
        };
        if (lockedBranchId) payload.branchId = lockedBranchId;
        else payload.branchId = branchId || null;
        if (password.trim()) payload.password = password.trim();

        const res = await updateUser(teacher.id, payload);
        if (!res.success) { setError(res.message || 'Update failed'); return; }
        if (photoFile) {
          const up = await uploadUserProfileImage(teacher.id, photoFile);
          if (!up.success) { setError(up.message || 'Profile saved but image upload failed'); return; }
        }
        await onSuccess();
        toast({ title: 'Teacher updated', variant: 'success' });
        closeModal();
      } else {
        const payload: CreateUserPayload = {
          fullName: name, mobile: mob,
          email: em || undefined,
          role: 'TEACHER', status: 'ACTIVE',
          profileImage: photoFile ? undefined : photoUrl || undefined,
        };
        if (password.trim()) payload.password = password.trim();
        const eff = lockedBranchId || branchId || undefined;
        if (eff) payload.branchId = eff;

        const res = await createUser(payload);
        if (!res.success || !res.data) { setError(res.message || 'Could not create teacher'); return; }

        const newId = res.data.id;

        // Save teaching info separately
        if (designation || institute || expYears != null || demoClassUrl || showMobile) {
          await updateUser(newId, {
            designation: designation.trim() || undefined,
            institute: institute.trim() || undefined,
            experienceYears: expYears,
            demoClassUrl: demoClassUrl.trim() || undefined,
            showMobile,
          });
        }

        if (photoFile) {
          const up = await uploadUserProfileImage(newId, photoFile);
          if (!up.success) { setError(up.message || 'Teacher created but photo upload failed'); return; }
        }

        await onSuccess();
        const otp = (res.data as { oneTimePassword?: string }).oneTimePassword;
        toast({
          title: 'Teacher created',
          description: otp ? `One-time password: ${otp}` : 'Account established.',
          variant: 'success',
        });
        closeModal();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const isLastStep = step === STEPS.length - 1;

  // ── Step content renderers ──────────────────────────────────────────────────

  const renderStep0 = () => (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Full Name <span className="text-rose-400">*</span></Label>
        <div className="relative">
          <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input
            className={cn(inputClass, 'pl-10')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Teacher's full name"
            autoFocus
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Phone (Login) <span className="text-rose-400">*</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input
              className={cn(inputClass, 'pl-10')}
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="017XXXXXXXX"
              disabled={isEdit}
            />
          </div>
          {isEdit && (
            <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1 px-1">
              <ShieldCheck className="h-3 w-3" /> Locked for security
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Email (optional)</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input
              className={cn(inputClass, 'pl-10')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@email.com"
            />
          </div>
        </div>
      </div>

      {/* Preview card */}
      {fullName && (
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
          <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-black shrink-0">
            {fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-black text-indigo-900">{fullName}</p>
            {mobile && <p className="text-xs text-indigo-400 font-bold">{mobile}</p>}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Photo preview */}
      <div className="flex justify-center">
        <div className="relative group">
          <div className="h-28 w-28 rounded-full border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center overflow-hidden">
            {(photoPreview || photoUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview || resolveAttachmentUrl(photoUrl, API_ORIGIN)}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserIcon className="h-10 w-10 text-slate-300" />
            )}
          </div>
          {(photoPreview || photoUrl) && (
            <button
              type="button"
              onClick={() => { setPhotoFile(null); setPhotoPreview(null); setPhotoUrl(''); }}
              className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mode toggle */}
      <RadioGroup
        value={photoMode}
        onValueChange={(v) => { setPhotoMode(v as 'upload' | 'url'); setPhotoFile(null); setPhotoPreview(null); setPhotoUrl(''); }}
        className="grid grid-cols-2 gap-3"
      >
        {[
          { value: 'upload', icon: Upload,    label: 'Upload File' },
          { value: 'url',    icon: Link2,     label: 'Image URL' },
        ].map(({ value, icon: Icon, label }) => (
          <Label
            key={value}
            htmlFor={`photo-${value}`}
            className={cn(
              'flex cursor-pointer items-center gap-2.5 rounded-xl border-2 px-4 py-3 transition-all font-bold text-sm',
              photoMode === value
                ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            )}
          >
            <RadioGroupItem value={value} id={`photo-${value}`} className="sr-only" />
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Label>
        ))}
      </RadioGroup>

      {photoMode === 'upload' ? (
        <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-8 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
          <div className="h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-all">
            <ImagePlus className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-slate-700">Click to upload photo</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">JPG, PNG up to 5MB</p>
          </div>
          {photoFile && (
            <p className="text-xs font-black text-indigo-600 bg-indigo-50 rounded-lg px-3 py-1">{photoFile.name}</p>
          )}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setPhotoFile(f);
              setPhotoPreview(URL.createObjectURL(f));
            }}
          />
        </label>
      ) : (
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Image URL</Label>
          <div className="relative">
            <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input
              className={cn(inputClass, 'pl-10')}
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
            />
          </div>
          <p className="text-[10px] font-bold text-slate-400 px-1">Paste a direct image URL</p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Designation</Label>
          <div className="relative">
            <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input
              className={cn(inputClass, 'pl-10')}
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Lecturer, Professor…"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Experience (Years)</Label>
          <div className="relative">
            <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input
              className={cn(inputClass, 'pl-10')}
              type="number"
              min={0}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              placeholder="e.g. 10"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Institute / Department</Label>
        <div className="relative">
          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input
            className={cn(inputClass, 'pl-10')}
            value={institute}
            onChange={(e) => setInstitute(e.target.value)}
            placeholder="Department of ICT, Dhaka College…"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Demo Class Video URL</Label>
        <div className="relative">
          <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input
            className={cn(inputClass, 'pl-10')}
            value={demoClassUrl}
            onChange={(e) => setDemoClassUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
        <p className="text-[10px] font-bold text-slate-400 px-1">YouTube or direct video link</p>
      </div>

      {/* Show mobile toggle */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
            <Eye className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-800">Show phone publicly</p>
            <p className="text-[10px] font-bold text-slate-400">Visible on teacher profile page</p>
          </div>
        </div>
        <Switch checked={showMobile} onCheckedChange={setShowMobile} />
      </div>

      {/* Quick summary preview */}
      {(designation || institute || experienceYears) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {designation && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-black px-3 py-1"><GraduationCap className="h-3 w-3" />{designation}</span>}
          {institute && <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black px-3 py-1"><Building2 className="h-3 w-3" />{institute}</span>}
          {experienceYears && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-black px-3 py-1"><Clock className="h-3 w-3" />{experienceYears} yrs</span>}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      {/* Branch */}
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Branch</Label>
        {lockedBranchId ? (
          <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
            <Building2 className="h-4 w-4 text-indigo-400 shrink-0" />
            <p className="text-sm font-black text-indigo-800">
              {branches.find((b) => b.id === lockedBranchId)?.name || 'Branch Office'}
            </p>
          </div>
        ) : (
          <Select value={branchId || 'none'} onValueChange={(v) => setBranchId(v === 'none' ? '' : v)}>
            <SelectTrigger className={cn(inputClass, 'h-12 px-4')}>
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent className="rounded-xl p-1 shadow-xl border-slate-100">
              <SelectItem value="none" className="rounded-lg font-bold">Not Assigned (Global)</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id} className="rounded-lg font-bold">{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          {isEdit ? 'New Password' : 'Password (optional)'}
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input
            className={cn(inputClass, 'pl-10')}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isEdit ? 'Leave blank to keep current' : 'Leave blank to auto-generate'}
          />
        </div>
        {!isEdit && (
          <p className="text-[9px] font-bold text-slate-400 px-1">Auto-generates a one-time password if left blank.</p>
        )}
      </div>

      {/* Status (edit only) */}
      {isEdit && (
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Account Status</Label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'ACTIVE',  label: 'Active',   color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
              { value: 'BLOCKED', label: 'Blocked',  color: 'border-rose-400 bg-rose-50 text-rose-700' },
            ].map(({ value, label, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={cn(
                  'rounded-xl border-2 px-4 py-3 text-sm font-black transition-all',
                  status === value ? color : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Final summary */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Summary</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <UserIcon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="font-black">{fullName || '—'}</span>
            <span className="text-slate-400">{mobile}</span>
          </div>
          {designation && (
            <div className="flex items-center gap-2 text-slate-600">
              <GraduationCap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="font-bold">{designation}{institute ? ` · ${institute}` : ''}</span>
            </div>
          )}
          {experienceYears && (
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="font-bold">{experienceYears} years experience</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-600">
            <Eye className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="font-bold">Phone {showMobile ? 'public' : 'private'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const STEP_CONTENT = [renderStep0, renderStep1, renderStep2, renderStep3];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col bg-white text-slate-900" style={{ maxHeight: '85vh' }}>

      {/* ── Step Progress Bar ── */}
      <div className="shrink-0 px-6 pt-6 pb-4 sm:px-8 border-b border-slate-50">
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  onClick={() => jumpTo(i)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 group transition-all',
                    (isEdit || i <= step) ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                  )}
                >
                  <div className={cn(
                    'h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all shadow-sm',
                    done   ? 'bg-emerald-500 border-emerald-500 text-white' :
                    active ? `${s.bg} ${s.color} border-current ring-4 ${s.ring}` :
                             'bg-white border-slate-200 text-slate-300'
                  )}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={cn(
                    'text-[9px] font-black uppercase tracking-widest leading-none hidden sm:block',
                    active ? s.color : done ? 'text-emerald-500' : 'text-slate-300'
                  )}>
                    {s.label}
                  </span>
                </button>

                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-1 rounded-full transition-all',
                    i < step ? 'bg-emerald-400' : 'bg-slate-100'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Step Header ── */}
      <div className="shrink-0 px-6 pt-5 pb-2 sm:px-8">
        <div className="flex items-center gap-3">
          <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shadow-sm border', STEPS[step].bg, STEPS[step].color)}>
            {(() => { const Icon = STEPS[step].icon; return <Icon className="h-4 w-4" />; })()}
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">{STEPS[step].label}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Step {step + 1} of {STEPS.length}</p>
          </div>
        </div>
      </div>

      {/* ── Step Content ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8">
        {STEP_CONTENT[step]()}

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 animate-in fade-in zoom-in duration-200">
            <X className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* ── Footer Navigation ── */}
      <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            className="h-11 rounded-xl px-5 font-black text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all text-sm"
            onClick={step === 0 ? closeModal : goBack}
            disabled={submitting}
          >
            <ChevronLeft className="mr-1.5 h-4 w-4" />
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>

          <div className="flex items-center gap-2">
            {/* Step dots */}
            <div className="flex gap-1.5 mr-2">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === step ? 'w-4 bg-indigo-500' : i < step ? 'w-1.5 bg-emerald-400' : 'w-1.5 bg-slate-200'
                  )}
                />
              ))}
            </div>

            {isLastStep ? (
              <Button
                type="button"
                className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                ) : (
                  <>{isEdit ? 'Save Changes' : 'Create Teacher'}</>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-black text-sm transition-all hover:scale-[1.02] active:scale-95"
                onClick={goNext}
              >
                Next <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
