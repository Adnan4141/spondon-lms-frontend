import { apiRequest } from '../api';
import {
  appendActorUserIdToFormData,
  getActorUserIdQuery,
  getActorUserIdFromStorage,
} from '../actor-user';
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

export async function createCourseContent(
  data: CreateCourseContentDto,
  file?: File
): Promise<ApiResponse<CourseContent>> {
  const formData = new FormData();
  
  // Add all data fields to FormData
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'boolean' || typeof value === 'number') {
        formData.append(key, String(value));
      } else {
        formData.append(key, value);
      }
    }
  });
  
  // Add file if provided
  if (file) {
    formData.append('file', file);
  }

  appendActorUserIdToFormData(formData);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  const response = await fetch(`${API_BASE_URL}/course-contents`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create course content' }));
    throw new Error(error.message || 'Failed to create course content');
  }

  return response.json();
}

export async function updateCourseContent(id: string, data: UpdateCourseContentDto): Promise<ApiResponse<CourseContent>> {
  const actorUserId = getActorUserIdFromStorage();
  const body = { ...data, ...(actorUserId ? { actorUserId } : {}) };
  return apiRequest<ApiResponse<CourseContent>>(`/course-contents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteCourseContent(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/course-contents/${id}${getActorUserIdQuery()}`, {
    method: 'DELETE',
  });
}
