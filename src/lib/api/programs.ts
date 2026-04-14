import { apiRequest, API_ORIGIN } from '../api';
import type { Program, ApiResponse } from '@/types/course';
export type { Program, ApiResponse };

export interface CreateProgramDto {
  name: string;
  description?: string;
  mode?: 'ONLINE' | 'OFFLINE';
  paymentCircle?: 'ONE_TIME' | 'MONTHLY';
  admissionFeeEnabled?: boolean;
  admissionFeeAmount?: number | null;
}

export interface UpdateProgramDto {
  name?: string;
  description?: string;
  mode?: 'ONLINE' | 'OFFLINE';
  paymentCircle?: 'ONE_TIME' | 'MONTHLY';
  admissionFeeEnabled?: boolean;
  admissionFeeAmount?: number | null;
}

export async function getPrograms(): Promise<ApiResponse<Program[]>> {
  return apiRequest<ApiResponse<Program[]>>('/programs');
}

export async function getProgramById(id: string): Promise<ApiResponse<Program & { courses?: any[]; _count?: { courses: number } }>> {
  return apiRequest<ApiResponse<Program & { courses?: any[]; _count?: { courses: number } }>>(`/programs/${id}`);
}

export async function createProgram(data: CreateProgramDto): Promise<ApiResponse<Program>> {
  return apiRequest<ApiResponse<Program>>('/programs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProgram(id: string, data: UpdateProgramDto): Promise<ApiResponse<Program>> {
  return apiRequest<ApiResponse<Program>>(`/programs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProgram(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/programs/${id}`, {
    method: 'DELETE',
  });
}

export async function deleteProgramCascade(id: string): Promise<ApiResponse<{ courseCount: number }>> {
  return apiRequest<ApiResponse<{ courseCount: number }>>(`/programs/${id}/cascade`, {
    method: 'DELETE',
  });
}

export async function uploadProgramThumbnail(programId: string, file: File): Promise<ApiResponse<Program>> {
  const formData = new FormData();
  formData.append('thumbnail', file);
  const res = await apiRequest<ApiResponse<Program>>(`/programs/${programId}/thumbnail`, {
    method: 'POST',
    body: formData,
  });
  if (res.success && res.data?.thumbnail?.startsWith('/')) {
    res.data.thumbnail = `${API_ORIGIN}${res.data.thumbnail}`;
  }
  return res;
}
