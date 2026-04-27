// Exam types based on Prisma schema
export type ExamType = 'PRACTICE' | 'SCHEDULED' | 'MODEL' | 'TALENT_HUNT' | 'UNIVERSITY';
export type ExamScope = 'COURSE' | 'GLOBAL';
export type SelectionMode = 'RANDOM' | 'MANUAL';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface ExamSubjectFolderRule {
  id: string;
  examSubjectId: string;
  folderId: string;
  questionCount: number;
  difficulty?: Difficulty | null;
  selectionMode: SelectionMode;
  pinnedQuestionIds?: string[];
  excludedQuestionIds?: string[];
  createdAt: string;
  folder?: {
    id: string;
    name: string;
    _count?: { questions: number };
  };
}

export interface ExamSubject {
  id: string;
  examId: string;
  name: string;
  slug: string;
  questionCount: number;
  mcqSingleCount: number;
  mcqPassageCount: number;
  cqCount: number;
  shortCount: number;
  marksPerQuestion: number;
  negativeMarks?: number | null;
  passMarks?: number | null;
  isMandatory: boolean;
  sortOrder: number;
  color?: string | null;
  timeLimitMinutes?: number | null;
  createdAt: string;
  folderRules?: ExamSubjectFolderRule[];
}

// ─── Talent Hunt types ──────────────────────────────────────────────────────
export type TalentHuntStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type TalentHuntStageStatus = 'PENDING' | 'OPEN' | 'SCORING' | 'CLOSED';

export interface TalentHuntStage {
  id: string;
  talentHuntId: string;
  stageNumber: number;
  name: string;
  linkedExamId?: string | null;
  cutoffScore: number;
  topNAdvance: number;
  opensAt?: string | null;
  closesAt?: string | null;
  status: TalentHuntStageStatus;
  createdAt: string;
  advancements?: TalentHuntAdvancement[];
}

export interface TalentHuntPrize {
  id: string;
  talentHuntId: string;
  stageId?: string | null;
  rankFrom: number;
  rankTo: number;
  prizeType: string;
  amount: string;
  label: string;
}

export interface TalentHuntAdvancement {
  id: string;
  stageId: string;
  studentId: string;
  score: number;
  rank: number;
  advancedToNextStage: boolean;
  createdAt: string;
}

export interface TalentHunt {
  id: string;
  examId: string;
  title: string;
  courseId?: string | null;
  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
  status: TalentHuntStatus;
  autoAdvance: boolean;
  createdAt: string;
  stages: TalentHuntStage[];
  prizes: TalentHuntPrize[];
}

export type ExamEngineType =
  | 'REGULAR'
  | 'COMPETITIVE'
  | 'MULTI_SUBJECT'
  | 'UNIVERSITY_SPECIAL'
  | 'TALENT_HUNT'
  | 'OMR_BOOK';
export type ExamMode = 'ONLINE' | 'OFFLINE' | 'WRITTEN';
export type ExamStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface Course {
  id: string;
  name: string;
  slug?: string;
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
  sectionKey?: string | null;
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

export interface ExamCourseLink {
  id: string;
  examId: string;
  courseId: string;
  course?: Course;
}

export interface Exam {
  id: string;
  courseId: string;
  branchId?: string | null;
  batchId?: string | null;
  title: string;
  type: ExamType;
  scope?: ExamScope;
  examEngine?: ExamEngineType;
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
  hideResult?: boolean;
  showPercentile?: boolean;
  universityName?: string | null;
  totalSets?: number | null;
  omrQuestionCount?: number | null;
  omrOptionCount?: number | null;
  omrGeneratedUrl?: string | null;
  language?: string;
  examCourses?: ExamCourseLink[];
  solveSheetVisibility?: string | null;
  solveSheetScheduledAt?: string | null;
  createdAt: string;
  course?: Course;
  branch?: Branch;
  batch?: Batch | null;
  sets?: ExamSet[];
  attempts?: ExamAttempt[];
  subjects?: ExamSubject[];
  _count?: {
    attempts?: number;
    sets?: number;
  };
  // Student enrichment
  studentAttempts?: { examId: string; status: string; obtainedMarks?: number | null; totalMarks?: number | null; submittedAt?: string | null }[];
  canAttempt?: boolean;
  hasInProgress?: boolean;
}

/** Row from GET /exams/:id/leaderboard */
export interface ExamLeaderboardRow {
  rank: number;
  studentUserId: string;
  fullName: string;
  registrationNumber?: string | null;
  obtainedMarks: number | null;
  totalMarks: number | null;
  submittedAt?: string | null;
  percentile?: number;
}

/** Safe exam summary for students (from GET /exams/:id/student-view). */
export interface ExamStudentView {
  id: string;
  title: string;
  mode: ExamMode;
  status: ExamStatus;
  type: ExamType;
  examEngine?: ExamEngineType;
  showLeaderboard?: boolean;
  showPercentile?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  durationMinutes?: number | null;
  language?: string | null;
  pdfUrl?: string | null;
  solveSheetUrl?: string | null;
  solveSheetVisibility?: string | null;
  solveSheetScheduledAt?: string | null;
  courseId: string;
  branchId: string;
  batchId?: string | null;
  allowedAttempts: number;
  course?: Course;
  branch?: Branch;
  batch?: Batch | null;
  /** Extra linked courses (primary is `courseId` / `course`) — for multi-course exams & leaderboard scope. */
  examCourses?: { courseId: string; course?: { id: string; name: string; slug?: string } }[];
  _count?: { sets: number };
}

export interface CreateExamDto {
  /** When set, backend enforces CourseTeacher assignment (teacher flows). */
  teacherUserId?: string;
  courseId: string;
  /** Omit or null = all branches */
  branchId?: string | null;
  batchId?: string;
  title: string;
  type: ExamType;
  mode: ExamMode;
  scope?: ExamScope;
  examEngine?: ExamEngineType;
  showPercentile?: boolean;
  universityName?: string | null;
  totalSets?: number | null;
  omrQuestionCount?: number | null;
  omrOptionCount?: number | null;
  startAt?: string;
  endAt?: string;
  durationMinutes?: number;
  allowedAttempts?: number;
  status?: ExamStatus;
  settings?: any;
  showLeaderboard?: boolean;
  hideResult?: boolean;
  solveSheetVisibility?: string;
  solveSheetScheduledAt?: string;
  language?: string;
}

export interface UpdateExamDto {
  teacherUserId?: string;
  courseId?: string;
  branchId?: string | null;
  batchId?: string;
  mode?: ExamMode;
  language?: string;
  title?: string;
  type?: ExamType;
  scope?: ExamScope;
  examEngine?: ExamEngineType;
  showPercentile?: boolean;
  universityName?: string | null;
  totalSets?: number | null;
  omrQuestionCount?: number | null;
  omrOptionCount?: number | null;
  omrGeneratedUrl?: string | null;
  startAt?: string;
  endAt?: string;
  durationMinutes?: number;
  allowedAttempts?: number;
  status?: ExamStatus;
  settings?: any;
  showLeaderboard?: boolean;
  hideResult?: boolean;
  solveSheetVisibility?: string;
  solveSheetScheduledAt?: string;
}

export type ExamFlowKind = 'MCQ_ONLY' | 'WRITTEN_ONLY' | 'MIXED';

export interface ExamSectionBlock {
  key: string;
  label: string;
  questionIndices: number[];
}

export interface StartAttemptResponse {
  attempt: { id: string; startedAt: string; status: string };
  exam: {
    id: string;
    title: string;
    durationMinutes: number | null;
    type: ExamType;
    examEngine?: ExamEngineType;
    mode: ExamMode;
    language?: string | null;
    settings?: { proctorStrict?: boolean; [k: string]: unknown } | null;
  };
  setName: string;
  questions: ExamQuestion[];
  sections?: ExamSectionBlock[];
  examFlow?: ExamFlowKind;
  totalMarks: number;
  answeredMap: Record<string, any>;
}

export interface AttemptResultResponse {
  attempt: { id: string; status: string; startedAt: string; submittedAt: string | null; totalMarks: number | null; obtainedMarks: number | null };
  student: { id: string; fullName: string };
  exam: {
    id: string;
    title: string;
    type: ExamType;
    examEngine?: ExamEngineType;
    showLeaderboard: boolean;
    showPercentile?: boolean;
    language?: string | null;
  };
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

export interface WrittenEvaluation {
  id: string;
  attemptId: string;
  answerId?: string;
  subPartKey?: string | null;  // null = whole question; 'a'|'b'|'c'|'d' = CQ sub-part
  marksAwarded?: number | null;
  remarks?: string | null;
  teacherUserId: string;
  evaluatedAt: string;
}

export interface WrittenAttemptSummary {
  id: string;
  student: { id: string; fullName: string; mobile: string };
  status: string;
  startedAt: string;
  submittedAt?: string | null;
  totalMarks?: number | null;
  obtainedMarks?: number | null;
  evaluationStatus: 'PENDING' | 'PARTIAL' | 'EVALUATED';
  totalAwarded: number;
}

export interface WrittenAttemptDetail {
  attempt: {
    id: string;
    status: string;
    startedAt: string;
    submittedAt?: string | null;
    totalMarks?: number | null;
    obtainedMarks?: number | null;
  };
  student: { id: string; fullName: string; mobile: string };
  exam: { id: string; title: string };
  questions: WrittenQuestionWithAnswer[];
}

export interface WrittenQuestionWithAnswer {
  examQuestionId: string;
  questionId: string;
  marks: number;
  orderIndex: number;
  question: {
    id: string;
    type: string;
    prompt: string;
    meta?: any;
  };
  studentAnswer?: {
    id: string;
    answer: Record<string, string>;  // { text: 'answer' } for single; { a: '...', b: '...' } for CQ
    obtainedMarks?: number | null;
    evaluations: WrittenEvaluation[];
    scanUrls?: string[] | null;
  } | null;
}
