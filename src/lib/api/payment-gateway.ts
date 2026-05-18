import { apiRequest } from '../api';

export const initInvoicePayment = (invoiceId: string) =>
  apiRequest<{ success: boolean; data: { GatewayPageURL: string; bkashURL?: string; paymentID?: string; tranId: string; invoiceId: string; amount: number } }>(
    '/payment-gateway/invoice/init',
    {
      method: 'POST',
      body: JSON.stringify({ invoiceId }),
    }
  );

export const initSelfCheckoutPayment = (orderId: string) =>
  apiRequest<{
    success: boolean;
    data: {
      GatewayPageURL: string;
      bkashURL?: string;
      paymentID?: string;
      tranId: string;
      orderId: string;
      amount: number;
    };
  }>(`/payment-gateway/self-checkout/${encodeURIComponent(orderId)}/init`, {
    method: 'POST',
  });
