import { apiRequest } from '../api';
import type {
  Student,
  CreateStudentDto,
  UpdateStudentDto,
  ApiResponse,
  StudentCreatedWithCredentials,
} from '@/types/student';
export type { Student, CreateStudentDto, UpdateStudentDto, ApiResponse, StudentCreatedWithCredentials };

export async function getStudents(params?: {
  role?: string;
  branchId?: string;
  programId?: string;
  courseId?: string;
  batchId?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<Student[]>> {
  const queryParams = new URLSearchParams();
  const role = params?.role?.trim() || 'STUDENT';
  queryParams.append('role', role);
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.programId) queryParams.append('programId', params.programId);
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.batchId) queryParams.append('batchId', params.batchId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const query = queryParams.toString();
  return apiRequest<ApiResponse<Student[]>>(`/users${query ? `?${query}` : ''}`);
}

export async function getStudentById(id: string): Promise<ApiResponse<Student>> {
  return apiRequest<ApiResponse<Student>>(`/users/${id}`);
}

export type StudentLookupMatch = {
  id: string;
  fullName: string;
  mobile: string;
  registrationNumber?: string | null;
  matchedBy: 'id' | 'registrationNumber' | 'mobile';
};

/** Resolve student user id from internal id, registration number, or BD mobile. */
export async function lookupStudentUser(q: string): Promise<ApiResponse<StudentLookupMatch>> {
  return apiRequest<ApiResponse<StudentLookupMatch>>(
    `/users/lookup/student?q=${encodeURIComponent(q.trim())}`,
  );
}

export async function createStudent(
  data: CreateStudentDto,
): Promise<ApiResponse<StudentCreatedWithCredentials>> {
  const body: Record<string, unknown> = {
    ...data,
    role: 'STUDENT',
  };
  if (!data.password) delete body.password;
  if (!data.registrationNumber) delete body.registrationNumber;
  return apiRequest<ApiResponse<StudentCreatedWithCredentials>>('/users', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateStudent(id: string, data: UpdateStudentDto): Promise<ApiResponse<Student>> {
  // All data is now handled in a single call to the backend
  return apiRequest<ApiResponse<Student>>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteStudent(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/users/${id}`, {
    method: 'DELETE',
  });
}

export async function bulkImportStudents(file: File, branchId?: string, defaultPassword = '123456'): Promise<ApiResponse<{ created: number; errors: { row: number; message: string }[] }>> {
  const formData = new FormData();
  formData.append('file', file);
  if (branchId) formData.append('branchId', branchId);
  formData.append('defaultPassword', defaultPassword);
  return apiRequest<ApiResponse<{ created: number; errors: { row: number; message: string }[] }>>('/users/bulk-import', {
    method: 'POST',
    body: formData,
  });
}

export interface MobileDuplicateCheckResult {
  exists: boolean;
  student?: {
    id: string;
    fullName: string;
    registrationNumber: string | null;
  };
}

/** Check if a mobile number is already registered (500ms debounce recommended). */
export async function checkDuplicateMobile(mobile: string): Promise<ApiResponse<MobileDuplicateCheckResult>> {
  return apiRequest<ApiResponse<MobileDuplicateCheckResult>>(
    `/users/check-mobile/${encodeURIComponent(mobile)}`,
  );
}

/** Send initial credentials (OTP) via SMS to the student's mobile. */
export async function sendCredentialsSms(userId: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/users/${userId}/send-credentials-sms`, {
    method: 'POST',
  });
}

/** Send initial credentials (OTP) via email to the student. (TODO: email service) */
export async function sendCredentialsEmail(userId: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/users/${userId}/send-credentials-email`, {
    method: 'POST',
  });
}

/** Download student list as XLSX. */
export function exportStudentsUrl(params?: {
  branchId?: string;
  programId?: string;
  courseId?: string;
  batchId?: string;
  status?: string;
  search?: string;
}): string {
  const { API_BASE_URL } = require('../api');
  const qs = new URLSearchParams();
  if (params?.branchId && params.branchId !== 'all') qs.set('branchId', params.branchId);
  if (params?.programId && params.programId !== 'all') qs.set('programId', params.programId);
  if (params?.courseId && params.courseId !== 'all') qs.set('courseId', params.courseId);
  if (params?.batchId && params.batchId !== 'all') qs.set('batchId', params.batchId);
  if (params?.status && params.status !== 'all') qs.set('status', params.status);
  if (params?.search) qs.set('search', params.search);
  const query = qs.toString();
  return `${API_BASE_URL}/users/export/students${query ? `?${query}` : ''}`;
}
