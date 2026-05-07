'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createBookStockMovement,
  correctBookStockMovement,
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
import { ArrowRight, CalendarClock, Factory, PackageCheck } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { StockHistoryFilters } from './stock-history/StockHistoryFilters';
import { StockMovementFormDialog } from './stock-history/StockMovementFormDialog';
import { StockMovementList } from './stock-history/StockMovementList';
import {
  defaultLocationId,
  defaultStockMovementForm,
  endOfDay,
  locationPayload,
  movementToForm,
  validateStockMovementForm,
  type StockLocationOptions,
  type StockMovementFormState,
} from './stock-history/stockMovementRules';

function parseLocationFilter(value: string) {
  if (value.startsWith('branch:')) return { branchId: value.replace('branch:', '') };
  if (value.startsWith('channel:')) return { channelId: value.replace('channel:', '') };
  if (value.startsWith('source:')) return { sourceId: value.replace('source:', '') };
  return {};
}

function locationName(options: StockLocationOptions, type: StockLocationType, id: string) {
  return options[type]?.find((entry) => entry.id === id)?.name || (type === 'CENTRAL' ? 'Central Warehouse' : type);
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
  const [locationFilter, setLocationFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [movements, setMovements] = useState<BookStockMovement[]>([]);
  const [totals, setTotals] = useState({ centralQty: 0, branchQty: 0, distributedQty: 0, channelDistributedQty: 0, soldQty: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<BookStockMovement | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StockMovementFormState>(() => defaultStockMovementForm());

  const locationOptions = useMemo<StockLocationOptions>(() => ({
    SOURCE: sources.map((source) => ({ id: source.id, name: source.name })),
    BRANCH: branches.map((branch) => ({ id: branch.id, name: branch.name })),
    CHANNEL: channels.map((channel) => ({ id: channel.id, name: channel.name })),
    CENTRAL: [{ id: 'central', name: 'Central Warehouse' }],
    CUSTOMER: [{ id: 'customer', name: 'Customer' }],
    OTHER: [{ id: 'other', name: 'Other' }],
  }), [branches, channels, sources]);

  const loadData = useCallback(async (targetPage = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    try {
      const locationParams = parseLocationFilter(locationFilter);
      const [movementsRes, summaryRes] = await Promise.all([
        getBookStockMovements({
          bookId: bookId === 'all' ? undefined : bookId,
          movementType,
          search: search.trim() || undefined,
          from: fromDate ? fromDate.toISOString() : undefined,
          to: toDate ? endOfDay(toDate).toISOString() : undefined,
          page: targetPage,
          limit: 50,
          ...locationParams,
        }),
        getBookStockSummary({ bookId: bookId === 'all' ? undefined : bookId }),
      ]);

      if (!movementsRes.success) throw new Error('Stock history could not be loaded.');
      setMovements((previous) => append ? [...previous, ...(movementsRes.data || [])] : movementsRes.data || []);
      setPage(movementsRes.page || targetPage);
      setTotalPages(movementsRes.totalPages || 1);
      if (summaryRes.success) setTotals(summaryRes.totals);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Something went wrong while loading stock history.';
      setError(message);
      if (!append) setMovements([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [bookId, fromDate, locationFilter, movementType, search, toDate]);

  useEffect(() => {
    void loadData(1, false);
  }, [loadData]);

  const resetForm = () => {
    setEditingMovement(null);
    setForm(defaultStockMovementForm());
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openCorrectDialog = (movement: BookStockMovement) => {
    if (movement.referenceType === 'StockMovementCorrection' || Number(movement.correctionCount || 0) > 0) return;
    setEditingMovement(movement);
    setForm(movementToForm(movement));
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const validationError = validateStockMovementForm(form, !!editingMovement);
    if (validationError) {
      toast({ title: validationError, variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      const resolvedSourceId = form.sourceId || defaultLocationId(form.sourceType);
      const resolvedDestinationId = form.destinationId || defaultLocationId(form.destinationType);
      const payload = {
        bookId: form.bookId,
        movementType: form.movementType,
        quantity: Number(form.quantity),
        remarks: form.remarks.trim() || `Correction for ${editingMovement?.id}`,
        movementDate: form.entryDate.toISOString(),
        source: locationPayload(form.sourceType, resolvedSourceId, locationName(locationOptions, form.sourceType, resolvedSourceId)),
        destination: locationPayload(form.destinationType, resolvedDestinationId, locationName(locationOptions, form.destinationType, resolvedDestinationId)),
      };

      if (editingMovement) {
        await correctBookStockMovement(editingMovement.id, payload);
      } else {
        await createBookStockMovement(payload);
      }

      toast({ title: editingMovement ? 'Movement corrected' : 'Movement recorded', variant: 'success' });
      closeDialog();
      await loadData(1, false);
    } catch (submitError) {
      toast({
        title: editingMovement ? 'Correction failed' : 'Movement failed',
        description: submitError instanceof Error ? submitError.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard label="Central Stock" value={totals.centralQty} icon={PackageCheck} variant="green" />
          <StatsCard label="Branch Stock" value={totals.branchQty} icon={Factory} variant="blue" />
          <StatsCard label="Distributed" value={totals.distributedQty + totals.channelDistributedQty} icon={ArrowRight} variant="sky" />
          <StatsCard label="Sold" value={totals.soldQty} icon={CalendarClock} variant="red" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Cards show current stock totals for the selected book, independent of date and movement filters.</p>
      </div>

      <StockHistoryFilters
        books={books}
        branches={branches}
        sources={sources}
        channels={channels}
        bookId={bookId}
        movementType={movementType}
        locationFilter={locationFilter}
        search={search}
        fromDate={fromDate}
        toDate={toDate}
        onBookChange={setBookId}
        onMovementTypeChange={setMovementType}
        onLocationFilterChange={setLocationFilter}
        onSearchChange={setSearch}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onCreate={openCreateDialog}
      />

      <StockMovementList
        movements={movements}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        hasMore={page < totalPages}
        onLoadMore={() => void loadData(page + 1, true)}
        onRetry={() => void loadData(1, false)}
        onCorrect={openCorrectDialog}
      />

      <StockMovementFormDialog
        open={dialogOpen}
        editingMovement={editingMovement}
        books={books}
        sourceOptions={locationOptions}
        form={form}
        saving={saving}
        onClose={closeDialog}
        onFormChange={setForm}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
