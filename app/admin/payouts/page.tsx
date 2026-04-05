'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  getPayoutBatches,
  getPayoutBatch,
  createPayoutBatch,
  updateBatchStatus,
  updatePayoutStatus,
  type PayoutBatch,
  type Payout,
  type PayoutBatchStatus,
  type PayoutStatus,
} from '@/lib/api/payouts';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Plus, Eye, RefreshCw } from 'lucide-react';

const BATCH_STATUS_COLORS: Record<PayoutBatchStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

const PAYOUT_STATUS_COLORS: Record<PayoutStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

function StatusBadge({ status, colors }: { status: string; colors: Record<string, string> }) {
  const cls = colors[status] ?? 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{status}</span>;
}

export default function AdminPayoutsPage() {
  const { toast } = useToast();
  const [batches, setBatches] = useState<PayoutBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<PayoutBatch | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [showBatchDetail, setShowBatchDetail] = useState(false);

  // Create batch dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createPeriod, setCreatePeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [createNotes, setCreateNotes] = useState('');
  const [creating, setCreating] = useState(false);

  // Batch status update
  const [updatingBatchStatus, setUpdatingBatchStatus] = useState(false);

  // Payout status update
  const [payoutStatusEdits, setPayoutStatusEdits] = useState<Record<string, PayoutStatus>>({});
  const [savingPayoutStatus, setSavingPayoutStatus] = useState<Record<string, boolean>>({});
  const [payoutTransactionIds, setPayoutTransactionIds] = useState<Record<string, string>>({});

  const loadBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPayoutBatches();
      if (res.success && res.data) setBatches(res.data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load payout batches', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const handleCreateBatch = async () => {
    if (!createPeriod || !/^\d{4}-\d{2}$/.test(createPeriod)) {
      toast({ title: 'Validation', description: 'Enter period in YYYY-MM format', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const res = await createPayoutBatch({ period: createPeriod, notes: createNotes || undefined });
      if (res.success) {
        toast({ title: 'Success', description: `Payout batch for ${createPeriod} created with ${(res as any).data?.payoutsCreated ?? 0} records` });
        setShowCreateDialog(false);
        setCreateNotes('');
        await loadBatches();
      } else {
        toast({ title: 'Error', description: (res as any).message ?? 'Failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create batch', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const openBatchDetail = async (batch: PayoutBatch) => {
    setBatchLoading(true);
    setShowBatchDetail(true);
    setSelectedBatch(batch);
    setPayoutStatusEdits({});
    setPayoutTransactionIds({});
    try {
      const res = await getPayoutBatch(batch.id);
      if (res.success && res.data) setSelectedBatch(res.data);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleUpdateBatchStatus = async (status: PayoutBatchStatus) => {
    if (!selectedBatch) return;
    setUpdatingBatchStatus(true);
    try {
      const res = await updateBatchStatus(selectedBatch.id, { status });
      if (res.success && res.data) {
        setSelectedBatch((prev) => prev ? { ...prev, status: res.data!.status } : null);
        setBatches((prev) => prev.map((b) => b.id === selectedBatch.id ? { ...b, status: res.data!.status } : b));
        toast({ title: 'Updated', description: `Batch status set to ${status}` });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } finally {
      setUpdatingBatchStatus(false);
    }
  };

  const handleSavePayoutStatus = async (payout: Payout) => {
    const newStatus = payoutStatusEdits[payout.id];
    if (!newStatus) return;
    setSavingPayoutStatus((s) => ({ ...s, [payout.id]: true }));
    try {
      const res = await updatePayoutStatus(payout.id, {
        status: newStatus,
        transactionId: payoutTransactionIds[payout.id] || undefined,
      });
      if (res.success) {
        toast({ title: 'Saved', description: `Payout status set to ${newStatus}` });
        // Refresh batch detail
        const batchRes = await getPayoutBatch(selectedBatch!.id);
        if (batchRes.success && batchRes.data) setSelectedBatch(batchRes.data);
        setPayoutStatusEdits((s) => { const n = { ...s }; delete n[payout.id]; return n; });
      } else {
        toast({ title: 'Error', description: (res as any).message ?? 'Failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update payout status', variant: 'destructive' });
    } finally {
      setSavingPayoutStatus((s) => ({ ...s, [payout.id]: false }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold">Payout Management</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadBatches} className="gap-1">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Generate Batch
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Track-only payout workflow. Generate batches per period to calculate partner and book collaborator revenue shares.
        No payment gateway transfers are made — update status manually as payouts are processed.
      </p>

      {/* Batches table */}
      <div className="bg-white rounded-lg border overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : batches.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No payout batches yet. Generate one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Period</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Payouts</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-semibold">{batch.period}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={batch.status} colors={BATCH_STATUS_COLORS} />
                  </td>
                  <td className="px-4 py-3">{batch._count?.payouts ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(batch.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openBatchDetail(batch)}>
                      <Eye className="h-4 w-4" /> View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Batch Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Generate Payout Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Period (YYYY-MM) *</Label>
              <Input
                placeholder="e.g. 2026-04"
                value={createPeriod}
                onChange={(e) => setCreatePeriod(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Calculates partner and book collaborator revenue for this calendar month.
              </p>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Internal note..."
                value={createNotes}
                onChange={(e) => setCreateNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateBatch} disabled={creating}>
              {creating ? 'Generating...' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Detail Dialog */}
      <Dialog open={showBatchDetail} onOpenChange={setShowBatchDetail}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              Batch {selectedBatch?.period} — <StatusBadge status={selectedBatch?.status ?? ''} colors={BATCH_STATUS_COLORS} />
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-2 space-y-4">
            {batchLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : selectedBatch ? (
              <>
                {/* Batch status update */}
                <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-3">
                  <span className="text-sm font-medium">Batch Status:</span>
                  <Select
                    value={selectedBatch.status}
                    onValueChange={(v) => handleUpdateBatchStatus(v as PayoutBatchStatus)}
                    disabled={updatingBatchStatus}
                  >
                    <SelectTrigger className="w-40 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] as PayoutBatchStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBatch.notes && <span className="text-xs text-muted-foreground ml-2">{selectedBatch.notes}</span>}
                </div>

                {/* Individual payouts */}
                <div className="space-y-2">
                  {(selectedBatch.payouts ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No payout records in this batch.</p>
                  ) : (
                    (selectedBatch.payouts ?? []).map((payout) => (
                      <div key={payout.id} className="border rounded-xl p-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            {payout.recipientType === 'PARTNER' ? (
                              <p className="font-semibold">{payout.partner?.name ?? 'Partner'}</p>
                            ) : (
                              <p className="font-semibold">
                                {payout.bookCollaborator?.user?.fullName ?? 'Collaborator'}
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({payout.bookCollaborator?.book?.name})
                                </span>
                              </p>
                            )}
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{payout.recipientType}</Badge>
                              <Badge variant="outline" className="text-xs">{payout.sourceType}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">৳{Number(payout.revenueAmount).toLocaleString()} × {payout.sharePercentage}%</p>
                            <p className="font-bold text-emerald-600 text-lg">৳{Number(payout.payoutAmount).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <StatusBadge status={payout.paymentStatus} colors={PAYOUT_STATUS_COLORS} />
                          <Select
                            value={payoutStatusEdits[payout.id] ?? payout.paymentStatus}
                            onValueChange={(v) => setPayoutStatusEdits((s) => ({ ...s, [payout.id]: v as PayoutStatus }))}
                          >
                            <SelectTrigger className="w-36 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] as PayoutStatus[]).map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            className="h-7 w-40 text-xs"
                            placeholder="Transaction ID"
                            value={payoutTransactionIds[payout.id] ?? payout.transactionId ?? ''}
                            onChange={(e) => setPayoutTransactionIds((s) => ({ ...s, [payout.id]: e.target.value }))}
                          />
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            disabled={savingPayoutStatus[payout.id] || !payoutStatusEdits[payout.id]}
                            onClick={() => handleSavePayoutStatus(payout)}
                          >
                            {savingPayoutStatus[payout.id] ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDetail(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
