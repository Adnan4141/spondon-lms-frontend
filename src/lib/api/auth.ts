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

export type LoginApiResponse = ApiResponse<LoginResponse> & {
  requiresOtp?: boolean;
  pendingLoginId?: string;
  maskedMobile?: string;
};

export async function login(data: {
  mobile: string;
  password: string;
  deviceId?: string;
  turnstileToken?: string;
}): Promise<LoginApiResponse> {
  return apiRequest<LoginApiResponse>('/users/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyLoginOtp(data: {
  pendingLoginId: string;
  code: string;
  deviceId: string;
  turnstileToken?: string;
}): Promise<ApiResponse<LoginResponse>> {
  return apiRequest<ApiResponse<LoginResponse>>('/auth/verify-login-otp', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function resendLoginOtp(data: {
  pendingLoginId: string;
  deviceId: string;
  turnstileToken?: string;
}): Promise<ApiResponse<null> & { maskedMobile?: string }> {
  return apiRequest<ApiResponse<null> & { maskedMobile?: string }>('/auth/resend-login-otp', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export type TrustedDevice = {
  id: string;
  userId: string;
  label: string;
  trustedAt: string;
  lastUsedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  isActive: boolean;
};

export async function getTrustedDevices(userId?: string): Promise<
  ApiResponse<{
    user: { id: string; fullName: string; mobile: string; role: string; branchId?: string | null } | null;
    devices: TrustedDevice[];
  }>
> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return apiRequest(`/auth/trusted-devices${query}`);
}

export async function revokeTrustedDevice(deviceId: string): Promise<ApiResponse<null>> {
  return apiRequest(`/auth/trusted-devices/${deviceId}`, { method: 'DELETE' });
}

export async function revokeAllTrustedDevices(userId?: string): Promise<ApiResponse<null>> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return apiRequest(`/auth/trusted-devices${query}`, { method: 'DELETE' });
}

export async function register(data: {
  fullName: string;
  mobile: string;
  gender?: string;
  password: string;
  turnstileToken?: string;
}): Promise<ApiResponse<{ userId: string; mobile: string; otpQueued?: boolean; otpFailureReason?: string }>> {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyMobile(data: {
  mobile: string;
  code: string;
  turnstileToken?: string;
}): Promise<ApiResponse<{ registrationNumber: string }>> {
  return apiRequest('/auth/verify-mobile', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function forgotPassword(data: {
  mobile: string;
  turnstileToken?: string;
}): Promise<ApiResponse<null>> {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyForgotPasswordOtp(data: {
  mobile: string;
  code: string;
  turnstileToken?: string;
}): Promise<ApiResponse<{ verified: boolean; resetToken?: string }>> {
  return apiRequest('/auth/verify-forgot-password-otp', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function resetPassword(data: {
  newPassword: string;
  resetToken?: string;
}): Promise<ApiResponse<null>> {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function resendOtp(data: {
  mobile: string;
  purpose: 'REGISTRATION' | 'FORGOT_PASSWORD';
  turnstileToken?: string;
}): Promise<ApiResponse<null>> {
  return apiRequest('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
