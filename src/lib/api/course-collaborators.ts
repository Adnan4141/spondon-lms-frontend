import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/course';

export interface CourseCollaborator {
  id: string;
  courseId: string;
  userId: string;
  role: string;
  permissions?: any;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email?: string | null;
    mobile: string;
  };
}

export async function getCourseCollaborators(courseId?: string): Promise<ApiResponse<CourseCollaborator[]>> {
  const query = courseId ? `?courseId=${courseId}` : '';
  return apiRequest<ApiResponse<CourseCollaborator[]>>(`/course-collaborators${query}`);
}

export async function createCourseCollaborator(data: {
  courseId: string;
  userId: string;
  role?: string;
  permissions?: any;
}): Promise<ApiResponse<CourseCollaborator>> {
  return apiRequest<ApiResponse<CourseCollaborator>>('/course-collaborators', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCourseCollaborator(id: string, data: {
  role?: string;
  permissions?: any;
}): Promise<ApiResponse<CourseCollaborator>> {
  return apiRequest<ApiResponse<CourseCollaborator>>(`/course-collaborators/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCourseCollaborator(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/course-collaborators/${id}`, {
    method: 'DELETE',
  });
}
