import type { Enrollment as ApiEnrollment } from '@/lib/api/enrollments';

export interface Student {
  id: string;
  regNo: string;
  fullName: string;
  mobile: string;
  email: string | null;
  status: 'ACTIVE' | 'BLOCKED';
  branchId: string;
  createdAt: string;
  _count?: { enrollments?: number };
  fatherName?: string;
  motherName?: string;
  fatherMobile?: string;
  motherMobile?: string;
  bloodGroup?: string;
  gender?: string;
  address?: string;
  smsAlertTo?: string[];
}

export interface Program {
  id: string;
  name: string;
  paymentCircle: 'MONTHLY' | 'ONE_TIME';
  admissionFeeEnabled: boolean;
  admissionFeeAmount: number;
}

export interface Course {
  id: string;
  programId: string;
  name: string;
  fee: number;
  type: 'OFFLINE' | 'ONLINE';
  startMonth: string;
  endMonth: string;
  batches: { id: string; name: string }[];
}

export interface EnrolledCourse {
  id: string;
  courseId: string;
  batchId: string | null;
  status: 'ACTIVE' | 'CANCELLED';
  startMonth: string;
  endMonth: string;
  cancelEffectiveMonth?: string | null;
  includeBook: boolean;
}

export interface Enrollment {
  id: string;
  programId: string;
  branchId: string;
  status: string;
  source?: string;
  accessStatus?: string;
  billingType: 'MONTHLY' | 'ONE_TIME';
  monthlyDiscount: number;
  billingStartMonth: string;
  courses: EnrolledCourse[];
}

export interface Invoice {
  id: string;
  month: string;
  amount: number;
  paidAmount: number;
  status: 'PAID' | 'DUE' | 'WAIVED' | 'PARTIAL';
  dueDate: string;
  branchName?: string;
  items?: {
    title: string;
    refId?: string | null;
    unitPrice: number;
    qty: number;
    type?: string;
    discountAmount?: number;
    payableAmount?: number;
    paidAmount?: number;
    dueAmount?: number;
    allocationPriority?: number;
  }[];
}

export interface CourseWithDiscount extends Course {
  discount: number;
}

export interface SelCourseState {
  checked: boolean;
  batch?: string;
  startMonth?: string;
}

export type BranchOption = { id: string; name: string };
export type ApiEnrollmentLike = ApiEnrollment;
