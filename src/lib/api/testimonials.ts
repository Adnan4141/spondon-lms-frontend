import { apiRequest } from '../api';

export interface Testimonial {
  id: string;
  name: string;
  institute?: string | null;
  info?: string | null;
  quote: string;
  rating?: number | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
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

export async function getPublicTestimonials(): Promise<{ success: boolean; data: Testimonial[] }> {
  return apiRequest('/testimonials/public');
}

export async function getAllTestimonials(params?: {
  approved?: boolean;
}): Promise<{ success: boolean; data: TestimonialAdmin[] }> {
  const q =
    params?.approved === true ? '?approved=true' : params?.approved === false ? '?approved=false' : '';
  return apiRequest(`/testimonials${q}`);
}

export async function createTestimonial(data: Partial<TestimonialAdmin>): Promise<{ success: boolean; data: TestimonialAdmin }> {
  return apiRequest('/testimonials', {
    method: 'POST',
    body: JSON.stringify(data),
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
