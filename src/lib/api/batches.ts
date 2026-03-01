import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/course';

export interface Batch {
  id: string;
  courseId: string;
  branchId: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  capacity?: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    name: string;
    code: string;
  };
  branch?: {
    id: string;
    name: string;
  };
}

export async function getBatches(params?: {
  courseId?: string;
  branchId?: string;
  status?: string;
}): Promise<ApiResponse<Batch[]>> {
  const queryParams = new URLSearchParams();
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.status) queryParams.append('status', params.status);

  const query = queryParams.toString();
  return apiRequest<ApiResponse<Batch[]>>(`/batches${query ? `?${query}` : ''}`);
}
