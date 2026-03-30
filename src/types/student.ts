// Student types based on Prisma schema
export type UserRole = 'SUPER_ADMIN' | 'BRANCH_ADMIN' | 'ACCOUNTS' | 'TEACHER' | 'STUDENT' | 'MODERATOR';
export type UserStatus = 'ACTIVE' | 'BLOCKED';
export type InstituteType = 'SCHOOL' | 'COLLEGE' | 'UNIVERSITY';

export interface Branch {
  id: string;
  name: string;
  code?: string | null;
  address?: string | null;
  phone?: string | null;
}

export interface Institute {
  id: string;
  name: string;
  eiin?: string | null;
  district?: string | null;
  type: InstituteType;
  createdAt: string;
}

export type SmsAlertTo = 'SELF' | 'FATHER' | 'MOTHER';

export interface StudentProfile {
  id: string;
  userId: string;
  fatherName?: string | null;
  motherName?: string | null;
  fatherMobile?: string | null;
  motherMobile?: string | null;
  dob?: string | null;
  bloodGroup?: string | null;
  gender?: string | null;
  primaryMobile?: string | null;
  secondaryMobile?: string | null;
  address?: string | null;
  instituteId?: string | null;
  registrationNumber?: string | null;
  smsAlertTo?: SmsAlertTo[] | null;
  sscInfo?: any;
  hscInfo?: any;
  createdAt: string;
  updatedAt: string;
  institute?: Institute | null;
}

export interface Enrollment {
  id: string;
  studentUserId: string;
  courseId: string;
  batchId?: string | null;
  branchId: string;
  status: string;
  billingStartMonth?: string | null;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    name: string;
    code: string;
    type?: string;
    fee?: number | string;
    billingType?: string;
    program?: {
      id: string;
      name: string;
    };
  };
  batch?: {
    id: string;
    name: string;
  } | null;
}

export interface Student {
  registrationNumber: ReactNode;
  id: string;
  fullName: string;
  email?: string | null;
  mobile: string;
  role: UserRole;
  branchId?: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  branch?: Branch | null;
  studentProfile?: StudentProfile | null;
  enrollments?: Enrollment[];
  _count?: {
    enrollments?: number;
    invoices?: number;
    examAttempts?: number;
  };
}

export interface CreateStudentDto {
  fullName: string;
  email?: string;
  mobile: string;
  /** Omit for new students — server generates a one-time password. */
  password?: string;
  branchId?: string;
  status?: UserStatus;
  // Student profile fields
  fatherName?: string;
  motherName?: string;
  fatherMobile?: string;
  motherMobile?: string;
  dob?: string;
  bloodGroup?: string;
  gender?: string;
  primaryMobile?: string;
  secondaryMobile?: string;
  address?: string;
  instituteId?: string;
  /** Omit — server assigns roll / registration number. */
  registrationNumber?: string;
  smsAlertTo?: SmsAlertTo[];
  sscInfo?: any;
  hscInfo?: any;
}

/** Returned once from POST /users when the server generated login credentials. */
export type StudentCreatedWithCredentials = Student & { oneTimePassword?: string };

export interface UpdateStudentDto {
  fullName?: string;
  email?: string;
  mobile?: string;
  password?: string;
  branchId?: string;
  status?: UserStatus;
  // Student profile fields
  fatherName?: string;
  motherName?: string;
  fatherMobile?: string;
  motherMobile?: string;
  dob?: string;
  bloodGroup?: string;
  gender?: string;
  primaryMobile?: string;
  secondaryMobile?: string;
  address?: string;
  instituteId?: string;
  registrationNumber?: string;
  smsAlertTo?: SmsAlertTo[];
  sscInfo?: any;
  hscInfo?: any;
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
