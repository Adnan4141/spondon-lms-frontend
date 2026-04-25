import type { CourseContent, ContentType } from '@/types/course-content';

export interface SubjectGroup { name: string; chapters: ChapterGroup[]; }
export interface ChapterGroup { name: string; items: CourseContent[]; }
export interface ContentForm {
  subjectTitle: string; chapterTitle: string; title: string;
  topicTitle: string; type: ContentType; fileUrl: string;
  textBody: string; isFree: boolean;
}

export interface CourseForm {
  name: string;
  slug: string;
  programId: string;
  grade: string;
  group: string;
  type: 'ONLINE' | 'OFFLINE';
  admissionStatus: 'OPEN' | 'CLOSED';
  status: 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
  startMonth: string;
  durationMonths: string;
  description: string;
  branchAccessMode: string;
  settledOptionEnabled: boolean;
  featured: boolean;
  websiteVisible: boolean;
  enrollmentVisible: boolean;
  heroTitle: string;
  whyTakeTitle: string;
  fee: string;
  offerPrice: string;
  bookPrice: string;
  includePrintedBooks: boolean;
  lectureCount: string;
  examCount: string;
  noteCount: string;
  bookCount: string;
}

export const EMPTY_CONTENT_FORM: ContentForm = {
  subjectTitle: '', chapterTitle: '', title: '', topicTitle: '',
  type: 'VIDEO', fileUrl: '', textBody: '', isFree: true,
};

export const EMPTY_COURSE_FORM: CourseForm = {
  name: '', slug: '', programId: '', grade: '', group: '',
  type: 'ONLINE', admissionStatus: 'OPEN', status: 'ACTIVE',
  startMonth: '', durationMonths: '', description: '',
  branchAccessMode: 'ALL_BRANCH', settledOptionEnabled: false,
  featured: false, websiteVisible: true, enrollmentVisible: true,
  heroTitle: '', whyTakeTitle: '',
  fee: '', offerPrice: '', bookPrice: '', includePrintedBooks: false,
  lectureCount: '', examCount: '', noteCount: '', bookCount: '',
};
