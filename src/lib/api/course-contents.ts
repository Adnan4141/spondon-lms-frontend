import { apiRequest } from '../api';
import type { CourseContent, CreateCourseContentDto, UpdateCourseContentDto, ApiResponse } from '@/types/course-content';

export async function getCourseContents(courseId?: string, type?: string): Promise<ApiResponse<CourseContent[]>> {
  const queryParams = new URLSearchParams();
  if (courseId) queryParams.append('courseId', courseId);
  if (type) queryParams.append('type', type);

  const query = queryParams.toString();
  return apiRequest<ApiResponse<CourseContent[]>>(`/course-contents${query ? `?${query}` : ''}`);
}

export async function getCourseContentById(id: string): Promise<ApiResponse<CourseContent>> {
  return apiRequest<ApiResponse<CourseContent>>(`/course-contents/${id}`);
}

export async function createCourseContent(data: CreateCourseContentDto): Promise<ApiResponse<CourseContent>> {
  return apiRequest<ApiResponse<CourseContent>>('/course-contents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCourseContent(id: string, data: UpdateCourseContentDto): Promise<ApiResponse<CourseContent>> {
  return apiRequest<ApiResponse<CourseContent>>(`/course-contents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCourseContent(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/course-contents/${id}`, {
    method: 'DELETE',
  });
}
