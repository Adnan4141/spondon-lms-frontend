'use client';

import type { BookCategory } from '@/lib/api/books';
import type { Program } from '@/lib/api/programs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid2X2, List, Plus, Search } from 'lucide-react';
import type { BookCatalogStockFilter, BookCatalogViewMode } from './book-catalog-types';

type BookCatalogToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  type: 'all' | 'physical' | 'ebook';
  onTypeChange: (value: 'all' | 'physical' | 'ebook') => void;
  stock: BookCatalogStockFilter;
  onStockChange: (value: BookCatalogStockFilter) => void;
  categoryId: string;
  onCategoryIdChange: (value: string) => void;
  featured: 'all' | 'featured' | 'regular';
  onFeaturedChange: (value: 'all' | 'featured' | 'regular') => void;
  programId: string;
  onProgramIdChange: (value: string) => void;
  categories: BookCategory[];
  programs: Program[];
  viewMode: BookCatalogViewMode;
  onViewModeChange: (mode: BookCatalogViewMode) => void;
  onClearFilters: () => void;
  onAddBook: () => void;
};

export function BookCatalogToolbar({
  search,
  onSearchChange,
  type,
  onTypeChange,
  stock,
  onStockChange,
  categoryId,
  onCategoryIdChange,
  featured,
  onFeaturedChange,
  programId,
  onProgramIdChange,
  categories,
  programs,
  viewMode,
  onViewModeChange,
  onClearFilters,
  onAddBook,
}: BookCatalogToolbarProps) {
  return (
    <section className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid flex-1 gap-3 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name or SKU"
              className="h-10 rounded-lg pl-9"
            />
          </div>
          <Select value={type} onValueChange={(v) => onTypeChange(v as 'all' | 'physical' | 'ebook')}>
            <SelectTrigger className="h-10 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="ebook">E-Book</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stock} onValueChange={(v) => onStockChange(v as BookCatalogStockFilter)}>
            <SelectTrigger className="h-10 rounded-lg">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryId} onValueChange={onCategoryIdChange}>
            <SelectTrigger className="h-10 rounded-lg">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="__none__">Uncategorized</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={featured} onValueChange={(v) => onFeaturedChange(v as 'all' | 'featured' | 'regular')}>
            <SelectTrigger className="h-10 rounded-lg">
              <SelectValue placeholder="Featured" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Visibility</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="regular">Not Featured</SelectItem>
            </SelectContent>
          </Select>
          <Select value={programId} onValueChange={onProgramIdChange}>
            <SelectTrigger className="h-10 rounded-lg">
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              <SelectItem value="__none__">No Program</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border bg-muted/40 p-1">
            <Button
              type="button"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-md"
              onClick={() => onViewModeChange('grid')}
            >
              <Grid2X2 className="mr-2 h-4 w-4" />
              Grid
            </Button>
            <Button
              type="button"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-md"
              onClick={() => onViewModeChange('table')}
            >
              <List className="mr-2 h-4 w-4" />
              Table
            </Button>
          </div>
          <Button type="button" variant="outline" className="rounded-lg" onClick={onClearFilters}>
            Clear
          </Button>
          <Button type="button" className="rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200" onClick={onAddBook}>
            <Plus className="mr-2 h-4 w-4" />
            Add Book
          </Button>
        </div>
      </div>
    </section>
  );
}
