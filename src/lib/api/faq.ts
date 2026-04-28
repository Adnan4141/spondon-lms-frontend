import { apiRequest } from '../api';

export type FaqStatus = 'ACTIVE' | 'INACTIVE';

export interface FaqPublic {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FaqAdmin extends FaqPublic {
  status: FaqStatus;
}

export async function getPublicFaqs(): Promise<{ success: boolean; data: FaqPublic[] }> {
  return apiRequest('/faqs/public');
}

export async function getAllFaqsAdmin(): Promise<{ success: boolean; data: FaqAdmin[] }> {
  return apiRequest('/faqs');
}

export async function createFaq(body: {
  question: string;
  answer: string;
  status?: FaqStatus;
  sortOrder?: number;
}): Promise<{ success: boolean; data: FaqAdmin }> {
  return apiRequest('/faqs', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateFaq(
  id: string,
  body: Partial<{ question: string; answer: string; status: FaqStatus; sortOrder: number }>,
): Promise<{ success: boolean; data: FaqAdmin }> {
  return apiRequest(`/faqs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteFaq(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/faqs/${id}`, { method: 'DELETE' });
}

export async function reorderFaqs(items: { id: string; sortOrder: number }[]): Promise<{ success: boolean }> {
  return apiRequest('/faqs/reorder', {
    method: 'PATCH',
    body: JSON.stringify(items),
  });
}
