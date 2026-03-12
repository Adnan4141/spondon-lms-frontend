import { apiRequest } from '../api';
import type { Exam, CreateExamDto, UpdateExamDto, ApiResponse } from '@/types/exam';

export async function getExams(params?: {
  courseId?: string;
  branchId?: string;
  batchId?: string;
  status?: string;
  mode?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<Exam[]>> {
  const queryParams = new URLSearchParams();
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.batchId) queryParams.append('batchId', params.batchId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.mode) queryParams.append('mode', params.mode);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const query = queryParams.toString();
  return apiRequest<ApiResponse<Exam[]>>(`/exams${query ? `?${query}` : ''}`);
}

export async function getExamById(id: string): Promise<ApiResponse<Exam>> {
  return apiRequest<ApiResponse<Exam>>(`/exams/${id}`);
}

export async function createExam(data: CreateExamDto): Promise<ApiResponse<Exam>> {
  return apiRequest<ApiResponse<Exam>>('/exams', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateExam(id: string, data: UpdateExamDto): Promise<ApiResponse<Exam>> {
  return apiRequest<ApiResponse<Exam>>(`/exams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteExam(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/exams/${id}`, {
    method: 'DELETE',
  });
}

// Exam Set Management
export async function createExamSet(data: { examId: string; name: string }): Promise<ApiResponse<any>> {
  return apiRequest<ApiResponse<any>>('/exams/sets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteExamSet(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/exams/sets/${id}`, {
    method: 'DELETE',
  });
}

export async function addQuestionsToSet(data: {
  examSetId: string;
  questionIds?: string[];
  folderId?: string;
  count?: number;
  cqCount?: number;
  mcqSingleCount?: number;
  mcqPassageCount?: number;
  marks?: number;
  negativeMarks?: number;
}): Promise<ApiResponse<any>> {
  return apiRequest<ApiResponse<any>>('/exams/sets/questions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeQuestionFromSet(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/exams/sets/questions/${id}`, {
    method: 'DELETE',
  });
}
