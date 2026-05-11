import { apiRequest } from '../api';
import type { ApiResponse, StudentResults } from '@/types/academic';
import type { Book } from './books';
import type { MyBookPurchaseRow } from '@/components/student/MyBookPurchasesPanel';

export async function getMyCourses(studentUserId: string): Promise<ApiResponse<unknown[]>> {
  return apiRequest<ApiResponse<unknown[]>>(`/student-portal/my-courses/${studentUserId}`);
}

export async function getStudentResults(studentUserId: string): Promise<ApiResponse<StudentResults>> {
  return apiRequest<ApiResponse<StudentResults>>(`/student-portal/results/${studentUserId}`);
}

export async function getAcademicRecordSummary(
  studentUserId: string,
  courseId?: string,
): Promise<
  ApiResponse<{
    records: unknown[];
    computedSummaries: Array<{
      courseId: string;
      course: { id: string; name: string; slug?: string } | null;
      totalExams: number;
      avgPercentage: number;
      bestPercentage: number;
      worstPercentage: number;
      source: string;
    }>;
  }>
> {
  const q = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
  return apiRequest(`/student-portal/academic-record/${encodeURIComponent(studentUserId)}${q}`);
}

export async function checkEnrollment(studentUserId: string, courseId: string): Promise<ApiResponse<{ enrolled: boolean; enrollmentId?: string }>> {
  return apiRequest<ApiResponse<{ enrolled: boolean; enrollmentId?: string }>>(`/student-portal/check-enrollment/${studentUserId}/${encodeURIComponent(courseId)}`);
}

export async function getPortalBooks(): Promise<ApiResponse<Book[]>> {
  return apiRequest<ApiResponse<Book[]>>('/student-portal/all-books');
}

export async function getMyBookPurchases(
  studentUserId: string
): Promise<ApiResponse<MyBookPurchaseRow[]>> {
  return apiRequest<ApiResponse<MyBookPurchaseRow[]>>(
    `/student-portal/my-book-purchases/${encodeURIComponent(studentUserId)}`
  );
}

export async function getRoutine(studentUserId: string): Promise<ApiResponse<unknown[]>> {
  return apiRequest<ApiResponse<unknown[]>>(`/student-portal/routine/${encodeURIComponent(studentUserId)}`);
}

export async function getCourseContentsWithProgress(
  courseId: string,
  studentUserId: string
): Promise<ApiResponse<unknown[]>> {
  return apiRequest<ApiResponse<unknown[]>>(
    `/student-portal/course-contents/${encodeURIComponent(courseId)}/${encodeURIComponent(studentUserId)}`
  );
}

export async function updateContentProgress(data: {
  studentUserId: string;
  contentId?: string;
  lessonResourceId?: string;
  completed?: boolean;
  progressPercent?: number;
}): Promise<ApiResponse<unknown>> {
  return apiRequest<ApiResponse<unknown>>('/student-portal/course-progress', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export type BookPurchaseDelivery = {
  recipientName: string;
  phone: string;
  address: string;
  city?: string;
  postalCode?: string;
  notes?: string;
};

export type BookAccessData = {
  authenticated: boolean;
  hasAccess: boolean;
  canPurchase?: boolean;
  isEbook: boolean;
  isFreePrice?: boolean;
  reason: string;
  readUrl?: string | null;
  sale?: { id: string; soldAt: string } | null;
  delivery?: {
    recipientName: string;
    phone: string;
    address: string;
    city?: string | null;
    postalCode?: string | null;
    deliveryStatus?: string;
    notes?: string | null;
  } | null;
  invoice?: { id: string; status: string; dueAmount: number } | null;
};

export async function getBookAccess(bookId: string, studentUserId?: string): Promise<ApiResponse<BookAccessData>> {
  const q = studentUserId ? `?studentUserId=${encodeURIComponent(studentUserId)}` : '';
  return apiRequest<ApiResponse<BookAccessData>>(`/student-portal/book-access/${encodeURIComponent(bookId)}${q}`);
}

export async function purchaseBook(data: {
  studentUserId: string;
  bookId: string;
  branchId?: string;
  delivery: BookPurchaseDelivery;
}): Promise<ApiResponse<{ id: string }>> {
  return apiRequest<ApiResponse<{ id: string }>>('/student-portal/purchase-book', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** API response format: { success, message?, data? } */
export type EnrollCourseDelivery = {
  recipientName: string;
  phone: string;
  address: string;
  city?: string;
  postalCode?: string;
  notes?: string;
};

export type FinancialDashboardInvoice = {
  id: string;
  month?: string | null;
  status: string;
  totalAmount: number;
  discountAmount: number;
  payableAmount: number;
  paidAmount: number;
  dueAmount: number;
  issuedAt?: string | null;
  createdAt: string;
  branch?: { id: string; name: string } | null;
  items: Array<{
    id: string;
    type: string;
    title: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  payments: Array<{
    id: string;
    method: string;
    amount: number;
    trxId?: string | null;
    paidAt: string;
  }>;
  pdfUrl: string;
};

export interface FinancialDashboardData {
  enrollments: Array<{
    id: string;
    status: string;
    courseId: string;
    courseName: string;
    courseCode: string;
    courseType: 'ONLINE' | 'OFFLINE';
    billingType: 'ONE_TIME' | 'MONTHLY';
    courseFee: number;
    programName?: string;
    batch?: {
      id: string;
      name: string;
      status: string;
      startDate?: string | null;
      endDate?: string | null;
      capacity?: number | null;
      _count?: { enrollments: number };
    } | null;
    branch?: { id: string; name: string } | null;
    billingStartMonth?: string | null;
    billingEndMonth?: string | null;
    monthlyDiscount?: number | null;
    oneTimeDiscount?: number | null;
    createdAt: string;
  }>;
  paymentHistory: FinancialDashboardInvoice[];
  programPayments?: Array<{
    programId: string;
    programName: string;
    billingType: 'ONE_TIME' | 'MONTHLY';
    enrollmentId: string;
    status: string;
    branch?: { id: string; name: string } | null;
    courses: Array<{
      id: string;
      name: string;
      type?: string;
      batch?: {
        id: string;
        name: string;
        status: string;
        startDate?: string | null;
        endDate?: string | null;
        capacity?: number | null;
      } | null;
    }>;
    payableAmount: number;
    paidAmount: number;
    dueAmount: number;
    invoices: FinancialDashboardInvoice[];
    monthGroups: Array<{
      month: string;
      payableAmount: number;
      paidAmount: number;
      dueAmount: number;
      status: string;
      invoices: FinancialDashboardInvoice[];
    }>;
  }>;
  summary: {
    totalEnrollments: number;
    activeEnrollments: number;
    waitlistedEnrollments: number;
    totalInvoices: number;
    totalPaid: number;
    totalDue: number;
  };
}

export async function getFinancialDashboard(studentUserId: string): Promise<ApiResponse<FinancialDashboardData>> {
  return apiRequest<ApiResponse<FinancialDashboardData>>(
    `/student-portal/financial-dashboard/${encodeURIComponent(studentUserId)}`
  );
}

export async function enrollInCourse(data: {
  courseId: string;
  branchId?: string;
  batchId?: string;
  includeBookIds?: string[];
  delivery?: EnrollCourseDelivery;
}): Promise<ApiResponse<{
  enrollmentId?: string;
  enrollment: unknown;
  invoice: { id: string; totalAmount?: number; payableAmount?: number; dueAmount?: number };
  quote?: {
    courseFee: number;
    booksTotal: number;
    admissionFee: number;
    payableTotal: number;
    currency: string;
  };
}>> {
  return apiRequest('/student-portal/enroll-course', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
