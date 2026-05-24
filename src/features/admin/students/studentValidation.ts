import { z } from 'zod';

export const GENDER_OPTIONS = ['MALE', 'FEMALE', 'OTHER'] as const;
export const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export type StudentFormErrors = Record<string, string>;

const emailSchema = z.string().email('Invalid email');
const genderSchema = z.enum(GENDER_OPTIONS);
const bloodGroupSchema = z.enum(BLOOD_GROUP_OPTIONS);

export function normalizeBdMobile(value: string): string {
  return value.trim().replace(/[\s-]/g, '').replace(/^\+?88/, '');
}

export function isValidBdMobile(value: string): boolean {
  return /^01[3-9]\d{8}$/.test(normalizeBdMobile(value));
}

export function isValidGpa(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (!/^\d(?:\.\d{1,2})?$/.test(trimmed)) return false;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) && numeric >= 0 && numeric <= 5;
}

export function isValidDob(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;
  const [year, month, day] = trimmed.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return false;
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed <= today;
}

export function validateOptionalStudentFields(input: {
  email?: string;
  fatherMobile?: string;
  motherMobile?: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  sscGpa?: string;
  hscGpa?: string;
}): StudentFormErrors {
  const errors: StudentFormErrors = {};

  if (input.email?.trim() && !emailSchema.safeParse(input.email.trim()).success) {
    errors.email = 'Invalid email';
  }
  if (input.fatherMobile?.trim() && !isValidBdMobile(input.fatherMobile)) {
    errors.fatherMobile = 'Invalid BD mobile (01XXXXXXXXX)';
  }
  if (input.motherMobile?.trim() && !isValidBdMobile(input.motherMobile)) {
    errors.motherMobile = 'Invalid BD mobile (01XXXXXXXXX)';
  }
  if (input.dob?.trim() && !isValidDob(input.dob)) {
    errors.dob = 'Date of birth must be a valid past date';
  }
  if (input.gender?.trim() && !genderSchema.safeParse(input.gender).success) {
    errors.gender = 'Select a valid gender';
  }
  if (input.bloodGroup?.trim() && !bloodGroupSchema.safeParse(input.bloodGroup).success) {
    errors.bloodGroup = 'Select a valid blood group';
  }
  if (input.sscGpa?.trim() && !isValidGpa(input.sscGpa)) {
    errors.sscGpa = 'SSC GPA must be between 0.00 and 5.00';
  }
  if (input.hscGpa?.trim() && !isValidGpa(input.hscGpa)) {
    errors.hscGpa = 'HSC GPA must be between 0.00 and 5.00';
  }

  return errors;
}

export function validateAdminStudentForm(input: {
  fullName: string;
  mobile: string;
  branchId: string;
  email?: string;
  fatherMobile?: string;
  motherMobile?: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  sscGpa?: string;
  hscGpa?: string;
}): StudentFormErrors {
  const errors = validateOptionalStudentFields(input);

  if (!input.fullName.trim()) errors.fullName = 'Name is required';
  if (!input.mobile.trim()) errors.mobile = 'Mobile is required';
  else if (!isValidBdMobile(input.mobile)) errors.mobile = 'Invalid BD mobile (01XXXXXXXXX)';
  if (!input.branchId) errors.branchId = 'Branch is required';

  return errors;
}

export function validateStudentProfileForm(input: {
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  sscGpa?: string;
  hscGpa?: string;
}): StudentFormErrors {
  return validateOptionalStudentFields(input);
}

export function gpaInfo(value: string): { gpa: string } | undefined {
  const trimmed = value.trim();
  return trimmed ? { gpa: trimmed } : undefined;
}
