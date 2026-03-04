import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/course';

export type EnrollmentStatusType = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';

export interface Enrollment {
  id: string;
  studentUserId: string;
  courseId: string;
  batchId?: string | null;
  branchId: string;
  status: EnrollmentStatusType | string;
  billingStartMonth?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    fullName: string;
    email?: string | null;
    mobile: string;
  };
  course?: {
    id: string;
    name: string;
    code: string;
    fee: number;
  };
  batch?: {
    id: string;
    name: string;
  };
  branch?: {
    id: string;
    name: string;
  };
}

export interface CreateEnrollmentDto {
  studentUserId: string;
  courseId: string;
  batchId?: string;
  branchId: string;
  status?: EnrollmentStatusType;
  billingStartMonth?: string; // YYYY-MM
}

export interface UpdateEnrollmentDto {
  batchId?: string;
  status?: EnrollmentStatusType;
  billingStartMonth?: string;
}

export async function getEnrollments(params?: {
  studentUserId?: string;
  courseId?: string;
  branchId?: string;
  batchId?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<Enrollment[]>> {
  const queryParams = new URLSearchParams();
  if (params?.studentUserId) queryParams.append('studentUserId', params.studentUserId);
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.batchId) queryParams.append('batchId', params.batchId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const query = queryParams.toString();
  return apiRequest<ApiResponse<Enrollment[]>>(`/enrollments${query ? `?${query}` : ''}`);
}

export async function getEnrollmentById(id: string): Promise<ApiResponse<Enrollment>> {
  return apiRequest<ApiResponse<Enrollment>>(`/enrollments/${id}`);
}

export async function createEnrollment(data: CreateEnrollmentDto): Promise<ApiResponse<Enrollment>> {
  return apiRequest<ApiResponse<Enrollment>>('/enrollments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEnrollment(
  id: string,
  data: UpdateEnrollmentDto,
): Promise<ApiResponse<Enrollment>> {
  return apiRequest<ApiResponse<Enrollment>>(`/enrollments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEnrollment(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/enrollments/${id}`, {
    method: 'DELETE',
  });
}

export async function changeEnrollmentBatch(id: string, batchId: string, reason?: string): Promise<ApiResponse<Enrollment>> {
  return apiRequest<ApiResponse<Enrollment>>(`/enrollments/${id}/batch`, {
    method: 'PUT',
    body: JSON.stringify({ batchId, reason }),
  });
}

export async function changeEnrollmentBranch(id: string, branchId: string, reason?: string): Promise<ApiResponse<Enrollment>> {
  return apiRequest<ApiResponse<Enrollment>>(`/enrollments/${id}/branch`, {
    method: 'PUT',
    body: JSON.stringify({ branchId, reason }),
  });
}

export async function bulkChangeBatch(data: {
  courseId: string;
  branchId?: string;
  fromBatchId?: string;
  toBatchId: string;
  enrollmentIds?: string[];
  reason?: string;
}): Promise<ApiResponse<{ count: number }>> {
  return apiRequest<ApiResponse<{ count: number }>>('/enrollments/bulk/batch', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function bulkChangeBranch(data: {
  courseId: string;
  fromBranchId?: string;
  toBranchId: string;
  enrollmentIds?: string[];
  reason?: string;
}): Promise<ApiResponse<{ count: number }>> {
  return apiRequest<ApiResponse<{ count: number }>>('/enrollments/bulk/branch', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
