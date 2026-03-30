export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIAL' | 'CANCELLED' | 'SETTLED';
export type InvoiceItemType = 'COURSE' | 'BOOK' | 'FEE' | 'OTHER';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  type: InvoiceItemType;
  refId?: string | null;
  title: string;
  qty: number;
  unitPrice: number | string;
  lineTotal: number | string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  method: string;
  amount: number | string;
  trxId?: string | null;
  paidAt: string;
  receivedByUserId?: string | null;
  receivedBy?: {
    id: string;
    fullName: string;
  } | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  studentUserId: string;
  branchId: string;
  month?: string | null;
  status: InvoiceStatus;
  totalAmount: number | string;
  discountAmount: number | string;
  discountReference?: string | null;
  scholarshipAmount: number | string;
  payableAmount: number | string;
  paidAmount: number | string;
  dueAmount: number | string;
  issuedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    fullName: string;
    email?: string | null;
    mobile: string;
  };
  branch?: {
    id: string;
    name: string;
  };
  items?: InvoiceItem[];
  payments?: Payment[];
  _count?: {
    items?: number;
    payments?: number;
  };
}

export interface CreateInvoiceDto {
  studentUserId: string;
  branchId: string;
  month?: string;
  status?: InvoiceStatus;
  discountAmount?: number;
  scholarshipAmount?: number;
  items: CreateInvoiceItemDto[];
}

export interface CreateInvoiceItemDto {
  type: InvoiceItemType;
  refId?: string;
  title: string;
  qty: number;
  unitPrice: number;
}

export interface UpdateInvoiceDto {
  status?: InvoiceStatus;
  discountAmount?: number;
  scholarshipAmount?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
