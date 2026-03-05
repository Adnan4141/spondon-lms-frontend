// Question types based on Prisma schema
export type QuestionType = 'MCQ' | 'CQ';
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
    code: string;
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
  courseId?: string;
  name: string;
  parentFolderId?: string;
}

export interface UpdateQuestionFolderDto {
  name?: string;
  courseId?: string;
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
