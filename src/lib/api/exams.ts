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
  ExamFolderRule,
  SelectionMode,
} from '@/types/exam';

export type { ExamFolderRule, SelectionMode };

export interface UpsertExamFolderRuleDto {
  folderId: string;
  selectionMode: SelectionMode;
  questionCount?: number | null;
  questionTypes?: string[];
  difficulty?: string | null;
  tags?: string[];
}

export interface GenerateFromFoldersDto {
  examSetId: string;
  marks?: number;
  negativeMarks?: number;
  replaceExisting?: boolean;
}

export async function getExams(params?: {
  courseId?: string;
  branchId?: string;
  batchId?: string;
  status?: string;
  mode?: string;
  teacherUserId?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<Exam[]>> {
  const queryParams = new URLSearchParams();
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.batchId) queryParams.append('batchId', params.batchId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.mode) queryParams.append('mode', params.mode);
  if (params?.teacherUserId) queryParams.append('teacherUserId', params.teacherUserId);
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
  shuffleQuestions?: boolean;
  autoSetCount?: number;
  cqCount?: number;
  mcqSingleCount?: number;
  mcqPassageCount?: number;
  marks?: number;
  negativeMarks?: number;
}): Promise<
  ApiResponse<{
    addedCount: number;
    skippedDuplicates?: number;
    generatedSetCount?: number;
    generatedSetNames?: string[];
    perSet?: Array<{
      setId: string;
      setName: string;
      addedCount: number;
      skippedDuplicates: number;
    }>;
  }>
> {
  return apiRequest<
    ApiResponse<{
      addedCount: number;
      skippedDuplicates?: number;
      generatedSetCount?: number;
      generatedSetNames?: string[];
      perSet?: Array<{
        setId: string;
        setName: string;
        addedCount: number;
        skippedDuplicates: number;
      }>;
    }>
  >('/exams/sets/questions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeQuestionFromSet(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/exams/sets/questions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    cache: 'no-store',
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

// Offline Answer Sheet Upload APIs
export async function uploadAnswerSheet(
  examId: string,
  data: { attemptId: string; questionId: string; files: File[] },
): Promise<ApiResponse<{ answerId: string; scanUrls: string[] }>> {
  const formData = new FormData();
  formData.append('attemptId', data.attemptId);
  formData.append('questionId', data.questionId);
  data.files.forEach((f) => formData.append('files', f));
  return apiRequest<ApiResponse<{ answerId: string; scanUrls: string[] }>>(
    `/exams/${examId}/answer-sheets/upload`,
    { method: 'POST', body: formData },
  );
}

export async function removeAnswerSheetScan(
  examId: string,
  data: { attemptId: string; questionId: string; scanUrl: string },
): Promise<ApiResponse<{ scanUrls: string[] }>> {
  return apiRequest<ApiResponse<{ scanUrls: string[] }>>(
    `/exams/${examId}/answer-sheets/remove-scan`,
    { method: 'POST', body: JSON.stringify(data) },
  );
}

export async function createOfflineAttempt(
  examId: string,
  studentUserId: string,
): Promise<ApiResponse<{ attemptId: string }>> {
  return apiRequest<ApiResponse<{ attemptId: string }>>(
    `/exams/${examId}/offline-attempts`,
    { method: 'POST', body: JSON.stringify({ studentUserId }) },
  );
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

// ─── Exam Folder Rules ──────────────────────────────────────────────────────

export async function getExamFolderRules(examId: string): Promise<ApiResponse<ExamFolderRule[]>> {
  return apiRequest<ApiResponse<ExamFolderRule[]>>(`/exams/${examId}/folder-rules`);
}

export async function upsertExamFolderRule(examId: string, data: UpsertExamFolderRuleDto): Promise<ApiResponse<ExamFolderRule>> {
  return apiRequest<ApiResponse<ExamFolderRule>>(`/exams/${examId}/folder-rules`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteExamFolderRule(examId: string, ruleId: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/exams/${examId}/folder-rules/${ruleId}`, { method: 'DELETE' });
}

export async function generateFromFolders(examId: string, data: GenerateFromFoldersDto): Promise<ApiResponse<any>> {
  return apiRequest<ApiResponse<any>>(`/exams/${examId}/generate-from-folders`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

