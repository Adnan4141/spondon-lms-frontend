import { apiRequest, API_ORIGIN } from '../api';
import { appendActorUserIdToFormData, getActorUserIdQuery } from '../actor-user';
import type { Course, CreateCourseDto, UpdateCourseDto, GetCoursesParams, ApiResponse } from '@/types/course';
export type { Course, CreateCourseDto, UpdateCourseDto, GetCoursesParams, ApiResponse };

export async function getCourses(params?: GetCoursesParams & { type?: string; isFree?: boolean; featured?: boolean }): Promise<ApiResponse<Course[]>> {
  const queryParams = new URLSearchParams();
  
  if (params?.programId) queryParams.append('programId', params.programId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.type) queryParams.append('type', params.type);
  if (params?.isFree !== undefined) queryParams.append('isFree', String(params.isFree));
  if (params?.featured !== undefined) queryParams.append('featured', String(params.featured));
  if (params?.websiteVisible !== undefined) queryParams.append('websiteVisible', String(params.websiteVisible));
  if (params?.teacherUserId) queryParams.append('teacherUserId', params.teacherUserId);
  if (params?.grade) queryParams.append('grade', params.grade);
  if (params?.group) queryParams.append('group', params.group);
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

export async function toggleCourseVisibility(courseId: string): Promise<ApiResponse<Course>> {
  return apiRequest<ApiResponse<Course>>(`/courses/${courseId}/toggle-visibility`, {
    method: 'PATCH',
  });
}

export async function toggleCourseFeatured(courseId: string): Promise<ApiResponse<Course>> {
  return apiRequest<ApiResponse<Course>>(`/courses/${courseId}/toggle-featured`, {
    method: 'PATCH',
  });
}

export async function settleCourse(courseId: string): Promise<ApiResponse<{ message?: string }>> {
  return apiRequest<ApiResponse<{ message?: string }>>(`/courses/${courseId}/settle`, {
    method: 'POST',
  });
}

export async function disableCourse(courseId: string): Promise<ApiResponse<Course>> {
  return apiRequest<ApiResponse<Course>>(`/courses/${courseId}/disable`, {
    method: 'POST',
  });
}

export async function addCourseTeacher(
  courseId: string,
  teacherUserId: string
): Promise<ApiResponse<{ id: string; teacher?: { id: string; fullName: string; email?: string | null } }>> {
  return apiRequest(`/courses/${courseId}/teachers`, {
    method: 'POST',
    body: JSON.stringify({ teacherUserId }),
  });
}

export async function removeCourseTeacher(courseId: string, teacherUserId: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/courses/${courseId}/teachers/${teacherUserId}`, {
    method: 'DELETE',
  });
}

export async function uploadCourseThumbnail(courseId: string, file: File): Promise<ApiResponse<Course>> {
  const formData = new FormData();
  formData.append('thumbnail', file);
  const res = await apiRequest<ApiResponse<Course>>(`/courses/${courseId}/thumbnail`, {
    method: 'POST',
    body: formData,
  });
  // Make thumbnail URL absolute
  if (res.success && res.data?.thumbnail) {
    const url = res.data.thumbnail;
    if (url.startsWith('/')) {
      res.data.thumbnail = `${API_ORIGIN}${url}`;
    }
  }
  return res;
}

// Course Contents
export async function getCourseContents(params?: { courseId?: string; type?: string }): Promise<ApiResponse<any[]>> {
  const queryParams = new URLSearchParams();
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.type) queryParams.append('type', params.type);
  
  return apiRequest<ApiResponse<any[]>>(`/course-contents?${queryParams.toString()}`);
}

export async function createCourseContent(formData: FormData): Promise<ApiResponse<any>> {
  appendActorUserIdToFormData(formData);
  return apiRequest<ApiResponse<any>>('/course-contents', {
    method: 'POST',
    body: formData, // fetch will handle boundary for FormData
  });
}

export async function updateCourseContent(id: string, formData: FormData): Promise<ApiResponse<any>> {
  appendActorUserIdToFormData(formData);
  return apiRequest<ApiResponse<any>>(`/course-contents/${id}`, {
    method: 'PUT',
    body: formData,
  });
}

export async function deleteCourseContent(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/course-contents/${id}${getActorUserIdQuery()}`, {
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
