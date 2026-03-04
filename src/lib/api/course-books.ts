import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/course';

export interface CourseBook {
  id: string;
  courseId: string;
  bookId: string;
  isFree: boolean;
  book?: {
    id: string;
    name: string;
    sku: string;
    price: number;
    isEbook: boolean;
    fileUrl?: string | null;
  };
  course?: {
    id: string;
    name: string;
    code: string;
  };
}

export async function getCourseBooks(courseId: string): Promise<ApiResponse<CourseBook[]>> {
  return apiRequest<ApiResponse<CourseBook[]>>(`/course-books/course?courseId=${courseId}`);
}

export async function getBookCourses(bookId: string): Promise<ApiResponse<CourseBook[]>> {
  return apiRequest<ApiResponse<CourseBook[]>>(`/course-books/book?bookId=${bookId}`);
}

export async function addCourseBook(
  courseId: string,
  bookId: string,
  isFree: boolean = false
): Promise<ApiResponse<CourseBook>> {
  return apiRequest<ApiResponse<CourseBook>>('/course-books', {
    method: 'POST',
    body: JSON.stringify({ courseId, bookId, isFree }),
  });
}

export async function bulkAddCourseBooks(
  courseId: string,
  books: Array<{ bookId: string; isFree?: boolean }>
): Promise<ApiResponse<{ count: number }>> {
  return apiRequest<ApiResponse<{ count: number }>>('/course-books/bulk', {
    method: 'POST',
    body: JSON.stringify({ courseId, books }),
  });
}

export async function updateCourseBook(
  id: string,
  isFree: boolean
): Promise<ApiResponse<CourseBook>> {
  return apiRequest<ApiResponse<CourseBook>>(`/course-books/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ isFree }),
  });
}

export async function removeCourseBook(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/course-books/${id}`, {
    method: 'DELETE',
  });
}
