import { apiRequest } from '../api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface InventoryItem {
  id: string;
  branchId?: string | null;
  name: string;
  sku?: string | null;
  category?: string | null;
  unit?: string | null;
  currentQty: number;
  reorderLevel?: number | null;
  costPrice?: number | null;
  sellPrice?: number | null;
  createdAt: string;
  updatedAt: string;
  branch?: { id: string; name: string } | null;
}

export interface InventoryTransaction {
  id: string;
  inventoryItemId: string;
  qty: number;
  txnType: string;
  note?: string | null;
  createdAt: string;
  item?: InventoryItem;
}

export async function getInventoryItems(params?: { branchId?: string; category?: string; search?: string }): Promise<ApiResponse<InventoryItem[]>> {
  const q = new URLSearchParams();
  if (params?.branchId) q.set('branchId', params.branchId);
  if (params?.category) q.set('category', params.category);
  if (params?.search) q.set('search', params.search);
  return apiRequest<ApiResponse<InventoryItem[]>>(`/inventory/items?${q.toString()}`);
}

export async function createInventoryItem(data: {
  name: string;
  branchId?: string;
  sku?: string;
  category?: string;
  unit?: string;
  currentQty?: number;
  reorderLevel?: number;
  costPrice?: number;
  sellPrice?: number;
}): Promise<ApiResponse<InventoryItem>> {
  return apiRequest<ApiResponse<InventoryItem>>('/inventory/items', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateInventoryItem(id: string, data: Partial<{
  name: string;
  branchId: string;
  sku: string;
  category: string;
  unit: string;
  currentQty: number;
  reorderLevel: number;
  costPrice: number;
  sellPrice: number;
}>): Promise<ApiResponse<InventoryItem>> {
  return apiRequest<ApiResponse<InventoryItem>>(`/inventory/items/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function getInventoryTransactions(params?: { inventoryItemId?: string }): Promise<ApiResponse<InventoryTransaction[]>> {
  const q = new URLSearchParams();
  if (params?.inventoryItemId) q.set('inventoryItemId', params.inventoryItemId);
  return apiRequest<ApiResponse<InventoryTransaction[]>>(`/inventory/transactions?${q.toString()}`);
}

export async function createInventoryTransaction(data: {
  inventoryItemId: string;
  qty: number;
  txnType: 'IN' | 'OUT' | 'ADJUST';
  note?: string;
}): Promise<ApiResponse<InventoryTransaction>> {
  return apiRequest<ApiResponse<InventoryTransaction>>('/inventory/transactions', { method: 'POST', body: JSON.stringify(data) });
}
