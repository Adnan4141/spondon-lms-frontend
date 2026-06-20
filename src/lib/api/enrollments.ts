import { apiRequest, API_ORIGIN } from '../api';
import type { ApiResponse } from '@/types/course';

export type EnrollmentStatusType = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED' | 'WAITLISTED' | 'PENDING_PAYMENT' | 'EXPIRED' | 'SUSPENDED';
export type EnrollmentSourceType = 'ADMIN' | 'STUDENT_SELF';
export type EnrollmentAccessStatusType = 'NO_ACCESS' | 'LIMITED_ACCESS' | 'FULL_ACCESS';

// EnrollmentCourse — child record for each course within a program enrollment
export interface EnrollmentCourse {
  id: string;
  enrollmentId: string;
  courseId: string;
  batchId?: string | null;
  includeBook: boolean;
  bookPrice?: number | string | null;
  startMonth?: string | null;
  endMonth?: string | null;
  status?: 'ACTIVE' | 'CANCELLED' | string;
  cancelEffectiveMonth?: string | null;
  addedAt: string;
  course?: {
    id: string;
    name: string;
    slug?: string;
    type?: 'ONLINE' | 'OFFLINE' | string;
    fee?: number | string;
    offerPrice?: number | string | null;
    startMonth?: string | null;
    endMonth?: string | null;
  };
  batch?: {
    id: string;
    name: string;
  } | null;
}

// Settlement — adjustment record for add/remove course
export interface Settlement {
  id: string;
  enrollmentId: string;
  type: 'ADD' | 'REMOVE' | 'ADJUST';
  adjustmentType: 'CREDIT' | 'DEBIT';
  amount: number | string;
  referenceMonth?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  studentUserId: string;
  programId: string;
  branchId: string;
  status: EnrollmentStatusType | string;
  source?: EnrollmentSourceType | string;
  accessStatus?: EnrollmentAccessStatusType | string;
  accessBlockedAt?: string | null;
  accessBlockedReason?: string | null;
  accessHoldExempt?: boolean;
  billingType?: 'ONE_TIME' | 'MONTHLY';
  billingStartMonth?: string | null;
  billingEndMonth?: string | null;
  monthlyDiscount?: number | string | null;
  oneTimeDiscount?: number | string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    fullName: string;
    email?: string | null;
    mobile: string;
  };
  program?: {
    id: string;
    name: string;
  };
  enrollmentCourses?: EnrollmentCourse[];
  settlements?: Settlement[];
  branch?: {
    id: string;
    name: string;
  };
}

export interface CourseEnrollmentItem {
  courseId: string;
  batchId?: string;
  includeBook?: boolean;
  startMonth?: string;
  endMonth?: string;
}

export interface CreateEnrollmentDto {
  studentUserId: string;
  programId: string;
  courses: CourseEnrollmentItem[];
  branchId: string;
  status?: EnrollmentStatusType;
  source?: EnrollmentSourceType;
  accessStatus?: EnrollmentAccessStatusType;
  billingStartMonth?: string; // YYYY-MM
  installmentCount?: number | null;
  installmentSchedule?: unknown;
}

export interface UpdateEnrollmentDto {
  status?: EnrollmentStatusType;
  accessStatus?: EnrollmentAccessStatusType;
  billingStartMonth?: string;
  reason?: string;
  appliedByUserId?: string;
  effectiveMonth?: string;
  monthlyDiscount?: number | null;
  oneTimeDiscount?: number | null;
}

export async function getEnrollments(params?: {
  studentUserId?: string;
  courseId?: string;
  branchId?: string;
  batchId?: string;
  teacherUserId?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<Enrollment[]>> {
  const queryParams = new URLSearchParams();
  if (params?.studentUserId) queryParams.append('studentUserId', params.studentUserId);
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.batchId) queryParams.append('batchId', params.batchId);
  if (params?.teacherUserId) queryParams.append('teacherUserId', params.teacherUserId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const query = queryParams.toString();
  return apiRequest<ApiResponse<Enrollment[]>>(`/enrollments${query ? `?${query}` : ''}`);
}

export async function getEnrollmentById(id: string): Promise<ApiResponse<Enrollment>> {
  return apiRequest<ApiResponse<Enrollment>>(`/enrollments/${id}`);
}

export async function createEnrollment(data: CreateEnrollmentDto): Promise<ApiResponse<Enrollment>> {
  return apiRequest<ApiResponse<Enrollment>>('/enrollments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEnrollment(
  id: string,
  data: UpdateEnrollmentDto,
): Promise<ApiResponse<Enrollment>> {
  return apiRequest<ApiResponse<Enrollment>>(`/enrollments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEnrollment(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/enrollments/${id}`, {
    method: 'DELETE',
  });
}

export async function fullResetEnrollment(
  id: string,
  data: { reason: string; confirmation: 'DELETE_ALL_ENROLLMENT_DATA' | string },
): Promise<ApiResponse<{ enrollmentId: string; counts: Record<string, number>; totals: Record<string, number> }>> {
  return apiRequest<ApiResponse<{ enrollmentId: string; counts: Record<string, number>; totals: Record<string, number> }>>(
    `/enrollments/${id}/full-reset`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
}

export async function cancelFullEnrollment(
  id: string,
  data: {
    reason: string;
    effectiveMonth?: string;
    cancellationPolicy?: 'FULL_REMOVE' | 'PRORATE_CURRENT' | 'CANCEL_FROM_NEXT_MONTH';
  },
): Promise<ApiResponse<{
  enrollmentId: string;
  effectiveMonth: string;
  cancellationPolicy: string;
  cancelledCourses: number;
  recalculatedInvoices: number;
}>> {
  return apiRequest<ApiResponse<{
    enrollmentId: string;
    effectiveMonth: string;
    cancellationPolicy: string;
    cancelledCourses: number;
    recalculatedInvoices: number;
  }>>(`/enrollments/${id}/cancel-full`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface EnrollmentCorrectionResetDto {
  reason: string;
  effectiveMonth: string;
  monthlyDiscount?: number | null;
  restoreCancelledCourses?: boolean;
}

export interface EnrollmentCorrectionResetResult {
  enrollmentId: string;
  effectiveMonth: string;
  monthlyDiscount: number | null;
  restoredCourses: number;
  statusChanged: boolean;
  recalculatedInvoices: number;
  invoiceRefreshFailedMonths?: string[];
  settlementCreated: boolean;
}

export async function correctionResetEnrollment(
  id: string,
  data: EnrollmentCorrectionResetDto,
): Promise<ApiResponse<EnrollmentCorrectionResetResult>> {
  return apiRequest<ApiResponse<EnrollmentCorrectionResetResult>>(`/enrollments/${id}/correction-reset`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function changeEnrollmentBatch(id: string, courseId: string, batchId: string, reason?: string): Promise<ApiResponse<Enrollment>> {
  return apiRequest<ApiResponse<Enrollment>>(`/enrollments/${id}/batch`, {
    method: 'PUT',
    body: JSON.stringify({ courseId, batchId, reason }),
  });
}

export async function changeEnrollmentBranch(id: string, branchId: string, reason?: string): Promise<ApiResponse<Enrollment>> {
  return apiRequest<ApiResponse<Enrollment>>(`/enrollments/${id}/branch`, {
    method: 'PUT',
    body: JSON.stringify({ branchId, reason }),
  });
}

export async function settleEnrollment(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/enrollments/${id}/settle`, {
    method: 'POST',
  });
}

export interface CancelPreviewInvoice {
  invoiceId: string;
  month: string;
  isAllRemoved: boolean;
  before: { total: number; discount: number; payable: number; due: number };
  after: { total: number; discount: number; payable: number; due: number };
}

export interface CancelPreviewData {
  enrollmentId: string;
  programName: string;
  isMonthly: boolean;
  courses: { courseId: string; courseName: string; fee: number; bookPrice: number | null }[];
  affectedInvoices: CancelPreviewInvoice[];
  settlements: Settlement[];
  monthlyDiscount: number;
  oneTimeDiscount: number;
}

export async function getCancelPreview(id: string): Promise<ApiResponse<CancelPreviewData>> {
  return apiRequest<ApiResponse<CancelPreviewData>>(`/enrollments/${id}/cancel-preview`);
}

export async function bulkChangeBatch(data: {
  courseId: string;
  branchId?: string;
  fromBatchId?: string;
  toBatchId: string;
  enrollmentIds?: string[];
  reason?: string;
}): Promise<ApiResponse<{ count: number }>> {
  return apiRequest<ApiResponse<{ count: number }>>('/enrollments/bulk/batch', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function regenerateRoll(id: string): Promise<ApiResponse<{ rollNumber: number }>> {
  return apiRequest<ApiResponse<{ rollNumber: number }>>(`/enrollments/${id}/regenerate-roll`, {
    method: 'POST',
  });
}

export async function suspendEnrollment(id: string, reason?: string): Promise<ApiResponse<Enrollment>> {
  return apiRequest<ApiResponse<Enrollment>>(`/enrollments/${id}/suspend`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export async function unsuspendEnrollment(id: string, reason?: string): Promise<ApiResponse<Enrollment>> {
  return apiRequest<ApiResponse<Enrollment>>(`/enrollments/${id}/unsuspend`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export type PaymentAccessViewMode = 'TO_BLOCK' | 'BLOCKED' | 'ALL_DUE';

export type BulkAccessFilters = {
  branchId?: string;
  programId?: string;
  courseId?: string;
  batchId?: string;
  dueMonth?: string;
  minDueAmount?: number;
  viewMode?: PaymentAccessViewMode;
  onlyWithAccess?: boolean;
  onlyWithoutExempt?: boolean;
  enrollmentIds?: string[];
};

export type DueAccessCandidate = Enrollment & {
  totalDue?: number;
  dueForMonth?: number;
  oldestDueMonth?: string | null;
};

export async function blockEnrollmentAccess(
  id: string,
  data: { reason: string; source?: 'DUE_PAYMENT' | 'ADMIN' | 'OTHER' },
): Promise<ApiResponse<Enrollment>> {
  return apiRequest<ApiResponse<Enrollment>>(`/enrollments/${id}/access/block`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function restoreEnrollmentAccess(
  id: string,
  data?: { reason?: string },
): Promise<ApiResponse<Enrollment>> {
  return apiRequest<ApiResponse<Enrollment>>(`/enrollments/${id}/access/restore`, {
    method: 'POST',
    body: JSON.stringify(data ?? {}),
  });
}

export async function setEnrollmentAccessExempt(
  id: string,
  data: { exempt: boolean; reason: string },
): Promise<ApiResponse<Enrollment>> {
  return apiRequest<ApiResponse<Enrollment>>(`/enrollments/${id}/access/exempt`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getDueAccessCandidates(params?: BulkAccessFilters & { page?: number; limit?: number }): Promise<
  ApiResponse<DueAccessCandidate[]> & { pagination?: { page: number; limit: number; total: number } }
> {
  const queryParams = new URLSearchParams();
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.programId) queryParams.append('programId', params.programId);
  if (params?.courseId) queryParams.append('courseId', params.courseId);
  if (params?.batchId) queryParams.append('batchId', params.batchId);
  if (params?.dueMonth) queryParams.append('dueMonth', params.dueMonth);
  if (params?.minDueAmount != null) queryParams.append('minDueAmount', String(params.minDueAmount));
  if (params?.viewMode) queryParams.append('viewMode', params.viewMode);
  if (params?.onlyWithAccess === false) queryParams.append('onlyWithAccess', 'false');
  if (params?.onlyWithoutExempt === false) queryParams.append('onlyWithoutExempt', 'false');
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));
  const query = queryParams.toString();
  return apiRequest(`/enrollments/access/due-candidates${query ? `?${query}` : ''}`);
}

export async function bulkBlockEnrollmentAccess(data: BulkAccessFilters & {
  reason: string;
  source?: 'DUE_PAYMENT' | 'ADMIN' | 'OTHER';
  dryRun?: boolean;
}): Promise<ApiResponse<{ dryRun: boolean; count: number; enrollmentIds: string[]; errors?: Array<{ enrollmentId: string; message: string }> }>> {
  return apiRequest('/enrollments/access/block-bulk', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function bulkRestoreEnrollmentAccess(data: BulkAccessFilters & {
  reason?: string;
  dryRun?: boolean;
}): Promise<ApiResponse<{ dryRun: boolean; count: number; enrollmentIds: string[]; errors?: Array<{ enrollmentId: string; message: string }> }>> {
  return apiRequest('/enrollments/access/restore-bulk', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function bulkChangeBranch(data: {
  courseId: string;
  fromBranchId?: string;
  toBranchId: string;
  enrollmentIds?: string[];
  reason?: string;
}): Promise<ApiResponse<{ count: number }>> {
  return apiRequest<ApiResponse<{ count: number }>>('/enrollments/bulk/branch', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export type PaymentMethodType = 'CASH' | 'BKASH';

export interface OfflineAdmissionCourseLine {
  courseId: string;
  batchId?: string | null;
  includeBook?: boolean;
  startMonth?: string; // "YYYY-MM" per-course enrollment start (defaults to course.startMonth on backend)
  endMonth?: string;  // "YYYY-MM" per-course enrollment end month
}

export interface OfflineAdmissionDto {
  studentUserId: string;
  programId: string;
  courses: OfflineAdmissionCourseLine[];
  branchId: string;
  billingType?: 'ONE_TIME' | 'MONTHLY';
  billingStartMonth?: string;
  paymentMethod?: PaymentMethodType;
  paymentAmount?: number;
  paymentTrxId?: string;
  /** Per-program admission fee overrides: { [programId]: overrideAmount }. If omitted, program defaults are used. */
  admissionFeeAmountOverrides?: Record<string, number>;
  receivedByUserId?: string;
  discountAmount?: number;
  discountReference?: string;
  monthlyDiscount?: number;
  oneTimeDiscount?: number;
  forceWaitlist?: boolean;
  nextPaymentDueDate?: string;
  /** Number of installments (2 or 3). Only for ONE_TIME billing. */
  installmentCount?: number;
  additionalItems?: Array<{
    type?: string;
    refId?: string;
    title?: string;
    qty?: number;
    unitPrice?: number;
  }>;
  appliedByUserId?: string;
}

export interface OfflineAdmissionResult {
  studentId: string;
  registrationNumber: string | null;
  oneTimePassword: string | null;
  enrollmentId: string;
  invoiceId: string;
  invoicePdfUrl: string | null;
  enrollment: Enrollment;
  invoice: {
    id: string;
    dueAmount: number | string;
    payableAmount: number | string;
    paidAmount: number | string;
    totalAmount: number | string;
    nextPaymentDueDate?: string | null;
    status: string;
  };
  paymentAllocationSummary?: {
    invoiceId: string;
    applied: number;
    remaining: number;
    admissionApplied: number;
    itemAllocations: Array<{
      invoiceItemId: string;
      type: string;
      refId?: string | null;
      courseId?: string | null;
      title: string;
      applied: number;
      dueBefore: number;
      dueAfter: number;
    }>;
    courseAllocations: Array<{
      invoiceItemId: string;
      courseId?: string | null;
      title: string;
      applied: number;
      dueBefore: number;
      dueAfter: number;
    }>;
  } | null;
  pdfUrl: string | null;
}

export async function offlineAdmission(
  data: OfflineAdmissionDto,
  idempotencyKey?: string,
): Promise<ApiResponse<OfflineAdmissionResult>> {
  const headers: Record<string, string> = {};
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const res = await apiRequest<ApiResponse<OfflineAdmissionResult>>('/enrollments/offline-admission', {
    method: 'POST',
    body: JSON.stringify(data),
    headers,
  });
  if (res.success && res.data?.pdfUrl?.startsWith('/')) {
    res.data.pdfUrl = `${API_ORIGIN}${res.data.pdfUrl}`;
  }
  if (res.success && res.data?.invoicePdfUrl?.startsWith('/')) {
    res.data.invoicePdfUrl = `${API_ORIGIN}${res.data.invoicePdfUrl}`;
  }
  return res;
}

export interface EnrollmentDiscountLogEntry {
  id: string;
  enrollmentId: string;
  invoiceId?: string | null;
  discountAmount: number | string;
  reference: string;
  appliedByUserId: string;
  createdAt: string;
  enrollment?: {
    id: string;
    program?: { id: string; name: string };
    enrollmentCourses?: { course?: { id: string; name: string } }[];
  };
  appliedBy?: { id: string; fullName: string } | null;
}

export async function updateMonthlyDiscount(
  enrollmentId: string,
  monthlyDiscount: number,
): Promise<ApiResponse<{ invoiceId: string | null }>> {
  return apiRequest<ApiResponse<{ invoiceId: string | null }>>(`/enrollments/${enrollmentId}/monthly-discount`, {
    method: 'PATCH',
    body: JSON.stringify({ monthlyDiscount }),
  });
}

export async function getEnrollmentDiscountHistory(
  studentUserId: string,
): Promise<ApiResponse<EnrollmentDiscountLogEntry[]>> {
  return apiRequest<ApiResponse<EnrollmentDiscountLogEntry[]>>(
    `/enrollments/discount-history?studentUserId=${encodeURIComponent(studentUserId)}`,
  );
}

export interface AdmissionFeeCheckResult {
  programId: string;
  programName: string;
  admissionFeeEnabled: boolean;
  admissionFeeAmount: number;
  alreadyPaid: boolean;
  courseFee: number;
  courseName: string;
  totalAmount: number;
}

export async function checkAdmissionFee(params: {
  studentUserId: string;
  programId?: string;
  courseId?: string;
}): Promise<ApiResponse<AdmissionFeeCheckResult>> {
  const queryParams = new URLSearchParams();
  queryParams.append('studentUserId', params.studentUserId);
  if (params.programId) queryParams.append('programId', params.programId);
  if (params.courseId) queryParams.append('courseId', params.courseId);
  return apiRequest<ApiResponse<AdmissionFeeCheckResult>>(
    `/enrollments/admission-check?${queryParams.toString()}`,
  );
}

// --- Settlements ---

export async function getSettlements(
  enrollmentId: string,
): Promise<ApiResponse<Settlement[]>> {
  return apiRequest<ApiResponse<Settlement[]>>(`/settlements/enrollment/${enrollmentId}`);
}

export async function createSettlement(
  enrollmentId: string,
  data: { type: 'ADD' | 'REMOVE' | 'ADJUST'; adjustmentType: 'CREDIT' | 'DEBIT'; amount: number; referenceMonth?: string; note?: string },
): Promise<ApiResponse<Settlement>> {
  return apiRequest<ApiResponse<Settlement>>(`/settlements/enrollment/${enrollmentId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteSettlement(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/settlements/${id}`, {
    method: 'DELETE',
  });
}

export async function addCourseToEnrollment(
  enrollmentId: string,
  body: { courseId: string; batchId?: string | null; includeBook?: boolean; startMonth?: string; endMonth?: string; effectiveMonth?: string },
): Promise<ApiResponse<EnrollmentCourse>> {
  return apiRequest<ApiResponse<EnrollmentCourse>>(`/enrollments/${enrollmentId}/courses`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function removeCourseFromEnrollment(
  enrollmentId: string,
  courseId: string,
  body?: { effectiveMonth?: string; cancellationPolicy?: 'FULL_REMOVE' | 'PRORATE' | 'NEXT_MONTH'; reason?: string },
): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<ApiResponse<{ message: string }>>(`/enrollments/${enrollmentId}/courses/${courseId}`, {
    method: 'DELETE',
    body: JSON.stringify(body ?? {}),
  });
}
