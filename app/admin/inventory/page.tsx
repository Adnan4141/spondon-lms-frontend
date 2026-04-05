'use client';

import React, { useEffect, useState } from 'react';
import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  createInventoryTransaction,
  type InventoryItem,
} from '@/lib/api/inventory';
import { getBranches } from '@/lib/api/branches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Package,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type BranchRow = { id: string; name: string };

export default function InventoryPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');

  // Create/edit modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    sku: '',
    category: '',
    unit: 'pcs',
    branchId: '',
    quantity: 0,
    reorderLevel: 0,
    costPrice: 0,
    salePrice: 0,
  });
  const [savingItem, setSavingItem] = useState(false);

  // Transaction modal
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [txnItem, setTxnItem] = useState<InventoryItem | null>(null);
  const [txnForm, setTxnForm] = useState({ type: 'IN' as 'IN' | 'OUT' | 'ADJUST', quantity: 1, note: '' });
  const [savingTxn, setSavingTxn] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, branchesRes] = await Promise.all([
        getInventoryItems({
          branchId: branchFilter !== 'all' ? branchFilter : undefined,
          search: search || undefined,
        }),
        getBranches(),
      ]);
      if (itemsRes.success) setItems(itemsRes.data || []);
      if (branchesRes.success) setBranches(branchesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [branchFilter]);

  const handleSearch = () => loadData();

  const openCreateModal = () => {
    setEditingItem(null);
    setItemForm({ name: '', sku: '', category: '', unit: 'pcs', branchId: '', quantity: 0, reorderLevel: 0, costPrice: 0, salePrice: 0 });
    setShowItemModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      sku: item.sku || '',
      category: item.category || '',
      unit: item.unit || 'pcs',
      branchId: item.branchId || '',
      quantity: item.quantity,
      reorderLevel: item.reorderLevel ?? 0,
      costPrice: item.costPrice ?? 0,
      salePrice: item.salePrice ?? 0,
    });
    setShowItemModal(true);
  };

  const handleSaveItem = async () => {
    if (!itemForm.name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    setSavingItem(true);
    try {
      const payload = {
        name: itemForm.name.trim(),
        sku: itemForm.sku.trim() || undefined,
        category: itemForm.category.trim() || undefined,
        unit: itemForm.unit.trim() || undefined,
        branchId: itemForm.branchId || undefined,
        quantity: Number(itemForm.quantity) || 0,
        reorderLevel: Number(itemForm.reorderLevel) || 0,
        costPrice: Number(itemForm.costPrice) || 0,
        salePrice: Number(itemForm.salePrice) || 0,
      };
      const res = editingItem
        ? await updateInventoryItem(editingItem.id, payload)
        : await createInventoryItem(payload);
      if (res.success) {
        toast({ title: editingItem ? 'Item updated' : 'Item created', variant: 'success' });
        setShowItemModal(false);
        loadData();
      } else {
        toast({ title: res.message || 'Failed', variant: 'destructive' });
      }
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'Error', variant: 'destructive' });
    } finally {
      setSavingItem(false);
    }
  };

  const openTxnModal = (item: InventoryItem) => {
    setTxnItem(item);
    setTxnForm({ type: 'IN', quantity: 1, note: '' });
    setShowTxnModal(true);
  };

  const handleSaveTxn = async () => {
    if (!txnItem) return;
    if (txnForm.quantity <= 0) {
      toast({ title: 'Quantity must be positive', variant: 'destructive' });
      return;
    }
    setSavingTxn(true);
    try {
      const res = await createInventoryTransaction({
        inventoryItemId: txnItem.id,
        quantity: txnForm.quantity,
        type: txnForm.type,
        note: txnForm.note.trim() || undefined,
      });
      if (res.success) {
        toast({ title: 'Transaction recorded', variant: 'success' });
        setShowTxnModal(false);
        loadData();
      } else {
        toast({ title: res.message || 'Failed', variant: 'destructive' });
      }
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'Error', variant: 'destructive' });
    } finally {
      setSavingTxn(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-16">
      {/* Header */}
      <header>
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-5 py-8 text-white shadow-xl sm:rounded-[28px] sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge className="border-white/20 bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                Administrative
              </Badge>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">Inventory Management</h1>
            </div>
            <Button
              onClick={openCreateModal}
              className="h-11 rounded-2xl bg-white font-bold text-slate-900 hover:bg-slate-100 sm:h-12"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex-1 min-w-[180px]">
          <Label className="text-xs font-bold text-slate-500 mb-1 block">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-48">
          <Label className="text-xs font-bold text-slate-500 mb-1 block">Branch</Label>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch} variant="outline" className="h-10 rounded-xl">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Items Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white py-16">
          <Package className="h-12 w-12 text-slate-300" />
          <p className="font-bold text-slate-400">No inventory items found</p>
          <Button onClick={openCreateModal} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add first item
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-left font-bold text-slate-600">Item</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-600">SKU</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-600">Category</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-600">Branch</th>
                  <th className="px-4 py-3 text-center font-bold text-slate-600">Qty</th>
                  <th className="px-4 py-3 text-center font-bold text-slate-600">Reorder</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-600">Cost</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-600">Sale</th>
                  <th className="px-4 py-3 text-center font-bold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const lowStock = item.reorderLevel != null && item.quantity <= item.reorderLevel;
                  return (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {item.name}
                        {lowStock && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-600">
                            <AlertTriangle className="h-3 w-3" />
                            Low
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{item.sku || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{item.category || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{item.branch?.name || '—'}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-900">{item.quantity} {item.unit || ''}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{item.reorderLevel ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-slate-600">৳{Number(item.costPrice ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-600">৳{Number(item.salePrice ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openTxnModal(item)}
                            className="h-8 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                          >
                            <ArrowUpRight className="mr-1 h-3 w-3" />
                            Stock
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(item)}
                            className="h-8 rounded-lg text-xs font-bold"
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Item Modal */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Name *</Label>
              <Input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>SKU</Label>
                <Input value={itemForm.sku} onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Unit</Label>
                <Input value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} />
              </div>
              <div>
                <Label>Branch</Label>
                <Select value={itemForm.branchId || 'none'} onValueChange={(v) => setItemForm({ ...itemForm, branchId: v === 'none' ? '' : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Reorder Level</Label>
                <Input type="number" value={itemForm.reorderLevel} onChange={(e) => setItemForm({ ...itemForm, reorderLevel: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Cost Price</Label>
                <Input type="number" value={itemForm.costPrice} onChange={(e) => setItemForm({ ...itemForm, costPrice: Number(e.target.value) })} />
              </div>
            </div>
            <div className="w-1/3">
              <Label>Sale Price</Label>
              <Input type="number" value={itemForm.salePrice} onChange={(e) => setItemForm({ ...itemForm, salePrice: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemModal(false)}>Cancel</Button>
            <Button onClick={handleSaveItem} disabled={savingItem}>
              {savingItem ? 'Saving…' : editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Transaction Modal */}
      <Dialog open={showTxnModal} onOpenChange={setShowTxnModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Stock Transaction</DialogTitle>
          </DialogHeader>
          {txnItem && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-700">
                {txnItem.name} — Current: <span className="text-indigo-600">{txnItem.quantity} {txnItem.unit || ''}</span>
              </p>
              <div>
                <Label>Type</Label>
                <Select value={txnForm.type} onValueChange={(v) => setTxnForm({ ...txnForm, type: v as 'IN' | 'OUT' | 'ADJUST' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">
                      <span className="flex items-center gap-2">
                        <ArrowDownRight className="h-4 w-4 text-emerald-600" />
                        Stock In
                      </span>
                    </SelectItem>
                    <SelectItem value="OUT">
                      <span className="flex items-center gap-2">
                        <ArrowUpRight className="h-4 w-4 text-rose-600" />
                        Stock Out
                      </span>
                    </SelectItem>
                    <SelectItem value="ADJUST">
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-amber-600" />
                        Adjustment
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={txnForm.quantity}
                  onChange={(e) => setTxnForm({ ...txnForm, quantity: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Note</Label>
                <Input value={txnForm.note} onChange={(e) => setTxnForm({ ...txnForm, note: e.target.value })} placeholder="Optional note" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTxnModal(false)}>Cancel</Button>
            <Button onClick={handleSaveTxn} disabled={savingTxn}>
              {savingTxn ? 'Saving…' : 'Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
