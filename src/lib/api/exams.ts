import { apiRequest, API_ORIGIN } from '../api';
import type {
  Exam,
  ExamCourseLink,
  ExamLeaderboardRow,
  CreateExamDto,
  UpdateExamDto,
  ApiResponse,
  StartAttemptResponse,
  AttemptResultResponse,
  ExamStudentView,
} from '@/types/exam';

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

export async function getExamById(id: string, opts?: { teacherUserId?: string }): Promise<ApiResponse<Exam>> {
  const q = opts?.teacherUserId ? `?teacherUserId=${encodeURIComponent(opts.teacherUserId)}` : '';
  return apiRequest<ApiResponse<Exam>>(`/exams/${id}${q}`);
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

export async function deleteExam(id: string, opts?: { teacherUserId?: string }): Promise<ApiResponse<void>> {
  const q = opts?.teacherUserId ? `?teacherUserId=${encodeURIComponent(opts.teacherUserId)}` : '';
  return apiRequest<ApiResponse<void>>(`/exams/${id}${q}`, {
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

export async function importQuestionsFromExamSet(
  examId: string,
  setId: string,
  body: { sourceExamId: string; sourceSetId: string; questionIds?: string[] },
): Promise<ApiResponse<{ added: number; skipped: number; considered: number }>> {
  return apiRequest<ApiResponse<{ added: number; skipped: number; considered: number }>>(
    `/exams/${examId}/sets/${setId}/import-questions`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
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

export async function getExamStudentView(
  examId: string,
  studentUserId: string,
): Promise<ApiResponse<ExamStudentView>> {
  const q = new URLSearchParams({ studentUserId });
  return apiRequest<ApiResponse<ExamStudentView>>(`/exams/${examId}/student-view?${q}`);
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

export async function saveExamAnswers(
  examId: string,
  data: { studentUserId: string; answers: { questionId: string; answer: unknown }[] },
): Promise<ApiResponse<{ saved: number; lastSavedAt: string }>> {
  return apiRequest<ApiResponse<{ saved: number; lastSavedAt: string }>>(`/exams/${examId}/save-answers`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export type PaperBlueprintSubject = {
  subjectId: string;
  subjectName?: string;
  type: 'MCQ' | 'CQ' | 'Short' | 'MCQ+CQ' | 'MCQ+Short';
  setSequence?: number;
  totalMCQ?: number;
  singleMCQ?: number;
  passageMCQ?: number;
  creativeSets?: number;
  shortCount?: number;
};

export type PaperBlueprint = {
  sets: number;
  marksPerQuestion?: number;
  negativeMarking?: number;
  duration?: number;
  subjects: PaperBlueprintSubject[];
};

export async function validateExamBlueprint(body: {
  blueprint: PaperBlueprint;
  teacherUserId?: string;
}): Promise<ApiResponse<{ valid: boolean; errors: string[]; warnings: string[] }>> {
  return apiRequest(`/exams/validate-blueprint`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function generateExamPaper(
  examId: string,
  body: { blueprint: PaperBlueprint; teacherUserId?: string },
): Promise<
  ApiResponse<{
    examId: string;
    generatedAt: string;
    setsSummary: { name: string; questionCount: number }[];
    setNames: string[];
  }>
> {
  return apiRequest(`/exams/${examId}/generate-paper`, {
    method: 'POST',
    body: JSON.stringify(body),
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

// Written Exam Evaluation APIs
export async function listWrittenAttempts(examId: string): Promise<ApiResponse<any[]>> {
  return apiRequest<ApiResponse<any[]>>(`/exams/${examId}/written-attempts`);
}

export async function getWrittenAttempt(examId: string, attemptId: string): Promise<ApiResponse<any>> {
  return apiRequest<ApiResponse<any>>(`/exams/${examId}/written-attempts/${attemptId}`);
}

export async function saveWrittenEvaluation(data: {
  attemptId: string;
  answerId: string;
  subPartKey?: string;
  marksAwarded: number;
  remarks?: string;
  teacherUserId: string;
}): Promise<ApiResponse<any>> {
  return apiRequest<ApiResponse<any>>('/exams/written-evaluations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function finalizeWrittenEvaluation(examId: string, attemptId: string): Promise<ApiResponse<any>> {
  return apiRequest<ApiResponse<any>>(`/exams/${examId}/written-attempts/${attemptId}/finalize`, {
    method: 'POST',
  });
}

export async function getExamCourseLinks(examId: string): Promise<ApiResponse<ExamCourseLink[]>> {
  return apiRequest<ApiResponse<ExamCourseLink[]>>(`/exams/${examId}/courses`);
}

export async function linkExamCourse(examId: string, courseId: string): Promise<ApiResponse<ExamCourseLink[]>> {
  return apiRequest<ApiResponse<ExamCourseLink[]>>(`/exams/${examId}/courses`, {
    method: 'POST',
    body: JSON.stringify({ courseId }),
  });
}

export async function unlinkExamCourse(examId: string, courseId: string): Promise<ApiResponse<ExamCourseLink[]>> {
  return apiRequest<ApiResponse<ExamCourseLink[]>>(`/exams/${examId}/courses/${encodeURIComponent(courseId)}`, {
    method: 'DELETE',
  });
}

export type ExamLeaderboardPayload = {
  examId: string;
  global: boolean;
  courseFilter: string | null;
  count: number;
  rows: ExamLeaderboardRow[];
};

export async function getExamLeaderboard(
  examId: string,
  opts?: { global?: boolean; courseId?: string },
): Promise<ApiResponse<ExamLeaderboardPayload>> {
  const q = new URLSearchParams();
  if (opts?.global !== false) q.set('global', 'true');
  if (opts?.courseId) {
    q.delete('global');
    q.set('courseId', opts.courseId);
  }
  const qs = q.toString();
  return apiRequest<ApiResponse<ExamLeaderboardPayload>>(`/exams/${examId}/leaderboard${qs ? `?${qs}` : ''}`);
}

export type OmrSamplePayload = {
  examId: string;
  questionCount: number;
  optionCount: number;
  labels: string[];
};

export async function getOmrSample(examId: string): Promise<ApiResponse<OmrSamplePayload>> {
  return apiRequest<ApiResponse<OmrSamplePayload>>(`/exams/${examId}/omr/sample`);
}

export async function gradeOmrAttempt(
  examId: string,
  body: { studentUserId: string; omrUploadUrl?: string; answers?: unknown },
): Promise<ApiResponse<{ attemptId: string; status: string }>> {
  return apiRequest<ApiResponse<{ attemptId: string; status: string }>>(`/exams/${examId}/omr/grade`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export type ExamMeritListPayload = {
  examId: string;
  meritType: string;
  rows: Record<string, unknown>[];
};

export async function getExamMeritListOnline(examId: string): Promise<ApiResponse<ExamMeritListPayload>> {
  return apiRequest<ApiResponse<ExamMeritListPayload>>(`/exams/${examId}/merit-list/online`);
}

export async function getExamMeritListOffline(examId: string): Promise<ApiResponse<ExamMeritListPayload>> {
  return apiRequest<ApiResponse<ExamMeritListPayload>>(`/exams/${examId}/merit-list/offline`);
}

export async function getExamMeritListAll(examId: string): Promise<ApiResponse<ExamMeritListPayload>> {
  return apiRequest<ApiResponse<ExamMeritListPayload>>(`/exams/${examId}/merit-list/all`);
}
