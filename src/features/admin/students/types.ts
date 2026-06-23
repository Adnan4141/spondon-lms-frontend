import type { Enrollment as ApiEnrollment } from '@/lib/api/enrollments';

export type StudentsListPagination = {
  page: number;
  limit: number;
  total: number | null;
  pages: number;
  hasMore?: boolean;
};

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
  profileImage?: string | null;
  fatherName?: string;
  motherName?: string;
  fatherMobile?: string;
  motherMobile?: string;
  dob?: string;
  bloodGroup?: string;
  gender?: string;
  sscGpa?: string;
  hscGpa?: string;
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
  offerPrice?: number | string | null;
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
  programName?: string;
  branchId: string;
  status: string;
  source?: string;
  accessStatus?: string;
  accessBlockedAt?: string | null;
  accessBlockedReason?: string | null;
  accessHoldExempt?: boolean;
  billingType: 'MONTHLY' | 'ONE_TIME';
  monthlyDiscount: number;
  billingStartMonth: string;
  billingEndMonth?: string;
  courses: EnrolledCourse[];
}

export interface Invoice {
  id: string;
  invoiceNumber?: string | null;
  month: string;
  billingType?: 'MONTHLY' | 'ONE_TIME';
  programId?: string;
  programName?: string;
  displayPeriod?: string;
  isDuePaymentInvoice?: boolean;
  amount: number;
  paidAmount: number;
  status: 'PAID' | 'DUE' | 'WAIVED' | 'PARTIAL';
  displayStatus?: 'PAID' | 'PAID_WITH_WAIVER' | 'WAIVED' | 'PARTIALLY_WAIVED' | 'PARTIAL' | 'SETTLED' | 'DUE' | 'CANCELLED';
  displayLabel?: string;
  waivedAmount?: number;
  discountAmount?: number;
  settlementAmount?: number;
  dueDate: string;
  branchName?: string;
  items?: {
    title: string;
    refId?: string | null;
    unitPrice: number;
    qty: number;
    type?: string;
    grossAmount?: number;
    discountAmount?: number;
    waivedAmount?: number;
    settlementAmount?: number;
    payableAmount?: number;
    paidAmount?: number;
    dueAmount?: number;
    lineStatus?: 'PAID' | 'PAID_WITH_WAIVER' | 'WAIVED' | 'PARTIALLY_WAIVED' | 'PARTIAL' | 'SETTLED' | 'DUE' | 'CANCELLED';
    waiverReason?: string | null;
    waivedByUserId?: string | null;
    waivedAt?: string | null;
    allocationPriority?: number;
    installmentNumber?: number | null;
    totalInstallments?: number | null;
  }[];
}

export interface CourseWithDiscount extends Course {
  discount: number;
}

export interface SelCourseState {
  checked: boolean;
  batch?: string;
  startMonth?: string;
  endMonth?: string;
}

export type BranchOption = { id: string; name: string };
export type ApiEnrollmentLike = ApiEnrollment;
