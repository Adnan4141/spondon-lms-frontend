import { apiRequest } from '../api';
import type { Course, CreateCourseDto, UpdateCourseDto, GetCoursesParams, ApiResponse } from '@/types/course';

export async function getCourses(params?: GetCoursesParams): Promise<ApiResponse<Course[]>> {
  const queryParams = new URLSearchParams();
  
  if (params?.programId) queryParams.append('programId', params.programId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.websiteVisible !== undefined) queryParams.append('websiteVisible', String(params.websiteVisible));
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const query = queryParams.toString();
  return apiRequest<ApiResponse<Course[]>>(`/courses${query ? `?${query}` : ''}`);
}

export async function getCourseById(id: string): Promise<ApiResponse<Course>> {
  return apiRequest<ApiResponse<Course>>(`/courses/${id}`);
}

export async function createCourse(data: CreateCourseDto): Promise<ApiResponse<Course>> {
  return apiRequest<ApiResponse<Course>>('/courses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCourse(id: string, data: UpdateCourseDto): Promise<ApiResponse<Course>> {
  return apiRequest<ApiResponse<Course>>(`/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCourse(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/courses/${id}`, {
    method: 'DELETE',
  });
}
