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

/**
 * Paginated OMR scans for the review UI. Returns both scans and the recent
 * batch list so the UI can render batch progress without a second request.
 */
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

/**
 * Upload one or more scan files (images or multi-page PDFs). Returns the new
 * batch id and the generated scan ids. PDFs are split server-side into one
 * OmrScan per page.
 */
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

export async function importOfflineResults(examId: string, file: File): Promise<{ success: boolean; data: { count: number }; message?: string }> {
  const formData = new FormData();
  formData.append('examId', examId);
  formData.append('file', file);
  return apiRequest<{ success: boolean; data: { count: number }; message?: string }>('/exam-results/import-offline', {
    method: 'POST',
    body: formData,
  });
}

export async function getOfflineResults(examId?: string, approvalStatus?: string): Promise<{ success: boolean; data: any[] }> {
  const params = new URLSearchParams();
  if (examId) params.append('examId', examId);
  if (approvalStatus) params.append('approvalStatus', approvalStatus);
  const q = params.toString() ? `?${params}` : '';
  return apiRequest<{ success: boolean; data: any[] }>(`/exam-results/offline${q}`);
}

export async function approveOfflineResult(id: string): Promise<{ success: boolean; data: any }> {
  return apiRequest<{ success: boolean; data: any }>(`/exam-results/offline/${id}/approve`, { method: 'PATCH' });
}

export async function rejectOfflineResult(id: string): Promise<{ success: boolean; data: any }> {
  return apiRequest<{ success: boolean; data: any }>(`/exam-results/offline/${id}/reject`, { method: 'PATCH' });
}

export interface CreateOfflineResultInput {
  examId: string;
  rollNo: string;
  subject?: string;
  totalMarks?: number;
  obtainedMarks?: number;
  meritPosition?: number;
}

export async function createOfflineResult(data: CreateOfflineResultInput): Promise<{ success: boolean; data: any }> {
  return apiRequest<{ success: boolean; data: any }>('/exam-results/offline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function createBulkOfflineResults(items: CreateOfflineResultInput[]): Promise<{ success: boolean; data: { count: number }; message?: string }> {
  return apiRequest<{ success: boolean; data: { count: number }; message?: string }>('/exam-results/offline/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
}

export async function getOnlineMeritList(examId: string): Promise<{ success: boolean; data: any[] }> {
  return apiRequest<{ success: boolean; data: any[] }>(`/exam-results/merit/online?examId=${examId}`);
}

export async function getOfflineMeritList(examId: string): Promise<{ success: boolean; data: any[] }> {
  return apiRequest<{ success: boolean; data: any[] }>(`/exam-results/merit/offline?examId=${examId}`);
}

export async function getMultipleExamMeritList(examIds: string[]): Promise<{ success: boolean; data: any[] }> {
  return apiRequest<{ success: boolean; data: any[] }>(`/exam-results/merit/multiple?examIds=${examIds.join(',')}`);
}

export async function findStudentByRollNo(rollNo: string): Promise<{ success: boolean; data: { id: string; fullName: string; mobile: string; registrationNumber?: string } | null }> {
  return apiRequest<{ success: boolean; data: any }>(`/exam-results/student-by-roll?rollNo=${encodeURIComponent(rollNo)}`);
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  marks: number;
  source: string;
}

export async function getLeaderboard(examId: string): Promise<{ success: boolean; data: { examTitle: string; leaderboard: LeaderboardEntry[] } }> {
  return apiRequest<{ success: boolean; data: { examTitle: string; leaderboard: LeaderboardEntry[] } }>(`/exam-results/leaderboard?examId=${examId}`);
}
