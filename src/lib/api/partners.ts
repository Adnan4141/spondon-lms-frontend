import { apiRequest } from '../api';

export interface Partner {
  id: string;
  name: string;
  logo?: string | null;
  description?: string | null;
  websiteUrl?: string | null;
  type?: string | null;
}

export interface PartnerLinkedProgram {
  program: { id: string; name: string };
}

export interface PartnerLinkedCourse {
  course: { id: string; name: string; slug?: string | null; thumbnailUrl?: string | null };
}

export interface PartnerLinkedBook {
  bookId: string;
  book: { id: string; name: string; sku: string; thumbnailUrl?: string | null };
}

export interface PartnerAdmin extends Partner {
  isActive: boolean;
  sortOrder: number;
  revenueSharePercent?: number | null;
  createdAt: string;
  partnerPrograms?: PartnerLinkedProgram[];
  partnerCourses?: PartnerLinkedCourse[];
  partnerBooks?: PartnerLinkedBook[];
}

export async function getPublicPartners(): Promise<{ success: boolean; data: Partner[] }> {
  return apiRequest('/partners/public');
}

export async function getPartnerById(id: string): Promise<{ success: boolean; data: PartnerAdmin }> {
  return apiRequest(`/partners/${encodeURIComponent(id)}`);
}

export async function getAllPartners(): Promise<{ success: boolean; data: PartnerAdmin[] }> {
  return apiRequest('/partners');
}

export async function createPartner(data: FormData): Promise<{ success: boolean; data: PartnerAdmin }> {
  return apiRequest('/partners', {
    method: 'POST',
    body: data,
  });
}

export async function updatePartner(id: string, data: FormData): Promise<{ success: boolean; data: PartnerAdmin }> {
  return apiRequest(`/partners/${id}`, {
    method: 'PUT',
    body: data,
  });
}

export async function deletePartner(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/partners/${id}`, { method: 'DELETE' });
}

export async function patchPartner(
  id: string,
  body: { isActive: boolean },
): Promise<{ success: boolean; data: PartnerAdmin }> {
  return apiRequest(`/partners/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export interface PartnerRevenueSummary {
  partnerId: string;
  partnerName: string;
  revenueSharePercent: number | null;
  from: string | null;
  to: string | null;
  totalSales: number;
  partnerShare: number;
  courseCount: number;
  bookCount: number;
}

export async function getPartnerRevenueSummary(
  partnerId: string,
  params?: { from?: string; to?: string },
): Promise<{ success: boolean; data?: PartnerRevenueSummary; message?: string }> {
  const q = new URLSearchParams();
  if (params?.from) q.append('from', params.from);
  if (params?.to) q.append('to', params.to);
  const qs = q.toString();
  return apiRequest(`/partners/${encodeURIComponent(partnerId)}/revenue${qs ? `?${qs}` : ''}`);
}
