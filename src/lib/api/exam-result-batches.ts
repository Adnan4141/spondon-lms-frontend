import { apiRequest } from '../api';
import { getActorUserIdFromStorage } from '../actor-user';
import type { ApiResponse } from '@/types/exam';

export type ResultBatchSummary = {
  id: string;
  examId: string;
  branchId: string;
  inputMode: string;
  excelUploadUrl?: string | null;
  totalRecords: number;
  approvalStatus: string;
  approvedBy?: string | null;
  approvalNotes?: string | null;
  createdAt: string;
  exam?: { id: string; title: string; mode: string };
  branch?: { id: string; name: string };
  uploaderUser?: { id: string; fullName: string };
  approverUser?: { id: string; fullName: string } | null;
};

export type ResultBatchImportResponse = {
  batchId?: string;
  inserted?: number;
  errors?: Array<Record<string, unknown>>;
  batch?: unknown;
  result?: unknown;
};

export async function listResultBatchesOverview(params?: {
  queue?: boolean;
  approvalStatus?: string;
  /** When set (e.g. branch admin), only batches for this branch */
  branchId?: string;
}): Promise<ApiResponse<ResultBatchSummary[]>> {
  const q = new URLSearchParams();
  if (params?.queue) q.set('queue', '1');
  if (params?.approvalStatus) q.set('approvalStatus', params.approvalStatus);
  if (params?.branchId) q.set('branchId', params.branchId);
  const qs = q.toString();
  return apiRequest<ApiResponse<ResultBatchSummary[]>>(
    `/exams/result-batches/overview${qs ? `?${qs}` : ''}`,
  );
}

export async function listExamResultBatches(
  examId: string,
  approvalStatus?: string,
): Promise<ApiResponse<ResultBatchSummary[]>> {
  const q = approvalStatus ? `?approvalStatus=${encodeURIComponent(approvalStatus)}` : '';
  return apiRequest<ApiResponse<ResultBatchSummary[]>>(`/exams/${examId}/results/batches${q}`);
}

export async function getExamResultBatchDetail(examId: string, batchId: string): Promise<ApiResponse<unknown>> {
  return apiRequest<ApiResponse<unknown>>(`/exams/${examId}/results/batches/${batchId}`);
}

export async function sendExamResultBatchSms(examId: string, batchId: string, smsType: 'masking' | 'non_masking' = 'masking'): Promise<ApiResponse<unknown>> {
  return apiRequest(`/exams/${examId}/results/batches/${batchId}/send-sms`, {
    method: 'POST',
    body: JSON.stringify({ smsType }),
  });
}

export async function postExamResultSingle(
  examId: string,
  body: {
    rollNo: string;
    marksObtained: number;
    totalMarks?: number;
    comments?: string;
    branchId?: string;
  },
): Promise<ApiResponse<ResultBatchImportResponse>> {
  const uid = getActorUserIdFromStorage();
  if (!uid) throw new Error('Sign in required');
  return apiRequest(`/exams/${examId}/results/single`, {
    method: 'POST',
    body: JSON.stringify({ ...body, uploadedBy: uid }),
  });
}

export async function postExamResultBulkManual(
  examId: string,
  rows: { rollNo: string; marksObtained?: number; marks?: number; totalMarks?: number; comments?: string }[],
  branchId?: string,
): Promise<ApiResponse<ResultBatchImportResponse>> {
  const uid = getActorUserIdFromStorage();
  if (!uid) throw new Error('Sign in required');
  return apiRequest(`/exams/${examId}/results/bulk-manual`, {
    method: 'POST',
    body: JSON.stringify({ rows, uploadedBy: uid, branchId }),
  });
}

export async function postExamResultBulkExcel(examId: string, file: File, branchId?: string): Promise<ApiResponse<ResultBatchImportResponse>> {
  const uid = getActorUserIdFromStorage();
  if (!uid) throw new Error('Sign in required');
  const fd = new FormData();
  fd.append('file', file);
  fd.append('uploadedBy', uid);
  if (branchId) fd.append('branchId', branchId);
  return apiRequest(`/exams/${examId}/results/bulk-excel`, { method: 'POST', body: fd });
}

export async function approveResultBatchBranch(examId: string, batchId: string): Promise<ApiResponse<unknown>> {
  const uid = getActorUserIdFromStorage();
  if (!uid) throw new Error('Sign in required');
  return apiRequest(`/exams/${examId}/results/batches/${batchId}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ approvedBy: uid }),
  });
}

export async function approveResultBatchCentral(
  examId: string,
  batchId: string,
  approvalNotes?: string,
): Promise<ApiResponse<unknown>> {
  const uid = getActorUserIdFromStorage();
  if (!uid) throw new Error('Sign in required');
  return apiRequest(`/exams/${examId}/results/batches/${batchId}/approve-central`, {
    method: 'PATCH',
    body: JSON.stringify({ approvedBy: uid, approvalNotes }),
  });
}

export async function rejectResultBatch(
  examId: string,
  batchId: string,
  approvalNotes?: string,
): Promise<ApiResponse<unknown>> {
  const uid = getActorUserIdFromStorage();
  return apiRequest(`/exams/${examId}/results/batches/${batchId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ approvedBy: uid ?? '', approvalNotes }),
  });
}

export async function deleteResultBatch(examId: string, batchId: string): Promise<ApiResponse<unknown>> {
  return apiRequest(`/exams/${examId}/results/batches/${batchId}`, { method: 'DELETE' });
}
