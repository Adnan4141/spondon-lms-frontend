import { apiRequest, API_ORIGIN } from '../api';

export type OmrScanStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'REVIEW_NEEDED'
  | 'REJECTED'
  | 'DISCARDED';

export interface DetectedAnswer {
  q: number;
  choice: string | null;
  conf: number;
  multi?: boolean;
}

export interface OmrScan {
  id: string;
  examId: string;
  batchId?: string | null;
  fileUrl: string;
  fileName?: string | null;
  pageIndex?: number | null;
  status: OmrScanStatus;
  studentUserId?: string | null;
  detectedRoll?: string | null;
  detectedAnswers?: DetectedAnswer[] | null;
  confidence?: number | null;
  marks?: number | null;
  rejectionReason?: string | null;
  diagnostics?: Record<string, unknown> | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  resultBatchId?: string | null;
  contentHash?: string | null;
  detectedSetLabel?: string | null;
  expectedSetLabel?: string | null;
  detectedBranchCode?: string | null;
  registrationFromGrid?: string | null;
  identityWarnings?: string[] | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    fullName: string | null;
    registrationNumber?: string | null;
  } | null;
}

export interface OmrScanBatch {
  id: string;
  examId: string;
  branchId?: string | null;
  uploadedBy: string;
  totalScans: number;
  processedCount: number;
  status: 'PENDING' | 'READY' | 'FINALIZED' | 'CANCELLED';
  resultBatchId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OmrScanListResponse {
  page: number;
  pageSize: number;
  total: number;
  scans: OmrScan[];
  batches: OmrScanBatch[];
}

export interface OmrRosterStudent {
  id: string;
  fullName: string | null;
  registrationNumber: string | null;
  branchCode: string | null;
  branchName: string | null;
}

export async function getOmrRoster(
  examId: string,
  params: { q?: string; limit?: number } = {},
): Promise<{ success: boolean; data: { students: OmrRosterStudent[] } }> {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.limit) search.set('limit', String(params.limit));
  const q = search.toString();
  return apiRequest<{ success: boolean; data: { students: OmrRosterStudent[] } }>(
    `/exams/${examId}/omr-scans/roster${q ? `?${q}` : ''}`,
  );
}

export async function getOmrScans(
  examId: string,
  params: { status?: OmrScanStatus; batchId?: string; page?: number; pageSize?: number } = {},
): Promise<{ success: boolean; data: OmrScanListResponse }> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.batchId) search.set('batchId', params.batchId);
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  const q = search.toString();
  return apiRequest<{ success: boolean; data: OmrScanListResponse }>(
    `/exams/${examId}/omr-scans${q ? `?${q}` : ''}`,
  );
}

export async function uploadOmrScanBatch(
  examId: string,
  files: File[],
  options: { branchId?: string; uploadedBy?: string } = {},
): Promise<{
  success: boolean;
  data: { batchId: string; totalScans: number; scanIds: string[]; duplicateFiles?: string[] };
  message?: string;
}> {
  const formData = new FormData();
  for (const f of files) formData.append('files', f);
  if (options.branchId) formData.append('branchId', options.branchId);
  if (options.uploadedBy) formData.append('uploadedBy', options.uploadedBy);
  return apiRequest<{ success: boolean; data: { batchId: string; totalScans: number; scanIds: string[] }; message?: string }>(
    `/exams/${examId}/omr-scans/upload`,
    { method: 'POST', body: formData },
  );
}

export async function reassignOmrScan(
  examId: string,
  scanId: string,
  studentUserId: string,
): Promise<{ success: boolean; data: OmrScan; message?: string }> {
  return apiRequest<{ success: boolean; data: OmrScan; message?: string }>(
    `/exams/${examId}/omr-scans/${scanId}/reassign`,
    {
      method: 'POST',
      body: JSON.stringify({ studentUserId }),
    },
  );
}

export async function overrideOmrAnswers(
  examId: string,
  scanId: string,
  answers: DetectedAnswer[],
): Promise<{ success: boolean; data: OmrScan; message?: string }> {
  return apiRequest<{ success: boolean; data: OmrScan; message?: string }>(
    `/exams/${examId}/omr-scans/${scanId}/answers`,
    {
      method: 'POST',
      body: JSON.stringify({ answers }),
    },
  );
}

export async function discardOmrScan(
  examId: string,
  scanId: string,
): Promise<{ success: boolean; data: OmrScan; message?: string }> {
  return apiRequest<{ success: boolean; data: OmrScan; message?: string }>(
    `/exams/${examId}/omr-scans/${scanId}/discard`,
    { method: 'POST' },
  );
}

export async function finalizeOmrBatch(
  examId: string,
  batchId: string,
  options: { branchId?: string; uploadedBy?: string } = {},
): Promise<{
  success: boolean;
  data: {
    resultBatchId: string;
    totalRecords: number;
    duplicateScans?: Array<{ scanId: string; studentUserId: string; keptScanId: string }>;
  };
  message?: string;
}> {
  return apiRequest<{ success: boolean; data: { resultBatchId: string; totalRecords: number }; message?: string }>(
    `/exams/${examId}/omr-scans/batch/${batchId}/finalize`,
    {
      method: 'POST',
      body: JSON.stringify(options),
    },
  );
}

export function getOmrScanDownloadUrl(fileUrl: string): string {
  return `${API_ORIGIN}${fileUrl}`;
}
