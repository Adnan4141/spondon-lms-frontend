'use client';

import { useMemo, useState } from 'react';
import type { Book, BookCategory } from '@/lib/api/books';
import type { Program } from '@/lib/api/programs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, Eye, FileText, Grid2X2, List, PackageOpen, PencilLine, Plus, Search, Star } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { BookFormDialog } from './BookFormDialog';
import { PdfViewerDialog } from './PdfViewerDialog';
import { BookDetailDialog } from './BookDetailDialog';

type ViewMode = 'grid' | 'table';
type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

function stockState(book: Book): { label: string; className: string } {
  if (book.isEbook) return { label: 'Digital', className: 'border-sky-200 bg-sky-50 text-sky-700' };
  const qty = Number(book.centralQty || 0);
  if (qty <= 0) return { label: 'Out of stock', className: 'border-rose-200 bg-rose-50 text-rose-700' };
  if (qty <= 10) return { label: 'Low stock', className: 'border-amber-200 bg-amber-50 text-amber-700' };
  return { label: 'In stock', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
}

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
  const [stock, setStock] = useState<StockFilter>('all');
  const [featured, setFeatured] = useState<'all' | 'featured' | 'regular'>('all');
  const [categoryId, setCategoryId] = useState('all');
  const [programId, setProgramId] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [pdfBook, setPdfBook] = useState<Book | null>(null);
  const [detailBook, setDetailBook] = useState<Book | null>(null);

  const filtered = useMemo(() => {
    return books.filter((book) => {
      const query = search.toLowerCase().trim();
      const matchesSearch = !query || book.name.toLowerCase().includes(query) || book.sku.toLowerCase().includes(query);
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
      const matchesCategory = categoryId === 'all' || (categoryId === '__none__' ? !book.categoryId : book.categoryId === categoryId);
      const matchesProgram = programId === 'all' || (programId === '__none__' ? !book.programId : book.programId === programId);
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
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard label="Total Books" value={books.length} icon={BookOpen} sub="All physical and digital titles" />
        <StatsCard label="Physical" value={books.filter((book) => !book.isEbook).length} icon={BookOpen} variant="green" />
        <StatsCard label="Ebooks" value={books.filter((book) => book.isEbook).length} icon={FileText} variant="blue" />
        <StatsCard label="Featured" value={books.filter((book) => book.featured).length} icon={Star} variant="orange" />
      </div>

      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid flex-1 gap-3 lg:grid-cols-6">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or SKU" className="pl-9" />
            </div>
            <Select value={type} onValueChange={(value) => setType(value as 'all' | 'physical' | 'ebook')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="physical">Physical</SelectItem>
                <SelectItem value="ebook">E-Book</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stock} onValueChange={(value) => setStock(value as StockFilter)}>
              <SelectTrigger><SelectValue placeholder="Stock" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="__none__">Uncategorized</SelectItem>
                {categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={featured} onValueChange={(value) => setFeatured(value as 'all' | 'featured' | 'regular')}>
              <SelectTrigger><SelectValue placeholder="Featured" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="regular">Not Featured</SelectItem>
              </SelectContent>
            </Select>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger><SelectValue placeholder="Program" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                <SelectItem value="__none__">No Program</SelectItem>
                {programs.map((program) => <SelectItem key={program.id} value={program.id}>{program.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-2xl border border-border bg-muted/40 p-1">
              <Button type="button" variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" className="rounded-xl" onClick={() => setViewMode('grid')}>
                <Grid2X2 className="mr-2 h-4 w-4" />
                Grid
              </Button>
              <Button type="button" variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" className="rounded-xl" onClick={() => setViewMode('table')}>
                <List className="mr-2 h-4 w-4" />
                Table
              </Button>
            </div>
            <Button type="button" variant="outline" className="rounded-2xl" onClick={clearFilters}>Clear</Button>
            <Button
              className="rounded-2xl"
              onClick={openCreate}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Book
            </Button>
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <section className="flex min-h-80 flex-col items-center justify-center rounded-[28px] border border-dashed border-border bg-card p-8 text-center">
          <div className="rounded-full bg-muted p-4 text-muted-foreground">
            <PackageOpen className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-xl font-black">No books match this view</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">Try clearing filters or add a new catalog item with cover, category, price, and inventory details.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={clearFilters}>Clear filters</Button>
            <Button className="rounded-2xl" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Book</Button>
          </div>
        </section>
      ) : viewMode === 'grid' ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((book) => {
            const state = stockState(book);
            return (
              <article key={book.id} className="group overflow-hidden rounded-[28px] border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative aspect-[16/10] bg-muted">
                {book.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.thumbnailUrl} alt={book.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl font-black text-muted-foreground">{book.name.slice(0, 1)}</div>
                )}
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                <Badge className={state.className} variant="outline">{state.label}</Badge>
                {book.featured ? <Badge className="border-amber-500/20 bg-amber-50 text-amber-700">Featured</Badge> : null}
              </div>
              <div className="absolute bottom-3 right-3 rounded-2xl bg-background/95 px-3 py-1.5 text-lg font-black text-primary shadow-sm">
                ৳{Number(book.price).toLocaleString()}
              </div>
                </div>
                <div className="space-y-4 p-5">
                <div>
                  <h3 className="line-clamp-2 text-lg font-black text-foreground">{book.name}</h3>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{book.sku}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{book.isEbook ? 'E-Book' : 'Physical'}</Badge>
                  {book.category ? <Badge variant="outline">{book.category.name}</Badge> : null}
                  {book.program ? <Badge variant="outline">{book.program.name}</Badge> : null}
                </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl border border-border bg-muted/30 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Central</p>
                  <p className="mt-1 font-black text-foreground">{book.isEbook ? 'Digital' : Number(book.centralQty || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/30 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Linked</p>
                  <p className="mt-1 font-black text-foreground">{book.courseBooks?.length || 0} courses</p>
                </div>
              </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailBook(book)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEdit(book)}
              >
                <PencilLine className="mr-2 h-4 w-4" />
                Edit
              </Button>
              {book.isEbook && book.fileUrl ? (
                <Button variant="outline" size="sm" onClick={() => setPdfBook(book)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              ) : null}
            </div>
                </div>
              </article>
            );
          })}
      </section>
      ) : (
        <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((book) => {
                const state = stockState(book);
                return (
                  <TableRow key={book.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-9 overflow-hidden rounded-xl bg-muted">
                          {book.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={book.thumbnailUrl} alt={book.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm font-black text-muted-foreground">{book.name.slice(0, 1)}</div>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-foreground">{book.name}</p>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{book.sku}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{book.category?.name || 'Uncategorized'}</TableCell>
                    <TableCell><Badge variant="outline">{book.isEbook ? 'E-Book' : 'Physical'}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={state.className}>{book.isEbook ? 'Digital' : `${book.centralQty || 0} · ${state.label}`}</Badge></TableCell>
                    <TableCell className="text-right font-black text-primary">৳{Number(book.price).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDetailBook(book)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(book)}><PencilLine className="h-4 w-4" /></Button>
                        {book.isEbook && book.fileUrl ? <Button variant="outline" size="sm" onClick={() => setPdfBook(book)}><FileText className="h-4 w-4" /></Button> : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </section>
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
      <PdfViewerDialog isOpen={Boolean(pdfBook)} onClose={() => setPdfBook(null)} bookName={pdfBook?.name || ''} fileUrl={pdfBook?.fileUrl} />
    </div>
  );
}
