'use client';

import { useMemo, useState } from 'react';
import type { Book, BookCategory } from '@/lib/api/books';
import type { Program } from '@/lib/api/programs';
import { BookFormDialog } from './BookFormDialog';
import { PdfViewerDialog } from './PdfViewerDialog';
import { BookDetailDialog } from './BookDetailDialog';
import type { BookCatalogStockFilter, BookCatalogViewMode } from './book-catalog/book-catalog-types';
import { stripCatalogHtml } from './book-catalog/book-catalog-utils';
import { BookCatalogStatsSection } from './book-catalog/BookCatalogStatsSection';
import { BookCatalogToolbar } from './book-catalog/BookCatalogToolbar';
import { BookCatalogEmptyState } from './book-catalog/BookCatalogEmptyState';
import { BookCatalogGrid } from './book-catalog/BookCatalogGrid';
import { BookCatalogDataTable } from './book-catalog/BookCatalogDataTable';

export function BookCatalogTab({
  books,
  categories,
  programs,
  onRefresh,
}: {
  books: Book[];
  categories: BookCategory[];
  programs: Program[];
  onRefresh: () => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'all' | 'physical' | 'ebook'>('all');
  const [stock, setStock] = useState<BookCatalogStockFilter>('all');
  const [featured, setFeatured] = useState<'all' | 'featured' | 'regular'>('all');
  const [categoryId, setCategoryId] = useState('all');
  const [programId, setProgramId] = useState('all');
  const [viewMode, setViewMode] = useState<BookCatalogViewMode>('grid');
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [pdfBook, setPdfBook] = useState<Book | null>(null);
  const [detailBook, setDetailBook] = useState<Book | null>(null);

  const filtered = useMemo(() => {
    return books.filter((book) => {
      const query = search.toLowerCase().trim();
      const haystack = [
        book.name,
        book.sku,
        book.author || '',
        stripCatalogHtml(book.description),
        book.category?.name || '',
        book.program?.name || '',
      ]
        .join(' ')
        .toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesType = type === 'all' || (type === 'ebook' ? book.isEbook : !book.isEbook);
      const qty = Number(book.centralQty || 0);
      const matchesStock =
        stock === 'all' ||
        (stock === 'in_stock' && (book.isEbook || qty > 10)) ||
        (stock === 'low_stock' && !book.isEbook && qty > 0 && qty <= 10) ||
        (stock === 'out_of_stock' && !book.isEbook && qty <= 0);
      const matchesFeatured =
        featured === 'all' ||
        (featured === 'featured' && Boolean(book.featured)) ||
        (featured === 'regular' && !book.featured);
      const matchesCategory =
        categoryId === 'all' || (categoryId === '__none__' ? !book.categoryId : book.categoryId === categoryId);
      const matchesProgram =
        programId === 'all' || (programId === '__none__' ? !book.programId : book.programId === programId);
      return matchesSearch && matchesType && matchesStock && matchesFeatured && matchesCategory && matchesProgram;
    });
  }, [books, categoryId, featured, programId, search, stock, type]);

  const clearFilters = () => {
    setSearch('');
    setType('all');
    setStock('all');
    setFeatured('all');
    setCategoryId('all');
    setProgramId('all');
  };

  const openCreate = () => {
    setMode('create');
    setSelectedBook(null);
    setFormOpen(true);
  };

  const openEdit = (book: Book) => {
    setMode('edit');
    setSelectedBook(book);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <BookCatalogStatsSection books={books} />

      <BookCatalogToolbar
        search={search}
        onSearchChange={setSearch}
        type={type}
        onTypeChange={setType}
        stock={stock}
        onStockChange={setStock}
        categoryId={categoryId}
        onCategoryIdChange={setCategoryId}
        featured={featured}
        onFeaturedChange={setFeatured}
        programId={programId}
        onProgramIdChange={setProgramId}
        categories={categories}
        programs={programs}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onClearFilters={clearFilters}
        onAddBook={openCreate}
      />

      {filtered.length === 0 ? (
        <BookCatalogEmptyState onClearFilters={clearFilters} onAddBook={openCreate} />
      ) : viewMode === 'grid' ? (
        <BookCatalogGrid
          books={filtered}
          onOpenDetail={setDetailBook}
          onOpenEdit={openEdit}
          onPreviewPdf={setPdfBook}
        />
      ) : (
        <BookCatalogDataTable
          books={filtered}
          onOpenDetail={setDetailBook}
          onOpenEdit={openEdit}
          onPreviewPdf={setPdfBook}
        />
      )}

      <BookFormDialog
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={onRefresh}
        mode={mode}
        book={selectedBook}
        categories={categories}
        programs={programs}
      />
      <BookDetailDialog
        book={detailBook}
        open={Boolean(detailBook)}
        onClose={() => setDetailBook(null)}
        onPreviewPdf={(book) => {
          setDetailBook(null);
          setPdfBook(book);
        }}
      />
      <PdfViewerDialog
        isOpen={Boolean(pdfBook)}
        onClose={() => setPdfBook(null)}
        bookName={pdfBook?.name || ''}
        fileUrl={pdfBook?.fileUrl}
      />
    </div>
  );
}
