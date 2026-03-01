import { apiRequest } from '../api';
import type { Program, ApiResponse } from '@/types/course';

export interface CreateProgramDto {
  name: string;
  description?: string;
}

export interface UpdateProgramDto {
  name?: string;
  description?: string;
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
