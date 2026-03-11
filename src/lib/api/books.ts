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

export interface BookSale {
  id: string;
  branchId: string;
  studentUserId?: string | null;
  invoiceId?: string | null;
  totalAmount: number;
  soldAt: string;
  createdAt: string;
  items?: BookSaleItem[];
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

export interface CreateBookSaleDto {
  branchId: string;
  studentUserId?: string;
  invoiceId?: string;
  items: Array<{
    bookId: string;
    qty: number;
    unitPrice: number;
  }>;
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

export async function getBookById(id: string): Promise<ApiResponse<Book>> {
  return apiRequest<ApiResponse<Book>>(`/books/${id}`);
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
