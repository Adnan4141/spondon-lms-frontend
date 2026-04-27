import type { CourseContent, ContentType } from '@/types/course-content';

export interface SubjectGroup { name: string; chapters: ChapterGroup[]; }
export interface ChapterGroup { name: string; items: CourseContent[]; }
export interface ContentForm {
  subjectTitle: string; chapterTitle: string; title: string;
  topicTitle: string; type: ContentType; fileUrl: string;
  textBody: string; isFree: boolean;
}

/** One row in the public course page right sidebar; persisted in `outline.sidebarFeatures`. */
export interface CourseFormSidebarFeature {
  id: string;
  label: string;
  value: string;
  icon: string;
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
  showBenefits: boolean;
  showWebsiteSections: boolean;
  showBooks: boolean;
  showSidebar: boolean;
  showTeachers: boolean;
  benefitsText: string;
  /** Heading above feature rows on `/course/[slug]`; empty = default copy. */
  sidebarTitle: string;
  sidebarFeatures: CourseFormSidebarFeature[];
  /** `outline.*` — optional overrides for section headings on the public course page. */
  booksSectionTitle: string;
  booksSectionSubtitle: string;
  teachersSectionTitle: string;
  /** Public URL or path (e.g. /uploads/course-thumbnails/...). */
  thumbnail: string;
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
  showBenefits: true, showWebsiteSections: true, showBooks: true, showSidebar: true, showTeachers: true, benefitsText: '',
  sidebarTitle: '', sidebarFeatures: [],
  booksSectionTitle: '', booksSectionSubtitle: '', teachersSectionTitle: '',
  thumbnail: '',
};
