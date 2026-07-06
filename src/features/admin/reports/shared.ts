'use client';

export type TabKey = 'finance' | 'enrollment' | 'course-transactions' | 'book-sales' | 'due-collection' | 'ledger';
export type NamedEntity = { id: string; name: string };
export type BranchOption = { id: string; name: string };

export function fmtNum(n: number) {
  return new Intl.NumberFormat('en-BD').format(Math.round(n));
}

export function fmtCur(n: number) {
  return '৳ ' + fmtNum(n);
}

export function normalizeSingleDateRange(from?: string, to?: string) {
  return {
    from: from || to || undefined,
    to: to || from || undefined,
  };
}

export function exportFilename(prefix: string) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  return `${prefix}-${stamp}`;
}

export async function exportRows<Row>(args: {
  format: import('@/lib/export').ExportFormat;
  filename: string;
  sheetName: string;
  rows: Row[];
  columns: Array<{ header: string; value: (row: Row) => string | number | boolean | null | undefined }>;
}) {
  const { downloadTableExport } = await import('@/lib/export');
  await downloadTableExport(args);
}

export type CourseTransactionsQueryState = {
  courseId: string;
  branchId: string;
  from: string;
  to: string;
  search: string;
  page: number;
  limit: number;
};

export const COURSE_TRANSACTIONS_PAGE_SIZES = [25, 50, 100] as const;
const COURSE_TRANSACTIONS_DEFAULT_LIMIT = 25;

export function getCurrentMonthRange(now = new Date()) {
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const month = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return {
    month,
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function getCurrentMonthLabel(now = new Date()) {
  return now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function getNextMonthRange(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const year = d.getFullYear();
  const monthIndex = d.getMonth();
  const month = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return {
    month,
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function getNextMonthLabel(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function getLastMonthRange(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = d.getFullYear();
  const monthIndex = d.getMonth();
  const month = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function getLastMonthLabel(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export type PaymentDatePreset = 'current' | 'last';

export function isPaymentDatePresetActive(
  query: { from: string; to: string },
  preset: PaymentDatePreset,
  now = new Date(),
): boolean {
  const range = preset === 'current' ? getCurrentMonthRange(now) : getLastMonthRange(now);
  return query.from === range.from && query.to === range.to;
}

export type MonthPreset = 'current' | 'next';

export function isMonthPresetActive(
  query: { month: string; from: string; to: string },
  preset: MonthPreset,
  now = new Date(),
): boolean {
  const range = preset === 'current' ? getCurrentMonthRange(now) : getNextMonthRange(now);
  return query.month === range.month && !query.from && !query.to;
}

function parseCourseTransactionsPage(raw: string | null): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function parseCourseTransactionsLimit(raw: string | null): number {
  const n = Number(raw);
  return COURSE_TRANSACTIONS_PAGE_SIZES.includes(n as (typeof COURSE_TRANSACTIONS_PAGE_SIZES)[number])
    ? n
    : COURSE_TRANSACTIONS_DEFAULT_LIMIT;
}

export function defaultCourseTransactionsQuery(): CourseTransactionsQueryState {
  const range = getCurrentMonthRange();
  return {
    courseId: '',
    branchId: '',
    from: range.from,
    to: range.to,
    search: '',
    page: 1,
    limit: COURSE_TRANSACTIONS_DEFAULT_LIMIT,
  };
}

function resolveCourseTransactionsDateRange(from: string, to: string) {
  if (from || to) {
    return { from: from || to, to: to || from };
  }
  return getCurrentMonthRange();
}

export function parseCourseTransactionsQuery(searchParams: URLSearchParams): CourseTransactionsQueryState {
  const fromRaw = searchParams.get('from')?.trim() ?? '';
  const toRaw = searchParams.get('to')?.trim() ?? '';
  const dates = resolveCourseTransactionsDateRange(fromRaw, toRaw);
  return {
    courseId: searchParams.get('courseId')?.trim() ?? '',
    branchId: searchParams.get('branchId')?.trim() ?? '',
    from: dates.from,
    to: dates.to,
    search: searchParams.get('search')?.trim() ?? '',
    page: parseCourseTransactionsPage(searchParams.get('page')),
    limit: parseCourseTransactionsLimit(searchParams.get('limit')),
  };
}

export function buildCourseTransactionsSearchParams(state: CourseTransactionsQueryState): URLSearchParams {
  const params = new URLSearchParams();
  params.set('tab', 'course-transactions');
  if (state.courseId) params.set('courseId', state.courseId);
  if (state.branchId) params.set('branchId', state.branchId);
  const defaultRange = getCurrentMonthRange();
  if (state.from && state.from !== defaultRange.from) params.set('from', state.from);
  if (state.to && state.to !== defaultRange.to) params.set('to', state.to);
  if (state.search.trim()) params.set('search', state.search.trim());
  if (state.page > 1) params.set('page', String(state.page));
  if (state.limit !== COURSE_TRANSACTIONS_DEFAULT_LIMIT) params.set('limit', String(state.limit));
  return params;
}

export function courseTransactionsHref(state: CourseTransactionsQueryState): string {
  return `/admin/reports?${buildCourseTransactionsSearchParams(state).toString()}`;
}

export type DueCollectionInvoiceStatus = '' | 'ISSUED' | 'PARTIAL' | 'PAID' | 'DRAFT' | 'WAIVED';

export const DUE_COLLECTION_PAGE_SIZES = COURSE_TRANSACTIONS_PAGE_SIZES;
const DUE_COLLECTION_DEFAULT_LIMIT = COURSE_TRANSACTIONS_DEFAULT_LIMIT;

export type DueCollectionQueryState = {
  branchId: string;
  month: string;
  from: string;
  to: string;
  status: DueCollectionInvoiceStatus;
  search: string;
  page: number;
  limit: number;
};

function parseDueCollectionPage(raw: string | null): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function parseDueCollectionLimit(raw: string | null): number {
  const n = Number(raw);
  return DUE_COLLECTION_PAGE_SIZES.includes(n as (typeof DUE_COLLECTION_PAGE_SIZES)[number])
    ? n
    : DUE_COLLECTION_DEFAULT_LIMIT;
}

function parseDueCollectionStatus(raw: string | null): DueCollectionInvoiceStatus {
  const value = raw?.trim().toUpperCase();
  if (value === 'ISSUED' || value === 'PARTIAL' || value === 'PAID' || value === 'DRAFT' || value === 'WAIVED') {
    return value;
  }
  return '';
}

export function defaultDueCollectionQuery(): DueCollectionQueryState {
  return {
    branchId: '',
    month: '',
    from: '',
    to: '',
    status: '',
    search: '',
    page: 1,
    limit: DUE_COLLECTION_DEFAULT_LIMIT,
  };
}

export function parseDueCollectionQuery(searchParams: URLSearchParams): DueCollectionQueryState {
  return {
    branchId: searchParams.get('branchId')?.trim() ?? '',
    month: searchParams.get('month')?.trim() ?? '',
    from: searchParams.get('from')?.trim() ?? '',
    to: searchParams.get('to')?.trim() ?? '',
    status: parseDueCollectionStatus(searchParams.get('status')),
    search: searchParams.get('search')?.trim() ?? '',
    page: parseDueCollectionPage(searchParams.get('page')),
    limit: parseDueCollectionLimit(searchParams.get('limit')),
  };
}

export function buildDueCollectionSearchParams(state: DueCollectionQueryState): URLSearchParams {
  const params = new URLSearchParams();
  params.set('tab', 'due-collection');
  if (state.branchId) params.set('branchId', state.branchId);
  if (state.month) params.set('month', state.month);
  if (state.from) params.set('from', state.from);
  if (state.to) params.set('to', state.to);
  if (state.status) params.set('status', state.status);
  if (state.search.trim()) params.set('search', state.search.trim());
  if (state.page > 1) params.set('page', String(state.page));
  if (state.limit !== DUE_COLLECTION_DEFAULT_LIMIT) params.set('limit', String(state.limit));
  return params;
}

export function dueCollectionHref(state: DueCollectionQueryState): string {
  return `/admin/reports?${buildDueCollectionSearchParams(state).toString()}`;
}

export type FinancePeriod = 'daily' | 'monthly' | 'yearly';
export type FinanceView = 'grouped' | 'allocation' | 'payment';
export type FinanceItemType = '' | 'COURSE' | 'BOOK' | 'ADMISSION_FEE' | 'FEE' | 'OTHER';

export const FINANCE_PAGE_SIZES = [25, 50, 100, 200] as const;
const FINANCE_DEFAULT_LIMIT = 50;

export type FinanceQueryState = {
  period: FinancePeriod;
  branchId: string;
  programId: string;
  courseId: string;
  itemType: FinanceItemType;
  view: FinanceView;
  month: string;
  from: string;
  to: string;
  search: string;
  page: number;
  limit: number;
  paymentId: string;
};

function parseFinancePage(raw: string | null): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function parseFinanceLimit(raw: string | null): number {
  const n = Number(raw);
  return FINANCE_PAGE_SIZES.includes(n as (typeof FINANCE_PAGE_SIZES)[number]) ? n : FINANCE_DEFAULT_LIMIT;
}

function parseFinancePeriod(raw: string | null): FinancePeriod {
  if (raw === 'daily' || raw === 'monthly' || raw === 'yearly') return raw;
  return 'monthly';
}

function parseFinanceView(raw: string | null): FinanceView {
  if (raw === 'grouped' || raw === 'allocation' || raw === 'payment') return raw;
  return 'grouped';
}

function parseFinanceItemType(raw: string | null): FinanceItemType {
  const value = raw?.trim().toUpperCase();
  if (value === 'COURSE' || value === 'BOOK' || value === 'ADMISSION_FEE' || value === 'FEE' || value === 'OTHER') {
    return value;
  }
  return '';
}

function resolveFinanceDateRange(month: string, from: string, to: string) {
  if (month) {
    return { month, from: '', to: '' };
  }
  if (from || to) {
    return { month: '', from: from || to, to: to || from };
  }
  const range = getCurrentMonthRange();
  return { month: '', from: range.from, to: range.to };
}

export function defaultFinanceQuery(): FinanceQueryState {
  const range = getCurrentMonthRange();
  return {
    period: 'monthly',
    branchId: '',
    programId: '',
    courseId: '',
    itemType: '',
    view: 'grouped',
    month: '',
    from: range.from,
    to: range.to,
    search: '',
    page: 1,
    limit: FINANCE_DEFAULT_LIMIT,
    paymentId: '',
  };
}

export function parseFinanceQuery(searchParams: URLSearchParams): FinanceQueryState {
  const tab = searchParams.get('tab');
  if (tab && tab !== 'finance') {
    return defaultFinanceQuery();
  }

  const monthRaw = searchParams.get('month')?.trim() ?? '';
  const fromRaw = searchParams.get('from')?.trim() ?? '';
  const toRaw = searchParams.get('to')?.trim() ?? '';
  const dates = resolveFinanceDateRange(monthRaw, fromRaw, toRaw);

  return {
    period: parseFinancePeriod(searchParams.get('period')),
    branchId: searchParams.get('branchId')?.trim() ?? '',
    programId: searchParams.get('programId')?.trim() ?? '',
    courseId: searchParams.get('courseId')?.trim() ?? '',
    itemType: parseFinanceItemType(searchParams.get('itemType')),
    view: parseFinanceView(searchParams.get('view')),
    month: dates.month,
    from: dates.from,
    to: dates.to,
    search: searchParams.get('search')?.trim() ?? '',
    page: parseFinancePage(searchParams.get('page')),
    limit: parseFinanceLimit(searchParams.get('limit')),
    paymentId: searchParams.get('paymentId')?.trim() ?? '',
  };
}

export function buildFinanceSearchParams(state: FinanceQueryState): URLSearchParams {
  const params = new URLSearchParams();
  params.set('tab', 'finance');

  if (state.period !== 'monthly') params.set('period', state.period);
  if (state.branchId) params.set('branchId', state.branchId);
  if (state.programId) params.set('programId', state.programId);
  if (state.courseId) params.set('courseId', state.courseId);
  if (state.itemType) params.set('itemType', state.itemType);
  if (state.view !== 'grouped') params.set('view', state.view);

  if (state.month) {
    params.set('month', state.month);
  } else {
    const defaultRange = getCurrentMonthRange();
    if (state.from && state.from !== defaultRange.from) params.set('from', state.from);
    if (state.to && state.to !== defaultRange.to) params.set('to', state.to);
  }

  if (state.search.trim()) params.set('search', state.search.trim());
  if (state.page > 1) params.set('page', String(state.page));
  if (state.limit !== FINANCE_DEFAULT_LIMIT) params.set('limit', String(state.limit));
  if (state.paymentId) params.set('paymentId', state.paymentId);

  return params;
}

export function financeHref(state: FinanceQueryState): string {
  return `/admin/reports?${buildFinanceSearchParams(state).toString()}`;
}
