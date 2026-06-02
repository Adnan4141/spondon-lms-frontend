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

export async function login(data: { mobile: string; password: string }): Promise<ApiResponse<LoginResponse>> {
  return apiRequest<ApiResponse<LoginResponse>>('/users/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function register(data: {
  fullName: string;
  mobile: string;
  gender?: string;
  password: string;
}): Promise<ApiResponse<{ userId: string; mobile: string; otpQueued?: boolean; otpFailureReason?: string }>> {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyMobile(data: {
  mobile: string;
  code: string;
}): Promise<ApiResponse<{ registrationNumber: string }>> {
  return apiRequest('/auth/verify-mobile', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function forgotPassword(data: {
  mobile: string;
}): Promise<ApiResponse<null>> {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function resetPassword(data: {
  mobile: string;
  code: string;
  newPassword: string;
}): Promise<ApiResponse<null>> {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function resendOtp(data: {
  mobile: string;
  purpose: 'REGISTRATION' | 'FORGOT_PASSWORD';
}): Promise<ApiResponse<null>> {
  return apiRequest('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
