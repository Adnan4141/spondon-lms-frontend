export type CurriculumNodeType = 'SUBJECT' | 'CHAPTER' | 'LESSON';

export type LessonResourceType =
  | 'VIDEO'
  | 'NOTE'
  | 'PDF'
  | 'QUIZ'
  | 'ASSIGNMENT'
  | 'LIVE'
  | 'LINK'
  | 'SAMPLE'
  | 'OTHER';

export type CurriculumVisibility = 'VISIBLE' | 'HIDDEN' | 'DRAFT';

export interface LessonResourceRow {
  id: string;
  lessonId: string;
  type: LessonResourceType;
  title: string;
  fileUrl?: string | null;
  externalUrl?: string | null;
  isFree: boolean;
  downloadAllowed: boolean;
  sortOrder: number;
  durationMinutes?: number | null;
  visibility?: CurriculumVisibility;
  publishAt?: string | null;
  scheduledAt?: string | null;
  isRequired?: boolean;
  thumbnailUrl?: string | null;
}

export interface CurriculumTreeNode {
  id: string;
  courseId: string;
  parentId: string | null;
  type: CurriculumNodeType;
  sortOrder: number;
  title: string;
  description?: string | null;
  visibility: CurriculumVisibility;
  icon?: string | null;
  estimatedClasses?: number | null;
  assignedTeacherUserId?: string | null;
  durationMinutes?: number | null;
  isFreePreview: boolean;
  publishAt?: string | null;
  children: CurriculumTreeNode[];
  resources: LessonResourceRow[];
  resourceCount?: number;
}
