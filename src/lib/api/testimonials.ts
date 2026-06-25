import { apiRequest } from '../api';

export interface Testimonial {
  id: string;
  testimonialType?: 'HOME' | 'COURSE';
  name: string;
  institute?: string | null;
  info?: string | null;
  quote: string;
  rating?: number | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  mediaCaptionTitle?: string | null;
  mediaCaptionSubtitle?: string | null;
  course?: { id: string; name: string } | null;
}

export interface TestimonialAdmin extends Testimonial {
  studentUserId?: string | null;
  courseId?: string | null;
  student?: { id: string; fullName: string } | null;
  approved: boolean;
  sortOrder: number;
  createdAt: string;
}

export async function getPublicTestimonials(params?: {
  type?: 'HOME' | 'COURSE';
  courseId?: string;
}): Promise<{ success: boolean; data: Testimonial[] }> {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.courseId) query.set('courseId', params.courseId);
  const q = query.toString();
  return apiRequest(`/testimonials/public${q ? `?${q}` : ''}`);
}

export interface MyCourseReview {
  id: string;
  rating: number | null;
  quote: string;
  info: string | null;
  approved: boolean;
  createdAt: string;
}

export interface MyCourseReviewStatus {
  eligible: boolean;
  reason: 'NOT_ENROLLED' | 'NOT_COMPLETED' | null;
  enrolled: boolean;
  progressPct: number;
  myReview: MyCourseReview | null;
}

export async function getMyCourseReview(
  courseId: string,
  actorUserId: string,
): Promise<{ success: boolean; data: MyCourseReviewStatus }> {
  const query = new URLSearchParams({ courseId, actorUserId });
  return apiRequest(`/testimonials/my-course-review?${query.toString()}`);
}

export async function getAllTestimonials(params?: {
  approved?: boolean;
  type?: 'HOME' | 'COURSE';
}): Promise<{ success: boolean; data: TestimonialAdmin[] }> {
  const query = new URLSearchParams();
  if (params?.approved === true) query.set('approved', 'true');
  if (params?.approved === false) query.set('approved', 'false');
  if (params?.type) query.set('type', params.type);
  const q = query.toString();
  return apiRequest(`/testimonials${q ? `?${q}` : ''}`);
}

export async function createTestimonial(data: Partial<TestimonialAdmin>): Promise<{ success: boolean; data: TestimonialAdmin }> {
  return apiRequest('/testimonials', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function submitCourseReview(data: {
  actorUserId: string;
  courseId: string;
  rating: number;
  quote: string;
  info?: string;
}): Promise<{ success: boolean; message?: string; data: TestimonialAdmin }> {
  return apiRequest('/testimonials', {
    method: 'POST',
    body: JSON.stringify({ ...data, testimonialType: 'COURSE' }),
  });
}

export async function createAdminTestimonial(
  data: Partial<TestimonialAdmin> | FormData,
): Promise<{ success: boolean; data: TestimonialAdmin }> {
  return apiRequest('/testimonials/admin', {
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
  });
}

export async function updateTestimonial(
  id: string,
  data: Partial<TestimonialAdmin> | FormData,
): Promise<{ success: boolean; data: TestimonialAdmin }> {
  return apiRequest(`/testimonials/${id}`, {
    method: 'PUT',
    body: data instanceof FormData ? data : JSON.stringify(data),
  });
}

export async function deleteTestimonial(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/testimonials/${id}`, { method: 'DELETE' });
}

export async function approveTestimonial(id: string): Promise<{ success: boolean; data: TestimonialAdmin }> {
  return apiRequest(`/testimonials/${id}/approve`, { method: 'PATCH' });
}

export async function reorderTestimonials(items: { id: string; sortOrder: number }[]): Promise<{ success: boolean }> {
  return apiRequest('/testimonials/reorder', {
    method: 'PATCH',
    body: JSON.stringify(items),
  });
}
