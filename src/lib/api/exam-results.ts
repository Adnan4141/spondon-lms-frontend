import { apiRequest, API_ORIGIN } from '../api';

export interface OmrScan {
  id: string;
  examId: string;
  fileUrl: string;
  fileName?: string | null;
  status: string;
  createdAt: string;
}

export async function getOmrScans(examId: string): Promise<{ success: boolean; data: OmrScan[] }> {
  return apiRequest<{ success: boolean; data: OmrScan[] }>(`/exam-results/omr-scans?examId=${examId}`);
}

export async function uploadOmrScan(examId: string, file: File): Promise<{ success: boolean; data: OmrScan }> {
  const formData = new FormData();
  formData.append('examId', examId);
  formData.append('file', file);
  const res = await apiRequest<{ success: boolean; data: OmrScan }>('/exam-results/upload-omr', {
    method: 'POST',
    body: formData,
  });
  return res;
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
