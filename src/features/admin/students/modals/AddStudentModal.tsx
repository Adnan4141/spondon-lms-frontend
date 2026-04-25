'use client';

import { useEffect, useState } from 'react';
import { Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBranches } from '@/lib/api/branches';
import { createUser } from '@/lib/api/users';
import { getInstitutes, type Institute } from '@/lib/api/institutes';
import { upsertStudentProfile } from '@/lib/api/student-profiles';
import type { Student } from '../types';
import { StudentAdminField } from '../components/StudentAdminField';
import { StudentAdminModal } from '../components/StudentAdminModal';
import { StudentAdminSelect } from '../components/StudentAdminSelect';
import { SearchableSelect } from '../components/SearchableSelect';
import { EMPTY_FORM, StudentFormFields, type StudentForm } from '../components/StudentFormFields';

export function AddStudentModal({
  onClose, onSave,
}: {
  onClose: () => void;
  onSave: (student: Student) => void;
}) {
  const [form, setForm] = useState<StudentForm>(EMPTY_FORM);
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
    if (!instituteId) e.instituteId = 'Institute is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      let user = profileUser;

      if (!user) {
        const createRes = await createUser({
          fullName: form.fullName,
          mobile: form.mobile,
          email: form.email || undefined,
          role: 'STUDENT',
          branchId: branchId || undefined,
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
        instituteId,
        smsAlertTo: form.smsAlertTo.length
          ? (form.smsAlertTo as ('SELF' | 'FATHER' | 'MOTHER')[])
          : undefined,
      });

      if (!(profileRes.success && profileRes.data)) {
        const msg = (profileRes as { message?: string }).message ?? 'Student created, but profile save failed. Please retry.';
        setErrors({ submit: msg });
        return;
      }

      onSave({
        id: user.id,
        regNo: profileRes.data.registrationNumber ?? user.studentProfile?.registrationNumber ?? '—',
        fullName: user.fullName,
        mobile: user.mobile,
        email: user.email ?? null,
        status: 'ACTIVE',
        branchId: user.branchId ?? '',
        createdAt: user.createdAt ?? new Date().toISOString().slice(0, 10),
      });

      setProfileUser(null);
      setInstituteId('');
      setBranchId('');
      setForm(EMPTY_FORM);
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
      <StudentFormFields form={form} onChange={change} errors={errors} />

      <StudentAdminField
        label="Institute (School/College/University)"
        required
        error={errors.instituteId}
        hint={loadingInstitutes ? 'Loading institutes...' : undefined}
      >
        <SearchableSelect
          value={instituteId}
          onChange={(v) => {
            setInstituteId(v);
            if (errors.instituteId) setErrors(prev => { const n = { ...prev }; delete n.instituteId; return n; });
          }}
          disabled={loadingInstitutes || saving}
          placeholder={loadingInstitutes ? 'Loading...' : 'Search institute...'}
          options={institutes.map((ins) => ({
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
          disabled={loadingBranches || saving}
          placeholder={loadingBranches ? 'Loading...' : 'Select branch (optional)'}
          options={branches.map(b => ({ value: b.id, label: b.name }))}
        />
      </StudentAdminField>

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
