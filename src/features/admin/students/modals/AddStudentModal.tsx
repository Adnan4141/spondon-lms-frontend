'use client';

import { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBranches } from '@/lib/api/branches';
import { createUser } from '@/lib/api/users';
import { getInstitutes, type Institute } from '@/lib/api/institutes';
import { upsertStudentProfile } from '@/lib/api/student-profiles';
import type { Student } from '../types';
import { StudentAdminModal } from '../components/StudentAdminModal';
import { StudentAdminField } from '../components/StudentAdminField';
import { EMPTY_FORM, StudentFormFields, type StudentForm } from '../components/StudentFormFields';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const MIN_PASSWORD_LENGTH = 6;

export type AddStudentSaveMeta = {
  /** Present when the server generated an initial password (leave password fields empty). */
  oneTimePassword?: string;
  /** True when an admin-set password was used (no OTP returned). */
  usedCustomPassword?: boolean;
};

const ADD_STUDENT_DEFAULT_FORM: StudentForm = {
  ...EMPTY_FORM,
  smsAlertTo: ['SELF'],
};

export function AddStudentModal({
  onClose, onSave,
}: {
  onClose: () => void;
  onSave: (student: Student, meta?: AddStudentSaveMeta) => void;
}) {
  const [form, setForm] = useState<StudentForm>(ADD_STUDENT_DEFAULT_FORM);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [instituteId, setInstituteId] = useState('');
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loadingInstitutes, setLoadingInstitutes] = useState(true);
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [profileUser, setProfileUser] = useState<null | {
    id: string;
    fullName: string;
    mobile: string;
    email?: string | null;
    branchId?: string;
    createdAt?: string;
    studentProfile?: { registrationNumber?: string };
  }>(null);

  useEffect(() => {
    getInstitutes({ limit: 500 })
      .then(res => {
        if (res.success && res.data) setInstitutes(res.data);
      })
      .catch(() => setInstitutes([]))
      .finally(() => setLoadingInstitutes(false));
    getBranches()
      .then(res => {
        if (res.success && res.data) setBranches(res.data.map(b => ({ id: b.id, name: b.name })));
      })
      .catch(() => {})
      .finally(() => setLoadingBranches(false));
  }, []);

  const change = (key: keyof StudentForm, value: string | string[]) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key as string]) setErrors(e => { const n = { ...e }; delete n[key as string]; return n; });
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Name is required';
    if (!form.mobile.trim()) e.mobile = 'Mobile is required';
    else if (!/^01[3-9]\d{8}$/.test(form.mobile.replace(/^88/, '')))
      e.mobile = 'Invalid BD mobile (01XXXXXXXXX)';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Invalid email';
    if (!branchId) e.branchId = 'Branch is required';

    const pw = password.trim();
    const cpw = confirmPassword.trim();
    if (pw || cpw) {
      if (pw.length < MIN_PASSWORD_LENGTH)
        e.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
      else if (pw !== cpw)
        e.confirmPassword = 'Passwords do not match';
    }
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      let user = profileUser;
      let generatedOtp: string | undefined;

      if (!user) {
        const pw = password.trim();
        const createRes = await createUser({
          fullName: form.fullName,
          mobile: form.mobile,
          email: form.email || undefined,
          role: 'STUDENT',
          branchId: branchId || undefined,
          ...(pw ? { password: pw } : {}),
        });

        if (!(createRes.success && createRes.data)) {
          const msg = (createRes as { message?: string }).message ?? 'Failed to create student';
          if (/mobile|phone|number|already/i.test(msg)) {
            setErrors({ mobile: msg });
          } else {
            setErrors({ submit: msg });
          }
          return;
        }

        user = createRes.data;
        setProfileUser(createRes.data);
        if (!pw) {
          generatedOtp = (createRes.data as { oneTimePassword?: string }).oneTimePassword;
        }
      }

      const profileRes = await upsertStudentProfile({
        userId: user.id,
        fatherName: form.fatherName || undefined,
        motherName: form.motherName || undefined,
        fatherMobile: form.fatherMobile || undefined,
        motherMobile: form.motherMobile || undefined,
        bloodGroup: form.bloodGroup || undefined,
        gender: form.gender || undefined,
        address: form.address || undefined,
        instituteId: instituteId || undefined,
        smsAlertTo: form.smsAlertTo.length
          ? (form.smsAlertTo as ('SELF' | 'FATHER' | 'MOTHER')[])
          : undefined,
      });

      if (!(profileRes.success && profileRes.data)) {
        const msg = (profileRes as { message?: string }).message ?? 'Student created, but profile save failed. Please retry.';
        setErrors({ submit: msg });
        return;
      }

      const usedCustomPassword = Boolean(password.trim());
      onSave(
        {
          id: user.id,
          regNo: profileRes.data.registrationNumber ?? user.studentProfile?.registrationNumber ?? '—',
          fullName: user.fullName,
          mobile: user.mobile,
          email: user.email ?? null,
          status: 'ACTIVE',
          branchId: user.branchId ?? '',
          createdAt: user.createdAt ?? new Date().toISOString().slice(0, 10),
        },
        usedCustomPassword
          ? { usedCustomPassword: true }
          : generatedOtp
            ? { oneTimePassword: generatedOtp }
            : undefined,
      );

      setProfileUser(null);
      setInstituteId('');
      setBranchId('');
      setForm(ADD_STUDENT_DEFAULT_FORM);
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setErrors({});
    } catch (err: unknown) {
      const msg = (err as Error).message ?? 'Failed to create student';
      if (/mobile|phone|number|already/i.test(msg)) {
        setErrors({ mobile: msg });
      } else {
        setErrors({ submit: msg });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <StudentAdminModal open onClose={onClose} title="Add New Student">
      <StudentFormFields
        form={form}
        onChange={change}
        errors={errors}
        branchId={branchId}
        onBranchChange={(value) => {
          setBranchId(value);
          if (errors.branchId) setErrors(prev => { const n = { ...prev }; delete n.branchId; return n; });
        }}
        branchOptions={branches.map(b => ({ value: b.id, label: b.name }))}
        branchDisabled={loadingBranches || saving}
        instituteId={instituteId}
        onInstituteChange={(value) => {
          setInstituteId(value);
          if (errors.instituteId) setErrors(prev => { const n = { ...prev }; delete n.instituteId; return n; });
        }}
        instituteOptions={institutes.map((ins) => ({
          value: ins.id,
          label: `${ins.name}${ins.type ? ` (${ins.type})` : ''}`,
          sublabel: [ins.district, ins.eiin ? `EIIN: ${ins.eiin}` : null].filter(Boolean).join(' · ') || undefined,
        }))}
        instituteDisabled={loadingInstitutes || saving}
        loadingInstituteHint={loadingInstitutes ? 'Loading institutes...' : undefined}
      />

      <div className="grid grid-cols-2 gap-x-4 mb-1">
        <StudentAdminField
          label="Initial password"
          hint="Optional. Leave empty to auto-generate a one-time password."
          error={errors.password}
        >
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => { const n = { ...prev }; delete n.password; return n; });
              }}
              placeholder="Leave empty for auto-generated"
              className={cn('focus-visible:ring-indigo-400 pr-10')}
              disabled={saving}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:pointer-events-none"
              onClick={() => setShowPassword((v) => !v)}
              disabled={saving}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </StudentAdminField>
        <StudentAdminField label="Confirm password" error={errors.confirmPassword}>
          <div className="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((prev) => { const n = { ...prev }; delete n.confirmPassword; return n; });
              }}
              placeholder="Repeat if setting a password"
              className={cn('focus-visible:ring-indigo-400 pr-10')}
              disabled={saving}
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:pointer-events-none"
              onClick={() => setShowConfirmPassword((v) => !v)}
              disabled={saving}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </StudentAdminField>
      </div>

      {password.trim() ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex gap-2 items-start">
          <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900">
            With a custom password, automated SMS login credentials will not include this password (the system only stores a generated one-time password for SMS). Share the password with the student directly if needed.
          </p>
        </div>
      ) : null}

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
    </StudentAdminModal>
  );
}
