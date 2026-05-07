import { apiRequest } from '../api';

// ─── Accounts ─────────────────────────────────────────────────────────────────

export interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  category?: string;
  branchId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountPayload {
  code: string;
  name: string;
  type?: string;
  branchId?: string;
}

export interface UpdateAccountPayload {
  name?: string;
  branchId?: string | null;
  isActive?: boolean;
  type?: string;
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
  flowType?: string | null;
  voucherNo?: string | null;
  debitCredit?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  sourceLabel?: string | null;
  purpose?: string | null;
  amount: string | number;
  refType?: string | null;
  refId?: string | null;
  description?: string | null;
  entryDate: string;
  createdByUserId?: string | null;
  createdAt: string;
  account?: { id: string; name: string; code: string; type: string; category?: string } | null;
}

export interface CreateLedgerEntryPayload {
  branchId?: string;
  sourceType?: string;
  sourceId?: string;
  voucherNo?: string;
  purpose?: string;
  entryType?: string;
  flowType?: 'CREDIT' | 'DEBIT' | 'TRANSFER' | 'OPENING_BALANCE';
  description?: string;
  refType?: string;
  refId?: string;
  entryDate?: string;
  createdByUserId?: string;
  accountId?: string;
  toAccountId?: string;
  amount?: number;
  debitCredit?: string;
  lines?: Array<{
    accountId: string;
    amount: number;
    debitCredit: 'DEBIT' | 'CREDIT';
    description?: string;
  }>;
}

export async function getLedgerEntries(params?: {
  accountId?: string;
  branchId?: string;
  from?: string;
  to?: string;
  entryType?: string;
  debitCredit?: string;
  sourceType?: string;
  sourceId?: string;
  voucherNo?: string;
  includeSystem?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data: LedgerEntry[]; total: number; page: number; limit: number; totalPages: number }> {
  const q = new URLSearchParams();
  if (params?.accountId) q.append('accountId', params.accountId);
  if (params?.branchId) q.append('branchId', params.branchId);
  if (params?.from) q.append('from', params.from);
  if (params?.to) q.append('to', params.to);
  if (params?.entryType) q.append('entryType', params.entryType);
  if (params?.debitCredit) q.append('debitCredit', params.debitCredit);
  if (params?.sourceType) q.append('sourceType', params.sourceType);
  if (params?.sourceId) q.append('sourceId', params.sourceId);
  if (params?.voucherNo) q.append('voucherNo', params.voucherNo);
  if (params?.includeSystem !== undefined) q.append('includeSystem', String(params.includeSystem));
  if (params?.page) q.append('page', String(params.page));
  if (params?.limit) q.append('limit', String(params.limit));
  const qs = q.toString();
  return apiRequest(`/accounting/ledger${qs ? `?${qs}` : ''}`);
}

export async function createLedgerEntry(data: CreateLedgerEntryPayload): Promise<{ success: boolean; data: LedgerEntry; message?: string }> {
  return apiRequest('/accounting/ledger', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateLedgerEntry(id: string, data: CreateLedgerEntryPayload): Promise<{ success: boolean; data: LedgerEntry; message?: string }> {
  return apiRequest(`/accounting/ledger/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteLedgerEntry(id: string): Promise<{ success: boolean; data: { deletedCount: number }; message?: string }> {
  return apiRequest(`/accounting/ledger/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export interface AccountingSummary {
  byType: { type: string; totalDebit: number; totalCredit: number; balance: number }[];
  totalDebit: number;
  totalCredit: number;
  balance: number;
  cashBalance: number;
  bankBalance: number;
  bkashBalance: number;
  recentAccountBalances: Array<{
    accountId: string;
    accountName: string;
    accountCode: string;
    accountType: string;
    totalDebit: number;
    totalCredit: number;
    balance: number;
  }>;
  bySource?: Array<{ label: string; totalCredit: number; totalDebit: number; balance: number }>;
  byPurpose?: Array<{ label: string; totalCredit: number; totalDebit: number; balance: number }>;
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
