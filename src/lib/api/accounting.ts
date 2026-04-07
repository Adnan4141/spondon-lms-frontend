import { apiRequest } from '../api';

// ─── Accounts ─────────────────────────────────────────────────────────────────

export interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  branchId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountPayload {
  code: string;
  name: string;
  type: string;
  branchId?: string;
}

export interface UpdateAccountPayload {
  name?: string;
  type?: string;
  branchId?: string | null;
  isActive?: boolean;
}

export async function getAccounts(params?: {
  type?: string;
  branchId?: string;
  isActive?: boolean;
}): Promise<{ success: boolean; data: Account[] }> {
  const q = new URLSearchParams();
  if (params?.type) q.append('type', params.type);
  if (params?.branchId) q.append('branchId', params.branchId);
  if (params?.isActive !== undefined) q.append('isActive', String(params.isActive));
  const qs = q.toString();
  return apiRequest(`/accounting/accounts${qs ? `?${qs}` : ''}`);
}

export async function createAccount(data: CreateAccountPayload): Promise<{ success: boolean; data: Account; message?: string }> {
  return apiRequest('/accounting/accounts', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateAccount(id: string, data: UpdateAccountPayload): Promise<{ success: boolean; data: Account; message?: string }> {
  return apiRequest(`/accounting/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// ─── Ledger Entries ───────────────────────────────────────────────────────────

export interface LedgerEntry {
  id: string;
  accountId: string;
  branchId?: string | null;
  entryType: string;
  amount: string | number;
  refType?: string | null;
  refId?: string | null;
  description?: string | null;
  entryDate: string;
  createdByUserId?: string | null;
  createdAt: string;
  account?: { id: string; name: string; code: string; type: string } | null;
}

export interface CreateLedgerEntryPayload {
  accountId: string;
  branchId?: string;
  entryType: string;
  amount: number;
  description?: string;
  refType?: string;
  refId?: string;
  entryDate?: string;
  createdByUserId?: string;
}

export async function getLedgerEntries(params?: {
  accountId?: string;
  branchId?: string;
  from?: string;
  to?: string;
  entryType?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data: LedgerEntry[]; total: number; page: number; limit: number; totalPages: number }> {
  const q = new URLSearchParams();
  if (params?.accountId) q.append('accountId', params.accountId);
  if (params?.branchId) q.append('branchId', params.branchId);
  if (params?.from) q.append('from', params.from);
  if (params?.to) q.append('to', params.to);
  if (params?.entryType) q.append('entryType', params.entryType);
  if (params?.page) q.append('page', String(params.page));
  if (params?.limit) q.append('limit', String(params.limit));
  const qs = q.toString();
  return apiRequest(`/accounting/ledger${qs ? `?${qs}` : ''}`);
}

export async function createLedgerEntry(data: CreateLedgerEntryPayload): Promise<{ success: boolean; data: LedgerEntry; message?: string }> {
  return apiRequest('/accounting/ledger', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export interface AccountingSummary {
  byType: { type: string; totalIncome: number; totalExpense: number; net: number }[];
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  totalAccounts: number;
}

export async function getAccountingSummary(params?: {
  from?: string;
  to?: string;
  branchId?: string;
}): Promise<{ success: boolean; data: AccountingSummary }> {
  const q = new URLSearchParams();
  if (params?.from) q.append('from', params.from);
  if (params?.to) q.append('to', params.to);
  if (params?.branchId) q.append('branchId', params.branchId);
  const qs = q.toString();
  return apiRequest(`/accounting/summary${qs ? `?${qs}` : ''}`);
}
