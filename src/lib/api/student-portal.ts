import { apiRequest } from '../api';
import type { ApiResponse, StudentResults } from '@/types/academic';
import type { Book } from './books';

export async function getStudentResults(studentUserId: string): Promise<ApiResponse<StudentResults>> {
  return apiRequest<ApiResponse<StudentResults>>(`/student-portal/results/${studentUserId}`);
}

export async function getPortalBooks(): Promise<ApiResponse<Book[]>> {
  return apiRequest<ApiResponse<Book[]>>('/student-portal/all-books');
}

export async function purchaseBook(data: { studentUserId: string; bookId: string; branchId?: string }): Promise<ApiResponse<any>> {
  return apiRequest<ApiResponse<any>>('/student-portal/purchase-book', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

