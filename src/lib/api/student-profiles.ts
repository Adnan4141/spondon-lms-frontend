import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/course';

export type SmsAlertTo = 'SELF' | 'FATHER' | 'MOTHER';

export interface StudentProfileRecord {
  id: string;
  userId: string;
  registrationNumber?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  fatherMobile?: string | null;
  motherMobile?: string | null;
  dob?: string | null;
  bloodGroup?: string | null;
  gender?: string | null;
  primaryMobile?: string | null;
  secondaryMobile?: string | null;
  address?: string | null;
  instituteId?: string | null;
  smsAlertTo?: SmsAlertTo[] | null;
  sscInfo?: unknown;
  hscInfo?: unknown;
}

export type UpsertStudentProfilePayload = {
  userId: string;
  fatherName?: string;
  motherName?: string;
  fatherMobile?: string;
  motherMobile?: string;
  dob?: string;
  bloodGroup?: string;
  gender?: string;
  primaryMobile?: string;
  secondaryMobile?: string;
  address?: string;
  instituteId?: string;
  registrationNumber?: string;
  smsAlertTo?: SmsAlertTo[];
  sscInfo?: unknown;
  hscInfo?: unknown;
};

export async function getStudentProfileByUserId(
  userId: string
): Promise<ApiResponse<StudentProfileRecord>> {
  return apiRequest<ApiResponse<StudentProfileRecord>>(
    `/student-profiles/user/${encodeURIComponent(userId)}`
  );
}

export async function getStudentProfileByRegistrationNumber(
  regNo: string
): Promise<ApiResponse<StudentProfileRecord & { user?: { id: string; fullName: string; mobile: string; email?: string | null; branchId?: string; status: string; createdAt?: string; studentProfile?: { registrationNumber?: string } } }>> {
  return apiRequest<ApiResponse<StudentProfileRecord & { user?: { id: string; fullName: string; mobile: string; email?: string | null; branchId?: string; status: string; createdAt?: string; studentProfile?: { registrationNumber?: string } } }>>(
    `/student-profiles/by-registration/${encodeURIComponent(regNo)}`
  );
}

export async function upsertStudentProfile(
  body: UpsertStudentProfilePayload
): Promise<ApiResponse<StudentProfileRecord>> {
  return apiRequest<ApiResponse<StudentProfileRecord>>('/student-profiles/upsert', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
