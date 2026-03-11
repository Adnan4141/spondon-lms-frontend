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
import { RefreshCw, Search, Warehouse, ArrowRight, Layers, Package, Database, BookOpen, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

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

  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [bookFilter, setBookFilter] = useState<string>('all');
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
      if (branchFilter && branchFilter !== 'all') params.branchId = branchFilter;
      if (bookFilter && bookFilter !== 'all') params.bookId = bookFilter;
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
  const physicalBooksCount = books.filter(b => !b.isEbook).length;

  return (
    <div className="space-y-8 text-slate-900">
      {/* Stats Section */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Stock Nodes', value: totalLocations, color: 'from-blue-600 to-cyan-500', icon: Warehouse },
          { label: 'Total Inventory', value: totalQty, color: 'from-emerald-600 to-teal-500', icon: Package },
          { label: 'Physical Titles', value: physicalBooksCount, color: 'from-purple-600 to-indigo-600', icon: Database },
          { label: 'Active Branches', value: branches.length, color: 'from-rose-600 to-pink-600', icon: Layers },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl">
             <div className="flex items-center justify-between">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg group-hover:scale-110 transition-transform", stat.color)}>
                   <stat.icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-200 group-hover:text-indigo-500 transition-colors" />
             </div>
             <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="mt-1 text-3xl font-black text-slate-900">{stat.value}</p>
             </div>
          </div>
        ))}
      </section>

      {/* Filter & Actions Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap flex-1 items-center gap-4">
            <div className="min-w-[300px] flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="Search by book title, SKU, or branch location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                />
              </div>
            </div>
            
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white text-sm font-medium shadow-sm">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                <SelectItem value="all" className="text-sm font-medium">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id} className="text-sm font-medium">
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={bookFilter} onValueChange={setBookFilter}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white text-sm font-medium shadow-sm">
                <SelectValue placeholder="All Titles" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                <SelectItem value="all" className="text-sm font-medium">All Titles</SelectItem>
                {books.map((book) => (
                  <SelectItem key={book.id} value={book.id} className="text-sm font-medium">
                    {book.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" onClick={loadStocks}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-slate-200 bg-white px-6 font-black uppercase tracking-widest text-[10px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              onClick={() => window.location.href = '/admin/books'}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Material Catalog
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-slate-200 bg-white px-6 font-black uppercase tracking-widest text-[10px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              onClick={() => window.location.href = '/admin/books/sales'}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Sales History
            </Button>
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Stock Ledger</h2>
            <p className="mt-0.5 text-base font-bold text-indigo-500">Real-time inventory levels across nodes</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {totalQty} Total Units
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Synchronizing Ledger...</p>
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No stock records identified.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Material & SKU</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Branch Node</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Inventory Level</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Classification</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Last Sync</TableHead>
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Maintain</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStocks.map((stock) => {
                  const isEditing = editStockId === stock.id;
                  return (
                    <TableRow key={stock.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                      <TableCell className="px-8 py-5">
                         <div className="flex flex-col">
                            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{stock.book?.name || '-'}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stock.book?.sku || 'N/A'}</span>
                         </div>
                      </TableCell>
                      <TableCell className="py-5">
                         <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-bold text-slate-700">{stock.branch?.name || '-'}</span>
                         </div>
                      </TableCell>
                      <TableCell className="py-5">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            className="h-10 w-24 rounded-xl border-indigo-200 bg-white font-bold text-indigo-600 focus:ring-4 focus:ring-indigo-500/10 shadow-sm"
                            value={editQty}
                            onChange={(e) => setEditQty(Number(e.target.value || 0))}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                             <div className={cn("h-2 w-2 rounded-full", stock.stockQty > 10 ? "bg-emerald-500" : stock.stockQty > 0 ? "bg-amber-500" : "bg-rose-500")} />
                             <span className="text-base font-black text-slate-900 tabular-nums">{stock.stockQty}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-5">
                         <Badge variant="outline" className={cn("rounded-lg text-[10px] font-black uppercase tracking-widest px-2.5 py-1", stock.book?.isEbook ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-slate-50 text-slate-600 border-slate-100")}>
                           {stock.book?.isEbook ? 'Digital' : 'Physical'}
                         </Badge>
                      </TableCell>
                      <TableCell className="py-5">
                         <span className="text-sm font-bold text-slate-400">
                           {new Date(stock.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                         </span>
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        <div className="flex justify-center">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-xl border-slate-200 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 shadow-sm"
                                onClick={() => { setEditStockId(null); setEditQty(0); }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 rounded-xl bg-indigo-600 px-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                                onClick={handleSubmitEdit}
                                disabled={editSubmitting}
                              >
                                {editSubmitting ? 'Sync...' : 'Commit'}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                              onClick={() => handleStartEdit(stock)}
                            >
                              Adjust
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
