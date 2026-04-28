'use client';

import { Check, Phone, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { StudentAdminField } from './StudentAdminField';
import { SearchableSelect } from './SearchableSelect';
import { StudentAdminSelect } from './StudentAdminSelect';

export interface StudentForm {
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

export const EMPTY_FORM: StudentForm = {
  fullName: '', mobile: '', email: '',
  fatherName: '', motherName: '',
  fatherMobile: '', motherMobile: '',
  gender: '', bloodGroup: '', address: '',
  smsAlertTo: [],
};

// ─── SHARED STUDENT FORM FIELDS ───────────────────────────────────────────────

export function StudentFormFields({
  form, onChange, errors, branchId, onBranchChange, branchOptions, branchDisabled,
  instituteId, onInstituteChange, instituteOptions, instituteDisabled, loadingInstituteHint,
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
        <StudentAdminField label="Full Name" required error={errors.fullName}>
          <Input
            value={form.fullName}
            onChange={e => onChange('fullName', e.target.value)}
            placeholder="Student's full name"
            className="focus-visible:ring-indigo-400"
          />
        </StudentAdminField>
      </div>

      <StudentAdminField label="Mobile Number" required hint="Format: 01XXXXXXXXX" error={errors.mobile}>
        <Input
          value={form.mobile}
          onChange={e => onChange('mobile', e.target.value)}
          placeholder="01XXXXXXXXX"
          className="focus-visible:ring-indigo-400"
        />
      </StudentAdminField>

      <StudentAdminField label="Branch" required error={errors.branchId}>
        <SearchableSelect
          value={branchId}
          onChange={onBranchChange}
          disabled={branchDisabled}
          placeholder="Search branch..."
          options={branchOptions}
        />
      </StudentAdminField>

      <StudentAdminField
        label="Institute (School/College/University)"
        error={errors.instituteId}
        hint={loadingInstituteHint}
      >
        <SearchableSelect
          value={instituteId}
          onChange={onInstituteChange}
          disabled={instituteDisabled}
          placeholder={loadingInstituteHint ? 'Loading...' : 'Search institute...'}
          options={instituteOptions}
        />
      </StudentAdminField>

      <StudentAdminField label="Email Address" error={errors.email}>
        <Input
          type="email"
          value={form.email}
          onChange={e => onChange('email', e.target.value)}
          placeholder="Optional"
          className="focus-visible:ring-indigo-400"
        />
      </StudentAdminField>

      <StudentAdminField label="Father's Name">
        <Input
          value={form.fatherName}
          onChange={e => onChange('fatherName', e.target.value)}
          placeholder="Father's full name"
          className="focus-visible:ring-indigo-400"
        />
      </StudentAdminField>

      <StudentAdminField label="Mother's Name">
        <Input
          value={form.motherName}
          onChange={e => onChange('motherName', e.target.value)}
          placeholder="Mother's full name"
          className="focus-visible:ring-indigo-400"
        />
      </StudentAdminField>

      <StudentAdminField label="Father's Mobile">
        <Input
          value={form.fatherMobile}
          onChange={e => onChange('fatherMobile', e.target.value)}
          placeholder="01XXXXXXXXX"
          className="focus-visible:ring-indigo-400"
        />
      </StudentAdminField>

      <StudentAdminField label="Mother's Mobile">
        <Input
          value={form.motherMobile}
          onChange={e => onChange('motherMobile', e.target.value)}
          placeholder="01XXXXXXXXX"
          className="focus-visible:ring-indigo-400"
        />
      </StudentAdminField>

      <StudentAdminField label="Gender">
        <StudentAdminSelect
          value={form.gender}
          onChange={v => onChange('gender', v)}
          placeholder="Select gender"
          options={[
            { value: 'MALE', label: 'Male' },
            { value: 'FEMALE', label: 'Female' },
            { value: 'OTHER', label: 'Other' },
          ]}
        />
      </StudentAdminField>

      <StudentAdminField label="Blood Group">
        <StudentAdminSelect
          value={form.bloodGroup}
          onChange={v => onChange('bloodGroup', v)}
          placeholder="Select"
          options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(x => ({ value: x, label: x }))}
        />
      </StudentAdminField>

      <div className="col-span-2">
        <StudentAdminField label="Address">
          <Input
            value={form.address}
            onChange={e => onChange('address', e.target.value)}
            placeholder="Full address"
            className="focus-visible:ring-indigo-400"
          />
        </StudentAdminField>
      </div>

      <div className="col-span-2">
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
        </StudentAdminField>
      </div>
    </div>
  );
}
