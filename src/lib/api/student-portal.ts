import { apiRequest } from '../api';
import type { ApiResponse, StudentResults } from '@/types/academic';

export async function getStudentResults(studentUserId: string): Promise<ApiResponse<StudentResults>> {
  return apiRequest<ApiResponse<StudentResults>>(`/student-portal/results/${studentUserId}`);
}

