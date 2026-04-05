import { apiRequest } from '../api';

export interface InventoryItem {
  id: string;
  branchId?: string | null;
  name: string;
  sku?: string | null;
  category?: string | null;
  unit?: string | null;
  quantity: number;
  reorderLevel?: number | null;
  costPrice?: number | null;
  salePrice?: number | null;
  createdAt: string;
  updatedAt: string;
  branch?: { id: string; name: string } | null;
}

export interface InventoryTransaction {
  id: string;
  inventoryItemId: string;
  quantity: number;
  type: string;
  note?: string | null;
  createdAt: string;
  item?: InventoryItem;
}

export async function getInventoryItems(params?: { branchId?: string; category?: string; search?: string }) {
  const q = new URLSearchParams();
  if (params?.branchId) q.set('branchId', params.branchId);
  if (params?.category) q.set('category', params.category);
  if (params?.search) q.set('search', params.search);
  return apiRequest(`/inventory/items?${q.toString()}`);
}

export async function createInventoryItem(data: {
  name: string;
  branchId?: string;
  sku?: string;
  category?: string;
  unit?: string;
  quantity?: number;
  reorderLevel?: number;
  costPrice?: number;
  salePrice?: number;
}) {
  return apiRequest('/inventory/items', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateInventoryItem(id: string, data: Partial<{
  name: string;
  branchId: string;
  sku: string;
  category: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  costPrice: number;
  salePrice: number;
}>) {
  return apiRequest(`/inventory/items/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function getInventoryTransactions(params?: { inventoryItemId?: string }) {
  const q = new URLSearchParams();
  if (params?.inventoryItemId) q.set('inventoryItemId', params.inventoryItemId);
  return apiRequest(`/inventory/transactions?${q.toString()}`);
}

export async function createInventoryTransaction(data: {
  inventoryItemId: string;
  quantity: number;
  type: 'IN' | 'OUT' | 'ADJUST';
  note?: string;
}) {
  return apiRequest('/inventory/transactions', { method: 'POST', body: JSON.stringify(data) });
}
