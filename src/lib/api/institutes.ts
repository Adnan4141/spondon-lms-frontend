import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/course';

export type InstituteType = 'SCHOOL' | 'COLLEGE' | 'UNIVERSITY';

export interface Institute {
  id: string;
  name: string;
  eiin?: string | null;
  district?: string | null;
  type: InstituteType;
  createdAt: string;
  updatedAt?: string;
  _count?: { students: number };
}

export async function getInstitutes(params?: { type?: string; district?: string; page?: number; limit?: number }): Promise<ApiResponse<Institute[]>> {
  const q = new URLSearchParams();
  if (params?.type) q.append('type', params.type);
  if (params?.district) q.append('district', params.district);
  if (params?.page) q.append('page', String(params.page));
  if (params?.limit) q.append('limit', String(params.limit));
  const query = q.toString();
  return apiRequest<ApiResponse<Institute[]>>(`/institutes${query ? `?${query}` : ''}`);
}

export async function getInstituteById(id: string): Promise<ApiResponse<Institute>> {
  return apiRequest<ApiResponse<Institute>>(`/institutes/${id}`);
}

export async function createInstitute(data: { name: string; eiin?: string; district?: string; type: InstituteType }): Promise<ApiResponse<Institute>> {
  return apiRequest<ApiResponse<Institute>>('/institutes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function addInstituteByEiin(data: { eiin: string; name?: string; district?: string; type?: InstituteType }): Promise<ApiResponse<Institute>> {
  return apiRequest<ApiResponse<Institute>>('/institutes/by-eiin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInstitute(id: string, data: Partial<Institute>): Promise<ApiResponse<Institute>> {
  return apiRequest<ApiResponse<Institute>>(`/institutes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteInstitute(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/institutes/${id}`, {
    method: 'DELETE',
  });
}
