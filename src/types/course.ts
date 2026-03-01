// Course types based on Prisma schema
export type CourseType = 'ONLINE' | 'OFFLINE' | 'HYBRID';
export type BillingType = 'ONE_TIME' | 'MONTHLY';
export type CourseCategory = 'SSC' | 'HSC' | 'ADMISSION' | 'JUNIOR_CADET_JOB';
export type AdmissionStatus = 'OPEN' | 'CLOSED';
export type CourseStatus = 'ACTIVE' | 'DISABLED' | 'ARCHIVED';

export interface Program {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  programId: string;
  name: string;
  code: string;
  type: CourseType;
  billingType: BillingType;
  category?: CourseCategory;
  fee: number | string;
  description?: string;
  outline?: any;
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
  type: CourseType;
  billingType: BillingType;
  fee: number;
  description?: string;
  outline?: any;
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
  type?: CourseType;
  billingType?: BillingType;
  fee?: number;
  description?: string;
  outline?: any;
  featured?: boolean;
  websiteVisible?: boolean;
  admissionStatus?: AdmissionStatus;
  status?: CourseStatus;
  settledOptionEnabled?: boolean;
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
