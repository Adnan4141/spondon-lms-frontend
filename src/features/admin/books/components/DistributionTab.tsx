'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createDistribution,
  getDistributionSummary,
  getDistributions,
  type Book,
  type BookDistribution,
  type DistributionChannel,
  type DistributionDateRange,
} from '@/lib/api/books';
import type { Branch } from '@/lib/api/branches';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import { endOfDay, type StockPageSharedFilters } from './stock-page-filters';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRight, Building2, PackageCheck, RadioTower, Truck } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { BookAdminModal } from './BookAdminModal';

type DistributionSummary = {
  byBook: Array<{
    bookId: string;
    _sum: { quantity?: number | null };
    _min?: DistributionDateRange;
    _max?: DistributionDateRange;
    _count: number;
    book?: { id: string; name: string; sku: string };
  }>;
  byBranch: Array<{
    toBranchId: string | null;
    _sum: { quantity?: number | null };
    _min?: DistributionDateRange;
    _max?: DistributionDateRange;
    _count: number;
    branch?: { id: string; name: string };
  }>;
  byChannel: Array<{
    channelId: string | null;
    _sum: { quantity?: number | null };
    _min?: DistributionDateRange;
    _max?: DistributionDateRange;
    _count: number;
    channel?: { id: string; name: string };
  }>;
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function formatRange(min?: DistributionDateRange, max?: DistributionDateRange) {
  const start = formatDate(min?.distributedAt);
  const end = formatDate(max?.distributedAt);
  return start === end ? start : `${start} - ${end}`;
}

export function DistributionTab({
  books,
  branches,
  channels,
  sharedFilters,
  onSharedFiltersChange,
}: {
  books: Book[];
  branches: Branch[];
  channels: DistributionChannel[];
  sharedFilters: StockPageSharedFilters;
  onSharedFiltersChange: (filters: StockPageSharedFilters) => void;
}) {
  const toast = useAdminToast();
  const { user } = useAdminSession();
  const bookId = sharedFilters.bookId;
  const fromDate = sharedFilters.fromDate;
  const toDate = sharedFilters.toDate;
  const [destinationType, setDestinationType] = useState<'all' | 'branch' | 'channel'>(
    sharedFilters.branchId === 'all' ? 'all' : 'branch',
  );
  const [destinationId, setDestinationId] = useState(
    sharedFilters.branchId === 'all' ? 'all' : sharedFilters.branchId,
  );
  const [rows, setRows] = useState<BookDistribution[]>([]);
  const [summary, setSummary] = useState<DistributionSummary>({ byBook: [], byBranch: [], byChannel: [] });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ bookId: '', destinationType: 'branch' as 'branch' | 'channel', destinationId: '', quantity: 1, note: '', distributedAt: startOfToday() });

  const resetForm = () => {
    setForm({ bookId: '', destinationType: 'branch', destinationId: '', quantity: 1, note: '', distributedAt: startOfToday() });
  };
  const isBranchAdmin = user?.role === 'BRANCH_ADMIN';
  const visibleBranches = isBranchAdmin && user?.branchId
    ? branches.filter((branch) => branch.id === user.branchId)
    : branches;

  useEffect(() => {
    if (isBranchAdmin && user?.branchId) {
      setDestinationType('branch');
      setDestinationId(user.branchId);
      return;
    }
    if (sharedFilters.branchId === 'all') {
      setDestinationType('all');
      setDestinationId('all');
      return;
    }
    setDestinationType('branch');
    setDestinationId(sharedFilters.branchId);
  }, [isBranchAdmin, sharedFilters.branchId, user?.branchId]);

  const patchSharedFilters = (patch: Partial<StockPageSharedFilters>) => {
    onSharedFiltersChange({ ...sharedFilters, ...patch });
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const loadData = useCallback(async () => {
    const [listRes, summaryRes] = await Promise.all([
      getDistributions({
        bookId: bookId === 'all' ? undefined : bookId,
        toBranchId: isBranchAdmin
          ? user?.branchId || undefined
          : destinationType === 'branch' && destinationId !== 'all' ? destinationId : undefined,
        channelId: isBranchAdmin ? undefined : destinationType === 'channel' && destinationId !== 'all' ? destinationId : undefined,
        from: fromDate ? fromDate.toISOString() : undefined,
        to: toDate ? endOfDay(toDate).toISOString() : undefined,
        limit: 50,
      }),
      getDistributionSummary({
        bookId: bookId === 'all' ? undefined : bookId,
        branchId: isBranchAdmin
          ? user?.branchId || undefined
          : destinationType === 'branch' && destinationId !== 'all' ? destinationId : undefined,
        channelId: isBranchAdmin ? undefined : destinationType === 'channel' && destinationId !== 'all' ? destinationId : undefined,
        from: fromDate ? fromDate.toISOString() : undefined,
        to: toDate ? endOfDay(toDate).toISOString() : undefined,
      }),
    ]);
    if (listRes.success) setRows(listRes.data || []);
    if (summaryRes.success) setSummary(summaryRes.data);
  }, [bookId, destinationId, destinationType, fromDate, isBranchAdmin, toDate, user?.branchId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!form.bookId) {
      toast({ title: 'Select a book first', variant: 'destructive' });
      return;
    }
    if (!form.destinationId) {
      toast({ title: 'Select a distribution destination', variant: 'destructive' });
      return;
    }
    if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) <= 0) {
      toast({ title: 'Quantity must be a positive whole number', variant: 'destructive' });
      return;
    }
    if (form.distributedAt.getTime() > Date.now()) {
      toast({ title: 'Distribution date cannot be in the future', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      await createDistribution({
        bookId: form.bookId,
        quantity: Number(form.quantity),
        note: form.note,
        distributedAt: form.distributedAt.toISOString(),
        toBranchId: form.destinationType === 'branch' ? form.destinationId : undefined,
        channelId: form.destinationType === 'channel' ? form.destinationId : undefined,
      });
      toast({ title: 'Distribution recorded', variant: 'success' });
      closeDialog();
      await loadData();
    } catch (error) {
      toast({ title: 'Distribution failed', description: error instanceof Error ? error.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard label="Book Summary Rows" value={summary.byBook.length} icon={ArrowRight} variant="sky" />
        <StatsCard label="Branch Destinations" value={summary.byBranch.length} icon={Building2} variant="green" />
        <StatsCard label="Channel Destinations" value={summary.byChannel.length} icon={RadioTower} variant="purple" />
      </div>

      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={bookId} onValueChange={(value) => patchSharedFilters({ bookId: value })}>
            <SelectTrigger className="w-[240px]"><SelectValue placeholder="Book" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Books</SelectItem>{books.map((book) => <SelectItem key={book.id} value={book.id}>{book.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={destinationType} onValueChange={(value) => {
            const nextType = value as 'all' | 'branch' | 'channel';
            setDestinationType(nextType);
            setDestinationId('all');
            if (nextType !== 'branch') patchSharedFilters({ branchId: 'all' });
          }}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Destinations</SelectItem><SelectItem value="branch">Branch</SelectItem><SelectItem value="channel">Channel</SelectItem></SelectContent>
          </Select>
          {destinationType !== 'all' ? (
            <Select value={destinationId} onValueChange={(value) => {
              setDestinationId(value);
              if (destinationType === 'branch') {
                patchSharedFilters({ branchId: value === 'all' ? 'all' : value });
              }
            }}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Destination" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {(destinationType === 'branch' ? visibleBranches : channels).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : null}
          <DatePicker date={fromDate} setDate={(date) => patchSharedFilters({ fromDate: date })} placeholder="From date" className="w-[180px]" />
          <DatePicker date={toDate} setDate={(date) => patchSharedFilters({ toDate: date })} placeholder="To date" className="w-[180px]" />
          {!isBranchAdmin ? (
            <Button className="ml-auto rounded-2xl" onClick={() => setDialogOpen(true)}>New Distribution</Button>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-black">Book-wise Summary</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Book</TableHead><TableHead>Date Range</TableHead><TableHead>Trips</TableHead><TableHead className="text-right">Qty</TableHead></TableRow></TableHeader>
            <TableBody>
              {summary.byBook.map((row) => (
                <TableRow key={row.bookId}>
                  <TableCell>{row.book?.name || row.bookId}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatRange(row._min, row._max)}</TableCell>
                  <TableCell>{row._count}</TableCell>
                  <TableCell className="text-right font-semibold">{row._sum.quantity || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
        <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-black">Destination Summary</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Destination</TableHead><TableHead>Date Range</TableHead><TableHead>Trips</TableHead><TableHead className="text-right">Qty</TableHead></TableRow></TableHeader>
            <TableBody>
              {[...summary.byBranch.map((row) => ({ key: row.toBranchId || 'none', name: row.branch?.name || 'Unassigned Branch', count: row._count, quantity: row._sum.quantity || 0, min: row._min, max: row._max })), ...summary.byChannel.map((row) => ({ key: row.channelId || 'none-channel', name: row.channel?.name || 'Unassigned Channel', count: row._count, quantity: row._sum.quantity || 0, min: row._min, max: row._max }))].map((row) => (
                <TableRow key={row.key}><TableCell>{row.name}</TableCell><TableCell className="text-xs text-muted-foreground">{formatRange(row.min, row.max)}</TableCell><TableCell>{row.count}</TableCell><TableCell className="text-right font-semibold">{row.quantity}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>

      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-black">Recent Distributions</h3>
        <Table>
          <TableHeader><TableRow><TableHead>Book</TableHead><TableHead>Destination</TableHead><TableHead>Type</TableHead><TableHead>Distribution Date</TableHead><TableHead>Recorded At</TableHead><TableHead className="text-right">Qty</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.book?.name || row.bookId}</TableCell>
                <TableCell>{row.toBranch?.name || row.channel?.name || 'Unknown'}</TableCell>
                <TableCell>{row.toBranchId ? 'Branch' : 'Channel'}</TableCell>
                <TableCell>{formatDate(row.distributedAt)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDateTime(row.createdAt)}</TableCell>
                <TableCell className="text-right font-semibold">{row.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <BookAdminModal
        open={dialogOpen}
        onClose={closeDialog}
        title="Create Distribution"
        subtitle="Distribute books to a branch or external channel while preserving ledger-based stock history."
        maxWidth="max-w-4xl"
        bodyClassName="overflow-y-auto bg-muted/30 p-4 sm:p-6"
        contentClassName="bg-background"
        footer={(
          <DialogFooter className="shrink-0 border-t border-border bg-background px-4 py-4 sm:px-6">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Confirm Distribution'}</Button>
          </DialogFooter>
        )}
      >
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
                <PackageCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground">Book & quantity</h3>
                <p className="text-xs text-muted-foreground">Choose printed book stock to distribute.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
              <div className="space-y-2">
                <Label>Book</Label>
                <Select value={form.bookId} onValueChange={(value) => setForm((prev) => ({ ...prev, bookId: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select book" /></SelectTrigger>
                  <SelectContent>{books.map((book) => <SelectItem key={book.id} value={book.id}>{book.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={String(form.quantity)}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantity: Number(e.target.value || 0) }))}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground">Destination</h3>
                <p className="text-xs text-muted-foreground">Send stock to a branch or distribution channel.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Destination Type</Label>
                <Select value={form.destinationType} onValueChange={(value) => setForm((prev) => ({ ...prev, destinationType: value as 'branch' | 'channel', destinationId: '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branch">Branch</SelectItem>
                    <SelectItem value="channel">Channel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destination</Label>
                <Select value={form.destinationId} onValueChange={(value) => setForm((prev) => ({ ...prev, destinationId: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                  <SelectContent>{(form.destinationType === 'branch' ? visibleBranches : channels).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <ArrowRight className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground">Ledger details</h3>
                <p className="text-xs text-muted-foreground">This creates a distribution record and stock movement entry.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Distribution Date</Label>
                <DatePicker
                  date={form.distributedAt}
                  setDate={(date) => setForm((prev) => ({ ...prev, distributedAt: date || startOfToday() }))}
                  placeholder="Select distribution date"
                  className="w-full"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Note</Label>
                <Input
                  value={form.note}
                  onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Teacher fair, retail partner, branch top-up..."
                />
              </div>
            </div>
          </section>
        </div>
      </BookAdminModal>
    </div>
  );
}
