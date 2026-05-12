'use client';

import type { Book, BookStockMovementType, DistributionChannel, StockSource } from '@/lib/api/books';
import type { Branch } from '@/lib/api/branches';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';
import { STOCK_MOVEMENT_TYPES } from './stockMovementRules';

export function StockHistoryFilters({
  books,
  branches,
  sources,
  channels,
  bookId,
  movementType,
  locationFilter,
  search,
  fromDate,
  toDate,
  onBookChange,
  onMovementTypeChange,
  onLocationFilterChange,
  onSearchChange,
  onFromDateChange,
  onToDateChange,
  onCreate,
  canCreate,
}: {
  books: Book[];
  branches: Branch[];
  sources: StockSource[];
  channels: DistributionChannel[];
  bookId: string;
  movementType: BookStockMovementType | 'ALL';
  locationFilter: string;
  search: string;
  fromDate?: Date;
  toDate?: Date;
  onBookChange: (value: string) => void;
  onMovementTypeChange: (value: BookStockMovementType | 'ALL') => void;
  onLocationFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onFromDateChange: (date?: Date) => void;
  onToDateChange: (date?: Date) => void;
  onCreate: () => void;
  canCreate: boolean;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        Stock ledger filters
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.2fr)_180px_minmax(220px,1fr)_minmax(220px,1fr)_150px_150px_auto]">
        <Select value={bookId} onValueChange={onBookChange}>
          <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Filter by book" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Books</SelectItem>
            {books.map((book) => <SelectItem key={book.id} value={book.id}>{book.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={movementType} onValueChange={(value) => onMovementTypeChange(value as BookStockMovementType | 'ALL')}>
          <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Movements</SelectItem>
            {STOCK_MOVEMENT_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={locationFilter} onValueChange={onLocationFilterChange}>
          <SelectTrigger className="h-10 w-full"><SelectValue placeholder="All locations" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="central">Central Warehouse</SelectItem>
            {branches.map((branch) => <SelectItem key={branch.id} value={`branch:${branch.id}`}>Branch: {branch.name}</SelectItem>)}
            {channels.map((channel) => <SelectItem key={channel.id} value={`channel:${channel.id}`}>Channel: {channel.name}</SelectItem>)}
            {sources.map((source) => <SelectItem key={source.id} value={`source:${source.id}`}>Source: {source.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search book, SKU, reference..."
            className="h-10 pl-9"
          />
        </div>

        <DatePicker date={fromDate} setDate={onFromDateChange} placeholder="From date" className="h-10 w-full" />
        <DatePicker date={toDate} setDate={onToDateChange} placeholder="To date" className="h-10 w-full" />
        {canCreate ? <Button className="h-10 rounded-xl" onClick={onCreate}>Record Movement</Button> : null}
      </div>
    </section>
  );
}
