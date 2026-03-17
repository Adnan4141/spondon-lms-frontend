import { apiRequest } from '../api';

export interface SmsPricing {
  pricePerSms: number;
  minPurchase: number;
}

export const getSmsPricing = () => apiRequest<{ success: boolean; data: SmsPricing }>('/sms-purchase/pricing');

export const setSmsPricing = (data: { pricePerSms: number; minPurchase: number }) =>
  apiRequest<any>('/sms-purchase/pricing', {
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
  apiRequest<{ success: boolean; data: { GatewayPageURL: string; tranId: string; totalAmount: number } }>(
    '/sms-purchase/initiate',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

export const verifySmsPurchase = (tranId: string, body?: Record<string, unknown>) =>
  apiRequest<any>('/sms-purchase/verify', {
    method: 'POST',
    body: JSON.stringify(body || { tran_id: tranId }),
  });

export const getSmsTransactions = (params?: { scope?: string; branchId?: string; status?: string; page?: number; limit?: number }) => {
  const q = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
  return apiRequest<any>(`/sms-purchase/transactions${q ? `?${q}` : ''}`);
};
