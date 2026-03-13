import { apiRequest } from '../api';

export interface SmsConfig {
  id: string;
  provider: string;
  apiKey: string;
  senderId?: string;
  nonMaskingNumber?: string;
  isActive: boolean;
}

export interface SmsTemplate {
  id: string;
  key: string;
  body: string;
  isMasking: boolean;
}

export const getSmsConfig = () => apiRequest<any>('/sms/config');
export const upsertSmsConfig = (data: Partial<SmsConfig>) => apiRequest<any>('/sms/config', {
  method: 'POST',
  body: JSON.stringify(data)
});

export const getSmsTemplates = () => apiRequest<any>('/sms/templates');
export const createSmsTemplate = (data: Partial<SmsTemplate>) => apiRequest<any>('/sms/templates', {
  method: 'POST',
  body: JSON.stringify(data)
});

export const getSmsBalance = (params?: any) => {
  const q = params ? new URLSearchParams(params).toString() : '';
  return apiRequest<any>(`/sms/balance${q ? `?${q}` : ''}`);
};

export const getProviderBalance = () => apiRequest<any>('/sms/provider-balance');

export const updateSmsBalance = (data: any) => apiRequest<any>('/sms/balance', {
  method: 'POST',
  body: JSON.stringify(data)
});

export const transferSmsBalance = (branchId: string, count: number) => apiRequest<any>('/sms/balance/transfer', {
  method: 'POST',
  body: JSON.stringify({ branchId, count })
});

export const sendDirectSms = (to: string, message: string, isMasking: boolean, branchId?: string, scope?: string) => apiRequest<any>('/sms/send-direct', {
  method: 'POST',
  body: JSON.stringify({ to, message, isMasking, branchId, scope })
});

export const getSmsLogs = (page = 1, limit = 10) => apiRequest<any>(`/sms/logs?page=${page}&limit=${limit}`);

export const getCampaigns = () => apiRequest<any>('/sms/campaigns');
export const createCampaign = (data: any) => apiRequest<any>('/sms/campaigns', {
  method: 'POST',
  body: JSON.stringify(data)
});
export const getCampaignPreview = (data: any) => apiRequest<any>('/sms/campaigns/preview', {
  method: 'POST',
  body: JSON.stringify(data)
});
export const runCampaign = (id: string, isMasking: boolean) => apiRequest<any>(`/sms/campaigns/${id}/run`, {
  method: 'POST',
  body: JSON.stringify({ isMasking })
});
