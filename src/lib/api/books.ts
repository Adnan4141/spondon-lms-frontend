import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/course';

export interface Book {
  id: string;
  name: string;
  sku: string;
  price: number;
  centralQty?: number;
  mrp?: number | null;
  author?: string | null;
  description?: string | null;
  isEbook: boolean;
  featured?: boolean;
  fileUrl?: string | null;
  thumbnailUrl?: string | null;
  createdAt: string;
  programId?: string | null;
  program?: { id: string; name: string } | null;
  categoryId?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  courseBooks?: CourseBook[];
  collaborators?: Array<
    BookCollaborator & {
      user?: { id: string; fullName: string; email?: string; mobile?: string; profileImage?: string | null; role?: string };
    }
  >;
  _count?: {
    stocks?: number;
    saleItems?: number;
  };
}

export interface CourseBook {
  id: string;
  courseId: string;
  bookId: string;
  isFree: boolean;
  book: Book;
  course?: { id: string; name: string; slug?: string | null };
}

export interface BookCollaborator {
  id: string;
  bookId: string;
  userId: string;
  role: 'UPLOADER' | 'EDITOR' | 'VIEWER' | string;
  revenueSharePercent?: number | null;
  createdAt: string;
}

export interface BookStock {
  id: string;
  bookId: string;
  branchId: string;
  stockQty: number;
  updatedAt: string;
  book?: {
    id: string;
    name: string;
    sku: string;
    price: number;
    isEbook: boolean;
  };
  branch?: {
    id: string;
    name: string;
  };
}

export interface BookSaleDelivery {
  id: string;
  recipientName: string;
  phone: string;
  address: string;
  city?: string | null;
  postalCode?: string | null;
  deliveryStatus?: string;
  trackingNumber?: string | null;
  notes?: string | null;
}

export interface BookSale {
  id: string;
  branchId: string;
  studentUserId?: string | null;
  invoiceId?: string | null;
  sellingPointType?: StockLocationType;
  sellingPointId?: string | null;
  sellingPointName?: string | null;
  totalAmount: number;
  soldAt: string;
  createdAt: string;
  items?: BookSaleItem[];
  delivery?: BookSaleDelivery | null;
  student?: {
    id: string;
    fullName: string;
    mobile: string;
  };
  branch?: {
    id: string;
    name: string;
  };
}

export interface BookSaleItem {
  id: string;
  saleId: string;
  bookId: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  book?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface CreateBookDto {
  name: string;
  sku: string;
  price: number;
  centralQty?: number;
  mrp?: number;
  author?: string;
  description?: string;
  isEbook?: boolean;
  featured?: boolean;
  fileUrl?: string;
  thumbnailUrl?: string;
  programId?: string;
  categoryId?: string | null;
}

export interface UpdateBookDto {
  name?: string;
  sku?: string;
  price?: number;
  centralQty?: number;
  mrp?: number;
  author?: string;
  description?: string;
  isEbook?: boolean;
  featured?: boolean;
  fileUrl?: string;
  thumbnailUrl?: string;
  programId?: string | null;
  categoryId?: string | null;
}

export interface CreateBookStockDto {
  bookId: string;
  branchId: string;
  stockQty: number;
  remarks?: string;
}

export interface BookSaleDeliveryDto {
  recipientName: string;
  phone: string;
  address: string;
  city?: string;
  postalCode?: string;
  notes?: string;
}

export interface CreateBookSaleDto {
  branchId: string;
  sellingPointType?: StockLocationType;
  sellingPointId?: string;
  sellingPointName?: string;
  studentUserId?: string;
  invoiceId?: string;
  items: Array<{
    bookId: string;
    qty: number;
    unitPrice: number;
  }>;
  /** Saved as BookDelivery; use for shipping / contact after offline sale + invoice */
  delivery?: BookSaleDeliveryDto;
}

export async function getBooks(params?: {
  isEbook?: boolean;
  featured?: boolean;
  programId?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<Book[]>> {
  const queryParams = new URLSearchParams();
  if (params?.isEbook !== undefined) queryParams.append('isEbook', String(params.isEbook));
  if (params?.featured !== undefined) queryParams.append('featured', String(params.featured));
  if (params?.programId) queryParams.append('programId', params.programId);
  if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const query = queryParams.toString();
  return apiRequest<ApiResponse<Book[]>>(`/books${query ? `?${query}` : ''}`);
}

/** Marketing-safe catalog (no admin-only fields) */
export async function getPublicBooksCatalog(params?: {
  isEbook?: boolean;
  featured?: boolean;
  categoryId?: string;
  limit?: number;
}): Promise<ApiResponse<PublicCatalogBook[]>> {
  const queryParams = new URLSearchParams();
  if (params?.isEbook !== undefined) queryParams.append('isEbook', String(params.isEbook));
  if (params?.featured !== undefined) queryParams.append('featured', String(params.featured));
  if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params?.limit) queryParams.append('limit', String(params.limit));
  const query = queryParams.toString();
  return apiRequest<ApiResponse<PublicCatalogBook[]>>(`/books/public-list${query ? `?${query}` : ''}`);
}

export interface PublicCatalogBook {
  id: string;
  name: string;
  author?: string | null;
  price: number;
  thumbnailUrl?: string | null;
  isEbook: boolean;
  featured?: boolean;
  description?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string; slug: string } | null;
}

export async function getBookById(id: string): Promise<ApiResponse<Book>> {
  return apiRequest<ApiResponse<Book>>(`/books/${id}`);
}

/** Public catalog — no fileUrl; includes optional collaborators */
export async function getPublicBook(id: string): Promise<ApiResponse<PublicBook>> {
  return apiRequest<ApiResponse<PublicBook>>(`/books/public/${encodeURIComponent(id)}`);
}

export interface PublicBookCollaborator {
  role: string;
  user: { id: string; fullName: string; profileImage?: string | null };
}

export interface BookOutlineSegment {
  id: string;
  title: string;
  type: string;
  sortOrder: number;
  durationMinutes: number | null;
  isFree: boolean;
  topicTitle: string | null;
}

export interface BookOutlineChapter {
  id: string;
  title: string;
  sortOrder: number;
  segments: BookOutlineSegment[];
}

export interface BookOutlineSubject {
  id: string;
  title: string;
  sortOrder: number;
  chapters: BookOutlineChapter[];
}

export interface BookContentOutline {
  totals: {
    subjects: number;
    chapters: number;
    segments: number;
    videos: number;
    notes: number;
  };
  subjects: BookOutlineSubject[];
}

export interface PublicBook {
  id: string;
  name: string;
  sku: string;
  price: number;
  mrp?: number | null;
  author?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  isEbook: boolean;
  createdAt: string;
  categoryId?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  courseBooks?: Array<{ isFree: boolean; course: { id: string; name: string; slug?: string | null } }>;
  collaborators?: PublicBookCollaborator[];
  outline?: BookContentOutline;
}

export async function createBook(
  data: CreateBookDto,
  file?: File,
  thumbnail?: File
): Promise<ApiResponse<Book>> {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('sku', data.sku);
  formData.append('price', String(data.price));
  if (data.centralQty !== undefined) formData.append('centralQty', String(data.centralQty));
  if (data.mrp !== undefined) formData.append('mrp', String(data.mrp));
  if (data.author) formData.append('author', data.author);
  if (data.description) formData.append('description', data.description);
  if (data.isEbook !== undefined) formData.append('isEbook', String(data.isEbook));
  if (data.featured !== undefined) formData.append('featured', String(data.featured));
  if (data.fileUrl) formData.append('fileUrl', data.fileUrl);
  if (data.thumbnailUrl) formData.append('thumbnailUrl', data.thumbnailUrl);
  if (data.programId !== undefined) formData.append('programId', data.programId || '');
  if (data.categoryId !== undefined) formData.append('categoryId', data.categoryId || '');
  if (file) formData.append('file', file);
  if (thumbnail) formData.append('thumbnail', thumbnail);

  return apiRequest<ApiResponse<Book>>('/books', {
    method: 'POST',
    body: formData,
    headers: {},
  });
}

export async function updateBook(
  id: string,
  data: UpdateBookDto,
  file?: File,
  thumbnail?: File
): Promise<ApiResponse<Book>> {
  const formData = new FormData();
  if (data.name) formData.append('name', data.name);
  if (data.sku) formData.append('sku', data.sku);
  if (data.price !== undefined) formData.append('price', String(data.price));
  if (data.centralQty !== undefined) formData.append('centralQty', String(data.centralQty));
  if (data.mrp !== undefined) formData.append('mrp', String(data.mrp));
  if (data.author) formData.append('author', data.author);
  if (data.description) formData.append('description', data.description);
  if (data.isEbook !== undefined) formData.append('isEbook', String(data.isEbook));
  if (data.featured !== undefined) formData.append('featured', String(data.featured));
  if (data.fileUrl) formData.append('fileUrl', data.fileUrl);
  if (data.thumbnailUrl) formData.append('thumbnailUrl', data.thumbnailUrl);
  if (data.programId !== undefined) formData.append('programId', data.programId || '');
  if (data.categoryId !== undefined) formData.append('categoryId', data.categoryId || '');
  if (file) formData.append('file', file);
  if (thumbnail) formData.append('thumbnail', thumbnail);

  return apiRequest<ApiResponse<Book>>(`/books/${id}`, {
    method: 'PUT',
    body: formData,
    headers: {},
  });
}

export async function deleteBook(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/books/${id}`, {
    method: 'DELETE',
  });
}

export async function getBookStock(params?: {
  branchId?: string;
  bookId?: string;
}): Promise<ApiResponse<BookStock[]>> {
  const queryParams = new URLSearchParams();
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.bookId) queryParams.append('bookId', params.bookId);

  const query = queryParams.toString();
  return apiRequest<ApiResponse<BookStock[]>>(`/books/stock${query ? `?${query}` : ''}`);
}

export async function updateBookStock(data: CreateBookStockDto): Promise<ApiResponse<BookStock>> {
  return apiRequest<ApiResponse<BookStock>>('/books/stock', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getBookSales(params?: {
  branchId?: string;
  studentUserId?: string;
  invoiceId?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<BookSale[]>> {
  const queryParams = new URLSearchParams();
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.studentUserId) queryParams.append('studentUserId', params.studentUserId);
  if (params?.invoiceId) queryParams.append('invoiceId', params.invoiceId);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const query = queryParams.toString();
  return apiRequest<ApiResponse<BookSale[]>>(`/books/sales${query ? `?${query}` : ''}`);
}

export async function createBookSale(data: CreateBookSaleDto): Promise<ApiResponse<BookSale>> {
  return apiRequest<ApiResponse<BookSale>>('/books/sales', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCourseBooks(courseId: string): Promise<ApiResponse<CourseBook[]>> {
  return apiRequest<ApiResponse<CourseBook[]>>(`/books/course/${courseId}`);
}

export async function linkBookToCourse(data: { courseId: string; bookId: string; isFree?: boolean }): Promise<ApiResponse<CourseBook>> {
  return apiRequest<ApiResponse<CourseBook>>('/books/course/link', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function unlinkBookFromCourse(courseId: string, bookId: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/books/course/${courseId}/${bookId}`, {
    method: 'DELETE',
  });
}

export async function addBookCollaborator(data: {
  bookId: string;
  userId: string;
  role: string;
  revenueSharePercent?: number;
}): Promise<ApiResponse<BookCollaborator>> {
  return apiRequest<ApiResponse<BookCollaborator>>('/books/collaborator', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export type BulkCollaboratorItem = {
  userId: string;
  role: string;
  revenueSharePercent?: number;
};

export type BulkCollaboratorResult = {
  success: boolean;
  message: string;
  data: { userId: string; success: boolean; error?: string }[];
};

export async function addBookCollaboratorsBulk(
  bookId: string,
  collaborators: BulkCollaboratorItem[],
): Promise<ApiResponse<BulkCollaboratorResult>> {
  return apiRequest<ApiResponse<BulkCollaboratorResult>>(`/books/${encodeURIComponent(bookId)}/collaborators/bulk`, {
    method: 'POST',
    body: JSON.stringify({ collaborators }),
  });
}

export async function removeBookCollaborator(bookId: string, userId: string): Promise<ApiResponse<{ message?: string }>> {
  return apiRequest<ApiResponse<{ message?: string }>>(
    `/books/collaborator/${encodeURIComponent(bookId)}/${encodeURIComponent(userId)}`,
    { method: 'DELETE' }
  );
}

export interface OnlineOrder extends BookSale {
  invoice?: { id: string; status: string; paidAmount?: number; dueAmount?: number } | null;
}

export async function getOnlineOrders(params?: {
  deliveryStatus?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<OnlineOrder[]>> {
  const q = new URLSearchParams();
  if (params?.deliveryStatus) q.append('deliveryStatus', params.deliveryStatus);
  if (params?.page) q.append('page', String(params.page));
  if (params?.limit) q.append('limit', String(params.limit));
  const qs = q.toString();
  return apiRequest<ApiResponse<OnlineOrder[]>>(`/books/orders/online${qs ? `?${qs}` : ''}`);
}

export type DeliveryStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export async function updateDeliveryStatus(saleId: string, data: {
  deliveryStatus: DeliveryStatus;
  trackingNumber?: string;
  notes?: string;
}): Promise<ApiResponse<BookSaleDelivery>> {
  return apiRequest<ApiResponse<BookSaleDelivery>>(`/books/delivery/${encodeURIComponent(saleId)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export interface CollaboratorRevenueItem {
  collaboratorId: string;
  userId: string;
  user: { id: string; fullName: string; email: string; mobile?: string | null };
  role: string;
  revenueSharePercent: number;
  netRevenue: number;
  payableAmount: number;
}

export interface CollaboratorRevenueSummary {
  bookId: string;
  period: { from: string | null; to: string | null };
  netRevenue: number;
  totalAllocatedPercent: number;
  totalPayable: number;
  collaborators: CollaboratorRevenueItem[];
  invoiceItemCount: number;
}

export async function getCollaboratorRevenue(
  bookId: string,
  params?: { from?: string; to?: string },
): Promise<ApiResponse<CollaboratorRevenueSummary>> {
  const q = new URLSearchParams();
  if (params?.from) q.append('from', params.from);
  if (params?.to) q.append('to', params.to);
  const qs = q.toString();
  return apiRequest<ApiResponse<CollaboratorRevenueSummary>>(
    `/books/${encodeURIComponent(bookId)}/collaborator-revenue${qs ? `?${qs}` : ''}`,
  );
}

export async function updateCollaboratorRevShare(
  bookId: string,
  userId: string,
  revenueSharePercent: number,
): Promise<ApiResponse<BookCollaborator>> {
  return apiRequest<ApiResponse<BookCollaborator>>(
    `/books/${encodeURIComponent(bookId)}/collaborator/${encodeURIComponent(userId)}/revshare`,
    {
      method: 'PUT',
      body: JSON.stringify({ revenueSharePercent }),
    },
  );
}

// ─── Book Distribution ────────────────────────────────────────────────────────

export interface BookDistribution {
  id: string;
  bookId: string;
  fromBranchId?: string | null;
  toBranchId?: string | null;
  channelId?: string | null;
  quantity: number;
  note?: string | null;
  distributedAt: string;
  createdByUserId?: string | null;
  book?: { id: string; name: string; sku: string };
  toBranch?: { id: string; name: string };
  channel?: { id: string; name: string; type?: DistributionChannelType };
}

export type StockSourceType = 'VENDOR' | 'PRESS' | 'HEAD_OFFICE' | 'BRANCH' | 'INTERNAL_UNIT' | 'OTHER';
export type DistributionChannelType = 'BRANCH' | 'VENDOR' | 'TEACHER' | 'EVENT' | 'MARKETING' | 'OTHER';
export type StockLocationType = 'CENTRAL' | 'BRANCH' | 'CHANNEL' | 'SOURCE' | 'CUSTOMER' | 'OTHER';
export type BookStockMovementType = 'RECEIVE' | 'TRANSFER' | 'DISTRIBUTE' | 'SALE' | 'RETURN' | 'ADJUSTMENT';

export interface StockSource {
  id: string;
  name: string;
  type: StockSourceType;
  contactPerson?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DistributionChannel {
  id: string;
  name: string;
  type: DistributionChannelType;
  contactPerson?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockLocationPayload {
  type: StockLocationType;
  id?: string;
  name?: string;
}

export interface BookStockMovement {
  id: string;
  bookId: string;
  movementType: BookStockMovementType;
  quantity: number;
  sourceType?: StockLocationType | null;
  sourceId?: string | null;
  sourceName?: string | null;
  destinationType?: StockLocationType | null;
  destinationId?: string | null;
  destinationName?: string | null;
  sourceBalanceAfter?: number | null;
  destinationBalanceAfter?: number | null;
  movementDate: string;
  remarks?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  createdByUserId?: string | null;
  createdAt: string;
  book?: { id: string; name: string; sku: string };
}

export interface StockSummaryBook extends CentralStockBook {
  distributedQty: number;
  channelDistributedQty: number;
  soldQty: number;
  totalCurrentStock: number;
}

export interface BookCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: { books?: number };
}

export async function getBookCategories(): Promise<ApiResponse<BookCategory[]>> {
  return apiRequest<ApiResponse<BookCategory[]>>('/book-categories');
}

export async function createBookCategory(data: {
  name: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
}): Promise<ApiResponse<BookCategory>> {
  return apiRequest<ApiResponse<BookCategory>>('/book-categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBookCategory(id: string, data: {
  name?: string;
  slug?: string;
  description?: string | null;
  sortOrder?: number;
}): Promise<ApiResponse<BookCategory>> {
  return apiRequest<ApiResponse<BookCategory>>(`/book-categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteBookCategory(id: string): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/book-categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export interface CentralStockBook {
  id: string;
  name: string;
  sku: string;
  price: number;
  centralQty: number;
  branchStock: { branchId: string; branchName: string; qty: number }[];
  totalBranchStock: number;
}

export async function getCentralStock(): Promise<{ success: boolean; data: CentralStockBook[] }> {
  return apiRequest('/books/stock/central');
}

export async function getStockSources(params?: { includeInactive?: boolean }): Promise<ApiResponse<StockSource[]>> {
  const q = new URLSearchParams();
  if (params?.includeInactive) q.append('includeInactive', 'true');
  const qs = q.toString();
  return apiRequest<ApiResponse<StockSource[]>>(`/books/stock-sources${qs ? `?${qs}` : ''}`);
}

export async function createStockSource(data: Partial<StockSource> & { name: string }): Promise<ApiResponse<StockSource>> {
  return apiRequest<ApiResponse<StockSource>>('/books/stock-sources', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateStockSource(id: string, data: Partial<StockSource>): Promise<ApiResponse<StockSource>> {
  return apiRequest<ApiResponse<StockSource>>(`/books/stock-sources/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function updateStockSourceStatus(id: string, isActive: boolean): Promise<ApiResponse<StockSource>> {
  return apiRequest<ApiResponse<StockSource>>(`/books/stock-sources/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export async function getDistributionChannels(params?: { includeInactive?: boolean }): Promise<ApiResponse<DistributionChannel[]>> {
  const q = new URLSearchParams();
  if (params?.includeInactive) q.append('includeInactive', 'true');
  const qs = q.toString();
  return apiRequest<ApiResponse<DistributionChannel[]>>(`/books/distribution-channels${qs ? `?${qs}` : ''}`);
}

export async function createDistributionChannel(data: Partial<DistributionChannel> & { name: string }): Promise<ApiResponse<DistributionChannel>> {
  return apiRequest<ApiResponse<DistributionChannel>>('/books/distribution-channels', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateDistributionChannel(id: string, data: Partial<DistributionChannel>): Promise<ApiResponse<DistributionChannel>> {
  return apiRequest<ApiResponse<DistributionChannel>>(`/books/distribution-channels/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function updateDistributionChannelStatus(id: string, isActive: boolean): Promise<ApiResponse<DistributionChannel>> {
  return apiRequest<ApiResponse<DistributionChannel>>(`/books/distribution-channels/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export async function getBookStockMovements(params?: {
  bookId?: string;
  branchId?: string;
  channelId?: string;
  sourceId?: string;
  movementType?: BookStockMovementType | 'ALL';
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data: BookStockMovement[]; total: number; page: number; limit: number; totalPages: number }> {
  const q = new URLSearchParams();
  if (params?.bookId) q.append('bookId', params.bookId);
  if (params?.branchId) q.append('branchId', params.branchId);
  if (params?.channelId) q.append('channelId', params.channelId);
  if (params?.sourceId) q.append('sourceId', params.sourceId);
  if (params?.movementType) q.append('movementType', params.movementType);
  if (params?.from) q.append('from', params.from);
  if (params?.to) q.append('to', params.to);
  if (params?.page) q.append('page', String(params.page));
  if (params?.limit) q.append('limit', String(params.limit));
  const qs = q.toString();
  return apiRequest(`/books/stock/movements${qs ? `?${qs}` : ''}`);
}

export async function createBookStockMovement(data: {
  bookId: string;
  movementType: BookStockMovementType;
  quantity: number;
  source?: StockLocationPayload;
  destination?: StockLocationPayload;
  movementDate?: string;
  remarks: string;
}): Promise<ApiResponse<BookStockMovement>> {
  return apiRequest<ApiResponse<BookStockMovement>>('/books/stock/movements', { method: 'POST', body: JSON.stringify(data) });
}

export async function getBookStockSummary(params?: { bookId?: string }): Promise<{
  success: boolean;
  data: StockSummaryBook[];
  recentMovements: BookStockMovement[];
  totals: { centralQty: number; branchQty: number; distributedQty: number; channelDistributedQty: number; soldQty: number };
}> {
  const q = new URLSearchParams();
  if (params?.bookId) q.append('bookId', params.bookId);
  const qs = q.toString();
  return apiRequest(`/books/stock/summary${qs ? `?${qs}` : ''}`);
}

export async function getDistributions(params?: {
  bookId?: string;
  toBranchId?: string;
  channelId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data: BookDistribution[]; total: number; totalPages: number }> {
  const q = new URLSearchParams();
  if (params?.bookId) q.append('bookId', params.bookId);
  if (params?.toBranchId) q.append('toBranchId', params.toBranchId);
  if (params?.channelId) q.append('channelId', params.channelId);
  if (params?.from) q.append('from', params.from);
  if (params?.to) q.append('to', params.to);
  if (params?.page) q.append('page', String(params.page));
  if (params?.limit) q.append('limit', String(params.limit));
  const qs = q.toString();
  return apiRequest(`/books/distributions${qs ? `?${qs}` : ''}`);
}

export async function createDistribution(data: {
  bookId: string;
  toBranchId?: string;
  channelId?: string;
  quantity: number;
  note?: string;
  createdByUserId?: string;
}): Promise<{ success: boolean; data: BookDistribution; message?: string }> {
  return apiRequest('/books/distributions', { method: 'POST', body: JSON.stringify(data) });
}

export interface DistributionSummaryBookRow {
  bookId: string;
  _sum: { quantity?: number | null };
  _count: number;
  book?: { id: string; name: string; sku: string };
}

export interface DistributionSummaryBranchRow {
  toBranchId: string | null;
  _sum: { quantity?: number | null };
  _count: number;
  branch?: { id: string; name: string };
}

export interface DistributionSummaryChannelRow {
  channelId: string | null;
  _sum: { quantity?: number | null };
  _count: number;
  channel?: { id: string; name: string };
}

export async function getDistributionSummary(params?: {
  bookId?: string;
  branchId?: string;
  channelId?: string;
}): Promise<{
  success: boolean;
  data: {
    byBook: DistributionSummaryBookRow[];
    byBranch: DistributionSummaryBranchRow[];
    byChannel: DistributionSummaryChannelRow[];
  };
}> {
  const q = new URLSearchParams();
  if (params?.bookId) q.append('bookId', params.bookId);
  if (params?.branchId) q.append('branchId', params.branchId);
  if (params?.channelId) q.append('channelId', params.channelId);
  const qs = q.toString();
  return apiRequest(`/books/distributions/summary${qs ? `?${qs}` : ''}`);
}

export async function reorderBooks(items: { id: string; displayOrder: number }[]): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>('/books/reorder', {
    method: 'PATCH',
    body: JSON.stringify(items),
  });
}
