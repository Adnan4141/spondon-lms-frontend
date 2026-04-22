'use client';

/**
 * _components.tsx — Co-located private components for the /admin/students route.
 * The underscore prefix marks this as a non-route module (Next.js convention).
 *
 * Exports: Student (type), AddStudentModal, EditStudentModal
 */

import { useState, useEffect } from 'react';
import { X, Check, Info, Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { createUser, updateUser, getUserById } from '@/lib/api/users';

// ─── SHARED TYPE ──────────────────────────────────────────────────────────────

export interface Student {
  id: string;
  regNo: string;
  fullName: string;
  mobile: string;
  email: string | null;
  status: 'ACTIVE' | 'BLOCKED';
  branchId: string;
  createdAt: string;
  _count?: { enrollments?: number };
  // Extended profile fields (populated when fetching full user)
  fatherName?: string;
  motherName?: string;
  fatherMobile?: string;
  motherMobile?: string;
  bloodGroup?: string;
  gender?: string;
  address?: string;
  smsAlertTo?: string[];
}

// ─── MINI HELPERS (self-contained, no circular deps with page.tsx) ─────────────

type BadgeColor = 'green' | 'red' | 'amber' | 'blue' | 'slate' | 'orange' | 'purple';

function AppBadge({ label, color = 'slate' }: { label: string; color?: BadgeColor }) {
  const styles: Record<BadgeColor, string> = {
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-indigo-50 text-indigo-700',
    slate: 'bg-slate-100 text-slate-600',
    orange: 'bg-orange-50 text-orange-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap', styles[color])}>
      {label}
    </span>
  );
}

function Field({
  label, required, hint, error, children,
}: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="mb-3.5">
      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-rose-600 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{error}</p>}
    </div>
  );
}

function AppSelect({
  value, onChange, options, placeholder, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full h-9 text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 bg-white">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AppModal({
  open, onClose, title, subtitle, children, maxWidth = 'max-w-2xl',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const smMaxWidth = `sm:${maxWidth}`;
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn('p-0 gap-0 max-h-[92vh] w-[95vw] flex flex-col overflow-hidden', maxWidth, smMaxWidth)}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{subtitle || `${title} dialog`}</DialogDescription>
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-base font-black text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="bg-red-100 hover:bg-red-200 text-red-700 rounded-lg p-1.5 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 bg-white">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

// ─── STUDENT FORM TYPE ────────────────────────────────────────────────────────

interface StudentForm {
  fullName: string;
  mobile: string;
  email: string;
  fatherName: string;
  motherName: string;
  fatherMobile: string;
  motherMobile: string;
  gender: string;
  bloodGroup: string;
  address: string;
  smsAlertTo: string[];
}

const EMPTY_FORM: StudentForm = {
  fullName: '', mobile: '', email: '',
  fatherName: '', motherName: '',
  fatherMobile: '', motherMobile: '',
  gender: '', bloodGroup: '', address: '',
  smsAlertTo: [],
};

// ─── SHARED STUDENT FORM FIELDS ───────────────────────────────────────────────

function StudentFormFields({
  form, onChange, errors,
}: {
  form: StudentForm;
  onChange: (key: keyof StudentForm, value: string | string[]) => void;
  errors: Record<string, string>;
}) {
  const SMS_OPTIONS: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'SELF', label: 'Student', icon: <Phone className="h-3 w-3" /> },
    { id: 'FATHER', label: "Father", icon: <MessageSquare className="h-3 w-3" /> },
    { id: 'MOTHER', label: "Mother", icon: <MessageSquare className="h-3 w-3" /> },
  ];

  const toggleSms = (id: string) => {
    const current = form.smsAlertTo;
    onChange('smsAlertTo', current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  };

  return (
    <div className="grid grid-cols-2 gap-x-4">
      <div className="col-span-2">
        <Field label="Full Name" required error={errors.fullName}>
          <Input
            value={form.fullName}
            onChange={e => onChange('fullName', e.target.value)}
            placeholder="Student's full name"
            className="focus-visible:ring-indigo-400"
          />
        </Field>
      </div>

      <Field label="Mobile Number" required hint="Format: 01XXXXXXXXX" error={errors.mobile}>
        <Input
          value={form.mobile}
          onChange={e => onChange('mobile', e.target.value)}
          placeholder="01XXXXXXXXX"
          className="focus-visible:ring-indigo-400"
        />
      </Field>

      <Field label="Email Address" error={errors.email}>
        <Input
          type="email"
          value={form.email}
          onChange={e => onChange('email', e.target.value)}
          placeholder="Optional"
          className="focus-visible:ring-indigo-400"
        />
      </Field>

      <Field label="Father's Name">
        <Input
          value={form.fatherName}
          onChange={e => onChange('fatherName', e.target.value)}
          placeholder="Father's full name"
          className="focus-visible:ring-indigo-400"
        />
      </Field>

      <Field label="Mother's Name">
        <Input
          value={form.motherName}
          onChange={e => onChange('motherName', e.target.value)}
          placeholder="Mother's full name"
          className="focus-visible:ring-indigo-400"
        />
      </Field>

      <Field label="Father's Mobile">
        <Input
          value={form.fatherMobile}
          onChange={e => onChange('fatherMobile', e.target.value)}
          placeholder="01XXXXXXXXX"
          className="focus-visible:ring-indigo-400"
        />
      </Field>

      <Field label="Mother's Mobile">
        <Input
          value={form.motherMobile}
          onChange={e => onChange('motherMobile', e.target.value)}
          placeholder="01XXXXXXXXX"
          className="focus-visible:ring-indigo-400"
        />
      </Field>

      <Field label="Gender">
        <AppSelect
          value={form.gender}
          onChange={v => onChange('gender', v)}
          placeholder="Select gender"
          options={[
            { value: 'MALE', label: 'Male' },
            { value: 'FEMALE', label: 'Female' },
            { value: 'OTHER', label: 'Other' },
          ]}
        />
      </Field>

      <Field label="Blood Group">
        <AppSelect
          value={form.bloodGroup}
          onChange={v => onChange('bloodGroup', v)}
          placeholder="Select"
          options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(x => ({ value: x, label: x }))}
        />
      </Field>

      <div className="col-span-2">
        <Field label="Address">
          <Input
            value={form.address}
            onChange={e => onChange('address', e.target.value)}
            placeholder="Full address"
            className="focus-visible:ring-indigo-400"
          />
        </Field>
      </div>

      <div className="col-span-2">
        <Field label="SMS Alerts To" hint="Select who receives SMS notifications">
          <div className="flex gap-2 flex-wrap">
            {SMS_OPTIONS.map(opt => (
              <label
                key={opt.id}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 border rounded-lg cursor-pointer text-sm font-semibold transition-colors select-none',
                  form.smsAlertTo.includes(opt.id)
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                <input
                  type="checkbox"
                  checked={form.smsAlertTo.includes(opt.id)}
                  onChange={() => toggleSms(opt.id)}
                  className="sr-only"
                />
                {opt.icon}
                {opt.label}
                {form.smsAlertTo.includes(opt.id) && (
                  <Check className="h-3 w-3 text-indigo-600" />
                )}
              </label>
            ))}
          </div>
        </Field>
      </div>
    </div>
  );
}

// ─── ADD STUDENT MODAL ────────────────────────────────────────────────────────

export function AddStudentModal({
  onClose, onSave,
}: {
  onClose: () => void;
  onSave: (student: Student) => void;
}) {
  const [form, setForm] = useState<StudentForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const change = (key: keyof StudentForm, value: string | string[]) =>
    setForm(f => ({ ...f, [key]: value }));

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Name is required';
    if (!form.mobile.trim()) e.mobile = 'Mobile is required';
    else if (!/^01[3-9]\d{8}$/.test(form.mobile.replace(/^88/, '')))
      e.mobile = 'Invalid BD mobile (01XXXXXXXXX)';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Invalid email';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const res = await createUser({
        fullName: form.fullName,
        mobile: form.mobile,
        email: form.email || undefined,
        role: 'STUDENT',
      });
      if (res.success && res.data) {
        const u = res.data;
        onSave({
          id: u.id,
          regNo: (u as typeof u & { studentProfile?: { registrationNumber?: string } }).studentProfile?.registrationNumber ?? '—',
          fullName: u.fullName,
          mobile: u.mobile,
          email: u.email ?? null,
          status: 'ACTIVE',
          branchId: u.branchId ?? '',
          createdAt: u.createdAt ?? new Date().toISOString().slice(0, 10),
        });
      } else {
        setErrors({ submit: (res as { message?: string }).message ?? 'Failed to create student' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal open onClose={onClose} title="Add New Student">
      <StudentFormFields form={form} onChange={change} errors={errors} />

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5 flex gap-2 items-center">
        <Info className="h-4 w-4 text-emerald-600 shrink-0" />
        <p className="text-xs text-emerald-800">
          Registration number will be <strong>auto-generated</strong> as a 7-digit unique ID on save.
        </p>
      </div>

      {errors.submit && (
        <p className="text-sm text-rose-600 font-semibold mb-3">{errors.submit}</p>
      )}

      <div className="flex justify-end gap-2.5">
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all"
        >
          <Check className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Student'}
        </Button>
      </div>
    </AppModal>
  );
}

// ─── EDIT STUDENT MODAL ───────────────────────────────────────────────────────

export function EditStudentModal({
  student, onClose, onSave,
}: {
  student: Student;
  onClose: () => void;
  onSave: (updated: Student) => void;
}) {
  const [form, setForm] = useState<StudentForm>({
    fullName: student.fullName,
    mobile: student.mobile,
    email: student.email ?? '',
    fatherName: student.fatherName ?? '',
    motherName: student.motherName ?? '',
    fatherMobile: student.fatherMobile ?? '',
    motherMobile: student.motherMobile ?? '',
    gender: student.gender ?? '',
    bloodGroup: student.bloodGroup ?? '',
    address: student.address ?? '',
    smsAlertTo: student.smsAlertTo ?? [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch full user profile on mount to pre-populate all student profile fields
  useEffect(() => {
    getUserById(student.id)
      .then(res => {
        if (res.success && res.data) {
          const u = res.data;
          const prof = u.studentProfile;
          setForm({
            fullName: u.fullName,
            mobile: u.mobile,
            email: u.email ?? '',
            fatherName: prof?.fatherName ?? '',
            motherName: prof?.motherName ?? '',
            fatherMobile: prof?.fatherMobile ?? '',
            motherMobile: prof?.motherMobile ?? '',
            gender: prof?.gender ?? '',
            bloodGroup: prof?.bloodGroup ?? '',
            address: prof?.address ?? '',
            smsAlertTo: prof?.smsAlertTo ?? [],
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [student.id]);

  const change = (key: keyof StudentForm, value: string | string[]) =>
    setForm(f => ({ ...f, [key]: value }));

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Name is required';
    if (!form.mobile.trim()) e.mobile = 'Mobile is required';
    else if (!/^01[3-9]\d{8}$/.test(form.mobile.replace(/^88/, '')))
      e.mobile = 'Invalid BD mobile (01XXXXXXXXX)';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Invalid email';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const res = await updateUser(student.id, {
        fullName: form.fullName,
        mobile: form.mobile,
        email: form.email || undefined,
        fatherName: form.fatherName || undefined,
        motherName: form.motherName || undefined,
        fatherMobile: form.fatherMobile || undefined,
        motherMobile: form.motherMobile || undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup || undefined,
        address: form.address || undefined,
        smsAlertTo: form.smsAlertTo.length
          ? (form.smsAlertTo as ('SELF' | 'FATHER' | 'MOTHER')[])
          : undefined,
      });
      if (res.success) {
        onSave({
          ...student,
          fullName: form.fullName,
          mobile: form.mobile,
          email: form.email || null,
          fatherName: form.fatherName || undefined,
          motherName: form.motherName || undefined,
          fatherMobile: form.fatherMobile || undefined,
          motherMobile: form.motherMobile || undefined,
          gender: form.gender || undefined,
          bloodGroup: form.bloodGroup || undefined,
          address: form.address || undefined,
          smsAlertTo: form.smsAlertTo,
        });
      } else {
        setErrors({ submit: (res as { message?: string }).message ?? 'Failed to update student' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open
      onClose={onClose}
      title="Edit Student"
      subtitle={`Reg: ${student.regNo} · ${student.mobile}`}
    >
      {loadingProfile ? (
        <div className="py-10 text-center text-slate-400 text-sm">Loading profile…</div>
      ) : (
        <>
          {/* Status badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-slate-500 font-medium">Current status:</span>
            <AppBadge label={student.status} color={student.status === 'ACTIVE' ? 'green' : 'red'} />
          </div>

          <StudentFormFields form={form} onChange={change} errors={errors} />

          {errors.submit && (
            <p className="text-sm text-rose-600 font-semibold mb-3">{errors.submit}</p>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all"
            >
              <Check className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </>
      )}
    </AppModal>
  );
}
