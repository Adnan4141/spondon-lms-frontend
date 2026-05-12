// Question types based on Prisma schema
export type QuestionType = 'MCQ' | 'CQ' | 'SHORT';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type McqType = 'SINGLE' | 'PASSAGE_CHILD';

export interface QuestionFolder {
  id: string;
  courseId?: string | null;
  name: string;
  parentFolderId?: string | null;
  createdAt: string;
  course?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  parent?: QuestionFolder | null;
  children?: QuestionFolder[];
  _count?: {
    questions: number;
    children: number;
  };
}

export interface McqOption {
  id: string;
  questionId: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  folderId: string;
  type: QuestionType;
  mcqType?: McqType;
  passageId?: string | null;
  difficulty?: Difficulty | null;
  year?: number | null;
  prompt: string;
  explanation?: string | null;
  meta?: any;
   tags?: string[];
  createdAt: string;
  updatedAt: string;
  folder?: QuestionFolder;
  options?: McqOption[];
  passage?: McqPassage | null;
}

export interface McqPassage {
  id: string;
  folderId: string;
  title?: string | null;
  content: string;
  difficulty?: Difficulty | null;
  year?: number | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  folder?: QuestionFolder;
  questions?: Question[];
}

export interface CreateQuestionFolderDto {
  courseId?: string | null;
  name: string;
  parentFolderId?: string;
}

export interface UpdateQuestionFolderDto {
  name?: string;
  courseId?: string | null;
  parentFolderId?: string;
}

export interface CreateQuestionDto {
  folderId: string;
  type: QuestionType;
  mcqType?: McqType;
  passageId?: string;
  difficulty?: Difficulty;
  year?: number;
  prompt: string;
  explanation?: string;
  meta?: any;
  tags?: string[];
  options?: CreateMcqOptionDto[];
}

export interface UpdateQuestionDto {
  folderId?: string;
  type?: QuestionType;
  difficulty?: Difficulty;
  year?: number;
  prompt?: string;
  explanation?: string;
  meta?: any;
  tags?: string[];
  options?: CreateMcqOptionDto[];
}

export interface CreateMcqOptionDto {
  label: string;
  text: string;
  isCorrect?: boolean;
}

export interface CopyQuestionDto {
  questionId: string;
  targetFolderId: string;
}

export interface BulkCopyQuestionsDto {
  questionIds: string[];
  targetFolderId: string;
}

export interface BulkDeleteQuestionsDto {
  questionIds: string[];
}

export interface CreateShortQuestionDto {
  folderId: string;
  difficulty?: Difficulty;
  year?: number;
  prompt: string;
  explanation?: string;
  meta?: { answer?: string };
  tags?: string[];
}

export type QuestionImportType = 'MCQ' | 'CQ' | 'SHORT' | 'PASSAGE_MCQ';

export interface QuestionImportOption {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
  isCorrect: boolean;
}

export interface QuestionImportSubPart {
  label: string;
  prompt: string;
  marks: number;
  answerGuide?: string | null;
  sortOrder: number;
}

export interface QuestionImportRow {
  rowNumber: number;
  type: QuestionImportType;
  prompt: string;
  promptPreview: string;
  difficulty: Difficulty;
  year?: number | null;
  tags: string[];
  explanation?: string | null;
  answer?: string | null;
  options?: QuestionImportOption[];
  subParts?: QuestionImportSubPart[];
  passageKey?: string;
  passageTitle?: string | null;
  passageContent?: string;
}

export interface QuestionImportError {
  rowNumber: number;
  field: string;
  message: string;
  raw?: Record<string, unknown>;
}

export interface QuestionImportPreview {
  folderId: string;
  validCount: number;
  invalidCount: number;
  rows: QuestionImportRow[];
  errors: QuestionImportError[];
}

export interface QuestionImportCommitResult {
  createdCount: number;
  passageCount: number;
  skippedCount: number;
  questionIds: string[];
  passageIds: string[];
}

export interface QuestionImportJobStatusPayload {
  id: string;
  status: string;
  totalRows: number;
  processedRows: number;
  createdCount: number;
  passageCount: number;
  errorCount: number;
  errors: { row: number; message: string }[];
  failureReason: string | null;
  finished: boolean;
  originalName: string | null;
  folderId: string;
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
