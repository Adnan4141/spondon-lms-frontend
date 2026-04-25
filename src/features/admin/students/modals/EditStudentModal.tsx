'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBranches } from '@/lib/api/branches';
import { getInstitutes, type Institute } from '@/lib/api/institutes';
import { getStudentProfileByUserId, upsertStudentProfile } from '@/lib/api/student-profiles';
import { updateUser, getUserById } from '@/lib/api/users';
import type { Student } from '../types';
import { StudentAdminBadge } from '../components/StudentAdminBadge';
import { StudentAdminField } from '../components/StudentAdminField';
import { StudentAdminModal } from '../components/StudentAdminModal';
import { StudentAdminSelect } from '../components/StudentAdminSelect';
import { SearchableSelect } from '../components/SearchableSelect';
import { StudentFormFields, type StudentForm } from '../components/StudentFormFields';

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
  const [loading, setLoading] = useState(true);

  const [branchId, setBranchId] = useState(student.branchId ?? '');
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
            gender: prof?.gender ?? '',
            bloodGroup: prof?.bloodGroup ?? '',
            address: prof?.address ?? '',
            smsAlertTo: prof?.smsAlertTo ?? [],
          });
          setBranchId(u.branchId ?? student.branchId ?? '');
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
      const [userRes] = await Promise.all([
        updateUser(student.id, {
          fullName: form.fullName,
          mobile: form.mobile,
          email: form.email || undefined,
          branchId: branchId || null,
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
        }),
        upsertStudentProfile({
          userId: student.id,
          fatherName: form.fatherName || undefined,
          motherName: form.motherName || undefined,
          fatherMobile: form.fatherMobile || undefined,
          motherMobile: form.motherMobile || undefined,
          gender: form.gender || undefined,
          bloodGroup: form.bloodGroup || undefined,
          address: form.address || undefined,
          instituteId: instituteId || undefined,
          smsAlertTo: form.smsAlertTo.length
            ? (form.smsAlertTo as ('SELF' | 'FATHER' | 'MOTHER')[])
            : undefined,
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

      onSave({
        ...student,
        fullName: form.fullName,
        mobile: form.mobile,
        email: form.email || null,
        branchId,
        fatherName: form.fatherName || undefined,
        motherName: form.motherName || undefined,
        fatherMobile: form.fatherMobile || undefined,
        motherMobile: form.motherMobile || undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup || undefined,
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
            <StudentAdminBadge label={student.status} color={student.status === 'ACTIVE' ? 'green' : 'red'} />
          </div>

          <StudentFormFields form={form} onChange={change} errors={errors} />

          <StudentAdminField
            label="Institute (School/College/University)"
            error={errors.instituteId}
          >
            <SearchableSelect
              value={instituteId}
              onChange={setInstituteId}
              disabled={saving}
              placeholder="Search institute..."
              options={institutes.map(ins => ({
                value: ins.id,
                label: `${ins.name}${ins.type ? ` (${ins.type})` : ''}`,
                sublabel: [ins.district, ins.eiin ? `EIIN: ${ins.eiin}` : null].filter(Boolean).join(' · ') || undefined,
              }))}
            />
          </StudentAdminField>

          <StudentAdminField label="Branch">
            <StudentAdminSelect
              value={branchId}
              onChange={setBranchId}
              disabled={saving}
              placeholder="Select branch (optional)"
              options={branches.map(b => ({ value: b.id, label: b.name }))}
            />
          </StudentAdminField>

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
