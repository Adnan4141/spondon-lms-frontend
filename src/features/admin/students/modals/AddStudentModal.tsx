'use client';

import { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBranches } from '@/lib/api/branches';
import { createUser, uploadUserProfileImage } from '@/lib/api/users';
import { getInstitutes, type Institute } from '@/lib/api/institutes';
import { upsertStudentProfile } from '@/lib/api/student-profiles';
import type { Student } from '../types';
import { StudentAdminModal } from '../components/StudentAdminModal';
import { StudentAdminField } from '../components/StudentAdminField';
import { EMPTY_FORM, StudentFormFields, type StudentForm } from '../components/StudentFormFields';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { gpaInfo, validateAdminStudentForm } from '../studentValidation';

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
  onClose, onSave, defaultBranchId,
}: {
  onClose: () => void;
  onSave: (student: Student, meta?: AddStudentSaveMeta) => void;
  /** Prefills branch; branch admins may choose any branch. */
  defaultBranchId?: string;
}) {
  const [form, setForm] = useState<StudentForm>(ADD_STUDENT_DEFAULT_FORM);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [instituteId, setInstituteId] = useState('');
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loadingInstitutes, setLoadingInstitutes] = useState(true);
  const [branchId, setBranchId] = useState(defaultBranchId ?? '');
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [profileUser, setProfileUser] = useState<null | {
    id: string;
    fullName: string;
    mobile: string;
    email?: string | null;
    branchId?: string;
    profileImage?: string | null;
    createdAt?: string;
    studentProfile?: { registrationNumber?: string };
  }>(null);

  useEffect(() => {
    if (defaultBranchId) setBranchId(defaultBranchId);
  }, [defaultBranchId]);

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
    const e = validateAdminStudentForm({ ...form, branchId });

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
          fatherName: form.fatherName || undefined,
          motherName: form.motherName || undefined,
          fatherMobile: form.fatherMobile || undefined,
          motherMobile: form.motherMobile || undefined,
          dob: form.dob || undefined,
          bloodGroup: form.bloodGroup || undefined,
          gender: form.gender || undefined,
          address: form.address || undefined,
          instituteId: instituteId || undefined,
          smsAlertTo: form.smsAlertTo.length
            ? (form.smsAlertTo as ('SELF' | 'FATHER' | 'MOTHER')[])
            : undefined,
          sscInfo: gpaInfo(form.sscGpa),
          hscInfo: gpaInfo(form.hscGpa),
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

      let profileImage = user.profileImage ?? form.profileImage ?? null;
      if (profileImageFile) {
        const imageRes = await uploadUserProfileImage(user.id, profileImageFile);
        if (!(imageRes.success && imageRes.data)) {
          const msg = (imageRes as { message?: string }).message ?? 'Student created, but profile photo upload failed. Please retry.';
          setErrors({ submit: msg });
          return;
        }
        profileImage = imageRes.data.profileImage ?? null;
      }

      const profileRes = await upsertStudentProfile({
        userId: user.id,
        fatherName: form.fatherName || undefined,
        motherName: form.motherName || undefined,
        fatherMobile: form.fatherMobile || undefined,
        motherMobile: form.motherMobile || undefined,
        dob: form.dob || undefined,
        bloodGroup: form.bloodGroup || undefined,
        gender: form.gender || undefined,
        address: form.address || undefined,
        instituteId: instituteId || undefined,
        smsAlertTo: form.smsAlertTo.length
            ? (form.smsAlertTo as ('SELF' | 'FATHER' | 'MOTHER')[])
            : undefined,
        sscInfo: gpaInfo(form.sscGpa),
        hscInfo: gpaInfo(form.hscGpa),
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
          profileImage,
          dob: form.dob || undefined,
          sscGpa: form.sscGpa || undefined,
          hscGpa: form.hscGpa || undefined,
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
      setBranchId(defaultBranchId ?? '');
      setForm(ADD_STUDENT_DEFAULT_FORM);
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setProfileImageFile(null);
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
      <p className="mb-4 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-[11px] font-medium text-sky-900">
        Registration branch sets the student&apos;s home branch. Fees and invoices follow the branch you choose at enrollment; payments you collect are recorded under your branch.
      </p>
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
        profileImageFile={profileImageFile}
        onProfileImageFileChange={(file) => {
          setProfileImageFile(file);
          if (errors.profileImage) setErrors(prev => { const n = { ...prev }; delete n.profileImage; return n; });
        }}
        disabled={saving}
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
              placeholder="Repeat password"
              className={cn('focus-visible:ring-indigo-400 pr-10')}
              disabled={saving}
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:pointer-events-none"
              onClick={() => setShowConfirmPassword((v) => !v)}
              disabled={saving}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </StudentAdminField>
      </div>

      {errors.submit && (
        <p className="mb-3 text-[11px] font-semibold text-rose-600">{errors.submit}</p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 mt-4">
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={() => void handleSave()} disabled={saving} className="gap-2 bg-slate-900 text-white hover:bg-indigo-600">
          {saving ? 'Saving…' : <><Check className="h-4 w-4" /> Save Student</>}
        </Button>
      </div>
    </StudentAdminModal>
  );
}
