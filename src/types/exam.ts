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
    options?: any[];
  };
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
