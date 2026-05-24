import { apiRequest } from '../api';

export interface SmsPricing {
  id?: string;
  branchId?: string | null;
  pricePerSms: number;
  minPurchase: number;
}

export interface SmsPurchaseTransaction {
  id: string;
  tranId: string;
  scope: 'ORG' | 'BRANCH';
  branchId?: string | null;
  quantity: number;
  unitPrice: string | number;
  totalAmount: string | number;
  status: string;
  gatewayProvider?: string;
  gatewayValId?: string | null;
  createdAt: string;
  updatedAt?: string;
  branch?: { id: string; name: string } | null;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const getSmsPricing = (params?: { branchId?: string }) => {
  const q = params?.branchId ? `?branchId=${encodeURIComponent(params.branchId)}` : '';
  return apiRequest<ApiResponse<SmsPricing>>(`/sms-purchase/pricing${q}`);
};

export const setSmsPricing = (data: { branchId?: string; pricePerSms: number; minPurchase: number }) =>
  apiRequest<ApiResponse<SmsPricing>>('/sms-purchase/pricing', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const initiateSmsPurchase = (data: {
  scope?: string;
  branchId?: string;
  quantity: number;
  cusName?: string;
  cusEmail?: string;
  cusPhone?: string;
}) =>
  apiRequest<ApiResponse<{ GatewayPageURL: string; bkashURL?: string; paymentID?: string; tranId: string; totalAmount: number }>>(
    '/sms-purchase/initiate',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

export const verifySmsPurchase = (tranId: string, body?: Record<string, unknown>) =>
  apiRequest<ApiResponse<SmsPurchaseTransaction | { tranId: string; amountBdt: number }>>('/sms-purchase/verify', {
    method: 'POST',
    body: JSON.stringify(body || { tran_id: tranId }),
  });

export const getSmsTransactions = (params?: { scope?: string; branchId?: string; status?: string; page?: number; limit?: number }) => {
  const q = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
  return apiRequest<ApiResponse<SmsPurchaseTransaction[]>>(`/sms-purchase/transactions${q ? `?${q}` : ''}`);
};
