'use client';

import { Button } from '@/components/ui/button';
import { PackageOpen, Plus } from 'lucide-react';

type BookCatalogEmptyStateProps = {
  onClearFilters: () => void;
  onAddBook: () => void;
};

export function BookCatalogEmptyState({ onClearFilters, onAddBook }: BookCatalogEmptyStateProps) {
  return (
    <section className="flex min-h-80 flex-col items-center justify-center rounded-[28px] border border-dashed border-border bg-card p-8 text-center">
      <div className="rounded-full bg-muted p-4 text-muted-foreground">
        <PackageOpen className="h-8 w-8" />
      </div>
      <h3 className="mt-4 text-xl font-black">No books match this view</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Try clearing filters or add a new catalog item with cover, category, price, and inventory details.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button variant="outline" className="rounded-2xl" onClick={onClearFilters}>
          Clear filters
        </Button>
        <Button className="rounded-2xl" onClick={onAddBook}>
          <Plus className="mr-2 h-4 w-4" />
          Add Book
        </Button>
      </div>
    </section>
  );
}
