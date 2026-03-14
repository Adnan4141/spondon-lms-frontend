import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/course';

export interface LoginResponse {
  user: {
    id: string;
    fullName: string;
    email?: string;
    mobile: string;
    role: string;
    branchId?: string;
  };
  token: string;
}

export async function login(data: any): Promise<ApiResponse<LoginResponse>> {
  return apiRequest<ApiResponse<LoginResponse>>('/users/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
