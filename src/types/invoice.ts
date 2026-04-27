export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIAL' | 'CANCELLED' | 'WAIVED';
export type InvoiceItemType = 'COURSE' | 'BOOK' | 'FEE' | 'ADMISSION_FEE' | 'OTHER';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  type: InvoiceItemType;
  refId?: string | null;
  title: string;
  qty: number;
  unitPrice: number | string;
  lineTotal: number | string;
  payableAmount?: number | string;
  paidAmount?: number | string;
  dueAmount?: number | string;
  allocationPriority?: number;
  /** Mid-month cancellation / revision — line excluded from active subtotal in UI */
  cancelled?: boolean;
  proRatedFrom?: string | null;
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
  replacedInvoiceId?: string | null;
  month?: string | null;
  status: InvoiceStatus;
  totalAmount: number | string;
  discountAmount: number | string;
  discountReference?: string | null;
  monthlyDiscountAmount?: number | string;
  payableAmount: number | string;
  paidAmount: number | string;
  dueAmount: number | string;
  nextPaymentDueDate?: string | null;
  issuedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    fullName: string;
    email?: string | null;
    mobile: string;
    studentProfile?: { registrationNumber?: string | null } | null;
  };
  branch?: {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    vatRegNo?: string | null;
  };
  replacedInvoice?: {
    id: string;
    status: string;
  } | null;
  replacement?: {
    id: string;
    status: string;
  } | null;
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
