'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createBookStockMovement,
  getBookStockMovements,
  getBookStockSummary,
  type Book,
  type BookStockMovement,
  type BookStockMovementType,
  type DistributionChannel,
  type StockLocationType,
  type StockSource,
} from '@/lib/api/books';
import type { Branch } from '@/lib/api/branches';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, CalendarClock, Factory, FileText, PackageCheck } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { BookAdminModal } from './BookAdminModal';

const movementColors: Record<BookStockMovementType, string> = {
  RECEIVE: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  RETURN: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  ADJUSTMENT: 'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  DISTRIBUTE: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400',
  TRANSFER: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400',
  SALE: 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400',
};

function locationPayload(type: StockLocationType, id: string, name: string) {
  if (type === 'CENTRAL') return { type };
  return { type, id, name };
}

function formatBalance(movement: BookStockMovement) {
  if (movement.movementType === 'SALE' || movement.movementType === 'DISTRIBUTE' || movement.movementType === 'TRANSFER') {
    const after = movement.sourceBalanceAfter ?? null;
    if (after == null) return '—';
    return `${after + movement.quantity} → ${after}`;
  }
  const after = movement.destinationBalanceAfter ?? null;
  if (after == null) return '—';
  return `${Math.max(0, after - movement.quantity)} → ${after}`;
}

export function StockHistoryTab({
  books,
  branches,
  sources,
  channels,
}: {
  books: Book[];
  branches: Branch[];
  sources: StockSource[];
  channels: DistributionChannel[];
}) {
  const toast = useAdminToast();
  const [bookId, setBookId] = useState('all');
  const [movementType, setMovementType] = useState<BookStockMovementType | 'ALL'>('ALL');
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [movements, setMovements] = useState<BookStockMovement[]>([]);
  const [totals, setTotals] = useState({ centralQty: 0, branchQty: 0, distributedQty: 0, channelDistributedQty: 0, soldQty: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bookId: '',
    movementType: 'RECEIVE' as BookStockMovementType,
    quantity: 1,
    remarks: '',
    sourceType: 'SOURCE' as StockLocationType,
    sourceId: '',
    destinationType: 'CENTRAL' as StockLocationType,
    destinationId: '',
  });

  const loadData = async () => {
    const [movementsRes, summaryRes] = await Promise.all([
      getBookStockMovements({
        bookId: bookId === 'all' ? undefined : bookId,
        movementType,
        from: fromDate ? fromDate.toISOString() : undefined,
        to: toDate ? toDate.toISOString() : undefined,
        limit: 50,
      }),
      getBookStockSummary({ bookId: bookId === 'all' ? undefined : bookId }),
    ]);
    if (movementsRes.success) setMovements(movementsRes.data || []);
    if (summaryRes.success) setTotals(summaryRes.totals);
  };

  useEffect(() => {
    void loadData();
  }, [bookId, movementType, fromDate, toDate]);

  const sourceOptions = useMemo(() => ({
    SOURCE: sources.map((source) => ({ id: source.id, name: source.name })),
    BRANCH: branches.map((branch) => ({ id: branch.id, name: branch.name })),
    CHANNEL: channels.map((channel) => ({ id: channel.id, name: channel.name })),
    CENTRAL: [{ id: 'central', name: 'Central Warehouse' }],
  }), [branches, channels, sources]);

  const destinationOptions = sourceOptions;

  const handleCreate = async () => {
    if (!form.bookId) return;
    try {
      setSaving(true);
      const sourceName = sourceOptions[form.sourceType as 'SOURCE' | 'BRANCH' | 'CHANNEL' | 'CENTRAL']?.find((entry) => entry.id === form.sourceId)?.name || 'Central Warehouse';
      const destinationName = destinationOptions[form.destinationType as 'SOURCE' | 'BRANCH' | 'CHANNEL' | 'CENTRAL']?.find((entry) => entry.id === form.destinationId)?.name || 'Central Warehouse';
      await createBookStockMovement({
        bookId: form.bookId,
        movementType: form.movementType,
        quantity: Number(form.quantity),
        remarks: form.remarks,
        source: locationPayload(form.sourceType, form.sourceId, sourceName),
        destination: locationPayload(form.destinationType, form.destinationId, destinationName),
      });
      toast({ title: 'Movement recorded', variant: 'success' });
      setDialogOpen(false);
      await loadData();
    } catch (error) {
      toast({ title: 'Movement failed', description: error instanceof Error ? error.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard label="Central" value={totals.centralQty} icon={PackageCheck} variant="green" />
        <StatsCard label="Branch Stock" value={totals.branchQty} icon={Factory} variant="blue" />
        <StatsCard label="Distributed" value={totals.distributedQty + totals.channelDistributedQty} icon={ArrowRight} variant="sky" />
        <StatsCard label="Sold" value={totals.soldQty} icon={CalendarClock} variant="red" />
      </div>

      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={bookId} onValueChange={setBookId}>
            <SelectTrigger className="w-[240px]"><SelectValue placeholder="Filter by book" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Books</SelectItem>
              {books.map((book) => <SelectItem key={book.id} value={book.id}>{book.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={movementType} onValueChange={(value) => setMovementType(value as BookStockMovementType | 'ALL')}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Movements</SelectItem>
              {(['RECEIVE', 'TRANSFER', 'DISTRIBUTE', 'SALE', 'RETURN', 'ADJUSTMENT'] as const).map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DatePicker date={fromDate} setDate={setFromDate} placeholder="From date" className="w-[180px]" />
          <DatePicker date={toDate} setDate={setToDate} placeholder="To date" className="w-[180px]" />
          <Button className="ml-auto rounded-2xl" onClick={() => setDialogOpen(true)}>Record Movement</Button>
        </div>
      </section>

      <section className="space-y-3">
        {movements.map((movement) => (
          <article key={movement.id} className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.22em] ${movementColors[movement.movementType]}`}>
                    {movement.movementType}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{movement.book?.name || movement.bookId}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {movement.sourceName || movement.sourceType || 'Unknown'}
                  <ArrowRight className="mx-2 inline h-4 w-4" />
                  {movement.destinationName || movement.destinationType || 'Unknown'}
                </p>
                <p className="text-sm text-muted-foreground">Balance: <span className="font-semibold text-foreground">{formatBalance(movement)}</span></p>
                {movement.remarks ? <p className="text-sm text-muted-foreground">{movement.remarks}</p> : null}
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-foreground">{movement.quantity > 0 ? `±${movement.quantity}` : movement.quantity}</p>
                <p className="text-sm text-muted-foreground">{new Date(movement.movementDate).toLocaleString()}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">By {movement.createdByUserId || 'System'}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <BookAdminModal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Record Stock Movement"
        subtitle="Capture receives, transfers, sales, returns, and manual adjustments in the central audit ledger."
        maxWidth="max-w-5xl"
        bodyClassName="p-4 sm:p-6 md:p-8"
      >
          <div className="grid gap-4 py-1 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2"><Label>Book</Label><Select value={form.bookId} onValueChange={(value) => setForm((prev) => ({ ...prev, bookId: value }))}><SelectTrigger><SelectValue placeholder="Select book" /></SelectTrigger><SelectContent>{books.map((book) => <SelectItem key={book.id} value={book.id}>{book.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Movement Type</Label><Select value={form.movementType} onValueChange={(value) => setForm((prev) => ({ ...prev, movementType: value as BookStockMovementType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(['RECEIVE', 'TRANSFER', 'DISTRIBUTE', 'SALE', 'RETURN', 'ADJUSTMENT'] as const).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={String(form.quantity)} onChange={(e) => setForm((prev) => ({ ...prev, quantity: Number(e.target.value || 0) }))} /></div>
            <div className="space-y-2"><Label>Source Type</Label><Select value={form.sourceType} onValueChange={(value) => setForm((prev) => ({ ...prev, sourceType: value as StockLocationType, sourceId: '' }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SOURCE">Source</SelectItem><SelectItem value="CENTRAL">Central</SelectItem><SelectItem value="BRANCH">Branch</SelectItem><SelectItem value="CHANNEL">Channel</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Source</Label><Select value={form.sourceId || (form.sourceType === 'CENTRAL' ? 'central' : '')} onValueChange={(value) => setForm((prev) => ({ ...prev, sourceId: value }))}><SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger><SelectContent>{(sourceOptions[form.sourceType as 'SOURCE' | 'BRANCH' | 'CHANNEL' | 'CENTRAL'] || []).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Destination Type</Label><Select value={form.destinationType} onValueChange={(value) => setForm((prev) => ({ ...prev, destinationType: value as StockLocationType, destinationId: '' }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CENTRAL">Central</SelectItem><SelectItem value="BRANCH">Branch</SelectItem><SelectItem value="CHANNEL">Channel</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Destination</Label><Select value={form.destinationId || (form.destinationType === 'CENTRAL' ? 'central' : '')} onValueChange={(value) => setForm((prev) => ({ ...prev, destinationId: value }))}><SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger><SelectContent>{(destinationOptions[form.destinationType as 'SOURCE' | 'BRANCH' | 'CHANNEL' | 'CENTRAL'] || []).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2 md:col-span-2"><Label>Remarks</Label><Input value={form.remarks} onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))} placeholder="Press receive, manual adjustment, damaged return..." /></div>
          </div>
          <DialogFooter className="mt-6 border-t border-slate-100 bg-slate-50 px-0 pt-5 sm:mt-8 sm:pt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Record Movement'}</Button>
          </DialogFooter>
      </BookAdminModal>
    </div>
  );
}