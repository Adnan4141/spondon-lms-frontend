import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/student';

export interface User {
  id: string;
  fullName: string;
  email?: string;
  mobile: string;
  role: string;
  status: string;
  profileImage?: string | null;
  branchId?: string;
  createdAt?: string;
  updatedAt?: string;
  branch?: {
    id: string;
    name: string;
  };
  // Teacher profile fields
  designation?: string | null;
  institute?: string | null;
  experienceYears?: number | null;
  demoClassUrl?: string | null;
  showMobile?: boolean;
  displayOrder?: number;
  // Student profile fields (returned by getUserById)
  studentProfile?: {
    registrationNumber?: string;
    fatherName?: string;
    motherName?: string;
    fatherMobile?: string;
    motherMobile?: string;
    dob?: string | null;
    bloodGroup?: string;
    gender?: string;
    address?: string;
    smsAlertTo?: string[];
    sscInfo?: unknown;
    hscInfo?: unknown;
  };
}

export type CreateUserPayload = {
  fullName: string;
  email?: string;
  mobile: string;
  password?: string;
  role: string;
  branchId?: string;
  status?: string;
  profileImage?: string;
  fatherName?: string;
  motherName?: string;
  fatherMobile?: string;
  motherMobile?: string;
  dob?: string;
  bloodGroup?: string;
  gender?: string;
  address?: string;
  instituteId?: string;
  smsAlertTo?: ('SELF' | 'FATHER' | 'MOTHER')[];
  sscInfo?: unknown;
  hscInfo?: unknown;
};

export type UpdateUserPayload = {
  fullName?: string;
  email?: string;
  mobile?: string;
  password?: string;
  role?: string;
  branchId?: string | null;
  status?: string;
  profileImage?: string | null;
  designation?: string;
  institute?: string;
  experienceYears?: number | null;
  demoClassUrl?: string;
  showMobile?: boolean;
  // Student profile fields
  fatherName?: string;
  motherName?: string;
  fatherMobile?: string;
  motherMobile?: string;
  dob?: string;
  bloodGroup?: string;
  gender?: string;
  address?: string;
  instituteId?: string;
  smsAlertTo?: ('SELF' | 'FATHER' | 'MOTHER')[];
  sscInfo?: unknown;
  hscInfo?: unknown;
};

export async function changeMyPassword(body: {
  currentPassword: string;
  newPassword: string;
}): Promise<ApiResponse<Record<string, never>>> {
  return apiRequest<ApiResponse<Record<string, never>>>('/users/me/change-password', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getUsers(params?: {
  role?: string;
  branchId?: string;
  status?: string;
  includeUnverified?: boolean;
  programId?: string;
  courseId?: string;
  batchId?: string;
  search?: string;
  includeDetails?: boolean;
  /** Exclude students (staff directory). */
  staffOnly?: boolean;
  /** Lighter payload: branch only (faster list). */
  minimal?: boolean;
  page?: number;
  limit?: number;
}): Promise<
  ApiResponse<User[]> & {
    pagination?: { page: number; limit: number; total: number; pages: number };
  }
> {
  const queryParams = new URLSearchParams();
  if (params?.role) queryParams.append('role', params.role);
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.includeUnverified !== undefined) queryParams.append('includeUnverified', String(params.includeUnverified));
  if (params?.programId) queryParams.append('programId', params.programId);
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.batchId) queryParams.append('batchId', params.batchId);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.includeDetails !== undefined) queryParams.append('includeDetails', String(params.includeDetails));
  if (params?.staffOnly) queryParams.append('staffOnly', 'true');
  if (params?.minimal) queryParams.append('minimal', 'true');
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const query = queryParams.toString();
  return apiRequest<ApiResponse<User[]> & { pagination?: { page: number; limit: number; total: number; pages: number } }>(
    `/users${query ? `?${query}` : ''}`,
  );
}

export type AdminStudentListParams = {
  branchId?: string;
  status?: string;
  includeUnverified?: boolean;
  programId?: string;
  courseId?: string;
  batchId?: string;
  search?: string;
  includeDetails?: boolean;
  page?: number;
  limit?: number;
};

/** Optimized admin student list (`GET /users/students`). */
export async function getAdminStudents(params?: AdminStudentListParams): Promise<
  ApiResponse<User[]> & {
    pagination?: { page: number; limit: number; total: number; pages: number };
  }
> {
  const queryParams = new URLSearchParams();
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.includeUnverified !== undefined) {
    queryParams.append('includeUnverified', String(params.includeUnverified));
  }
  if (params?.programId) queryParams.append('programId', params.programId);
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.batchId) queryParams.append('batchId', params.batchId);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.includeDetails !== undefined) {
    queryParams.append('includeDetails', String(params.includeDetails));
  }
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const query = queryParams.toString();
  return apiRequest<ApiResponse<User[]> & { pagination?: { page: number; limit: number; total: number; pages: number } }>(
    `/users/students${query ? `?${query}` : ''}`,
  );
}

export type StudentDatabaseStats = {
  total: number;
  active: number;
  blocked: number;
  newThisMonth: number;
};

/** Stats + list in one request for /admin/students mount. */
export async function getStudentsPageBootstrap(params?: AdminStudentListParams): Promise<
  ApiResponse<{
    stats: StudentDatabaseStats;
    students: User[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>
> {
  const queryParams = new URLSearchParams();
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.includeUnverified !== undefined) {
    queryParams.append('includeUnverified', String(params.includeUnverified));
  }
  if (params?.programId) queryParams.append('programId', params.programId);
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.batchId) queryParams.append('batchId', params.batchId);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.includeDetails !== undefined) {
    queryParams.append('includeDetails', String(params.includeDetails));
  }
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const query = queryParams.toString();
  return apiRequest<
    ApiResponse<{
      stats: StudentDatabaseStats;
      students: User[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>
  >(`/users/students/page-bootstrap${query ? `?${query}` : ''}`);
}

/** Staff role counts (non-student); honors branch/status filters. */
export async function getStaffRoleSummary(params?: {
  branchId?: string;
  status?: string;
}): Promise<ApiResponse<{ byRole: Record<string, number>; total: number }>> {
  const queryParams = new URLSearchParams();
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.status) queryParams.append('status', params.status);
  const query = queryParams.toString();
  return apiRequest<ApiResponse<{ byRole: Record<string, number>; total: number }>>(
    `/users/staff-role-summary${query ? `?${query}` : ''}`,
  );
}

/** Global student row counts (ignores list filters; BRANCH_ADMIN is branch-scoped server-side). */
export async function getStudentDatabaseStats(): Promise<ApiResponse<StudentDatabaseStats>> {
  return apiRequest<ApiResponse<StudentDatabaseStats>>('/users/student-stats');
}

export async function getUserById(id: string): Promise<ApiResponse<User>> {
  return apiRequest<ApiResponse<User>>(`/users/${id}`);
}

export async function createUser(data: CreateUserPayload): Promise<
  ApiResponse<User & { oneTimePassword?: string }>
> {
  return apiRequest<ApiResponse<User & { oneTimePassword?: string }>>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(
  id: string,
  data: UpdateUserPayload
): Promise<ApiResponse<User>> {
  return apiRequest<ApiResponse<User>>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function uploadUserProfileImage(
  userId: string,
  file: File
): Promise<ApiResponse<User>> {
  const form = new FormData();
  form.append('file', file);
  return apiRequest<ApiResponse<User>>(`/users/${userId}/profile-image`, {
    method: 'POST',
    body: form,
  });
}

export async function uploadMyProfileImage(file: File): Promise<ApiResponse<User>> {
  const form = new FormData();
  form.append('file', file);
  return apiRequest<ApiResponse<User>>('/users/me/profile-image', {
    method: 'POST',
    body: form,
  });
}

export async function deleteUser(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/users/${id}`, {
    method: 'DELETE',
  });
}

export interface PublicTeacher {
  id: string;
  fullName: string;
  profileImage?: string | null;
  designation?: string | null;
  institute?: string | null;
  experienceYears?: number | null;
  demoClassUrl?: string | null;
  mobile?: string | null;
  courses: Array<{
    id: string;
    slug?: string;
    name: string;
    description?: string;
    fee?: number | string;
    thumbnail?: string;
  }>;
}

export async function getPublicTeachers(): Promise<ApiResponse<PublicTeacher[]>> {
  return apiRequest<ApiResponse<PublicTeacher[]>>('/users/teachers/public');
}

export async function getPublicTeacherById(id: string): Promise<ApiResponse<PublicTeacher>> {
  return apiRequest<ApiResponse<PublicTeacher>>(`/users/teachers/public/${id}`);
}

export async function reorderTeachers(
  items: { id: string; displayOrder: number }[]
): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>('/users/teachers/reorder', {
    method: 'PATCH',
    body: JSON.stringify(items),
  });
}
