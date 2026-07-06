import { apiRequest } from '../api';

export interface RevenueSummaryParams {
  period?: 'daily' | 'monthly' | 'yearly';
  branchId?: string;
  courseId?: string;
  programId?: string;
  itemType?: 'COURSE' | 'BOOK' | 'ADMISSION_FEE' | 'FEE' | 'OTHER';
  view?: 'grouped' | 'allocation' | 'payment';
  month?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number | 'all';
}

export interface RevenueSummaryData {
  bucket: string;
  amount: number;
}

export interface RevenuePaymentRow {
  id: string;
  paymentId: string;
  invoiceId: string;
  invoiceNumber?: string | null;
  amount: number;
  paymentTotal: number;
  method: string;
  trxId?: string | null;
  paidAt: string;
  itemType?: string | null;
  itemTitle?: string | null;
  programId?: string | null;
  programName?: string | null;
  courseId?: string | null;
  courseName?: string | null;
  courseIds: string[];
  itemTypes: string[];
  programIds: string[];
  programNames: string[];
  enrollmentSource?: 'ADMIN' | 'STUDENT_SELF' | null;
  student: {
    id: string;
    fullName: string;
    mobile: string;
    registrationNumber?: string | null;
  };
  branch?: {
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

export interface AdmissionFeeProgramSummary {
  programId: string;
  programName: string;
  totalAmount: number;
  paymentCount: number;
}

export interface AdmissionFeeSummary {
  totalAmount: number;
  paymentCount: number;
  byProgram: AdmissionFeeProgramSummary[];
}

export interface PaymentTypeBreakdown {
  type: string;
  label: string;
  amount: number;
  lineCount: number;
}

export interface ReportPaymentDetailAllocation {
  id: string;
  amount: number;
  itemType: string;
  itemTitle: string;
  programId: string | null;
  programName: string | null;
  courseId: string | null;
  courseName: string | null;
  lineTotal: number;
}

export interface ReportPaymentDetailOtherPayment {
  id: string;
  amount: number;
  method: string;
  trxId: string | null;
  paidAt: string;
}

export interface ReportPaymentDetail {
  payment: {
    id: string;
    amount: number;
    method: string;
    trxId: string | null;
    paidAt: string;
    receivedBy: { id: string; fullName: string } | null;
    collectionBranch: { id: string; name: string } | null;
  };
  invoice: {
    id: string;
    invoiceNumber: string | null;
    status: string;
    month: string | null;
    type: string;
    totalAmount: number;
    discountAmount: number;
    payableAmount: number;
    paidAmount: number;
    dueAmount: number;
    issuedAt: string | null;
    billingBranch: { id: string; name: string };
  };
  student: {
    id: string;
    fullName: string;
    mobile: string;
    email: string | null;
    registrationNumber: string | null;
  };
  enrollmentSource: 'ADMIN' | 'STUDENT_SELF' | null;
  allocations: ReportPaymentDetailAllocation[];
  otherPaymentsOnInvoice: ReportPaymentDetailOtherPayment[];
}

export interface ReportPaymentDetailResponse {
  success: boolean;
  data: ReportPaymentDetail;
  message?: string;
}

export interface RevenueSummaryResponse {
  success: boolean;
  data: RevenueSummaryData[];
  totals: {
    totalAmount: number;
    totalTransactions: number;
  };
  transactions?: RevenuePaymentRow[];
  admissionFeeSummary?: AdmissionFeeSummary;
  typeBreakdown?: PaymentTypeBreakdown[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
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
  search?: string;
  /** ALL | PAID | PARTIAL | UNPAID | WAIVED — legacy, ignored by collection report */
  paymentStatus?: string;
  page?: number;
  /** Number or `'all'` to fetch every matching row (export / bulk SMS). */
  limit?: number | 'all';
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
  lastPaymentDate?: string | null;
  nextPaymentDueDate?: string | null;
  gracePeriodEnd?: string | null;
  gross: number;
  discount: number;
  waived?: number;
  net: number;
  paid: number;
  due: number;
  collectionPercent: number;
  progressLabel: string;
  courseStatus: 'PAID' | 'PARTIAL' | 'UNPAID' | 'WAIVED';
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
  collected: number;
  transactionCount: number;
  netPayable: number;
  gross: number;
  discount: number;
  /** @deprecated use collected */
  paid?: number;
}

export interface CourseTransactionResponse {
  success: boolean;
  message?: string;
  data: CourseTransactionData[];
  totals?: CourseTransactionTotals;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
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
  if (params?.programId) queryParams.append('programId', params.programId);
  if (params?.itemType) queryParams.append('itemType', params.itemType);
  if (params?.view) queryParams.append('view', params.view);
  if (params?.month) queryParams.append('month', params.month);
  if (params?.search?.trim()) queryParams.append('search', params.search.trim());
  if (params?.from) queryParams.append('from', params.from);
  if (params?.to) queryParams.append('to', params.to);
  if (params?.page && params.page > 1) queryParams.append('page', String(params.page));
  if (params?.limit === 'all') {
    queryParams.append('limit', 'all');
  } else if (params?.limit) {
    queryParams.append('limit', String(params.limit));
  }

  const query = queryParams.toString();
  return apiRequest<RevenueSummaryResponse>(`/reports/revenue${query ? `?${query}` : ''}`);
}

export async function getReportPaymentDetail(paymentId: string): Promise<ReportPaymentDetailResponse> {
  return apiRequest<ReportPaymentDetailResponse>(`/reports/payments/${encodeURIComponent(paymentId)}`);
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
  if (params.search?.trim()) queryParams.append('search', params.search.trim());
  if (params.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
  if (params.page && params.page > 1) queryParams.append('page', String(params.page));
  if (params.limit === 'all') {
    queryParams.append('limit', 'all');
  } else if (params.limit) {
    queryParams.append('limit', String(params.limit));
  }

  return apiRequest<CourseTransactionResponse>(`/reports/course-transactions?${queryParams.toString()}`);
}

export async function getSystemStats(): Promise<SystemStatsResponse> {
  return apiRequest<SystemStatsResponse>('/reports/stats');
}

// ─── Dashboard Summary (aggregated) ───────────────────────────────────────────

export interface DashboardSummaryParams {
  from?: string;
  to?: string;
  bookFrom?: string;
  bookTo?: string;
  branchId?: string;
}

export interface DashboardSummaryData {
  stats: SystemStatsData;
  revenue: {
    buckets: RevenueSummaryData[];
    totalAmount: number;
    totalTransactions: number;
  };
  due: {
    totals: { totalPayable: number; totalPaid: number; totalDue: number };
    data: DueSummaryRow[];
    topBranches: DueSummaryRow[];
  };
  enrollments: {
    data: EnrollmentReportData[];
    activeCount: number;
    topCourses: EnrollmentReportData[];
  };
  bookSales: {
    data: BookSalesRow[];
    totals: { totalRevenue: number; totalQtySold: number };
    topBooks: BookSalesRow[];
  };
}

export interface DashboardSummaryResponse {
  success: boolean;
  data: DashboardSummaryData;
}

export async function getDashboardSummary(
  params?: DashboardSummaryParams,
): Promise<DashboardSummaryResponse> {
  const q = new URLSearchParams();
  if (params?.from) q.append('from', params.from);
  if (params?.to) q.append('to', params.to);
  if (params?.bookFrom) q.append('bookFrom', params.bookFrom);
  if (params?.bookTo) q.append('bookTo', params.bookTo);
  if (params?.branchId) q.append('branchId', params.branchId);
  const qs = q.toString();
  return apiRequest<DashboardSummaryResponse>(`/reports/dashboard-summary${qs ? `?${qs}` : ''}`);
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
  search?: string;
  page?: number;
  limit?: number | 'all';
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
  courseSummary?: string | null;
  programSummary?: string | null;
  nextDueDate?: string | null;
}

export interface DueSummaryResponse {
  success: boolean;
  message?: string;
  data: DueSummaryRow[];
  studentSummaries?: DueSummaryStudentRow[];
  totals: { totalPayable: number; totalPaid: number; totalDue: number };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export async function getDueSummary(params?: DueSummaryParams): Promise<DueSummaryResponse> {
  const q = new URLSearchParams();
  if (params?.branchId) q.append('branchId', params.branchId);
  if (params?.month) q.append('month', params.month);
  if (params?.status) q.append('status', params.status);
  if (params?.from) q.append('from', params.from);
  if (params?.to) q.append('to', params.to);
  if (params?.search?.trim()) q.append('search', params.search.trim());
  if (params?.page && params.page > 1) q.append('page', String(params.page));
  if (params?.limit === 'all') {
    q.append('limit', 'all');
  } else if (params?.limit) {
    q.append('limit', String(params.limit));
  }
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
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export interface LedgerTypeSummary {
  type: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
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
