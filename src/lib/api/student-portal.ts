import { apiRequest, API_BASE_URL } from '../api';
import type { ApiResponse, StudentResults } from '@/types/academic';
import type { Book } from './books';

export async function getMyCourses(studentUserId: string): Promise<ApiResponse<any[]>> {
  return apiRequest<ApiResponse<any[]>>(`/student-portal/my-courses/${studentUserId}`);
}

export async function getStudentResults(studentUserId: string): Promise<ApiResponse<StudentResults>> {
  return apiRequest<ApiResponse<StudentResults>>(`/student-portal/results/${studentUserId}`);
}

export async function checkEnrollment(studentUserId: string, courseId: string): Promise<ApiResponse<{ enrolled: boolean; enrollmentId?: string }>> {
  return apiRequest<ApiResponse<{ enrolled: boolean; enrollmentId?: string }>>(`/student-portal/check-enrollment/${studentUserId}/${encodeURIComponent(courseId)}`);
}

export async function getPortalBooks(): Promise<ApiResponse<Book[]>> {
  return apiRequest<ApiResponse<Book[]>>('/student-portal/all-books');
}

export async function getRoutine(studentUserId: string): Promise<ApiResponse<any[]>> {
  return apiRequest<ApiResponse<any[]>>(`/student-portal/routine/${encodeURIComponent(studentUserId)}`);
}

export async function getCourseContentsWithProgress(
  courseId: string,
  studentUserId: string
): Promise<ApiResponse<any[]>> {
  return apiRequest<ApiResponse<any[]>>(
    `/student-portal/course-contents/${encodeURIComponent(courseId)}/${encodeURIComponent(studentUserId)}`
  );
}

export async function updateContentProgress(data: {
  studentUserId: string;
  contentId: string;
  completed?: boolean;
  progressPercent?: number;
}): Promise<ApiResponse<any>> {
  return apiRequest<ApiResponse<any>>('/student-portal/course-progress', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export type BookPurchaseDelivery = {
  recipientName: string;
  phone: string;
  address: string;
  city?: string;
  postalCode?: string;
  notes?: string;
};

export async function purchaseBook(data: {
  studentUserId: string;
  bookId: string;
  branchId?: string;
  delivery: BookPurchaseDelivery;
}): Promise<ApiResponse<{ id: string }>> {
  return apiRequest<ApiResponse<{ id: string }>>('/student-portal/purchase-book', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** API response format: { success, message?, data? } */
export async function enrollInCourse(data: {
  studentUserId: string;
  courseId: string;
  branchId?: string;
  batchId?: string;
}): Promise<ApiResponse<{ enrollment: any; invoice: { id: string } }> & { data?: { enrollmentId?: string } }> {
  const url = `${API_BASE_URL}/student-portal/enroll-course`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.message || `Request failed (${res.status})`);
    (err as any).response = { success: false, message: body.message, data: body.data };
    throw err;
  }
  return body;
}

