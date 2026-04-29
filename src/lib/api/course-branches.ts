import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/course';

export interface CourseBranch {
  id: string;
  courseId: string;
  branchId: string;
  branch?: {
    id: string;
    name: string;
    code?: string | null;
    address?: string | null;
    phone?: string | null;
  };
}

export async function getCourseBranches(courseId: string): Promise<ApiResponse<CourseBranch[]>> {
  return apiRequest<ApiResponse<CourseBranch[]>>(`/course-branches?courseId=${courseId}`);
}

export async function addCourseBranch(courseId: string, branchId: string): Promise<ApiResponse<CourseBranch>> {
  return apiRequest<ApiResponse<CourseBranch>>('/course-branches', {
    method: 'POST',
    body: JSON.stringify({ courseId, branchId }),
  });
}

export async function bulkAddCourseBranches(courseId: string, branchIds: string[]): Promise<ApiResponse<{ count: number }>> {
  return apiRequest<ApiResponse<{ count: number }>>('/course-branches/bulk', {
    method: 'POST',
    body: JSON.stringify({ courseId, branchIds }),
  });
}

export async function syncCourseBranches(courseId: string, branchIds: string[]): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>('/course-branches/sync', {
    method: 'PUT',
    body: JSON.stringify({ courseId, branchIds }),
  });
}

export async function removeCourseBranch(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/course-branches/${id}`, {
    method: 'DELETE',
  });
}
