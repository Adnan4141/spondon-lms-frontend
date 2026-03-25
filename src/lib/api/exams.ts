import { apiRequest, API_ORIGIN } from '../api';
import type { Exam, CreateExamDto, UpdateExamDto, ApiResponse, StartAttemptResponse, AttemptResultResponse } from '@/types/exam';

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

export async function regenerateExamPdf(examId: string, columns: 1 | 2 = 2): Promise<ApiResponse<{ pdfUrl: string }>> {
  return apiRequest<ApiResponse<{ pdfUrl: string }>>(`/exams/${examId}/regenerate-pdf?columns=${columns}`, {
    method: 'POST',
  });
}

export async function generateSetPdf(examId: string, setId: string, columns: 1 | 2 = 2): Promise<ApiResponse<{ pdfUrl: string }>> {
  return apiRequest<ApiResponse<{ pdfUrl: string }>>(`/exams/${examId}/sets/${setId}/generate-pdf?columns=${columns}`, {
    method: 'POST',
  });
}

export async function regenerateSolveSheet(examId: string): Promise<ApiResponse<{ solveSheetUrl: string }>> {
  return apiRequest<ApiResponse<{ solveSheetUrl: string }>>(`/exams/${examId}/regenerate-solve-sheet`, {
    method: 'POST',
  });
}

export function getExamPdfDownloadUrl(pdfUrl: string): string {
  return `${API_ORIGIN}${pdfUrl}`;
}

// Student Exam APIs
export async function getStudentExams(studentUserId: string): Promise<ApiResponse<Exam[]>> {
  return apiRequest<ApiResponse<Exam[]>>(`/exams/student/${studentUserId}`);
}

export async function startExamAttempt(examId: string, studentUserId: string): Promise<ApiResponse<StartAttemptResponse>> {
  return apiRequest<ApiResponse<StartAttemptResponse>>(`/exams/${examId}/start-attempt`, {
    method: 'POST',
    body: JSON.stringify({ studentUserId }),
  });
}

export async function saveExamAnswer(examId: string, data: { studentUserId: string; questionId: string; answer: any }): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/exams/${examId}/save-answer`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function submitExamAttempt(examId: string, data: { studentUserId: string; antiCheatLog?: any }): Promise<ApiResponse<any>> {
  return apiRequest<ApiResponse<any>>(`/exams/${examId}/submit-attempt`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAttemptResult(attemptId: string): Promise<ApiResponse<AttemptResultResponse>> {
  return apiRequest<ApiResponse<AttemptResultResponse>>(`/exams/attempts/${attemptId}/result`);
}
