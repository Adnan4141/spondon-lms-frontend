// Course types based on Prisma schema
import type { ContentType, CourseContent } from './course-content';

export type CourseType = 'ONLINE' | 'OFFLINE';
export type BillingType = 'ONE_TIME' | 'MONTHLY';
export type AdmissionStatus = 'OPEN' | 'CLOSED';
export type CourseStatus = 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

/** Extra blocks for the public course page (`/course/[slug]`); stored inside `Course.outline` JSON. */
export interface CourseWebsiteSection {
  id: string;
  title: string;
  /** Rich HTML from admin editor */
  bodyHtml: string;
}

export function newCourseWebsiteSectionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Parse `outline.websiteSections` from API/DB into a safe list for forms and the website. */
export function normalizeCourseWebsiteSections(raw: unknown): CourseWebsiteSection[] {
  if (!Array.isArray(raw)) return [];
  const out: CourseWebsiteSection[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === 'string' && o.id.trim() ? o.id.trim() : newCourseWebsiteSectionId();
    const title = typeof o.title === 'string' ? o.title : '';
    const bodyHtml =
      typeof o.bodyHtml === 'string'
        ? o.bodyHtml
        : typeof o.body === 'string'
          ? o.body
          : '';
    if (!title.trim() && !bodyHtml.trim()) continue;
    out.push({ id, title, bodyHtml });
  }
  return out;
}

/** Custom rows for the public course page right sidebar (above pricing); stored in `Course.outline.sidebarFeatures`. */
export interface PublicCourseSidebarFeature {
  id: string;
  icon?: string;
  label: string;
  value: string;
}

export function newPublicCourseSidebarFeatureId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `sf-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeCourseSidebarFeatures(raw: unknown): PublicCourseSidebarFeature[] {
  if (!Array.isArray(raw)) return [];
  const out: PublicCourseSidebarFeature[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === 'string' && o.id.trim() ? o.id.trim() : newPublicCourseSidebarFeatureId();
    const label = typeof o.label === 'string' ? o.label : '';
    const value = typeof o.value === 'string' ? o.value : '';
    const icon = typeof o.icon === 'string' && o.icon.trim() ? o.icon.trim() : undefined;
    if (!label.trim() && !value.trim()) continue;
    out.push({ id, label: label.trim(), value: value.trim(), icon });
  }
  return out;
}

/** Stored at `Course.outline.publicPageDisplay` — controls `/course/[slug]`. */
export const PUBLIC_CURRICULUM_CONTENT_TYPES: ContentType[] = [
  'SYLLABUS',
  'LEAFLET',
  'SAMPLE',
  'NOTE',
  'VIDEO',
  'PDF',
  'OTHER',
];

export const DEFAULT_PUBLIC_CURRICULUM_TYPES: ContentType[] = ['SYLLABUS'];

/** Fallback bullets on `/course/[slug]` when `outline.benefits` is missing (not when explicitly empty). */
export const DEFAULT_PUBLIC_COURSE_BENEFIT_BULLETS = [
  'অভিজ্ঞ শিক্ষক মন্ডলী',
  'মানসম্মত লেকচার শিট',
  'নিয়মিত মডেল টেস্ট',
  'সাপ্তাহিক সলভ ক্লাস',
];

export interface CoursePublicPageDisplay {
  showBenefits: boolean;
  showWebsiteSections: boolean;
  showBooks: boolean;
  showSidebar: boolean;
  /** Public `/course/[slug]` teachers grid; default on when unset. */
  showTeachers: boolean;
  showCurriculum: boolean;
  curriculumContentTypes: ContentType[];
}

const CURRICULUM_TYPE_LABELS: Record<ContentType, string> = {
  SYLLABUS: 'সিলেবাস',
  LEAFLET: 'লিফলেট',
  SAMPLE: 'স্যাম্পল',
  NOTE: 'নোট',
  VIDEO: 'ভিডিও',
  PDF: 'PDF',
  OTHER: 'অন্যান্য',
};

export function curriculumContentTypeLabel(type: string): string {
  if ((PUBLIC_CURRICULUM_CONTENT_TYPES as readonly string[]).includes(type)) {
    return CURRICULUM_TYPE_LABELS[type as ContentType] ?? type;
  }
  return type;
}

export function normalizeCoursePublicPageDisplay(outline: unknown): CoursePublicPageDisplay {
  const root =
    outline && typeof outline === 'object' && !Array.isArray(outline)
      ? (outline as Record<string, unknown>)
      : {};
  const raw = root.publicPageDisplay;
  const o =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

  const typesRaw = o.curriculumContentTypes;
  let curriculumContentTypes: ContentType[] = [...DEFAULT_PUBLIC_CURRICULUM_TYPES];
  if (Array.isArray(typesRaw) && typesRaw.length > 0) {
    const picked = typesRaw.filter(
      (t): t is ContentType =>
        typeof t === 'string' && (PUBLIC_CURRICULUM_CONTENT_TYPES as string[]).includes(t)
    );
    if (picked.length > 0) curriculumContentTypes = picked;
  }

  return {
    showBenefits: o.showBenefits !== false,
    showWebsiteSections: o.showWebsiteSections !== false,
    showBooks: o.showBooks !== false,
    showSidebar: o.showSidebar !== false,
    showTeachers: o.showTeachers !== false,
    showCurriculum: o.showCurriculum !== false,
    curriculumContentTypes,
  };
}

export type DeliveryMode = 'ONLINE' | 'OFFLINE';

export interface Program {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  mode?: DeliveryMode;
  admissionFeeEnabled?: boolean;
  admissionFeeAmount?: number | null;
  paymentCircle?: BillingType;
  createdAt: string;
  updatedAt: string;
  _count?: {
    courses?: number;
  };
}

export interface CreateProgramDto {
  name: string;
  description?: string;
  thumbnail?: string;
  mode?: DeliveryMode;
  admissionFeeEnabled?: boolean;
  admissionFeeAmount?: number | null;
  paymentCircle?: BillingType;
}

export interface UpdateProgramDto {
  name?: string;
  description?: string;
  thumbnail?: string;
  mode?: DeliveryMode;
  admissionFeeEnabled?: boolean;
  admissionFeeAmount?: number | null;
  paymentCircle?: BillingType;
}

export interface Course {
  id: string;
  programId: string;
  name: string;
  slug: string;
  thumbnail?: string;
  type: CourseType;
  fee: number | string;
  offerPrice?: number | string | null;
  description?: string;
  outline?: JsonValue;
  featured: boolean;
  websiteVisible: boolean;
  enrollmentVisible: boolean;
  branchAccessMode: string;
  admissionStatus: AdmissionStatus;
  status: CourseStatus;
  settledOptionEnabled: boolean;
  grade?: string | null;
  group?: string | null;
  startMonth?: string | null;    // "YYYY-MM"
  durationMonths?: number | null;
  endMonth?: string | null;      // "YYYY-MM" — system-generated
  bookPrice?: number | string | null;
  /** Lower = earlier in admin list and default API ordering. */
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
  /** Present on getCourseById: number of curriculum nodes (subjects/chapters/lessons). */
  curriculumNodeCount?: number;
  program?: Program;
  _count?: {
    enrollments?: number;
    batches?: number;
  };
}

export interface CreateCourseDto {
  programId: string;
  name: string;
  slug?: string;
  thumbnail?: string;
  type: CourseType;
  fee: number;
  offerPrice?: number | null;
  description?: string;
  outline?: JsonValue;
  featured?: boolean;
  websiteVisible?: boolean;
  enrollmentVisible?: boolean;
  admissionStatus?: AdmissionStatus;
  status?: CourseStatus;
  settledOptionEnabled?: boolean;
  branchAccessMode?: string;
  grade?: string;
  group?: string;
  startMonth?: string | null;   // "YYYY-MM"
  durationMonths?: number | null;
  bookPrice?: number | null;
}

export interface UpdateCourseDto {
  programId?: string;
  name?: string;
  slug?: string;
  thumbnail?: string;
  type?: CourseType;
  fee?: number;
  offerPrice?: number | null;
  description?: string;
  outline?: JsonValue;
  featured?: boolean;
  websiteVisible?: boolean;
  enrollmentVisible?: boolean;
  admissionStatus?: AdmissionStatus;
  status?: CourseStatus;
  settledOptionEnabled?: boolean;
  branchAccessMode?: string;
  grade?: string;
  group?: string;
  startMonth?: string | null;   // "YYYY-MM"
  durationMonths?: number | null;
  bookPrice?: number | null;
}

export interface CourseDetailBatch {
  id: string;
  name: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface CourseDetailTeacher {
  id: string;
  /** e.g. { contentUpload: true, examManage: true } */
  permissions?: Record<string, boolean> | null;
  teacher?: {
    id: string;
    fullName: string;
    email?: string | null;
    profileImage?: string | null;
    designation?: string | null;
    experienceYears?: number | null;
    institute?: string | null;
  } | null;
}

export interface CourseDetailEnrollment {
  id: string;
  student?: {
    id: string;
    fullName: string;
    email?: string | null;
  } | null;
}

/** Linked book from admin “Course books”; isFree = bundled / no extra charge */
export interface CourseDetailCourseBook {
  id: string;
  courseId: string;
  bookId: string;
  isFree: boolean;
  book: {
    id: string;
    name: string;
    sku: string;
    price: number | string;
    isEbook: boolean;
    thumbnailUrl?: string | null;
    author?: string | null;
  };
}

export interface CourseFeeBreakdown {
  courseFee: number;
  offerPrice?: number | null;
  effectivePrice?: number;
  discountPercent?: number | null;
  linkedBooksTotal: number;
  totalWithPaidBooks: number;
}

export interface CourseDetails extends Course {
  batches?: CourseDetailBatch[];
  teachers?: CourseDetailTeacher[];
  enrollments?: CourseDetailEnrollment[];
  courseBooks?: CourseDetailCourseBook[];
  feeBreakdown?: CourseFeeBreakdown;
  /** Included when loading a single course from the API (e.g. public detail page). */
  contents?: CourseContent[];
  /** Dynamic course features (icon, label, value) from CourseFeature model */
  features?: { id: string; icon?: string | null; label: string; value: string; sortOrder: number }[];
  /** Enrollment courses — limited set returned by getCourseById for stats display */
  enrollmentCourses?: { id: string }[];
}

export interface GetCoursesParams {
  programId?: string;
  status?: CourseStatus;
  websiteVisible?: boolean;
  /** Public landing / featured strip */
  featured?: boolean;
  enrollmentVisible?: boolean;
  grade?: string;
  group?: string;
  /** When set, returns courses where this user is on CourseTeacher OR CourseCollaborator. */
  teacherUserId?: string;
  page?: number;
  limit?: number;
  /** When true, request every matching course (`all=true` — backend returns unpaginated list). */
  all?: boolean;
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
