import { apiRequest } from '../api';

export interface RevenueSummaryParams {
  period?: 'daily' | 'monthly' | 'yearly';
  branchId?: string;
  courseId?: string;
  from?: string;
  to?: string;
}

export interface RevenueSummaryData {
  bucket: string;
  amount: number;
}

export interface RevenueSummaryResponse {
  success: boolean;
  data: RevenueSummaryData[];
  totals: {
    totalAmount: number;
    totalTransactions: number;
  };
}

export interface EnrollmentReportParams {
  programId?: string;
  courseId?: string;
  branchId?: string;
}

export interface EnrollmentReportData {
  programId: string;
  programName: string;
  courseId: string;
  courseName: string;
  enrollmentCount: number;
  perStudentPay: number;
  estimatedPayable: number;
}

export interface EnrollmentReportResponse {
  success: boolean;
  data: EnrollmentReportData[];
}

export interface CourseTransactionParams {
  courseId: string;
}

export interface CourseTransactionData {
  id: string;
  studentId: string;
  branchId: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  createdAt: string;
  student?: {
    id: string;
    fullName: string;
  };
  branch?: {
    id: string;
    name: string;
  };
  items?: any[];
  payments?: any[];
}

export interface CourseTransactionResponse {
  success: boolean;
  data: CourseTransactionData[];
}

export async function getRevenueSummary(
  params?: RevenueSummaryParams
): Promise<RevenueSummaryResponse> {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append('period', params.period);
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.from) queryParams.append('from', params.from);
  if (params?.to) queryParams.append('to', params.to);

  const query = queryParams.toString();
  return apiRequest<RevenueSummaryResponse>(`/reports/revenue${query ? `?${query}` : ''}`);
}

export async function getEnrollmentReport(
  params?: EnrollmentReportParams
): Promise<EnrollmentReportResponse> {
  const queryParams = new URLSearchParams();
  if (params?.programId) queryParams.append('programId', params.programId);
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.branchId) queryParams.append('branchId', params.branchId);

  const query = queryParams.toString();
  return apiRequest<EnrollmentReportResponse>(`/reports/enrollments${query ? `?${query}` : ''}`);
}

export async function getCourseTransactions(
  params: CourseTransactionParams
): Promise<CourseTransactionResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append('courseId', params.courseId);

  return apiRequest<CourseTransactionResponse>(`/reports/course-transactions?${queryParams.toString()}`);
}
