import { apiRequest } from '../api';
import type { Invoice, CreateInvoiceDto, UpdateInvoiceDto, ApiResponse } from '@/types/invoice';

export async function getInvoicePdfUrl(invoiceId: string): Promise<ApiResponse<{ pdfUrl: string }>> {
  return apiRequest<ApiResponse<{ pdfUrl: string }>>(`/invoices/${invoiceId}/pdf`);
}

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

export async function initInvoicePayment(invoiceId: string) {
  return apiRequest<{ success: boolean; data: { GatewayPageURL: string; bkashURL?: string; paymentID?: string; tranId: string; invoiceId: string; amount: number } }>(
    '/payment-gateway/invoice/init',
    {
      method: 'POST',
      body: JSON.stringify({ invoiceId }),
    }
  );
}

export type MonthlyGenerateResult = {
  month: string;
  totalEnrollments: number;
  invoicesCreated: number;
  skipped: number;
  errors?: string[];
};

export async function generateMonthlyInvoices(body?: {
  month?: string;
  branchId?: string;
  courseId?: string;
}): Promise<ApiResponse<MonthlyGenerateResult>> {
  return apiRequest<ApiResponse<MonthlyGenerateResult>>('/invoices/monthly/generate', {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });
}

export async function generateAdvanceInvoices(body: {
  studentUserId: string;
  months: number;
}): Promise<ApiResponse<{ studentUserId: string; months: number; invoicesCreated: number; errors: string[]; skippedMonths?: string[]; maxBillableMonth?: string | null }>> {
  return apiRequest('/invoices/monthly/advance', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export interface MonthlyDueListMonth {
  month: string;
  invoiceId?: string;
  status: 'NOT_GENERATED' | 'DRAFT' | 'ISSUED' | 'PARTIAL' | 'PAID' | 'WAIVED';
  dueAmount: number | null;
  payableAmount: number | null;
  canWaive: boolean;
  canPay: boolean;
}

export async function getMonthlyDueList(params: {
  studentUserId: string;
  branchId?: string;
}): Promise<ApiResponse<{
  studentUserId: string;
  branchId: string | null;
  dueMonths: MonthlyDueListMonth[];
  invoices: Array<{ id: string; month: string | null }>;
  validMonths: string[];
  maxBillableMonth?: string | null;
}>> {
  const queryParams = new URLSearchParams();
  queryParams.append('studentUserId', params.studentUserId);
  if (params.branchId) queryParams.append('branchId', params.branchId);

  return apiRequest(`/invoices/monthly/due-list?${queryParams.toString()}`);
}

export type PaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'BANK' | 'GATEWAY';

export interface CreatePaymentDto {
  invoiceId: string;
  method: PaymentMethod;
  amount: number;
  trxId?: string;
  receivedByUserId?: string;
}

export async function createPayment(data: CreatePaymentDto): Promise<ApiResponse<unknown>> {
  return apiRequest<ApiResponse<unknown>>('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface ProgramPaymentDto {
  studentId: string;
  programId: string;
  amount: number;
  month?: string;
  method?: PaymentMethod;
  trxId?: string;
  receivedByUserId?: string;
  collectedByBranchId?: string;
}

export interface ProgramPaymentSummary {
  applied: number;
  remaining: number;
  totalCourseDueBefore: number;
  totalCourseDueAfter: number;
  totalInvoiceDueBefore: number;
  totalInvoiceDueAfter: number;
  invoices: Array<{
    invoiceId: string;
    paymentId: string;
    applied: number;
    dueBefore: number;
    dueAfter: number;
    newPaid: number;
    newStatus: string;
    courseAllocations: Array<{
      invoiceItemId: string;
      courseId: string;
      title: string;
      applied: number;
      dueBefore: number;
      dueAfter: number;
    }>;
  }>;
}

export async function createProgramPayment(data: ProgramPaymentDto): Promise<ApiResponse<{ summary: ProgramPaymentSummary }>> {
  return apiRequest<ApiResponse<{ summary: ProgramPaymentSummary }>>('/payments/program', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function cancelMonthlyEnrollment(
  enrollmentId: string,
  body?: { reason?: string; settleInvoices?: boolean; newMonthlyDiscount?: number }
): Promise<ApiResponse<{ message?: string }>> {
  return apiRequest<ApiResponse<{ message?: string }>>(`/invoices/monthly/cancel/${enrollmentId}`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });
}

export interface ProcessMonthlyPaymentDto {
  studentUserId: string;
  month: string;
  branchId?: string;
  snapshotEdits?: Array<{
    enrollmentId: string;
    courses: Array<{
      courseId: string;
      batchId?: string;
      includeBook?: boolean;
      bookPrice?: number | null;
      waived?: boolean;
      waivedAmount?: number | null;
      waiveReason?: string;
      waivedByUserId?: string;
    }>;
  }>;
  payment?: {
    amount: number;
    method: string;
    trxId?: string;
    receivedByUserId?: string;
  };
  discountAmount?: number;
  discountReference?: string;
  waive?: boolean;
  waiveReason?: string;
}

export async function processMonthPayment(
  body: ProcessMonthlyPaymentDto,
): Promise<ApiResponse<{ invoice: { id: string }; payment: unknown; replacedInvoiceId: string | null }>> {
  return apiRequest('/invoices/monthly/process', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function waiveMonthlyCourses(body: {
  studentUserId: string;
  month: string;
  branchId?: string;
  courseIds: string[];
  reason: string;
}): Promise<ApiResponse<{
  mode: 'INVOICE_REGENERATED' | 'SETTLEMENT_CREATED';
  invoice: { id: string };
  referenceMonth?: string | null;
  waivedCourseIds: string[];
}>> {
  return apiRequest('/invoices/monthly/course-waiver', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
