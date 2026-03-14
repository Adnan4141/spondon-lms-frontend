import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/course';

export interface Branch {
  id: string;
  name: string;
  code?: string | null;
  address?: string | null;
  phone?: string | null;
  status: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users?: number;
    batches?: number;
    enrollments?: number;
  };
  users?: Array<{
    id: string;
    fullName: string;
    email?: string | null;
    role: string;
  }>;
}

export interface CreateBranchDto {
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  status?: string;
}

export interface UpdateBranchDto {
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  status?: string;
}

export async function getBranches(): Promise<ApiResponse<Branch[]>> {
  return apiRequest<ApiResponse<Branch[]>>('/branches');
}

export async function getBranchById(id: string): Promise<ApiResponse<Branch>> {
  return apiRequest<ApiResponse<Branch>>(`/branches/${id}`);
}

export async function createBranch(data: CreateBranchDto): Promise<ApiResponse<Branch>> {
  return apiRequest<ApiResponse<Branch>>('/branches', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBranch(id: string, data: UpdateBranchDto): Promise<ApiResponse<Branch>> {
  return apiRequest<ApiResponse<Branch>>(`/branches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteBranch(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/branches/${id}`, {
    method: 'DELETE',
  });
}
