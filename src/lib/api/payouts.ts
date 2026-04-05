import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/course';

export type PayoutBatchStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type PayoutRecipientType = 'PARTNER' | 'BOOK_COLLABORATOR';
export type PayoutSourceType = 'BOOK_SALE' | 'COURSE_SALE';

export interface Payout {
  id: string;
  batchId: string;
  recipientType: PayoutRecipientType;
  partnerId?: string | null;
  bookCollaboratorId?: string | null;
  sourceType: PayoutSourceType;
  sourceRefId: string;
  revenueAmount: number;
  sharePercentage: number;
  payoutAmount: number;
  paymentStatus: PayoutStatus;
  transactionId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  partner?: { id: string; name: string; logo?: string | null } | null;
  bookCollaborator?: {
    user: { id: string; fullName: string; email: string };
    book: { id: string; name: string };
  } | null;
}

export interface PayoutBatch {
  id: string;
  period: string;
  status: PayoutBatchStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { payouts: number };
  payouts?: Payout[];
}

export async function createPayoutBatch(data: {
  period: string;
  notes?: string;
}): Promise<ApiResponse<{ batch: PayoutBatch; payoutsCreated: number }>> {
  return apiRequest('/payouts/batches', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getPayoutBatches(): Promise<ApiResponse<PayoutBatch[]>> {
  return apiRequest<ApiResponse<PayoutBatch[]>>('/payouts/batches');
}

export async function getPayoutBatch(id: string): Promise<ApiResponse<PayoutBatch>> {
  return apiRequest<ApiResponse<PayoutBatch>>(`/payouts/batches/${encodeURIComponent(id)}`);
}

export async function updateBatchStatus(
  id: string,
  data: { status: PayoutBatchStatus; notes?: string },
): Promise<ApiResponse<PayoutBatch>> {
  return apiRequest<ApiResponse<PayoutBatch>>(`/payouts/batches/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updatePayoutStatus(
  id: string,
  data: { status: PayoutStatus; transactionId?: string; notes?: string },
): Promise<ApiResponse<Payout>> {
  return apiRequest<ApiResponse<Payout>>(`/payouts/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
