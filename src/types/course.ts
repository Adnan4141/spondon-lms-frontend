// Course types based on Prisma schema
export type CourseType = 'ONLINE' | 'OFFLINE';
export type BillingType = 'ONE_TIME' | 'MONTHLY';
export type CourseCategory = 'SSC' | 'HSC' | 'ADMISSION' | 'JUNIOR_CADET_JOB';
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramDto {
  name: string;
  description?: string;
  thumbnail?: string;
}

export interface UpdateProgramDto {
  name?: string;
  description?: string;
  thumbnail?: string;
}

export interface Course {
  id: string;
  programId: string;
  name: string;
  code: string;
  thumbnail?: string;
  type: CourseType;
  billingType: BillingType;
  category?: CourseCategory;
  fee: number | string;
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
  code: string;
  thumbnail?: string;
  type: CourseType;
  billingType: BillingType;
  fee: number;
  description?: string;
  outline?: JsonValue;
  featured?: boolean;
  websiteVisible?: boolean;
  admissionStatus?: AdmissionStatus;
  status?: CourseStatus;
  settledOptionEnabled?: boolean;
}

export interface UpdateCourseDto {
  programId?: string;
  name?: string;
  code?: string;
  thumbnail?: string;
  type?: CourseType;
  billingType?: BillingType;
  fee?: number;
  description?: string;
  outline?: JsonValue;
  featured?: boolean;
  websiteVisible?: boolean;
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

export interface CourseDetails extends Course {
  batches?: CourseDetailBatch[];
  teachers?: CourseDetailTeacher[];
  enrollments?: CourseDetailEnrollment[];
}

export interface GetCoursesParams {
  programId?: string;
  status?: CourseStatus;
  websiteVisible?: boolean;
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
