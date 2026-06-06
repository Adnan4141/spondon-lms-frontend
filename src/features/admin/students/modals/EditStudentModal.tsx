'use client';

import { useEffect, useState } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getBranches } from '@/lib/api/branches';
import { getInstitutes, type Institute } from '@/lib/api/institutes';
import { getStudentProfileByUserId, upsertStudentProfile } from '@/lib/api/student-profiles';
import { sendCredentialsSms } from '@/lib/api/students';
import { updateUser, getUserById, uploadUserProfileImage } from '@/lib/api/users';
import type { Student } from '../types';
import { StudentAdminBadge } from '../components/StudentAdminBadge';
import { StudentAdminField } from '../components/StudentAdminField';
import { StudentAdminModal } from '../components/StudentAdminModal';
import { StudentAdminSelect } from '../components/StudentAdminSelect';
import { StudentFormFields, type StudentForm } from '../components/StudentFormFields';
import { gpaInfo, validateAdminStudentForm } from '../studentValidation';
import { cn } from '@/lib/utils';

const MIN_PASSWORD_LENGTH = 6;

function dateOnly(value?: string | null): string {
  return value ? value.slice(0, 10) : '';
}

function readGpa(value: unknown): string {
  const info = value as { gpa?: unknown } | null | undefined;
  return info?.gpa != null ? String(info.gpa) : '';
}

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
    dob: student.dob ?? '',
    gender: student.gender ?? '',
    bloodGroup: student.bloodGroup ?? '',
    sscGpa: student.sscGpa ?? '',
    hscGpa: student.hscGpa ?? '',
    address: student.address ?? '',
    smsAlertTo: student.smsAlertTo ?? [],
    profileImage: student.profileImage ?? null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [smsMessage, setSmsMessage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [branchId, setBranchId] = useState(student.branchId ?? '');
  const [status, setStatus] = useState<'ACTIVE' | 'BLOCKED'>(student.status);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [instituteId, setInstituteId] = useState('');
  const [institutes, setInstitutes] = useState<Institute[]>([]);

  useEffect(() => {
    Promise.all([
      getUserById(student.id),
      getStudentProfileByUserId(student.id),
      getInstitutes({ limit: 500 }),
      getBranches(),
    ])
      .then(([userRes, profileRes, institutesRes, branchesRes]) => {
        if (userRes.success && userRes.data) {
          const u = userRes.data;
          const prof = u.studentProfile;
          setForm({
            fullName: u.fullName,
            mobile: u.mobile,
            email: u.email ?? '',
            fatherName: prof?.fatherName ?? '',
            motherName: prof?.motherName ?? '',
            fatherMobile: prof?.fatherMobile ?? '',
            motherMobile: prof?.motherMobile ?? '',
            dob: dateOnly(prof?.dob),
            gender: prof?.gender ?? '',
            bloodGroup: prof?.bloodGroup ?? '',
            sscGpa: readGpa(prof?.sscInfo),
            hscGpa: readGpa(prof?.hscInfo),
            address: prof?.address ?? '',
            smsAlertTo: prof?.smsAlertTo ?? [],
            profileImage: u.profileImage ?? null,
          });
          setBranchId(u.branchId ?? student.branchId ?? '');
          setStatus(u.status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE');
        }
        if (profileRes.success && profileRes.data) {
          setInstituteId(profileRes.data.instituteId ?? '');
        }
        if (institutesRes.success && institutesRes.data) {
          setInstitutes(institutesRes.data);
        }
        if (branchesRes.success && branchesRes.data) {
          setBranches(branchesRes.data.map(b => ({ id: b.id, name: b.name })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [student.id, student.branchId]);

  const change = (key: keyof StudentForm, value: string | string[]) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key as string]) setErrors(e => { const n = { ...e }; delete n[key as string]; return n; });
  };

  const validate = (): Record<string, string> => {
    const e = validateAdminStudentForm({ ...form, branchId });
    const pw = password.trim();
    const cpw = confirmPassword.trim();
    if (pw || cpw) {
      if (pw.length < MIN_PASSWORD_LENGTH) {
        e.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
      } else if (pw !== cpw) {
        e.confirmPassword = 'Passwords do not match';
      }
    }
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const [userRes] = await Promise.all([
        updateUser(student.id, {
          fullName: form.fullName,
          mobile: form.mobile,
          email: form.email || undefined,
          branchId: branchId || null,
          status,
          ...(password.trim() ? { password: password.trim() } : {}),
          fatherName: form.fatherName || undefined,
          motherName: form.motherName || undefined,
          fatherMobile: form.fatherMobile || undefined,
          motherMobile: form.motherMobile || undefined,
          dob: form.dob || undefined,
          gender: form.gender || undefined,
          bloodGroup: form.bloodGroup || undefined,
          address: form.address || undefined,
          smsAlertTo: form.smsAlertTo.length
            ? (form.smsAlertTo as ('SELF' | 'FATHER' | 'MOTHER')[])
            : undefined,
          sscInfo: gpaInfo(form.sscGpa),
          hscInfo: gpaInfo(form.hscGpa),
        }),
        upsertStudentProfile({
          userId: student.id,
          fatherName: form.fatherName || undefined,
          motherName: form.motherName || undefined,
          fatherMobile: form.fatherMobile || undefined,
          motherMobile: form.motherMobile || undefined,
          dob: form.dob || undefined,
          gender: form.gender || undefined,
          bloodGroup: form.bloodGroup || undefined,
          address: form.address || undefined,
          instituteId: instituteId || undefined,
          smsAlertTo: form.smsAlertTo.length
            ? (form.smsAlertTo as ('SELF' | 'FATHER' | 'MOTHER')[])
            : undefined,
          sscInfo: gpaInfo(form.sscGpa),
          hscInfo: gpaInfo(form.hscGpa),
        }),
      ]);

      if (!userRes.success) {
        const msg = (userRes as { message?: string }).message ?? 'Failed to update student';
        if (/mobile|phone|number|already/i.test(msg)) {
          setErrors({ mobile: msg });
        } else {
          setErrors({ submit: msg });
        }
        return;
      }

      let profileImage = form.profileImage ?? null;
      if (profileImageFile) {
        const imageRes = await uploadUserProfileImage(student.id, profileImageFile);
        if (!(imageRes.success && imageRes.data)) {
          const msg = (imageRes as { message?: string }).message ?? 'Student saved, but profile photo upload failed. Please retry.';
          setErrors({ submit: msg });
          return;
        }
        profileImage = imageRes.data.profileImage ?? null;
        setForm(current => ({ ...current, profileImage }));
        setProfileImageFile(null);
      }

      onSave({
        ...student,
        fullName: form.fullName,
        mobile: form.mobile,
        email: form.email || null,
        branchId,
        status,
        profileImage,
        fatherName: form.fatherName || undefined,
        motherName: form.motherName || undefined,
        fatherMobile: form.fatherMobile || undefined,
        motherMobile: form.motherMobile || undefined,
        dob: form.dob || undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup || undefined,
        sscGpa: form.sscGpa || undefined,
        hscGpa: form.hscGpa || undefined,
        address: form.address || undefined,
        smsAlertTo: form.smsAlertTo,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <StudentAdminModal
      open
      onClose={saving ? () => undefined : onClose}
      title="Edit Student"
      subtitle={`Reg: ${student.regNo} · ${student.mobile}`}
    >
      {loading ? (
        <div className="py-10 text-center text-slate-400 text-sm">Loading profile…</div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-slate-500 font-medium">Current status:</span>
            <StudentAdminBadge label={status} color={status === 'ACTIVE' ? 'green' : 'red'} />
          </div>

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
            branchDisabled={saving || loading}
            instituteId={instituteId}
            onInstituteChange={(value) => {
              setInstituteId(value);
              if (errors.instituteId) setErrors(prev => { const n = { ...prev }; delete n.instituteId; return n; });
            }}
            instituteOptions={institutes.map(ins => ({
              value: ins.id,
              label: `${ins.name}${ins.type ? ` (${ins.type})` : ''}`,
              sublabel: [ins.district, ins.eiin ? `EIIN: ${ins.eiin}` : null].filter(Boolean).join(' · ') || undefined,
            }))}
            instituteDisabled={saving || loading}
            loadingInstituteHint={loading ? 'Loading institutes...' : undefined}
            profileImageFile={profileImageFile}
            onProfileImageFileChange={(file) => {
              setProfileImageFile(file);
              if (errors.profileImage) setErrors(prev => { const n = { ...prev }; delete n.profileImage; return n; });
            }}
            disabled={saving || loading}
          />

          <div className="mb-4 grid grid-cols-2 gap-x-4">
            <StudentAdminField
              label="Reset password"
              hint="Optional. Leave empty to keep the current password."
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
                  placeholder="New password"
                  className={cn('focus-visible:ring-indigo-400 pr-10')}
                  disabled={saving || loading}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:pointer-events-none"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={saving || loading}
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
                  placeholder="Re-enter password"
                  className={cn('focus-visible:ring-indigo-400 pr-10')}
                  disabled={saving || loading}
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:pointer-events-none"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  disabled={saving || loading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </StudentAdminField>
          </div>

          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Login credentials SMS</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Sends mobile and stored one-time password via SMS. Reset password above first so SMS matches.
                </p>
                {smsMessage && (
                  <p className={cn('mt-2 text-xs font-semibold', smsMessage.startsWith('Sent') ? 'text-emerald-700' : 'text-rose-600')}>
                    {smsMessage}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                className="shrink-0 rounded-xl font-bold"
                disabled={saving || loading || sendingSms}
                onClick={async () => {
                  setSendingSms(true);
                  setSmsMessage(null);
                  try {
                    const res = await sendCredentialsSms(student.id);
                    if (res.success) {
                      setSmsMessage('Sent credentials SMS successfully.');
                    } else {
                      setSmsMessage((res as { message?: string }).message ?? 'Failed to send SMS.');
                    }
                  } catch (err) {
                    setSmsMessage(err instanceof Error ? err.message : 'Failed to send SMS.');
                  } finally {
                    setSendingSms(false);
                  }
                }}
              >
                {sendingSms ? 'Sending…' : 'Send credentials SMS'}
              </Button>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="grid sm:grid-cols-[220px_1fr] gap-3 items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Student Status</p>
                <StudentAdminSelect
                  value={status}
                  onChange={(value) => setStatus(value === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE')}
                  disabled={saving || loading}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'BLOCKED', label: 'Blocked' },
                  ]}
                />
              </div>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                Blocked students cannot log in and will not appear in active student lookup flows. Use this for access control, not enrollment cancellation.
              </p>
            </div>
          </div>

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
    </StudentAdminModal>
  );
}
