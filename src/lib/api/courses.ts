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

// Course Contents
export async function getCourseContents(params?: { courseId?: string; type?: string }): Promise<ApiResponse<any[]>> {
  const queryParams = new URLSearchParams();
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.type) queryParams.append('type', params.type);
  
  return apiRequest<ApiResponse<any[]>>(`/course-contents?${queryParams.toString()}`);
}

export async function createCourseContent(formData: FormData): Promise<ApiResponse<any>> {
  return apiRequest<ApiResponse<any>>('/course-contents', {
    method: 'POST',
    body: formData, // fetch will handle boundary for FormData
  });
}

export async function updateCourseContent(id: string, formData: FormData): Promise<ApiResponse<any>> {
  return apiRequest<ApiResponse<any>>(`/course-contents/${id}`, {
    method: 'PUT',
    body: formData,
  });
}

export async function deleteCourseContent(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/course-contents/${id}`, {
    method: 'DELETE',
  });
}

// Associated Courses
export async function getAssociatedCourses(params?: { fromCourseId?: string; toCourseId?: string }): Promise<ApiResponse<any[]>> {
  const queryParams = new URLSearchParams();
  if (params?.fromCourseId) queryParams.append('fromCourseId', params.fromCourseId);
  if (params?.toCourseId) queryParams.append('toCourseId', params.toCourseId);
  
  return apiRequest<ApiResponse<any[]>>(`/associated-courses?${queryParams.toString()}`);
}

export async function createAssociatedCourse(data: { fromCourseId: string; toCourseId: string; type: string }): Promise<ApiResponse<any>> {
  return apiRequest<ApiResponse<any>>('/associated-courses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteAssociatedCourse(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/associated-courses/${id}`, {
    method: 'DELETE',
  });
}
