'use client';

import { useState } from 'react';
import { Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createUser } from '@/lib/api/users';
import type { Student } from './types';
import { StudentAdminModal } from './StudentAdminModal';
import { EMPTY_FORM, StudentFormFields, type StudentForm } from './StudentFormFields';

export function AddStudentModal({
  onClose, onSave,
}: {
  onClose: () => void;
  onSave: (student: Student) => void;
}) {
  const [form, setForm] = useState<StudentForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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
        const msg = (res as { message?: string }).message ?? 'Failed to create student';
        if (/mobile|phone|number|already/i.test(msg)) {
          setErrors({ mobile: msg });
        } else {
          setErrors({ submit: msg });
        }
      }
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
