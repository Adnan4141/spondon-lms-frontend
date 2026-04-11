import { apiRequest } from '../api';

export interface CourseFeature {
  id: string;
  courseId: string;
  icon: string;
  label: string;
  value: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseFeatureDto {
  courseId: string;
  icon: string;
  label: string;
  value: string;
  sortOrder?: number;
}

export interface UpdateCourseFeatureDto {
  icon?: string;
  label?: string;
  value?: string;
  sortOrder?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export async function getCourseFeatures(courseId: string): Promise<ApiResponse<CourseFeature[]>> {
  return apiRequest<ApiResponse<CourseFeature[]>>(`/course-features?courseId=${courseId}`, {
    method: 'GET',
  });
}

export async function createCourseFeature(data: CreateCourseFeatureDto): Promise<ApiResponse<CourseFeature>> {
  return apiRequest<ApiResponse<CourseFeature>>('/course-features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateCourseFeature(id: string, data: UpdateCourseFeatureDto): Promise<ApiResponse<CourseFeature>> {
  return apiRequest<ApiResponse<CourseFeature>>(`/course-features/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteCourseFeature(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/course-features/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderCourseFeatures(items: { id: string; sortOrder: number }[]): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>('/course-features/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  });
}
