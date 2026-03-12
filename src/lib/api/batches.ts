import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/course';

export type BatchStatusType = 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface Batch {
  id: string;
  courseId: string;
  branchId: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  capacity?: number | null;
  status: BatchStatusType | string;
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
  _count?: {
    enrollments?: number;
    classSessions?: number;
  };
}

export interface CreateBatchDto {
  courseId: string;
  branchId: string;
  name: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  status?: BatchStatusType;
}

export interface UpdateBatchDto {
  name?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  status?: BatchStatusType;
}

export async function getBatches(params?: {
  programId?: string;
  courseId?: string;
  branchId?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<Batch[]>> {
  const queryParams = new URLSearchParams();
  if (params?.programId) queryParams.append('programId', params.programId);
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const query = queryParams.toString();
  return apiRequest<ApiResponse<Batch[]>>(`/batches${query ? `?${query}` : ''}`);
}

export async function getBatchById(id: string): Promise<ApiResponse<Batch>> {
  return apiRequest<ApiResponse<Batch>>(`/batches/${id}`);
}

export async function createBatch(data: CreateBatchDto): Promise<ApiResponse<Batch>> {
  return apiRequest<ApiResponse<Batch>>('/batches', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBatch(id: string, data: UpdateBatchDto): Promise<ApiResponse<Batch>> {
  return apiRequest<ApiResponse<Batch>>(`/batches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteBatch(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/batches/${id}`, {
    method: 'DELETE',
  });
}

