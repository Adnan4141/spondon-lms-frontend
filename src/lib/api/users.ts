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
  branch?: {
    id: string;
    name: string;
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
};

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

export async function deleteUser(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/users/${id}`, {
    method: 'DELETE',
  });
}
