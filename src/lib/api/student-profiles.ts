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
  user?: {
    id: string;
    fullName: string;
    mobile: string;
    status: string;
    profileImage?: string | null;
    branchId?: string | null;
    branch?: { id: string; name: string } | null;
  };
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

export async function getMyStudentProfile(): Promise<ApiResponse<StudentProfileRecord>> {
  return apiRequest<ApiResponse<StudentProfileRecord>>('/student-profiles/me');
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

export type UpdateMyStudentProfilePayload = Pick<
  UpsertStudentProfilePayload,
  | 'fatherName'
  | 'motherName'
  | 'dob'
  | 'bloodGroup'
  | 'gender'
  | 'address'
  | 'instituteId'
  | 'sscInfo'
  | 'hscInfo'
>;

export async function updateMyStudentProfile(
  body: UpdateMyStudentProfilePayload
): Promise<ApiResponse<StudentProfileRecord>> {
  return apiRequest<ApiResponse<StudentProfileRecord>>('/student-profiles/me', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}
