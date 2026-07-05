import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/course';

export type TeacherStudentRow = {
  id: string;
  enrollmentId: string;
  enrollmentCourseId: string;
  activeMonth: string;
  enrollmentStatus: string;
  accessStatus: string;
  student: {
    id: string;
    fullName: string;
    email: string | null;
    mobile: string;
  };
  course: {
    id: string;
    name: string;
  };
  batch: {
    id: string;
    name: string;
  } | null;
  branch: {
    id: string;
    name: string;
  };
  program: {
    id: string;
    name: string;
  } | null;
};

export type TeacherStudentsSummary = {
  month: string;
  uniqueStudents: number;
  activeRows: number;
  byCourse: Array<{ courseId: string; courseName: string; studentCount: number }>;
  batches: Array<{ id: string; name: string; courseId: string }>;
};

export type TeacherStudentsListParams = {
  month?: string;
  courseId?: string;
  batchId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export function currentTeacherStudentsMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export async function getTeacherStudents(
  params?: TeacherStudentsListParams,
): Promise<
  ApiResponse<TeacherStudentRow[]> & {
    pagination?: { page: number; limit: number; total: number; pages: number };
    month?: string;
  }
> {
  const queryParams = new URLSearchParams();
  if (params?.month) queryParams.append('month', params.month);
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.batchId) queryParams.append('batchId', params.batchId);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const query = queryParams.toString();
  return apiRequest(`/teachers/me/students${query ? `?${query}` : ''}`);
}

export async function getTeacherStudentsSummary(params?: {
  month?: string;
  courseId?: string;
}): Promise<ApiResponse<TeacherStudentsSummary>> {
  const queryParams = new URLSearchParams();
  if (params?.month) queryParams.append('month', params.month);
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  const query = queryParams.toString();
  return apiRequest(`/teachers/me/students/summary${query ? `?${query}` : ''}`);
}
