'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getBookStockMovementDeletions,
  type Book,
  type BookStockMovement,
  type BookStockMovementDeletion,
} from '@/lib/api/books';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, Trash2 } from 'lucide-react';
import type { StockPageSharedFilters } from './stock-page-filters';
import { endOfDay } from './stock-page-filters';

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function movementSummary(movement: BookStockMovement) {
  const source = movement.sourceName || movement.sourceType || '-';
  const destination = movement.destinationName || movement.destinationType || '-';
  return `${movement.movementType} · ${movement.quantity} · ${source} → ${destination}`;
}

function DeletionCard({ record }: { record: BookStockMovementDeletion }) {
  const snapshot = record.movementSnapshot;
  const linked = Array.isArray(record.linkedSnapshots) ? record.linkedSnapshots : [];

  return (
    <article className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="destructive" className="rounded-full">Deleted</Badge>
            <span className="text-sm font-bold text-foreground">
              {record.book?.name || snapshot.book?.name || 'Unknown book'}
            </span>
            {record.book?.sku ? (
              <span className="text-xs text-muted-foreground">{record.book.sku}</span>
            ) : null}
          </div>
          <p className="text-sm font-semibold text-foreground">{movementSummary(snapshot)}</p>
          <p className="text-xs text-muted-foreground">
            Original ID: {record.originalMovementId}
          </p>
          <p className="text-sm text-foreground">
            <span className="font-semibold">Reason:</span> {record.deleteReason}
          </p>
          <p className="text-xs text-muted-foreground">
            Deleted {formatDateTime(record.deletedAt)}
            {record.deletedBy ? ` by ${record.deletedBy.fullName}` : ''}
          </p>
          {snapshot.remarks ? (
            <p className="text-xs text-muted-foreground">Remarks: {snapshot.remarks}</p>
          ) : null}
          {linked.length > 0 ? (
            <div className="rounded-xl border border-border/70 bg-background/80 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Also removed linked correction entries ({linked.length})</p>
              <ul className="space-y-1">
                {linked.map((item) => (
                  <li key={item.id}>{movementSummary(item)}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <Trash2 className="h-5 w-5 text-rose-500 shrink-0" />
      </div>
    </article>
  );
}

export function DeletedStockHistoryTab({
  books,
  sharedFilters,
}: {
  books: Book[];
  sharedFilters: StockPageSharedFilters;
}) {
  const toast = useAdminToast();
  const bookId = sharedFilters.bookId;
  const fromDate = sharedFilters.fromDate;
  const toDate = sharedFilters.toDate;

  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<BookStockMovementDeletion[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBookLabel = useMemo(() => {
    if (bookId === 'all') return 'All books';
    return books.find((book) => book.id === bookId)?.name || 'Selected book';
  }, [bookId, books]);

  const loadData = useCallback(async (targetPage: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await getBookStockMovementDeletions({
        bookId: bookId === 'all' ? undefined : bookId,
        search: search.trim() || undefined,
        from: fromDate ? fromDate.toISOString().slice(0, 10) : undefined,
        to: toDate ? endOfDay(toDate).toISOString() : undefined,
        page: targetPage,
        limit: 30,
      });

      if (!response.success) {
        throw new Error('Failed to load deleted stock history');
      }

      setRecords((prev) => (append ? [...prev, ...(response.data || [])] : response.data || []));
      setPage(response.page || targetPage);
      setTotalPages(response.totalPages || 1);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load deleted stock history';
      setError(message);
      if (!append) setRecords([]);
      toast({ title: 'Load failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [bookId, fromDate, search, toDate, toast]);

  useEffect(() => {
    void loadData(1, false);
  }, [loadData]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-900">
        Super Admin only. Direct deletes are stored here permanently. Active stock history no longer shows these records.
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reason or movement id"
          className="rounded-xl"
        />
        <Select value={bookId} disabled>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Book filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={bookId}>{selectedBookLabel}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="rounded-xl" onClick={() => void loadData(1, false)} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : error ? (
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="mx-auto h-9 w-9 text-destructive" />
          <p className="mt-3 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-4 rounded-xl" variant="outline" onClick={() => void loadData(1, false)}>
            Try again
          </Button>
        </section>
      ) : records.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Trash2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 text-base font-semibold text-foreground">No deleted stock movements</h3>
          <p className="mt-1 text-sm text-muted-foreground">Deleted records will appear here with reason and snapshot.</p>
        </section>
      ) : (
        <section className="space-y-3">
          {records.map((record) => (
            <DeletionCard key={record.id} record={record} />
          ))}
          {page < totalPages ? (
            <div className="flex justify-center pt-2">
              <Button
                className="rounded-xl"
                variant="outline"
                onClick={() => void loadData(page + 1, true)}
                disabled={loadingMore}
              >
                {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loadingMore ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
