'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateUser, getUserById } from '@/lib/api/users';
import type { Student } from './types';
import { StudentAdminBadge } from './StudentAdminBadge';
import { StudentAdminModal } from './StudentAdminModal';
import { StudentFormFields, type StudentForm } from './StudentFormFields';

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
    <StudentAdminModal
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
            <StudentAdminBadge label={student.status} color={student.status === 'ACTIVE' ? 'green' : 'red'} />
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
    </StudentAdminModal>
  );
}
