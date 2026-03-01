import { apiRequest } from '../api';
import type { Program, ApiResponse } from '@/types/course';

export async function getPrograms(): Promise<ApiResponse<Program[]>> {
  return apiRequest<ApiResponse<Program[]>>('/programs');
}
