import { apiRequest } from '../api';

export type PrivacyPolicyStatus = 'ACTIVE' | 'INACTIVE';

export interface PrivacyPolicyPublic {
  title: string;
  content: string;
}

export interface PrivacyPolicyAdmin extends PrivacyPolicyPublic {
  id: string;
  status: PrivacyPolicyStatus;
  createdAt: string;
  updatedAt: string;
}

export async function getPublicPrivacyPolicy(): Promise<{
  success: boolean;
  data: PrivacyPolicyPublic | null;
}> {
  return apiRequest('/privacy-policy/public');
}

export async function getAdminPrivacyPolicy(): Promise<{ success: boolean; data: PrivacyPolicyAdmin }> {
  return apiRequest('/privacy-policy');
}

export async function savePrivacyPolicy(body: {
  title?: string;
  content?: string;
  status?: PrivacyPolicyStatus;
}): Promise<{ success: boolean; data: PrivacyPolicyAdmin }> {
  return apiRequest('/privacy-policy', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}
