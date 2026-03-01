import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/course';

export interface Branch {
  id: string;
  name: string;
  code?: string | null;
  address?: string | null;
  phone?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function getBranches(): Promise<ApiResponse<Branch[]>> {
  return apiRequest<ApiResponse<Branch[]>>('/branches');
}
