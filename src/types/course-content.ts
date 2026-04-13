// Course Content types based on Prisma schema
export type ContentType = 'SYLLABUS' | 'LEAFLET' | 'SAMPLE' | 'NOTE' | 'VIDEO' | 'PDF' | 'OTHER';

export interface CourseContent {
  id: string;
  courseId: string;
  type: ContentType;
  title: string;
  fileUrl?: string;
  textBody?: string;
  isFree: boolean;
  sortOrder: number;
  subjectTitle?: string | null;
  chapterTitle?: string | null;
  topicTitle?: string;
  topicSortOrder?: number;
  durationMinutes?: number;
  createdAt: string;
  updatedAt: string;
  progress?: { completed: boolean; progressPercent?: number } | null;
  course?: {
    id: string;
    name: string;
    slug?: string;
  };
}

export interface CreateCourseContentDto {
  courseId: string;
  type: ContentType;
  title: string;
  fileUrl?: string;
  textBody?: string;
  isFree?: boolean;
  sortOrder?: number;
  subjectTitle?: string;
  chapterTitle?: string;
  topicTitle?: string;
  topicSortOrder?: number;
  durationMinutes?: number;
}

export interface UpdateCourseContentDto {
  type?: ContentType;
  title?: string;
  fileUrl?: string;
  textBody?: string;
  isFree?: boolean;
  sortOrder?: number;
  subjectTitle?: string;
  chapterTitle?: string;
  topicTitle?: string;
  topicSortOrder?: number;
  durationMinutes?: number;
}

export interface CourseOutline {
  totalClasses?: number;
  duration?: string; // e.g., "3 months", "6 weeks"
  instructor?: string;
  schedule?: string;
  prerequisites?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
