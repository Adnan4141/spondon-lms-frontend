import { apiRequest } from '../api';
import type { ApiResponse } from '@/types/course';

export interface Book {
  id: string;
  name: string;
  sku: string;
  price: number;
  author?: string | null;
  description?: string | null;
  isEbook: boolean;
  fileUrl?: string | null;
  thumbnailUrl?: string | null;
  createdAt: string;
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
  author?: string;
  description?: string;
  isEbook?: boolean;
  fileUrl?: string;
  thumbnailUrl?: string;
}

export interface UpdateBookDto {
  name?: string;
  sku?: string;
  price?: number;
  author?: string;
  description?: string;
  isEbook?: boolean;
  fileUrl?: string;
  thumbnailUrl?: string;
}

export interface CreateBookStockDto {
  bookId: string;
  branchId: string;
  stockQty: number;
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
  page?: number;
  limit?: number;
}): Promise<ApiResponse<Book[]>> {
  const queryParams = new URLSearchParams();
  if (params?.isEbook !== undefined) queryParams.append('isEbook', String(params.isEbook));
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const query = queryParams.toString();
  return apiRequest<ApiResponse<Book[]>>(`/books${query ? `?${query}` : ''}`);
}

/** Marketing-safe catalog (no admin-only fields) */
export async function getPublicBooksCatalog(params?: {
  isEbook?: boolean;
  limit?: number;
}): Promise<ApiResponse<PublicCatalogBook[]>> {
  const queryParams = new URLSearchParams();
  if (params?.isEbook !== undefined) queryParams.append('isEbook', String(params.isEbook));
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
  description?: string | null;
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
  author?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  isEbook: boolean;
  createdAt: string;
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
  if (data.author) formData.append('author', data.author);
  if (data.description) formData.append('description', data.description);
  if (data.isEbook !== undefined) formData.append('isEbook', String(data.isEbook));
  if (data.fileUrl) formData.append('fileUrl', data.fileUrl);
  if (data.thumbnailUrl) formData.append('thumbnailUrl', data.thumbnailUrl);
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
  if (data.author) formData.append('author', data.author);
  if (data.description) formData.append('description', data.description);
  if (data.isEbook !== undefined) formData.append('isEbook', String(data.isEbook));
  if (data.fileUrl) formData.append('fileUrl', data.fileUrl);
  if (data.thumbnailUrl) formData.append('thumbnailUrl', data.thumbnailUrl);
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

export async function addBookCollaborator(data: { bookId: string; userId: string; role: string }): Promise<ApiResponse<BookCollaborator>> {
  return apiRequest<ApiResponse<BookCollaborator>>('/books/collaborator', {
    method: 'POST',
    body: JSON.stringify(data),
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
