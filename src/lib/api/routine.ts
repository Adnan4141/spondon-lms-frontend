import { API_BASE_URL, apiRequest } from '../api';

export type CalendarDay = {
  date: string;
  dayOfWeek: number;
  dayName: string;
  slots: RoutineSlot[];
};

export type CalendarResponse = {
  success: boolean;
  data?: CalendarDay[];
  totalClasses?: number;
  message?: string;
};

export interface RoutineSlot {
  id: string;
  branchId?: string;
  programId?: string;
  courseId?: string;
  batchId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  topic?: string;
  teacherUserId?: string;
  mode: string;
  isActive: boolean;
  course?: { id: string; name: string; code: string };
  batch?: { id: string; name: string };
  branch?: { id: string; name: string };
  teacher?: { id: string; fullName: string };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export type RoutineFilters = {
  branchId?: string;
  programId?: string;
  courseId?: string;
  batchId?: string;
  teacherUserId?: string;
  dayOfWeek?: number;
  isActive?: boolean;
  mode?: string;
};

function buildRoutineQuery(params?: RoutineFilters): string {
  const q = new URLSearchParams();
  if (params?.branchId) q.append('branchId', params.branchId);
  if (params?.programId) q.append('programId', params.programId);
  if (params?.courseId) q.append('courseId', params.courseId);
  if (params?.batchId) q.append('batchId', params.batchId);
  if (params?.teacherUserId) q.append('teacherUserId', params.teacherUserId);
  if (params?.dayOfWeek !== undefined) q.append('dayOfWeek', String(params.dayOfWeek));
  if (params?.isActive !== undefined) q.append('isActive', String(params.isActive));
  if (params?.mode) q.append('mode', params.mode);
  return q.toString();
}

export async function getRoutineSlots(params?: RoutineFilters): Promise<ApiResponse<RoutineSlot[]>> {
  const query = buildRoutineQuery(params);
  return apiRequest<ApiResponse<RoutineSlot[]>>(`/routine${query ? `?${query}` : ''}`);
}

export type RoutineExportPdfParams = RoutineFilters & {
  format?: 'list' | 'weekly-range';
  startDate?: string;
  endDate?: string;
};

export function getRoutineExportPdfUrl(params?: RoutineExportPdfParams): string {
  const q = new URLSearchParams();
  if (params?.branchId) q.append('branchId', params.branchId);
  if (params?.programId) q.append('programId', params.programId);
  if (params?.courseId) q.append('courseId', params.courseId);
  if (params?.batchId) q.append('batchId', params.batchId);
  if (params?.teacherUserId) q.append('teacherUserId', params.teacherUserId);
  if (params?.dayOfWeek !== undefined) q.append('dayOfWeek', String(params.dayOfWeek));
  if (params?.isActive !== undefined) q.append('isActive', String(params.isActive));
  if (params?.mode) q.append('mode', params.mode);
  if (params?.format) q.append('format', params.format);
  if (params?.startDate) q.append('startDate', params.startDate);
  if (params?.endDate) q.append('endDate', params.endDate);
  const query = q.toString();
  return `${API_BASE_URL}/routine/export/pdf${query ? `?${query}` : ''}`;
}

export async function generateRoutineCalendar(params: {
  courseId?: string;
  batchId?: string;
  branchId?: string;
  teacherUserId?: string;
  mode?: string;
  startDate: string;
  endDate: string;
}): Promise<CalendarResponse> {
  const q = new URLSearchParams();
  if (params.courseId) q.append('courseId', params.courseId);
  if (params.batchId) q.append('batchId', params.batchId);
  if (params.branchId) q.append('branchId', params.branchId);
  if (params.teacherUserId) q.append('teacherUserId', params.teacherUserId);
  if (params.mode && params.mode !== 'all') q.append('mode', params.mode);
  q.append('startDate', params.startDate);
  q.append('endDate', params.endDate);

  const query = q.toString();
  return apiRequest<CalendarResponse>(`/routine/generate?${query}`);
}

export async function publishRoutineSessions(params: {
  courseId?: string;
  batchId?: string;
  branchId?: string;
  mode?: string;
  teacherUserId?: string;
  startDate: string;
  endDate: string;
  overwrite?: boolean;
}): Promise<ApiResponse<{ created: number; skipped: number }>> {
  return apiRequest<ApiResponse<{ created: number; skipped: number }>>('/routine/publish-sessions', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export type ExcelExportParams = {
  courseId?: string;
  batchId?: string;
  branchId?: string;
  programId?: string;
  teacherUserId?: string;
  mode?: string;
  startDate?: string;
  endDate?: string;
  format?: 'template' | 'calendar';
};

export function getRoutineExportExcelUrl(params?: ExcelExportParams): string {
  const q = new URLSearchParams();
  if (params?.courseId) q.append('courseId', params.courseId);
  if (params?.batchId) q.append('batchId', params.batchId);
  if (params?.branchId) q.append('branchId', params.branchId);
  if (params?.programId) q.append('programId', params.programId);
  if (params?.teacherUserId) q.append('teacherUserId', params.teacherUserId);
  if (params?.mode && params.mode !== 'all') q.append('mode', params.mode);
  if (params?.format) q.append('format', params.format);
  if (params?.startDate) q.append('startDate', params.startDate);
  if (params?.endDate) q.append('endDate', params.endDate);
  const query = q.toString();
  return `${API_BASE_URL}/routine/export/excel${query ? `?${query}` : ''}`;
}

export type CreateRoutineSlotData = Omit<RoutineSlot, 'id' | 'course' | 'batch' | 'branch' | 'teacher'> & {
  room?: never; // room is removed — never pass it
};

export async function createRoutineSlot(data: CreateRoutineSlotData): Promise<ApiResponse<RoutineSlot>> {
  return apiRequest<ApiResponse<RoutineSlot>>('/routine', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRoutineSlot(id: string, data: Partial<CreateRoutineSlotData>): Promise<ApiResponse<RoutineSlot>> {
  return apiRequest<ApiResponse<RoutineSlot>>(`/routine/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRoutineSlot(id: string): Promise<ApiResponse<{ message?: string }>> {
  return apiRequest<ApiResponse<{ message?: string }>>(`/routine/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
