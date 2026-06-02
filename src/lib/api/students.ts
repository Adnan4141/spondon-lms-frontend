import { API_BASE_URL, apiRequest } from '../api';
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
  includeUnverified?: boolean;
  search?: string;
  includeDetails?: boolean;
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
  if (params?.includeUnverified !== undefined) queryParams.append('includeUnverified', String(params.includeUnverified));
  if (params?.search) queryParams.append('search', params.search);
  if (params?.includeDetails !== undefined) queryParams.append('includeDetails', String(params.includeDetails));
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

export type StudentSmsSuggestion = {
  id: string;
  fullName: string;
  mobile: string;
  phone: string;
  branchId?: string | null;
  branchName?: string | null;
  registrationNumber?: string | null;
  roll?: string | null;
  primaryMobile?: string | null;
  secondaryMobile?: string | null;
  fatherName?: string | null;
  fatherMobile?: string | null;
  motherName?: string | null;
  motherMobile?: string | null;
  program?: string;
  course?: string;
  batch?: string;
  smsVariables: Record<string, string>;
};

/** Resolve student user id from internal id, registration number, or BD mobile. */
export async function lookupStudentUser(q: string): Promise<ApiResponse<StudentLookupMatch>> {
  return apiRequest<ApiResponse<StudentLookupMatch>>(
    `/users/lookup/student?q=${encodeURIComponent(q.trim())}`,
  );
}

export async function searchStudentSmsSuggestions(params: {
  q: string;
  branchId?: string;
  limit?: number;
}): Promise<ApiResponse<StudentSmsSuggestion[]>> {
  const query = new URLSearchParams();
  query.set('q', params.q.trim());
  if (params.branchId) query.set('branchId', params.branchId);
  if (params.limit) query.set('limit', String(params.limit));
  return apiRequest<ApiResponse<StudentSmsSuggestion[]>>(`/users/lookup/students?${query.toString()}`);
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

/** POST bulk-import returns 202 with job id (async background import). */
export async function startBulkImportStudents(
  file: File,
  branchId?: string,
  defaultPassword = '123456',
): Promise<ApiResponse<{ jobId: string; totalRows: number }>> {
  const formData = new FormData();
  formData.append('file', file);
  if (branchId) formData.append('branchId', branchId);
  formData.append('defaultPassword', defaultPassword);
  return apiRequest<ApiResponse<{ jobId: string; totalRows: number }>>('/users/bulk-import', {
    method: 'POST',
    body: formData,
  });
}

export type BulkImportJobStatusPayload = {
  id: string;
  status: string;
  totalRows: number;
  processedRows: number;
  createdCount: number;
  errorCount: number;
  errors: { row: number; message: string }[];
  failureReason: string | null;
  finished: boolean;
  originalName: string | null;
};

export async function getBulkImportJobStatus(jobId: string): Promise<ApiResponse<BulkImportJobStatusPayload>> {
  return apiRequest<ApiResponse<BulkImportJobStatusPayload>>(`/users/import-jobs/${jobId}`);
}

export async function cancelBulkImportJob(jobId: string): Promise<ApiResponse<{ status?: string }>> {
  return apiRequest<ApiResponse<{ status?: string }>>(`/users/import-jobs/${jobId}/cancel`, {
    method: 'POST',
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

export type ExportStudentsParams = {
  branchId?: string;
  programId?: string;
  courseId?: string;
  batchId?: string;
  status?: string;
  search?: string;
};

function buildExportStudentsQuery(params?: ExportStudentsParams): string {
  const qs = new URLSearchParams();
  if (params?.branchId && params.branchId !== 'all') qs.set('branchId', params.branchId);
  if (params?.programId && params.programId !== 'all') qs.set('programId', params.programId);
  if (params?.courseId && params.courseId !== 'all') qs.set('courseId', params.courseId);
  if (params?.batchId && params.batchId !== 'all') qs.set('batchId', params.batchId);
  if (params?.status && params.status !== 'all') qs.set('status', params.status);
  if (params?.search) qs.set('search', params.search);
  return qs.toString();
}

/** Plain URL (no auth headers); prefer {@link downloadStudentExportXlsx} for browser downloads. */
export function exportStudentsUrl(params?: ExportStudentsParams): string {
  const query = buildExportStudentsQuery(params);
  return `${API_BASE_URL}/users/export/students${query ? `?${query}` : ''}`;
}

/**
 * Download student export as XLSX using Bearer auth so it works when the API is on another
 * host (e.g. api.example.com) where `window.open` would not send `localStorage` token.
 */
export async function downloadStudentExportXlsx(params?: ExportStudentsParams): Promise<void> {
  const query = buildExportStudentsQuery(params);
  const url = `${API_BASE_URL}/users/export/students${query ? `?${query}` : ''}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { method: 'GET', credentials: 'include', headers });
  if (!response.ok) {
    let message = `Export failed (${response.status})`;
    try {
      const text = await response.text();
      if (text) {
        const body = JSON.parse(text) as { message?: string; error?: string };
        if (typeof body.message === 'string' && body.message.trim()) message = body.message.trim();
        else if (typeof body.error === 'string' && body.error.trim()) message = body.error.trim();
      }
    } catch {
      // keep default message
    }
    if (response.status === 401 && typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const cd = response.headers.get('Content-Disposition');
  let filename = 'students.xlsx';
  const match = cd?.match(/filename\*?=(?:UTF-8''|"?)([^";\n]+)/i) ?? cd?.match(/filename="([^"]+)"/);
  if (match?.[1]) filename = decodeURIComponent(match[1].replace(/^"|"$/g, ''));

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export type StudentExportJobPayload = {
  id: string;
  status: string;
  totalRows: number;
  processedRows: number;
  failureReason?: string | null;
  finished: boolean;
  fileUrl?: string | null;
  originalName?: string | null;
};

export async function queueStudentExportXlsx(
  params?: ExportStudentsParams,
): Promise<ApiResponse<{ jobId: string; totalRows: number; status: string }>> {
  const query = buildExportStudentsQuery(params);
  return apiRequest<ApiResponse<{ jobId: string; totalRows: number; status: string }>>(
    `/users/export/students/jobs${query ? `?${query}` : ''}`,
    { method: 'POST' },
  );
}

export async function getStudentExportJobStatus(jobId: string): Promise<ApiResponse<StudentExportJobPayload>> {
  return apiRequest<ApiResponse<StudentExportJobPayload>>(`/users/export/students/jobs/${jobId}`);
}

export async function downloadStudentExportJobXlsx(jobId: string): Promise<void> {
  const url = `${API_BASE_URL}/users/export/students/jobs/${encodeURIComponent(jobId)}/download`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { method: 'GET', credentials: 'include', headers });
  if (!response.ok) {
    let message = `Export download failed (${response.status})`;
    try {
      const text = await response.text();
      if (text) {
        const body = JSON.parse(text) as { message?: string; error?: string };
        message = body.message || body.error || message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const cd = response.headers.get('Content-Disposition');
  let filename = 'students.xlsx';
  const match = cd?.match(/filename\*?=(?:UTF-8''|"?)([^";\n]+)/i) ?? cd?.match(/filename="([^"]+)"/);
  if (match?.[1]) filename = decodeURIComponent(match[1].replace(/^"|"$/g, ''));

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
