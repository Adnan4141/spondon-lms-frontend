'use client';

import { useEffect, useState } from 'react';
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  type Book,
  type CreateBookDto,
  type UpdateBookDto,
} from '@/lib/api/books';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BookOpen,
  Download,
  Edit,
  Eye,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

type BookFilter = 'all' | 'physical' | 'ebook';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function BooksPage() {
  const { toast, toasts, removeToast } = useToast();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<BookFilter>('all');

  // Dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [bookDetails, setBookDetails] = useState<Book | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState<CreateBookDto>({
    name: '',
    sku: '',
    price: 0,
    isEbook: false,
    fileUrl: '',
  });
  const [editForm, setEditForm] = useState<UpdateBookDto>({
    name: '',
    sku: '',
    price: 0,
    isEbook: false,
    fileUrl: '',
  });
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);

  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBooks();
      if (response.success && response.data) {
        setBooks(response.data);
      } else {
        setBooks([]);
        setError(response.message || 'Failed to load books');
      }
    } catch (err: unknown) {
      setBooks([]);
      setError(getErrorMessage(err) || 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const fetchBookDetails = async (id: string) => {
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      const response = await getBookById(id);
      if (response.success && response.data) {
        const book = response.data;
        setBookDetails(book);
        setEditForm({
          name: book.name,
          sku: book.sku,
          price: book.price,
          isEbook: book.isEbook,
          fileUrl: book.fileUrl || '',
        });
        setEditFile(null);
        return book;
      }
      throw new Error(response.message || 'Failed to load book details');
    } catch (err: unknown) {
      setBookDetails(null);
      setDetailsError(getErrorMessage(err));
      return null;
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewBook = async (id: string) => {
    setViewDialogOpen(true);
    await fetchBookDetails(id);
  };

  const handleEditBook = async (id: string) => {
    setEditDialogOpen(true);
    setEditError(null);
    await fetchBookDetails(id);
  };

  const handleCreateSubmit = async () => {
    if (!createForm.name.trim() || !createForm.sku.trim()) {
      setCreateError('Name and SKU are required');
      toast({
        title: 'Error',
        description: 'Name and SKU are required',
        variant: 'destructive',
      });
      return;
    }
    if (Number.isNaN(createForm.price) || createForm.price < 0) {
      setCreateError('Price must be a non-negative number');
      toast({
        title: 'Error',
        description: 'Price must be a non-negative number',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError(null);
      const payload: CreateBookDto = {
        name: createForm.name.trim(),
        sku: createForm.sku.trim(),
        price: Number(createForm.price),
        isEbook: !!createForm.isEbook,
        fileUrl: createForm.fileUrl || undefined,
      };
      await createBook(payload, createFile || undefined);
      setCreateDialogOpen(false);
      setCreateForm({
        name: '',
        sku: '',
        price: 0,
        isEbook: false,
        fileUrl: '',
      });
      setCreateFile(null);
      await loadBooks();
      toast({
        title: 'Success',
        description: 'Book created successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      const msg = getErrorMessage(err) || 'Failed to create book';
      setCreateError(msg);
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!bookDetails) return;
    if (!editForm.name?.trim() || !editForm.sku?.trim()) {
      setEditError('Name and SKU are required');
      toast({
        title: 'Error',
        description: 'Name and SKU are required',
        variant: 'destructive',
      });
      return;
    }
    if (editForm.price !== undefined && (Number.isNaN(editForm.price) || editForm.price < 0)) {
      setEditError('Price must be a non-negative number');
      toast({
        title: 'Error',
        description: 'Price must be a non-negative number',
        variant: 'destructive',
      });
      return;
    }

    try {
      setEditSubmitting(true);
      setEditError(null);
      const payload: UpdateBookDto = {
        name: editForm.name?.trim(),
        sku: editForm.sku?.trim(),
        price: editForm.price !== undefined ? Number(editForm.price) : undefined,
        isEbook: editForm.isEbook,
        fileUrl: editForm.fileUrl || undefined,
      };
      await updateBook(bookDetails.id, payload, editFile || undefined);
      setEditDialogOpen(false);
      await loadBooks();
      toast({
        title: 'Success',
        description: 'Book updated successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      const msg = getErrorMessage(err) || 'Failed to update book';
      setEditError(msg);
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteBook(id);
      await loadBooks();
      toast({
        title: 'Success',
        description: 'Book deleted successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to delete book',
        variant: 'destructive',
      });
    }
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'ebook' && book.isEbook) ||
      (typeFilter === 'physical' && !book.isEbook);
    return matchesSearch && matchesType;
  });

  const totalBooks = books.length;
  const ebookCount = books.filter((b) => b.isEbook).length;
  const physicalCount = totalBooks - ebookCount;
  const totalStocks = books.reduce((sum, b) => sum + (b._count?.stocks || 0), 0);
  const totalSalesItems = books.reduce((sum, b) => sum + (b._count?.saleItems || 0), 0);

  const isDetailsReady = !!bookDetails && !detailsLoading;

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Books &amp; Materials</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Manage offline books, e-books, and materials used across courses and invoices.
            </p>
          </div>
          <Button className="mt-1 bg-primary hover:bg-primary/90" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Book
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Books</p>
          <p className="mt-2 text-2xl font-semibold">{totalBooks}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Physical Books</p>
          <p className="mt-2 text-2xl font-semibold">{physicalCount}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">E-Books</p>
          <p className="mt-2 text-2xl font-semibold">{ebookCount}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Stock Locations</p>
          <p className="mt-2 text-2xl font-semibold">{totalStocks}</p>
        </article>
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[260px] flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search books by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-border bg-background pl-10"
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as BookFilter)}>
            <SelectTrigger className="h-10 w-[180px] border-border bg-background">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="ebook">E-Books</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10" onClick={loadBooks}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <section className="glass-panel overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Book Catalog</h2>
            <p className="text-xs text-muted-foreground">Browse and maintain all books &amp; materials</p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <BookOpen className="h-4 w-4" />
            <span>{totalBooks} Total Records</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading books...</div>
        ) : filteredBooks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? 'No books found matching your search.' : 'No books found. Add your first book.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>E-Book File</TableHead>
                <TableHead>Stocks</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBooks.map((book) => (
                <TableRow key={book.id} className="hover:bg-muted/45">
                  <TableCell className="font-medium">{book.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{book.sku}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={book.isEbook ? 'secondary' : 'default'}>
                      {book.isEbook ? 'E-Book' : 'Physical'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="tabular-nums">
                      {book.price.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'BDT',
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    {book.isEbook && book.fileUrl ? (
                      <a
                        href={book.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{book._count?.stocks || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{book._count?.saleItems || 0}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewBook(book.id)}
                        title="View Book"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditBook(book.id)}
                        title="Edit Book"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBook(book.id)}
                        title="Delete Book"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {/* Create Book Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Add Book</DialogTitle>
            <DialogDescription>Add a new book or material to the system.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-4 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Book or material name"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKU *</label>
                  <Input
                    value={createForm.sku}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, sku: e.target.value }))}
                    placeholder="Unique SKU"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={createForm.price}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, price: Number(e.target.value || 0) }))
                    }
                    placeholder="Price"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={createForm.isEbook ? 'ebook' : 'physical'}
                    onValueChange={(v) => setCreateForm((prev) => ({ ...prev, isEbook: v === 'ebook' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">Physical Book</SelectItem>
                      <SelectItem value="ebook">E-Book</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-Book File</label>
                  <Input
                    type="file"
                    accept=".pdf,.epub,.mobi,.azw,.txt"
                    onChange={(e) => setCreateFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional. Upload if this is an e-book. Max 500MB.
                  </p>
                </div>
              </div>

              {createError && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                  {createError}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 bg-background border-t shadow-lg mt-auto">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} disabled={createSubmitting}>
              {createSubmitting ? 'Creating...' : 'Add Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Book Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Book Details</DialogTitle>
            <DialogDescription>View complete book information and statistics.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {detailsLoading && <p className="text-sm text-muted-foreground py-6">Loading details...</p>}
            {!detailsLoading && detailsError && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive my-6">
                {detailsError}
              </div>
            )}

            {isDetailsReady && bookDetails && (
              <div className="space-y-5 text-sm py-6">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Basic Information</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Name</p>
                      <p className="mt-1 font-medium">{bookDetails.name}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">SKU</p>
                      <p className="mt-1 font-medium">{bookDetails.sku}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Type</p>
                      <p className="mt-1">
                        <Badge variant={bookDetails.isEbook ? 'secondary' : 'default'}>
                          {bookDetails.isEbook ? 'E-Book' : 'Physical'}
                        </Badge>
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Price</p>
                      <p className="mt-1 font-medium">
                        {bookDetails.price.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'BDT',
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {bookDetails.isEbook && bookDetails.fileUrl && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">E-Book File</p>
                    <a
                      href={bookDetails.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm text-primary hover:bg-muted"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download E-Book</span>
                    </a>
                  </div>
                )}

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Statistics</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Stock Locations</p>
                      <p className="mt-1 text-2xl font-semibold">{bookDetails._count?.stocks || 0}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Total Sale Items</p>
                      <p className="mt-1 text-2xl font-semibold">{bookDetails._count?.saleItems || 0}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Timestamps</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Created At</p>
                      <p className="mt-1 text-sm">
                        {new Date(bookDetails.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Edit Book</DialogTitle>
            <DialogDescription>Update book information and save the changes.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {detailsLoading && <p className="text-sm text-muted-foreground py-6">Loading form...</p>}
            {!detailsLoading && detailsError && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive my-6">
                {detailsError}
              </div>
            )}

            {isDetailsReady && (
              <div className="space-y-4 py-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Book or material name"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">SKU *</label>
                    <Input
                      value={editForm.sku || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, sku: e.target.value }))}
                      placeholder="Unique SKU"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.price !== undefined ? editForm.price : ''}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, price: Number(e.target.value || 0) }))
                      }
                      placeholder="Price"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={editForm.isEbook ? 'ebook' : 'physical'}
                      onValueChange={(v) => setEditForm((prev) => ({ ...prev, isEbook: v === 'ebook' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physical">Physical Book</SelectItem>
                        <SelectItem value="ebook">E-Book</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">E-Book File</label>
                    <Input
                      type="file"
                      accept=".pdf,.epub,.mobi,.azw,.txt"
                      onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload to replace existing e-book file. Leave empty to keep current file.
                    </p>
                  </div>
                </div>

                {editError && (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                    {editError}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 bg-background border-t shadow-lg mt-auto">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={editSubmitting || !isDetailsReady}>
              {editSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

