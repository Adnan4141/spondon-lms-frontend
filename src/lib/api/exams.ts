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
  ExamSubject,
  ExamSubjectFolderRule,
  SelectionMode,
  Difficulty,
} from '@/types/exam';

export type { ExamSubject, ExamSubjectFolderRule, SelectionMode, Difficulty };

export interface CreateExamSubjectDto {
  name: string;
  questionCount: number;
  marksPerQuestion: number;
  negativeMarks?: number;
  passMarks?: number;
  isMandatory?: boolean;
  sortOrder?: number;
  folderRules?: { folderId: string; questionCount: number; difficulty?: Difficulty; selectionMode?: SelectionMode }[];
}

export interface UpdateExamSubjectDto extends Partial<CreateExamSubjectDto> {}

export interface UpsertSubjectFolderRuleDto {
  folderId: string;
  questionCount: number;
  difficulty?: Difficulty | null;
  selectionMode?: SelectionMode;
}

export interface GenerateFromSubjectsDto {
  setCount: number;
  language?: 'bn' | 'en';
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
  folderIds?: string[];
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
  if (!pdfUrl) return '';
  const trimmed = pdfUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${API_ORIGIN}${path}`;
}

// Student Exam APIs
export async function getExamAnalytics(examId: string): Promise<ApiResponse<ExamAnalytics>> {
  return apiRequest<ApiResponse<ExamAnalytics>>(`/exams/${examId}/analytics`);
}

export interface ExamAnalytics {
  totalAttempts: number;
  totalMarks: number;
  average: number;
  highest: number;
  lowest: number;
  scoreDistribution: { range: string; count: number }[];
  passFail: { pass: number; fail: number; passRate: number };
  perQuestionAccuracy: {
    questionId: string;
    type: string;
    text: string;
    totalAnswered: number;
    correctCount: number;
    accuracy: number;
  }[];
}

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

// ─── Exam Subjects & Folder Rules ───────────────────────────────────────────

export async function getExamSubjects(examId: string): Promise<ApiResponse<ExamSubject[]>> {
  return apiRequest<ApiResponse<ExamSubject[]>>(`/exams/${examId}/subjects`);
}

export async function createExamSubject(examId: string, data: CreateExamSubjectDto): Promise<ApiResponse<ExamSubject>> {
  return apiRequest<ApiResponse<ExamSubject>>(`/exams/${examId}/subjects`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateExamSubject(examId: string, subjectId: string, data: UpdateExamSubjectDto): Promise<ApiResponse<ExamSubject>> {
  return apiRequest<ApiResponse<ExamSubject>>(`/exams/${examId}/subjects/${subjectId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteExamSubject(examId: string, subjectId: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/exams/${examId}/subjects/${subjectId}`, { method: 'DELETE' });
}

export async function upsertSubjectFolderRule(examId: string, subjectId: string, data: UpsertSubjectFolderRuleDto): Promise<ApiResponse<ExamSubjectFolderRule>> {
  return apiRequest<ApiResponse<ExamSubjectFolderRule>>(`/exams/${examId}/subjects/${subjectId}/folder-rules`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteSubjectFolderRule(examId: string, subjectId: string, ruleId: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/exams/${examId}/subjects/${subjectId}/folder-rules/${ruleId}`, { method: 'DELETE' });
}

export async function validateExamSubjects(examId: string, setCount: number = 1): Promise<ApiResponse<{ valid: boolean; errors: string[]; warnings: string[] }>> {
  return apiRequest<ApiResponse<{ valid: boolean; errors: string[]; warnings: string[] }>>(`/exams/${examId}/validate-subjects`, {
    method: 'POST',
    body: JSON.stringify({ setCount }),
  });
}

export async function generateFromSubjects(examId: string, data: GenerateFromSubjectsDto): Promise<ApiResponse<any>> {
  return apiRequest<ApiResponse<any>>(`/exams/${examId}/generate-from-subjects`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Blueprint (sections × folder rules × difficulty %) ────────────────────

export type DifficultyPct = { easy: number; medium: number; hard: number };

export interface BlueprintFolderRule {
  folderId: string;
  folderName?: string;
  questionCount: number;
  includeDescendants?: boolean;
  selectionMode?: 'RANDOM' | 'MANUAL';
  difficulty?: Difficulty | null;
}

export interface BlueprintSection {
  id?: string;
  name: string;
  type: 'MCQ' | 'CQ' | 'SHORT';
  questionCount: number;
  marksPerQuestion: number;
  negativeMarks?: number;
  passMarks?: number;
  isMandatory?: boolean;
  difficultyDistribution: DifficultyPct;
  folderRules: BlueprintFolderRule[];
}

export interface BlueprintSettings {
  totalSets: number;
  durationMinutes: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  uniqueSets?: boolean;
  language?: 'bn' | 'en';
  negativeMarking?: boolean;
}

export interface ExamBlueprint {
  sections: BlueprintSection[];
  settings: BlueprintSettings;
}

export interface BlueprintValidationResult {
  valid: boolean;
  errors: { field: string; message: string }[];
  warnings: string[];
  availability: Array<{
    sectionName: string;
    type: 'MCQ' | 'CQ' | 'SHORT';
    folderRules: Array<{
      folderId: string;
      folderName?: string;
      needed: number;
      neededForAllSets: number;
      available: number;
      availableByDifficulty: { EASY: number; MEDIUM: number; HARD: number };
    }>;
  }>;
}

export async function getExamBlueprint(examId: string): Promise<ApiResponse<ExamBlueprint | null>> {
  return apiRequest<ApiResponse<ExamBlueprint | null>>(`/exams/${examId}/blueprint`);
}

export async function validateExamBlueprint(
  examId: string,
  blueprint: ExamBlueprint,
): Promise<ApiResponse<BlueprintValidationResult>> {
  return apiRequest<ApiResponse<BlueprintValidationResult>>(
    `/exams/${examId}/blueprint/validate`,
    { method: 'POST', body: JSON.stringify(blueprint) },
  );
}

export async function generateFromBlueprint(
  examId: string,
  blueprint: ExamBlueprint,
): Promise<
  ApiResponse<{
    setNames: string[];
    setsSummary: { name: string; questionCount: number }[];
    errors: { field: string; message: string }[];
    warnings: string[];
  }>
> {
  return apiRequest(`/exams/${examId}/blueprint/generate`, {
    method: 'POST',
    body: JSON.stringify(blueprint),
  });
}

/** Build a direct URL for downloading the ZIP bundle of all set PDFs + solve sheet + answer keys. */
export function getExamBundleZipUrl(examId: string): string {
  return `${API_ORIGIN}/api/exams/${examId}/bundle.zip`;
}

