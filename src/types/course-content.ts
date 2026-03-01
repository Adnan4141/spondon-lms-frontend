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
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    name: string;
    code: string;
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
}

export interface UpdateCourseContentDto {
  type?: ContentType;
  title?: string;
  fileUrl?: string;
  textBody?: string;
  isFree?: boolean;
  sortOrder?: number;
}

export interface CourseOutline {
  totalClasses?: number;
  duration?: string; // e.g., "3 months", "6 weeks"
  instructor?: string;
  schedule?: string;
  prerequisites?: string[];
}
