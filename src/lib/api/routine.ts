import { apiRequest } from '../api';

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
  room?: string;
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

export async function getRoutineSlots(params?: {
  branchId?: string;
  programId?: string;
  courseId?: string;
  batchId?: string;
  teacherUserId?: string;
  dayOfWeek?: number;
  isActive?: boolean;
  mode?: string;
}): Promise<ApiResponse<RoutineSlot[]>> {
  const q = new URLSearchParams();
  if (params?.branchId) q.append('branchId', params.branchId);
  if (params?.programId) q.append('programId', params.programId);
  if (params?.courseId) q.append('courseId', params.courseId);
  if (params?.batchId) q.append('batchId', params.batchId);
  if (params?.teacherUserId) q.append('teacherUserId', params.teacherUserId);
  if (params?.dayOfWeek !== undefined) q.append('dayOfWeek', String(params.dayOfWeek));
  if (params?.isActive !== undefined) q.append('isActive', String(params.isActive));
  if (params?.mode) q.append('mode', params.mode);
  
  const query = q.toString();
  return apiRequest<ApiResponse<RoutineSlot[]>>(`/routine${query ? `?${query}` : ''}`);
}

export async function generateRoutineCalendar(params: {
  courseId?: string;
  batchId?: string;
  branchId?: string;
  teacherUserId?: string;
  startDate: string;
  endDate: string;
}): Promise<ApiResponse<unknown>> {
  const q = new URLSearchParams();
  if (params.courseId) q.append('courseId', params.courseId);
  if (params.batchId) q.append('batchId', params.batchId);
  if (params.branchId) q.append('branchId', params.branchId);
  if (params.teacherUserId) q.append('teacherUserId', params.teacherUserId);
  q.append('startDate', params.startDate);
  q.append('endDate', params.endDate);
  
  const query = q.toString();
  return apiRequest<ApiResponse<unknown>>(`/routine/generate?${query}`);
}

export type CreateRoutineSlotData = Omit<RoutineSlot, 'id' | 'course' | 'batch' | 'branch' | 'teacher'>;

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
