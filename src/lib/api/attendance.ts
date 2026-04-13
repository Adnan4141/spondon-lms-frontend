import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/course';

export interface AttendanceSheet {
  course: {
    id: string;
    name: string;
    slug?: string;
  };
  enrollments: Array<{
    id: string;
    student: {
      id: string;
      fullName: string;
      email?: string | null;
      mobile: string;
    };
    batch?: {
      id: string;
      name: string;
    };
    branch?: {
      id: string;
      name: string;
    };
  }>;
  sessions: Array<{
    id: string;
    sessionDate: string;
    topic?: string | null;
    attendanceRecords: Array<{
      id: string;
      studentUserId: string;
      status: string;
      student: {
        id: string;
        fullName: string;
      };
    }>;
  }>;
}

export async function getAttendanceSheet(params: {
  courseId: string;
  branchId?: string;
  batchId?: string;
}): Promise<ApiResponse<AttendanceSheet>> {
  const queryParams = new URLSearchParams();
  queryParams.append('courseId', params.courseId);
  if (params.branchId) queryParams.append('branchId', params.branchId);
  if (params.batchId) queryParams.append('batchId', params.batchId);

  return apiRequest<ApiResponse<AttendanceSheet>>(`/classes/attendance/sheet?${queryParams.toString()}`);
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

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
}): Promise<
  ApiResponse<{
    id: string;
    sessionId: string;
    studentUserId: string;
    status: string;
    student: { id: string; fullName: string };
  }>
> {
  return apiRequest(`/classes/attendance`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
