'use client';

import { useEffect, useState } from 'react';
import { getBranches } from '@/lib/api/branches';
import { getBooks, getBookStock, updateBookStock, type Book, type BookStock } from '@/lib/api/books';
import type { Branch } from '@/lib/api/branches';
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
import { RefreshCw, Search, Warehouse } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function BookStockPage() {
  const { toast, toasts, removeToast } = useToast();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [stocks, setStocks] = useState<BookStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [branchFilter, setBranchFilter] = useState<string>('');
  const [bookFilter, setBookFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const [editStockId, setEditStockId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadBranches = async () => {
    try {
      const response = await getBranches();
      if (response.success && response.data) {
        setBranches(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  };

  const loadBooks = async () => {
    try {
      const response = await getBooks();
      if (response.success && response.data) {
        setBooks(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load books:', err);
    }
  };

  const loadStocks = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (branchFilter) params.branchId = branchFilter;
      if (bookFilter) params.bookId = bookFilter;
      const response = await getBookStock(params);
      if (response.success && response.data) {
        setStocks(response.data || []);
      } else {
        setStocks([]);
        setError(response.message || 'Failed to load stock data');
      }
    } catch (err: unknown) {
      setStocks([]);
      setError(getErrorMessage(err) || 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
    loadBooks();
  }, []);

  useEffect(() => {
    loadStocks();
  }, [branchFilter, bookFilter]);

  const handleStartEdit = (stock: BookStock) => {
    setEditStockId(stock.id);
    setEditQty(stock.stockQty);
  };

  const handleSubmitEdit = async () => {
    if (!editStockId) return;
    const stock = stocks.find((s) => s.id === editStockId);
    if (!stock) return;
    try {
      setEditSubmitting(true);
      await updateBookStock({
        bookId: stock.bookId,
        branchId: stock.branchId,
        stockQty: editQty,
      });
      setEditStockId(null);
      setEditQty(0);
      await loadStocks();
      toast({
        title: 'Success',
        description: 'Book stock updated successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to update stock',
        variant: 'destructive',
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  const filteredStocks = stocks.filter((stock) => {
    const q = searchQuery.toLowerCase();
    const bookName = stock.book?.name.toLowerCase() || '';
    const sku = stock.book?.sku.toLowerCase() || '';
    const branchName = stock.branch?.name.toLowerCase() || '';
    return (
      !q ||
      bookName.includes(q) ||
      sku.includes(q) ||
      branchName.includes(q)
    );
  });

  const totalLocations = stocks.length;
  const totalQty = stocks.reduce((sum, s) => sum + s.stockQty, 0);

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Book Stock</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Manage book and material stock levels per branch for the offline selling system.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Stock Locations</p>
          <p className="mt-2 text-2xl font-semibold">{totalLocations}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Quantity</p>
          <p className="mt-2 text-2xl font-semibold">{totalQty}</p>
        </article>
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <div className="flex flex-wrap gap-4">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by book, SKU, or branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 border-border bg-background pl-10"
            />
          </div>
          <div className="min-w-[200px]">
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-10 border-border bg-background">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[200px]">
            <Select value={bookFilter} onValueChange={setBookFilter}>
              <SelectTrigger className="h-10 border-border bg-background">
                <SelectValue placeholder="All books" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All books</SelectItem>
                {books.map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.name} ({book.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="h-10" onClick={loadStocks}>
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
            <h2 className="text-base font-semibold tracking-tight">Branch-wise Stock</h2>
            <p className="text-xs text-muted-foreground">
              View and update stock levels for each book at each branch.
            </p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <Warehouse className="h-4 w-4" />
            <span>{totalLocations} Locations</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading stock...</div>
        ) : filteredStocks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? 'No stock records match your search.' : 'No stock records found.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Book</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStocks.map((stock) => {
                const isEditing = editStockId === stock.id;
                return (
                  <TableRow key={stock.id} className="hover:bg-muted/45">
                    <TableCell className="font-medium">
                      {stock.book?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {stock.book?.sku ? (
                        <Badge variant="outline">{stock.book.sku}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={stock.book?.isEbook ? 'secondary' : 'default'}>
                        {stock.book?.isEbook ? 'E-Book' : 'Physical'}
                      </Badge>
                    </TableCell>
                    <TableCell>{stock.branch?.name || '-'}</TableCell>
                    <TableCell className="w-32">
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          value={editQty}
                          onChange={(e) => setEditQty(Number(e.target.value || 0))}
                        />
                      ) : (
                        <span className="tabular-nums">{stock.stockQty}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(stock.updatedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditStockId(null);
                              setEditQty(0);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSubmitEdit}
                            disabled={editSubmitting}
                          >
                            {editSubmitting ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(stock)}
                        >
                          Adjust
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

