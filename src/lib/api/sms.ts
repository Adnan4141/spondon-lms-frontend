import { apiRequest } from '../api';

export interface SmsConfig {
  id?: string;
  scope?: 'ORG' | 'BRANCH';
  branchId?: string | null;
  provider: string;
  apiEmail?: string | null;
  apiKey: string;
  senderId?: string | null;
  nonMaskingNumber?: string | null;
  maskingRate?: number;
  nonMaskingRate?: number;
  isActive: boolean;
}

export interface SmsTemplate {
  id: string;
  key: string;
  scope: 'ORG' | 'BRANCH';
  branchId?: string | null;
  body: string;
  isMasking: boolean;
}

export interface SmsSystemSetting {
  id: string;
  type: string;
  scope: 'ORG' | 'BRANCH';
  branchId?: string | null;
  isEnabled: boolean;
  balanceSource: 'ORG' | 'BRANCH';
  isMasking: boolean;
  templateKey?: string | null;
}

export interface SmsBalance {
  id: string;
  scope: 'ORG' | 'BRANCH';
  branchId?: string | null;
  balanceCount: number | string;
  branch?: { id: string; name: string } | null;
}

export interface SmsProviderBalance {
  provider: string;
  balanceText: string | null;
  balanceBdt?: number | null;
  currency?: 'BDT';
  raw?: unknown;
  status?: 'ERROR' | 'NOT_CONFIGURED';
}

export interface BulkPreview {
  filename?: string;
  columns?: string[];
  sampleRows?: Array<Record<string, string | number | null>>;
  mobileColumn?: string;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  valid: string[];
  invalid: string[];
  duplicates: string[];
  validRecipients?: SmsRecipient[];
}

export interface ApiResponse<T> {
  success: boolean;
  code?: string;
  message?: string;
  details?: unknown;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SmsQueueItem {
  id: string;
  jobId?: string | null;
  mobile: string;
  type?: string | null;
  smsType?: 'masking' | 'non_masking';
  context?: string | null;
  priority: number;
  status: string;
  message: string;
  cost?: string | number | null;
  scheduledAt?: string | null;
  cancelledAt?: string | null;
}

export interface SmsLog {
  id: string;
  jobId?: string | null;
  scope: 'ORG' | 'BRANCH';
  type?: string | null;
  source?: string | null;
  smsType?: 'masking' | 'non_masking';
  context?: string | null;
  campaignName?: string | null;
  message: string;
  recipientCount: number;
  successCount: number;
  failedCount: number;
  cost?: string | number | null;
  sentAt?: string | null;
  scheduledAt?: string | null;
  providerRef?: string | null;
  recipients?: Array<{
    id: string;
    mobile: string;
    status: string;
    message?: string | null;
    resolvedMessage?: string | null;
    cost?: string | number | null;
    sentAt?: string | null;
    error?: string | null;
    providerRef?: string | null;
  }>;
}

export interface SmsRecipientLog {
  id: string;
  smsLogId: string;
  jobId?: string | null;
  recipientUserId?: string | null;
  mobile: string;
  message?: string | null;
  resolvedMessage?: string | null;
  smsType?: string | null;
  context?: string | null;
  cost?: string | number | null;
  sentByUserId?: string | null;
  sentAt?: string | null;
  providerRef?: string | null;
  status: string;
  error?: string | null;
  createdAt: string;
}

export interface SmsLogStats {
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  cost: number;
}

export interface SmsReportRow {
  branchId?: string | null;
  branchName?: string | null;
  programId?: string | null;
  programName?: string | null;
  batchId?: string | null;
  batchName?: string | null;
  type?: string | null;
  _sum?: {
    recipientCount?: number | null;
    successCount?: number | null;
    failedCount?: number | null;
    cost?: string | number | null;
  };
  _count?: { id?: number };
}

const qs = (params?: Record<string, unknown>) => {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  const q = search.toString();
  return q ? `?${q}` : '';
};

export const getSmsConfig = (params?: Record<string, unknown>) => apiRequest<ApiResponse<SmsConfig | null>>(`/sms/config${qs(params)}`);
export const upsertSmsConfig = (data: Partial<SmsConfig>) => apiRequest<ApiResponse<SmsConfig>>('/sms/config', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const getSmsTemplates = () => apiRequest<ApiResponse<SmsTemplate[]>>('/sms/templates');
export const createSmsTemplate = (data: Partial<SmsTemplate>) => apiRequest<ApiResponse<SmsTemplate>>('/sms/templates', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const updateSmsTemplate = (key: string, data: Partial<SmsTemplate>) => apiRequest<ApiResponse<SmsTemplate>>(`/sms/templates/${encodeURIComponent(key)}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});

export const getSmsBalance = (params?: Record<string, unknown>) => apiRequest<ApiResponse<SmsBalance[]>>(`/sms/balance${qs(params)}`);
export const getProviderBalance = () => apiRequest<ApiResponse<SmsProviderBalance>>('/sms/provider-balance');
export const updateSmsBalance = (data: Record<string, unknown>) => apiRequest<ApiResponse<SmsBalance>>('/sms/balance', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const transferSmsBalance = (branchId: string, count: number) => apiRequest<ApiResponse<unknown>>('/sms/balance/transfer', {
  method: 'POST',
  body: JSON.stringify({ branchId, count }),
});

export const getSmsSystemSettings = () => apiRequest<ApiResponse<{ types: string[]; settings: SmsSystemSetting[] }>>('/sms/system-settings');
export const saveSmsSystemSetting = (data: Partial<SmsSystemSetting>) => apiRequest<ApiResponse<SmsSystemSetting>>('/sms/system-settings', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const deleteBranchSystemSettings = (branchId: string, type?: string) =>
  apiRequest<ApiResponse<{ count: number }>>('/sms/system-settings/delete-branch', {
    method: 'POST',
    body: JSON.stringify(type ? { branchId, type } : { branchId }),
  });

export const sendDirectSms = (to: string, message: string, isMasking: boolean, branchId?: string, scope?: string) => apiRequest<ApiResponse<unknown>>('/sms/send-direct', {
  method: 'POST',
  body: JSON.stringify({ to, message, isMasking, branchId, scope }),
});

export interface SmsRecipient {
  id?: string | null;
  name?: string | null;
  phone: string;
  branchId?: string | null;
  variables?: Record<string, unknown>;
}

export const resolveSmsRecipients = (data: {
  branchId?: string;
  programId?: string;
  courseIds?: string[];
  batchIds?: string[];
  studentIds?: string[];
  status?: string;
}) => apiRequest<ApiResponse<{ recipients: SmsRecipient[]; count: number }>>('/sms/resolve-recipients', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const dispatchSms = (data: {
  recipients: SmsRecipient[];
  message?: string;
  templateKey?: string;
  defaultVars?: Record<string, unknown>;
  smsType: 'masking' | 'non_masking';
  context: string;
  scope?: 'ORG' | 'BRANCH';
  branchId?: string;
  type?: string;
  source?: string;
  scheduledAt?: string;
  campaignName?: string;
  priority?: number;
  dedupeScope?: { examId?: string; resultBatchId?: string; dueMonth?: string };
  metadata?: Record<string, unknown>;
}) => apiRequest<ApiResponse<{ jobId: string; queuedCount: number; estimatedCost: number; invalid: string[] }>>('/sms/send', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const cancelQueuedSms = (id: string) => apiRequest<ApiResponse<{ id: string; status: string }>>(`/sms/queue/${encodeURIComponent(id)}/cancel`, {
  method: 'POST',
});

export const previewBulkManual = (numbers: string) => apiRequest<ApiResponse<BulkPreview>>('/sms/bulk/manual/preview', {
  method: 'POST',
  body: JSON.stringify({ numbers }),
});
export const sendBulkManual = (data: { branchId: string; numbers: string; message: string }) => apiRequest<ApiResponse<unknown>>('/sms/bulk/manual', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const previewBulkUpload = (file: File, mobileColumn?: string) => {
  const form = new FormData();
  form.append('file', file);
  if (mobileColumn) form.append('mobileColumn', mobileColumn);
  return apiRequest<ApiResponse<BulkPreview>>('/sms/bulk/preview', { method: 'POST', body: form });
};
export const sendBulkUpload = (data: { branchId: string; message: string; file: File; mobileColumn?: string }) => {
  const form = new FormData();
  form.append('branchId', data.branchId);
  form.append('message', data.message);
  form.append('file', data.file);
  if (data.mobileColumn) form.append('mobileColumn', data.mobileColumn);
  return apiRequest<ApiResponse<unknown>>('/sms/bulk/upload', { method: 'POST', body: form });
};

export const getSmsLogs = (params?: Record<string, unknown>) => apiRequest<ApiResponse<SmsLog[]>>(`/sms/logs${qs(params || { page: 1, limit: 20 })}`);
export const getSmsLogStats = (params?: Record<string, unknown>) => apiRequest<ApiResponse<SmsLogStats>>(`/sms/logs/stats${qs(params)}`);
export const getSmsLogRecipients = (id: string, params?: Record<string, unknown>) => apiRequest<ApiResponse<SmsRecipientLog[]>>(`/sms/logs/${encodeURIComponent(id)}/recipients${qs(params)}`);
export const retrySmsRecipient = (id: string, recipientLogId: string) => apiRequest<ApiResponse<{ count: number }>>(`/sms/logs/${encodeURIComponent(id)}/retry`, {
  method: 'POST',
  body: JSON.stringify({ recipientLogId }),
});
export const retryFailedSmsLog = (id: string) => apiRequest<ApiResponse<{ count: number }>>(`/sms/logs/${encodeURIComponent(id)}/retry-failed`, {
  method: 'POST',
});
export const getSmsQueue = (params?: Record<string, unknown>) => apiRequest<ApiResponse<{ summary: Record<string, number>; items: SmsQueueItem[] }>>(`/sms/queue${qs(params)}`);
export const getSmsReportSummary = (params?: Record<string, unknown>) => apiRequest<ApiResponse<Record<string, unknown>>>(`/sms/reports/summary${qs(params)}`);
export const getSmsReportBranch = (params?: Record<string, unknown>) => apiRequest<ApiResponse<SmsReportRow[]>>(`/sms/reports/branch${qs(params)}`);
export const getSmsReportProgram = (params?: Record<string, unknown>) => apiRequest<ApiResponse<SmsReportRow[]>>(`/sms/reports/program${qs(params)}`);
export const getSmsReportBatch = (params?: Record<string, unknown>) => apiRequest<ApiResponse<SmsReportRow[]>>(`/sms/reports/batch${qs(params)}`);
export const getSmsReportType = (params?: Record<string, unknown>) => apiRequest<ApiResponse<SmsReportRow[]>>(`/sms/reports/type${qs(params)}`);
export const getSmsReportDue = (params?: Record<string, unknown>) => apiRequest<ApiResponse<SmsLog[]>>(`/sms/reports/due${qs(params)}`);
export const getSmsReportPayment = (params?: Record<string, unknown>) => apiRequest<ApiResponse<SmsLog[]>>(`/sms/reports/payment${qs(params)}`);
export const getSmsReportResult = (params?: Record<string, unknown>) => apiRequest<ApiResponse<SmsLog[]>>(`/sms/reports/result${qs(params)}`);
export const queueDueReminders = (month: string) => apiRequest<ApiResponse<unknown>>('/sms/system/due-reminders', {
  method: 'POST',
  body: JSON.stringify({ month }),
});

export const getCampaigns = () => apiRequest<ApiResponse<unknown[]>>('/sms/campaigns');
export const createCampaign = (data: Record<string, unknown>) => apiRequest<ApiResponse<unknown>>('/sms/campaigns', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const getCampaignPreview = (data: Record<string, unknown>) => apiRequest<ApiResponse<unknown>>('/sms/campaigns/preview', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const runCampaign = (id: string, isMasking: boolean) => apiRequest<ApiResponse<unknown>>(`/sms/campaigns/${id}/run`, {
  method: 'POST',
  body: JSON.stringify({ isMasking }),
});
