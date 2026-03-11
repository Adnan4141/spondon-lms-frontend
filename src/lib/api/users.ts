import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/student';

export interface User {
  id: string;
  fullName: string;
  email?: string;
  mobile: string;
  role: string;
  status: string;
  branchId?: string;
  branch?: {
    name: string;
  };
}

export async function getUsers(params?: {
  role?: string;
  branchId?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<User[]>> {
  const queryParams = new URLSearchParams();
  if (params?.role) queryParams.append('role', params.role);
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const query = queryParams.toString();
  return apiRequest<ApiResponse<User[]>>(`/users${query ? `?${query}` : ''}`);
}

export async function getUserById(id: string): Promise<ApiResponse<User>> {
  return apiRequest<ApiResponse<User>>(`/users/${id}`);
}
