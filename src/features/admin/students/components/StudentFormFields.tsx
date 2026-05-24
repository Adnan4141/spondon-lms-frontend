'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
import { Check, Phone, MessageSquare, Camera, UserCircle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { StudentAdminField } from './StudentAdminField';
import { SearchableSelect } from './SearchableSelect';
import { StudentAdminSelect } from './StudentAdminSelect';
import { BLOOD_GROUP_OPTIONS, GENDER_OPTIONS } from '../studentValidation';

export interface StudentForm {
  fullName: string;
  mobile: string;
  email: string;
  fatherName: string;
  motherName: string;
  fatherMobile: string;
  motherMobile: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  sscGpa: string;
  hscGpa: string;
  address: string;
  smsAlertTo: string[];
  profileImage: string | null;
}

export const EMPTY_FORM: StudentForm = {
  fullName: '', mobile: '', email: '',
  fatherName: '', motherName: '',
  fatherMobile: '', motherMobile: '',
  dob: '',
  gender: '', bloodGroup: '', address: '',
  sscGpa: '', hscGpa: '',
  smsAlertTo: [],
  profileImage: null,
};

// ─── SHARED STUDENT FORM FIELDS ───────────────────────────────────────────────

export function StudentFormFields({
  form, onChange, errors, branchId, onBranchChange, branchOptions, branchDisabled,
  instituteId, onInstituteChange, instituteOptions, instituteDisabled, loadingInstituteHint,
  profileImageFile, onProfileImageFileChange, disabled,
}: {
  form: StudentForm;
  onChange: (key: keyof StudentForm, value: string | string[]) => void;
  errors: Record<string, string>;
  branchId: string;
  onBranchChange: (value: string) => void;
  branchOptions: { value: string; label: string }[];
  branchDisabled?: boolean;
  instituteId: string;
  onInstituteChange: (value: string) => void;
  instituteOptions: { value: string; label: string; sublabel?: string }[];
  instituteDisabled?: boolean;
  loadingInstituteHint?: string;
  profileImageFile?: File | null;
  onProfileImageFileChange?: (file: File | null) => void;
  disabled?: boolean;
}) {
  const SMS_OPTIONS: { id: string; label: string; icon: ReactNode }[] = [
    { id: 'SELF', label: 'Student', icon: <Phone className="h-3 w-3" /> },
    { id: 'FATHER', label: "Father", icon: <MessageSquare className="h-3 w-3" /> },
    { id: 'MOTHER', label: "Mother", icon: <MessageSquare className="h-3 w-3" /> },
  ];

  const toggleSms = (id: string) => {
    const current = form.smsAlertTo;
    onChange('smsAlertTo', current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  };

  const localProfilePreview = useMemo(
    () => (profileImageFile ? URL.createObjectURL(profileImageFile) : ''),
    [profileImageFile],
  );
  useEffect(() => () => {
    if (localProfilePreview) URL.revokeObjectURL(localProfilePreview);
  }, [localProfilePreview]);
  const profilePreview = localProfilePreview || (form.profileImage ? resolveAttachmentUrl(form.profileImage, API_ORIGIN) : '');

  return (
    <div className="space-y-5">
      <section className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-[132px_1fr]">
        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-500">Photo</p>
          <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-white text-indigo-500">
            {profilePreview ? (
              <img
                src={profilePreview}
                alt={form.fullName || 'Student profile'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-indigo-50">
                <UserCircle className="h-10 w-10" />
              </div>
            )}
            <label className={cn(
              'absolute inset-x-0 bottom-0 flex cursor-pointer items-center justify-center gap-1 bg-slate-950/75 py-1.5 text-[10px] font-bold text-white',
              disabled && 'pointer-events-none opacity-60',
            )}>
              <Camera className="h-3.5 w-3.5" />
              Replace
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={disabled}
                onChange={(event) => onProfileImageFileChange?.(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          {profileImageFile && (
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600"
              onClick={() => onProfileImageFileChange?.(null)}
              disabled={disabled}
            >
              <X className="h-3 w-3" /> Clear selected
            </button>
          )}
          {errors.profileImage && <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.profileImage}</p>}
        </div>

        <div className="grid gap-x-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <StudentAdminField label="Full Name" required error={errors.fullName}>
              <Input
                value={form.fullName}
                onChange={e => onChange('fullName', e.target.value)}
                placeholder="Student's full name"
                className="focus-visible:ring-indigo-400"
                disabled={disabled}
              />
            </StudentAdminField>
          </div>

          <StudentAdminField label="Mobile Number" required hint="Format: 01XXXXXXXXX" error={errors.mobile}>
            <Input
              value={form.mobile}
              onChange={e => onChange('mobile', e.target.value)}
              placeholder="01XXXXXXXXX"
              className="focus-visible:ring-indigo-400"
              disabled={disabled}
            />
          </StudentAdminField>

          <StudentAdminField label="Branch" required error={errors.branchId}>
            <SearchableSelect
              value={branchId}
              onChange={onBranchChange}
              disabled={branchDisabled || disabled}
              placeholder="Search branch..."
              options={branchOptions}
            />
          </StudentAdminField>

          <StudentAdminField label="Email Address" error={errors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={e => onChange('email', e.target.value)}
              placeholder="Optional"
              className="focus-visible:ring-indigo-400"
              disabled={disabled}
            />
          </StudentAdminField>
        </div>
      </section>

      <FormSection title="Education">
        <StudentAdminField
          label="Institute (School/College/University)"
          error={errors.instituteId}
          hint={loadingInstituteHint}
        >
          <SearchableSelect
            value={instituteId}
            onChange={onInstituteChange}
            disabled={instituteDisabled || disabled}
            placeholder={loadingInstituteHint ? 'Loading...' : 'Search institute...'}
            options={instituteOptions}
          />
        </StudentAdminField>

        <StudentAdminField label="SSC GPA" hint="0.00 to 5.00" error={errors.sscGpa}>
          <Input
            inputMode="decimal"
            value={form.sscGpa}
            onChange={e => onChange('sscGpa', e.target.value)}
            placeholder="Example: 5.00"
            className="focus-visible:ring-indigo-400"
            disabled={disabled}
          />
        </StudentAdminField>

        <StudentAdminField label="HSC GPA" hint="0.00 to 5.00" error={errors.hscGpa}>
          <Input
            inputMode="decimal"
            value={form.hscGpa}
            onChange={e => onChange('hscGpa', e.target.value)}
            placeholder="Example: 5.00"
            className="focus-visible:ring-indigo-400"
            disabled={disabled}
          />
        </StudentAdminField>
      </FormSection>

      <FormSection title="Guardian">
        <StudentAdminField label="Father's Name">
          <Input
            value={form.fatherName}
            onChange={e => onChange('fatherName', e.target.value)}
            placeholder="Father's full name"
            className="focus-visible:ring-indigo-400"
            disabled={disabled}
          />
        </StudentAdminField>

        <StudentAdminField label="Mother's Name">
          <Input
            value={form.motherName}
            onChange={e => onChange('motherName', e.target.value)}
            placeholder="Mother's full name"
            className="focus-visible:ring-indigo-400"
            disabled={disabled}
          />
        </StudentAdminField>

        <StudentAdminField label="Father's Mobile" hint="Format: 01XXXXXXXXX" error={errors.fatherMobile}>
          <Input
            value={form.fatherMobile}
            onChange={e => onChange('fatherMobile', e.target.value)}
            placeholder="01XXXXXXXXX"
            className="focus-visible:ring-indigo-400"
            disabled={disabled}
          />
        </StudentAdminField>

        <StudentAdminField label="Mother's Mobile" hint="Format: 01XXXXXXXXX" error={errors.motherMobile}>
          <Input
            value={form.motherMobile}
            onChange={e => onChange('motherMobile', e.target.value)}
            placeholder="01XXXXXXXXX"
            className="focus-visible:ring-indigo-400"
            disabled={disabled}
          />
        </StudentAdminField>
      </FormSection>

      <FormSection title="Personal">
        <StudentAdminField label="Date of Birth" error={errors.dob}>
          <Input
            type="date"
            value={form.dob}
            onChange={e => onChange('dob', e.target.value)}
            className="focus-visible:ring-indigo-400"
            disabled={disabled}
          />
        </StudentAdminField>

        <StudentAdminField label="Gender" error={errors.gender}>
          <StudentAdminSelect
            value={form.gender}
            onChange={v => onChange('gender', v)}
            placeholder="Select gender"
            disabled={disabled}
            options={GENDER_OPTIONS.map(value => ({
              value,
              label: value === 'MALE' ? 'Male' : value === 'FEMALE' ? 'Female' : 'Other',
            }))}
          />
        </StudentAdminField>

        <StudentAdminField label="Blood Group" error={errors.bloodGroup}>
          <StudentAdminSelect
            value={form.bloodGroup}
            onChange={v => onChange('bloodGroup', v)}
            placeholder="Select"
            disabled={disabled}
            options={BLOOD_GROUP_OPTIONS.map(x => ({ value: x, label: x }))}
          />
        </StudentAdminField>

        <div className="sm:col-span-2">
          <StudentAdminField label="Address">
            <textarea
              value={form.address}
              onChange={e => onChange('address', e.target.value)}
              placeholder="Full address"
              rows={3}
              className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled}
            />
          </StudentAdminField>
        </div>
      </FormSection>

      <section>
        <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-500">SMS Alerts</p>
        <StudentAdminField label="SMS Alerts To" hint="Select who receives SMS notifications">
          <div className="flex gap-2 flex-wrap">
            {SMS_OPTIONS.map(opt => (
              <label
                key={opt.id}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 border rounded-lg cursor-pointer text-sm font-semibold transition-colors select-none',
                  form.smsAlertTo.includes(opt.id)
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                  disabled && 'pointer-events-none opacity-60',
                )}
              >
                <input
                  type="checkbox"
                  checked={form.smsAlertTo.includes(opt.id)}
                  onChange={() => toggleSms(opt.id)}
                  className="sr-only"
                  disabled={disabled}
                />
                {opt.icon}
                {opt.label}
                {form.smsAlertTo.includes(opt.id) && (
                  <Check className="h-3 w-3 text-indigo-600" />
                )}
              </label>
            ))}
          </div>
        </StudentAdminField>
      </section>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-500">{title}</p>
      <div className="grid gap-x-4 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}
