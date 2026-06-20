import { apiRequest, API_BASE_URL } from '../api';
import type { ApiResponse } from '@/types/course';

// ── Authenticated binary-download helper ─────────────────────────────────────

export async function fetchWithAuth(path: string, init?: RequestInit): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export interface AttendanceRecord {
  id: string;
  studentUserId: string;
  status: AttendanceStatus;
  student: { id: string; fullName: string };
}

export interface ClassSession {
  id: string;
  sessionDate: string;
  topic?: string | null;
  attendanceRecords: AttendanceRecord[];
}

export interface Student {
  id: string;
  fullName: string;
  email?: string | null;
  mobile?: string;
}

export interface AttendanceSheet {
  course: { id: string; name: string; slug?: string };
  enrollments: Array<{
    id: string;
    student: Student;
    batch?: { id: string; name: string } | null;
    branch?: { id: string; name: string } | null;
  }>;
  sessions: ClassSession[];
  /** studentUserId -> sessionId -> eligible for attendance marking */
  sessionEligibility?: Record<string, Record<string, boolean>>;
}

export interface AttendanceSummaryRow {
  studentUserId: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendancePercent: number;
}

export interface OfflineSheetPreview {
  sessionCount: number;
  studentCount: number;
  sessions: { date: string; topic: string | null }[];
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function getAttendanceSheet(params: {
  courseId: string;
  branchId?: string;
  batchId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<AttendanceSheet>> {
  const q = new URLSearchParams({ courseId: params.courseId });
  if (params.branchId) q.set('branchId', params.branchId);
  if (params.batchId) q.set('batchId', params.batchId);
  if (params.startDate) q.set('startDate', params.startDate);
  if (params.endDate) q.set('endDate', params.endDate);
  return apiRequest<ApiResponse<AttendanceSheet>>(`/classes/attendance/sheet?${q}`);
}

export async function bulkRecordAttendance(payload: {
  sessionId: string;
  records: { studentUserId: string; status: AttendanceStatus }[];
}): Promise<ApiResponse<{ count: number }>> {
  return apiRequest<ApiResponse<{ count: number }>>('/classes/attendance/bulk', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function recordAttendance(payload: {
  sessionId: string;
  studentUserId: string;
  status: AttendanceStatus;
}): Promise<ApiResponse<{ id: string; sessionId: string; studentUserId: string; status: string; student: { id: string; fullName: string } }>> {
  return apiRequest('/classes/attendance', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getAttendanceSummary(params: {
  courseId: string;
  batchId: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<AttendanceSummaryRow[]>> {
  const q = new URLSearchParams({ courseId: params.courseId, batchId: params.batchId });
  if (params.startDate) q.set('startDate', params.startDate);
  if (params.endDate) q.set('endDate', params.endDate);
  return apiRequest<ApiResponse<AttendanceSummaryRow[]>>(`/classes/attendance/summary?${q}`);
}

export async function downloadAttendanceExport(params: {
  courseId: string;
  batchId: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  format: 'xlsx' | 'csv';
}): Promise<Blob> {
  const q = new URLSearchParams({ courseId: params.courseId, batchId: params.batchId, format: params.format });
  if (params.branchId) q.set('branchId', params.branchId);
  if (params.startDate) q.set('startDate', params.startDate);
  if (params.endDate) q.set('endDate', params.endDate);
  const res = await fetchWithAuth(`/classes/attendance/export?${q}`);
  if (!res.ok) {
    const text = await res.text();
    let msg = 'Export failed';
    try { msg = (JSON.parse(text) as { message?: string }).message ?? msg; } catch { if (text) msg = text.slice(0, 200); }
    throw new Error(msg);
  }
  return res.blob();
}

export async function previewOfflineSheet(params: {
  courseId: string;
  batchId: string;
  branchId?: string;
  startDate: string;
  endDate: string;
  source: 'published' | 'routine';
}): Promise<ApiResponse<OfflineSheetPreview>> {
  const q = new URLSearchParams({
    courseId: params.courseId,
    batchId: params.batchId,
    startDate: params.startDate,
    endDate: params.endDate,
    source: params.source,
    format: 'json',
  });
  if (params.branchId) q.set('branchId', params.branchId);
  return apiRequest<ApiResponse<OfflineSheetPreview>>(`/classes/attendance/offline-sheet?${q}`);
}

export async function downloadOfflineSheet(params: {
  courseId: string;
  batchId: string;
  branchId?: string;
  startDate: string;
  endDate: string;
  source: 'published' | 'routine';
  format: 'xlsx' | 'csv';
  institution?: string;
}): Promise<Blob> {
  const q = new URLSearchParams({
    courseId: params.courseId,
    batchId: params.batchId,
    startDate: params.startDate,
    endDate: params.endDate,
    source: params.source,
    format: params.format,
  });
  if (params.branchId) q.set('branchId', params.branchId);
  if (params.institution) q.set('institution', params.institution);
  const res = await fetchWithAuth(`/classes/attendance/offline-sheet?${q}`);
  if (!res.ok) {
    const text = await res.text();
    let msg = 'Download failed';
    try { msg = (JSON.parse(text) as { message?: string }).message ?? msg; } catch { if (text) msg = text.slice(0, 200); }
    throw new Error(msg);
  }
  return res.blob();
}

export async function importAttendanceFile(
  file: File,
  params: { courseId: string; batchId: string }
): Promise<ApiResponse<{ imported: number; skipped: number; errors: string[] }>> {
  const q = new URLSearchParams({ courseId: params.courseId, batchId: params.batchId });
  const form = new FormData();
  form.append('file', file);
  const res = await fetchWithAuth(`/classes/attendance/import?${q}`, { method: 'POST', body: form });
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(text.slice(0, 200)); }
}
