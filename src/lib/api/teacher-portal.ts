import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/student';

export interface TeacherMyProfileCourse {
  id: string;
  slug?: string;
  name: string;
  description?: string | null;
  fee?: number | string | null;
  thumbnail?: string | null;
}

export interface TeacherMyProfile {
  id: string;
  fullName: string;
  email?: string | null;
  mobile: string;
  role: string;
  status: string;
  profileImage?: string | null;
  designation?: string | null;
  institute?: string | null;
  experienceYears?: number | null;
  demoClassUrl?: string | null;
  showMobile?: boolean;
  updatedAt?: string;
  branch?: { id: string; name: string } | null;
  courses: TeacherMyProfileCourse[];
}

export interface UpdateMyTeacherProfilePayload {
  fullName?: string;
  email?: string | null;
  designation?: string | null;
  institute?: string | null;
  experienceYears?: number | null;
  demoClassUrl?: string | null;
  showMobile?: boolean;
}

export async function getMyTeacherProfile(): Promise<ApiResponse<TeacherMyProfile>> {
  return apiRequest<ApiResponse<TeacherMyProfile>>('/users/me');
}

export async function updateMyTeacherProfile(
  data: UpdateMyTeacherProfilePayload,
): Promise<ApiResponse<TeacherMyProfile>> {
  return apiRequest<ApiResponse<TeacherMyProfile>>('/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
