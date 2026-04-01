// Academic record and exam result types based on Prisma schema and student-portal responses

export interface OnlineExamAttempt {
  id: string;
  examId: string;
  studentUserId: string;
  startedAt: string;
  submittedAt?: string | null;
  status: string;
  totalMarks?: number | null;
  obtainedMarks?: number | null;
  exam?: {
    id: string;
    title: string;
    type: string;
    mode: string;
    courseId: string;
    status?: string;
    solveSheetUrl?: string | null;
  };
}

export interface OfflineExamResult {
  id: string;
  examId: string;
  studentUserId?: string | null;
  rollNo: string;
  subject?: string | null;
  totalMarks?: number | null;
  obtainedMarks?: number | null;
  meritPosition?: number | null;
  resultMeta?: any;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAcademicRecord {
  id: string;
  studentUserId: string;
  courseId?: string | null;
  examId?: string | null;
  examAttemptId?: string | null;
  recordType: string;
  score?: number | null;
  grade?: string | null;
  remarks?: string | null;
  createdAt: string;
}

/** Centrally published marks from ResultBatch / ExamResult (student portal). */
export interface OfficialExamResult {
  id: string;
  examId: string;
  studentId: string;
  rollNo: string;
  marks: number | string;
  totalMarks: number | string;
  percentage: number | string;
  passFail?: string;
  batchApprovalStatus: string;
  submittedAt?: string;
  exam?: { id: string; title: string; courseId: string };
  resultBatch?: { id: string; approvalStatus: string };
}

export interface StudentResults {
  onlineAttempts: OnlineExamAttempt[];
  offlineResults: OfflineExamResult[];
  academicRecords: StudentAcademicRecord[];
  officialExamResults?: OfficialExamResult[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
