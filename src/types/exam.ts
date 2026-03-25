// Exam types based on Prisma schema
export type ExamType = 'PRACTICE' | 'SCHEDULED' | 'MODEL' | 'TALENT_HUNT' | 'UNIVERSITY';
export type ExamMode = 'ONLINE' | 'OFFLINE';
export type ExamStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface Course {
  id: string;
  name: string;
  code: string;
}

export interface Branch {
  id: string;
  name: string;
}

export interface Batch {
  id: string;
  name: string;
}

export interface ExamSet {
  id: string;
  examId: string;
  name: string;
  createdAt: string;
  questions?: ExamQuestion[];
}

export interface ExamQuestion {
  id: string;
  examSetId: string;
  questionId: string;
  marks: number;
  negativeMarks?: number | null;
  orderIndex: number;
  question?: {
    id: string;
    prompt: string;
    type: string;
    meta?: any;
    explanation?: string | null;
    options?: { id: string; label: string; text: string; isCorrect?: boolean }[];
    passage?: { id: string; title?: string | null; content: string } | null;
  };
  studentAnswer?: {
    answer: any;
    isCorrect: boolean | null;
    obtainedMarks: number | null;
  } | null;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentUserId: string;
  startedAt: string;
  submittedAt?: string | null;
  status: string;
  totalMarks?: number | null;
  obtainedMarks?: number | null;
  student?: {
    id: string;
    fullName: string;
  };
}

export interface Exam {
  id: string;
  courseId: string;
  branchId: string;
  batchId?: string | null;
  title: string;
  type: ExamType;
  mode: ExamMode;
  startAt?: string | null;
  endAt?: string | null;
  durationMinutes?: number | null;
  allowedAttempts: number;
  status: ExamStatus;
  settings?: any;
  pdfUrl?: string | null;
  solveSheetUrl?: string | null;
  showLeaderboard?: boolean;
  language?: string;
  solveSheetVisibility?: string | null;
  solveSheetScheduledAt?: string | null;
  createdAt: string;
  course?: Course;
  branch?: Branch;
  batch?: Batch | null;
  sets?: ExamSet[];
  attempts?: ExamAttempt[];
  _count?: {
    attempts?: number;
    sets?: number;
  };
  // Student enrichment
  studentAttempts?: { examId: string; status: string; obtainedMarks?: number | null; totalMarks?: number | null; submittedAt?: string | null }[];
  canAttempt?: boolean;
  hasInProgress?: boolean;
}

export interface CreateExamDto {
  courseId: string;
  branchId: string;
  batchId?: string;
  title: string;
  type: ExamType;
  mode: ExamMode;
  startAt?: string;
  endAt?: string;
  durationMinutes?: number;
  allowedAttempts?: number;
  status?: ExamStatus;
  settings?: any;
  showLeaderboard?: boolean;
  solveSheetVisibility?: string;
  solveSheetScheduledAt?: string;
  language?: string;
}

export interface UpdateExamDto {
  courseId?: string;
  branchId?: string;
  batchId?: string;
  title?: string;
  type?: ExamType;
  mode?: ExamMode;
  startAt?: string;
  endAt?: string;
  durationMinutes?: number;
  allowedAttempts?: number;
  status?: ExamStatus;
  settings?: any;
  showLeaderboard?: boolean;
  solveSheetVisibility?: string;
  solveSheetScheduledAt?: string;
}

export interface StartAttemptResponse {
  attempt: { id: string; startedAt: string; status: string };
  exam: { id: string; title: string; durationMinutes: number | null; type: ExamType; mode: ExamMode; language?: string | null };
  setName: string;
  questions: ExamQuestion[];
  totalMarks: number;
  answeredMap: Record<string, any>;
}

export interface AttemptResultResponse {
  attempt: { id: string; status: string; startedAt: string; submittedAt: string | null; totalMarks: number | null; obtainedMarks: number | null };
  student: { id: string; fullName: string };
  exam: { id: string; title: string; type: ExamType; showLeaderboard: boolean; language?: string | null };
  questions: ExamQuestion[];
  showSolutions: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
