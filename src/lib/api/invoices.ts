import { apiRequest } from '../api';
import type { Invoice, CreateInvoiceDto, UpdateInvoiceDto, ApiResponse } from '@/types/invoice';

export async function getInvoices(params?: {
  studentUserId?: string;
  branchId?: string;
  status?: string;
  month?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<Invoice[]>> {
  const queryParams = new URLSearchParams();
  if (params?.studentUserId) queryParams.append('studentUserId', params.studentUserId);
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.month) queryParams.append('month', params.month);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const query = queryParams.toString();
  return apiRequest<ApiResponse<Invoice[]>>(`/invoices${query ? `?${query}` : ''}`);
}

export async function getInvoiceById(id: string): Promise<ApiResponse<Invoice>> {
  return apiRequest<ApiResponse<Invoice>>(`/invoices/${id}`);
}

export async function createInvoice(data: CreateInvoiceDto): Promise<ApiResponse<Invoice>> {
  return apiRequest<ApiResponse<Invoice>>('/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInvoice(id: string, data: UpdateInvoiceDto): Promise<ApiResponse<Invoice>> {
  return apiRequest<ApiResponse<Invoice>>(`/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteInvoice(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/invoices/${id}`, {
    method: 'DELETE',
  });
}
