import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/course';

export type BenefitType = 'DISCOUNT' | 'SCHOLARSHIP';
export type BenefitMode = 'FLAT' | 'PERCENT' | 'MONTHLY_FIXED' | 'ONE_TIME';

export interface Benefit {
  id: string;
  studentUserId: string;
  courseId?: string | null;
  type: BenefitType;
  mode: BenefitMode;
  value: number | string;
  startMonth?: string | null;
  endMonth?: string | null;
  approvedByUserId: string;
  reason?: string | null;
  createdAt: string;
  student?: {
    id: string;
    fullName: string;
    email?: string | null;
  };
  course?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  approvedBy?: {
    id: string;
    fullName: string;
  };
}

export interface BenefitInvoiceReplacementMeta {
  replacedInvoicesCount: number;
  replacedInvoices: Array<{
    oldInvoiceId: string;
    newInvoiceId: string;
    month: string | null;
    movedPayments: number;
    before: {
      total: number;
      discount: number;
      scholarship: number;
      payable: number;
      paid: number;
      due: number;
    };
    after: {
      total: number;
      discount: number;
      scholarship: number;
      payable: number;
      paid: number;
      due: number;
    };
  }>;
}

export interface BenefitApiResponse<T> extends ApiResponse<T> {
  meta?: BenefitInvoiceReplacementMeta;
}

export interface CreateBenefitPayload {
  studentUserId: string;
  courseId?: string | null;
  type: BenefitType;
  mode: BenefitMode;
  value: number;
  startMonth?: string;
  endMonth?: string;
  approvedByUserId: string;
  reason?: string;
}

export interface UpdateBenefitPayload {
  type?: BenefitType;
  mode?: BenefitMode;
  value?: number;
  startMonth?: string;
  endMonth?: string;
  reason?: string;
}

export async function getBenefits(params?: {
  studentUserId?: string;
  courseId?: string;
  type?: string;
  page?: number;
  limit?: number;
}): Promise<BenefitApiResponse<Benefit[]>> {
  const queryParams = new URLSearchParams();
  if (params?.studentUserId) queryParams.append('studentUserId', params.studentUserId);
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.type) queryParams.append('type', params.type);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const query = queryParams.toString();
  return apiRequest<BenefitApiResponse<Benefit[]>>(`/benefits${query ? `?${query}` : ''}`);
}

export async function getBenefitById(id: string): Promise<BenefitApiResponse<Benefit>> {
  return apiRequest<BenefitApiResponse<Benefit>>(`/benefits/${id}`);
}

export async function createBenefit(data: CreateBenefitPayload): Promise<BenefitApiResponse<Benefit>> {
  return apiRequest<BenefitApiResponse<Benefit>>('/benefits', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBenefit(id: string, data: UpdateBenefitPayload): Promise<BenefitApiResponse<Benefit>> {
  return apiRequest<BenefitApiResponse<Benefit>>(`/benefits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteBenefit(id: string): Promise<BenefitApiResponse<void>> {
  return apiRequest<BenefitApiResponse<void>>(`/benefits/${id}`, {
    method: 'DELETE',
  });
}