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

export interface RevenuePaymentRow {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  trxId?: string | null;
  paidAt: string;
  student: {
    id: string;
    fullName: string;
    mobile: string;
    registrationNumber?: string | null;
  };
  branch: {
    id: string;
    name: string;
  };
  collectionBranch?: {
    id: string;
    name: string;
  } | null;
  billingBranch?: {
    id: string;
    name: string;
  } | null;
}

export interface RevenueSummaryResponse {
  success: boolean;
  data: RevenueSummaryData[];
  totals: {
    totalAmount: number;
    totalTransactions: number;
  };
  transactions?: RevenuePaymentRow[];
}

export interface EnrollmentReportParams {
  programId?: string;
  courseId?: string;
  branchId?: string;
  from?: string;
  to?: string;
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
  from?: string;
  to?: string;
  branchId?: string;
  /** ALL | PAID | PARTIAL | UNPAID — filters by selected course line allocation status */
  paymentStatus?: string;
}

export interface CourseTransactionData {
  id: string;
  invoiceId: string;
  invoiceNumber?: string | null;
  studentUserId: string;
  branchId: string;
  month: string | null;
  status: string;
  createdAt: string;
  nextPaymentDueDate?: string | null;
  gracePeriodEnd?: string | null;
  gross: number;
  discount: number;
  net: number;
  paid: number;
  due: number;
  collectionPercent: number;
  progressLabel: string;
  courseStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  student?: {
    id: string;
    fullName: string;
    mobile?: string;
    registrationNumber?: string | null;
  };
  branch?: {
    id: string;
    name: string;
  };
  /** Legacy aliases used by older UI */
  selectedCourseAmount?: number;
  selectedCoursePaid?: number;
  selectedCourseDue?: number;
}

export interface CourseTransactionTotals {
  gross: number;
  discount: number;
  netPayable: number;
  paid: number;
  due: number;
  collectionPercent: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
}

export interface CourseTransactionResponse {
  success: boolean;
  data: CourseTransactionData[];
  totals?: CourseTransactionTotals;
}

export interface SystemStatsData {
  students: number;
  teachers: number;
  courses: number;
  contents: number;
}

export interface SystemStatsResponse {
  success: boolean;
  data: SystemStatsData;
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
  if (params?.from) queryParams.append('from', params.from);
  if (params?.to) queryParams.append('to', params.to);

  const query = queryParams.toString();
  return apiRequest<EnrollmentReportResponse>(`/reports/enrollments${query ? `?${query}` : ''}`);
}

export async function getCourseTransactions(
  params: CourseTransactionParams
): Promise<CourseTransactionResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append('courseId', params.courseId);
  if (params.from) queryParams.append('from', params.from);
  if (params.to) queryParams.append('to', params.to);
  if (params.branchId) queryParams.append('branchId', params.branchId);
  if (params.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);

  return apiRequest<CourseTransactionResponse>(`/reports/course-transactions?${queryParams.toString()}`);
}

export async function getSystemStats(): Promise<SystemStatsResponse> {
  return apiRequest<SystemStatsResponse>('/reports/stats');
}

// ─── Book Sales Report ────────────────────────────────────────────────────────

export interface BookSalesParams {
  branchId?: string;
  from?: string;
  to?: string;
}

export interface BookStockEntry {
  branchId: string;
  branchName: string;
  qty: number;
}

export interface BookSalesRow {
  bookId: string;
  bookName: string;
  sku: string;
  unitPrice: number;
  totalQty: number;
  totalRevenue: number;
  saleCount: number;
  stocks: BookStockEntry[];
  totalStock: number;
}

export interface BookSalesResponse {
  success: boolean;
  data: BookSalesRow[];
  totals: { totalRevenue: number; totalQtySold: number };
}

export async function getBookSalesReport(params?: BookSalesParams): Promise<BookSalesResponse> {
  const q = new URLSearchParams();
  if (params?.branchId) q.append('branchId', params.branchId);
  if (params?.from) q.append('from', params.from);
  if (params?.to) q.append('to', params.to);
  const qs = q.toString();
  return apiRequest<BookSalesResponse>(`/reports/book-sales${qs ? `?${qs}` : ''}`);
}

// ─── Due Summary ──────────────────────────────────────────────────────────────

export interface DueSummaryParams {
  branchId?: string;
  month?: string;
  status?: string;
  from?: string;
  to?: string;
}

export interface DueSummaryRow {
  branchId: string;
  branchName: string;
  invoiceCount: number;
  totalPayable: number;
  totalPaid: number;
  totalDue: number;
}

export interface DueSummaryStudentRow {
  studentUserId: string;
  fullName: string;
  mobile: string;
  registrationNumber?: string | null;
  branchId: string;
  branchName: string;
  invoiceCount: number;
  totalPayable: number;
  totalPaid: number;
  totalDue: number;
}

export interface DueSummaryResponse {
  success: boolean;
  data: DueSummaryRow[];
  studentSummaries?: DueSummaryStudentRow[];
  totals: { totalPayable: number; totalPaid: number; totalDue: number };
}

export async function getDueSummary(params?: DueSummaryParams): Promise<DueSummaryResponse> {
  const q = new URLSearchParams();
  if (params?.branchId) q.append('branchId', params.branchId);
  if (params?.month) q.append('month', params.month);
  if (params?.status) q.append('status', params.status);
  if (params?.from) q.append('from', params.from);
  if (params?.to) q.append('to', params.to);
  const qs = q.toString();
  return apiRequest<DueSummaryResponse>(`/reports/due-summary${qs ? `?${qs}` : ''}`);
}

// ─── Ledger Summary ───────────────────────────────────────────────────────────

export interface LedgerSummaryParams {
  from?: string;
  to?: string;
  branchId?: string;
}

export interface LedgerSummaryRow {
  accountId: string;
  accountName: string;
  accountType: string;
  accountCode: string;
  entryType: string;
  total: number;
}

export interface LedgerTypeSummary {
  type: string;
  income: number;
  expense: number;
  net: number;
}

export interface LedgerSummaryResponse {
  success: boolean;
  data: LedgerSummaryRow[];
  summary: LedgerTypeSummary[];
}

export async function getLedgerSummary(params?: LedgerSummaryParams): Promise<LedgerSummaryResponse> {
  const q = new URLSearchParams();
  if (params?.from) q.append('from', params.from);
  if (params?.to) q.append('to', params.to);
  if (params?.branchId) q.append('branchId', params.branchId);
  const qs = q.toString();
  return apiRequest<LedgerSummaryResponse>(`/reports/ledger-summary${qs ? `?${qs}` : ''}`);
}
