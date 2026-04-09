// Course types based on Prisma schema
export type CourseType = 'ONLINE' | 'OFFLINE';
export type BillingType = 'ONE_TIME' | 'MONTHLY';
export type CourseCategory = 'SSC' | 'HSC' | 'ADMISSION' | 'JUNIOR_CADET_JOB' | 'JOB';
export type AdmissionStatus = 'OPEN' | 'CLOSED';
export type CourseStatus = 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export interface Program {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  admissionFeeEnabled?: boolean;
  admissionFeeAmount?: number | null;
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
  admissionFeeEnabled?: boolean;
  admissionFeeAmount?: number | null;
}

export interface UpdateProgramDto {
  name?: string;
  description?: string;
  thumbnail?: string;
  admissionFeeEnabled?: boolean;
  admissionFeeAmount?: number | null;
}

export interface Course {
  id: string;
  programId: string;
  name: string;
  slug: string;
  code: string;
  thumbnail?: string;
  type: CourseType;
  billingType: BillingType;
  category?: CourseCategory;
  fee: number | string;
  offerDiscountAmount?: number | string | null;
  offerDiscountNote?: string | null;
  description?: string;
  outline?: JsonValue;
  featured: boolean;
  websiteVisible: boolean;
  enrollmentVisible: boolean;
  branchAccessMode: string;
  admissionStatus: AdmissionStatus;
  status: CourseStatus;
  settledOptionEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  program?: Program;
  _count?: {
    enrollments?: number;
    batches?: number;
  };
}

export interface CreateCourseDto {
  programId: string;
  name: string;
  slug: string;
  code: string;
  thumbnail?: string;
  type: CourseType;
  billingType: BillingType;
  fee: number;
  offerDiscountAmount?: number | null;
  offerDiscountNote?: string | null;
  description?: string;
  outline?: JsonValue;
  featured?: boolean;
  websiteVisible?: boolean;
  enrollmentVisible?: boolean;
  admissionStatus?: AdmissionStatus;
  status?: CourseStatus;
  settledOptionEnabled?: boolean;
}

export interface UpdateCourseDto {
  programId?: string;
  name?: string;
  slug?: string;
  code?: string;
  thumbnail?: string;
  type?: CourseType;
  billingType?: BillingType;
  fee?: number;
  offerDiscountAmount?: number | null;
  offerDiscountNote?: string | null;
  description?: string;
  outline?: JsonValue;
  featured?: boolean;
  websiteVisible?: boolean;
  enrollmentVisible?: boolean;
  admissionStatus?: AdmissionStatus;
  status?: CourseStatus;
  settledOptionEnabled?: boolean;
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
  linkedBooksTotal: number;
  totalWithPaidBooks: number;
}

export interface CourseDetails extends Course {
  batches?: CourseDetailBatch[];
  teachers?: CourseDetailTeacher[];
  enrollments?: CourseDetailEnrollment[];
  courseBooks?: CourseDetailCourseBook[];
  feeBreakdown?: CourseFeeBreakdown;
}

export interface GetCoursesParams {
  programId?: string;
  status?: CourseStatus;
  websiteVisible?: boolean;
  billingType?: BillingType;
  /** When set, returns courses where this user is on CourseTeacher OR CourseCollaborator. */
  teacherUserId?: string;
  page?: number;
  limit?: number;
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
