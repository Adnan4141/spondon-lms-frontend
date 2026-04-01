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
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<Student[]>> {
  const queryParams = new URLSearchParams();
  const role = params?.role?.trim() || 'STUDENT';
  queryParams.append('role', role);
  if (params?.branchId) queryParams.append('branchId', params.branchId);
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
