'use client';

import { useCallback, useEffect, useState } from 'react';
import { getBranches } from '@/lib/api/branches';
import {
  getBooks,
  getBookStock,
  updateBookStock,
  getCentralStock,
  getDistributions,
  createDistribution,
  type Book,
  type BookStock,
  type CentralStockBook,
  type BookDistribution,
} from '@/lib/api/books';
import type { Branch } from '@/lib/api/branches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  RefreshCw,
  Search,
  BookOpen,
  ShoppingBag,
  Building2,
  Package,
  ArrowRight,
  Plus,
  Warehouse,
  History,
  Send,
} from 'lucide-react';

type TabKey = 'branch-stock' | 'central-stock' | 'distribution-history';

const TABS: { key: TabKey; label: string; icon: typeof Package }[] = [
  { key: 'branch-stock', label: 'Branch Stock', icon: Building2 },
  { key: 'central-stock', label: 'Central Stock', icon: Warehouse },
  { key: 'distribution-history', label: 'Distribution History', icon: History },
];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

// ─── Distribute Modal ─────────────────────────────────────────────────────────

function DistributeModal({
  centralBooks,
  branches,
  onSuccess,
  onCancel,
}: {
  centralBooks: CentralStockBook[];
  branches: Branch[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [bookId, setBookId] = useState('');
  const [toBranchId, setToBranchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBook = centralBooks.find((b) => b.id === bookId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!bookId) { setError('Select a book.'); return; }
    if (!toBranchId) { setError('Select a target branch.'); return; }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) { setError('Enter a valid quantity.'); return; }
    if (selectedBook && qty > selectedBook.centralQty) {
      setError(`Only ${selectedBook.centralQty} units available in central stock.`); return;
    }
    setSubmitting(true);
    try {
      const res = await createDistribution({ bookId, toBranchId, quantity: qty, note: note || undefined });
      if (!res.success) throw new Error((res as any).message || 'Failed');
      toast({ title: 'Books distributed', description: `${qty} units → ${branches.find((b) => b.id === toBranchId)?.name}`, variant: 'success' });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = 'h-10 rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}

      <div>
        <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Book *</Label>
        <Select value={bookId || 'none'} onValueChange={(v) => setBookId(v === 'none' ? '' : v)}>
          <SelectTrigger className={cn(inputCls, 'mt-1')}><SelectValue placeholder="Select book…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select book…</SelectItem>
            {centralBooks.map((b) => (
              <SelectItem key={b.id} value={b.id} disabled={b.centralQty === 0}>
                {b.name} (Central: {b.centralQty})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedBook && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-bold text-amber-800">
          Central stock available: <span className="text-amber-900 font-black">{selectedBook.centralQty} units</span>
        </div>
      )}

      <div>
        <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Target Branch *</Label>
        <Select value={toBranchId || 'none'} onValueChange={(v) => setToBranchId(v === 'none' ? '' : v)}>
          <SelectTrigger className={cn(inputCls, 'mt-1')}><SelectValue placeholder="Select branch…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select branch…</SelectItem>
            {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Quantity *</Label>
        <Input
          type="number" min="1"
          className={cn(inputCls, 'mt-1')}
          placeholder="Units to distribute"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
      </div>

      <div>
        <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Note (optional)</Label>
        <Input className={cn(inputCls, 'mt-1')} placeholder="e.g. For HSC batch 2026" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" className="bg-teal-600 text-white hover:bg-teal-700 hover:text-white gap-2" disabled={submitting}>
          {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Distribute
        </Button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookStockPage() {
  const { toast, toasts, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('branch-stock');

  const [branches, setBranches] = useState<Branch[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  // Branch stock state
  const [stocks, setStocks] = useState<BookStock[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [bookFilter, setBookFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editStockId, setEditStockId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Central stock state
  const [centralBooks, setCentralBooks] = useState<CentralStockBook[]>([]);
  const [centralLoading, setCentralLoading] = useState(false);
  const [distributeOpen, setDistributeOpen] = useState(false);

  // Distribution history state
  const [distributions, setDistributions] = useState<BookDistribution[]>([]);
  const [distLoading, setDistLoading] = useState(false);
  const [distTotal, setDistTotal] = useState(0);

  const loadMeta = useCallback(async () => {
    const [bRes, bookRes] = await Promise.all([getBranches(), getBooks()]);
    if (bRes.success && bRes.data) setBranches(bRes.data);
    if (bookRes.success && bookRes.data) setBooks(bookRes.data);
  }, []);

  const loadStocks = useCallback(async () => {
    setStockLoading(true);
    try {
      const params: any = {};
      if (branchFilter !== 'all') params.branchId = branchFilter;
      if (bookFilter !== 'all') params.bookId = bookFilter;
      const res = await getBookStock(params);
      if (res.success && res.data) setStocks(res.data);
    } catch { toast({ title: 'Failed to load stock', variant: 'destructive' }); }
    finally { setStockLoading(false); }
  }, [branchFilter, bookFilter, toast]);

  const loadCentral = useCallback(async () => {
    setCentralLoading(true);
    try {
      const res = await getCentralStock();
      if (res.success) setCentralBooks(res.data);
    } catch { toast({ title: 'Failed to load central stock', variant: 'destructive' }); }
    finally { setCentralLoading(false); }
  }, [toast]);

  const loadDistributions = useCallback(async () => {
    setDistLoading(true);
    try {
      const res = await getDistributions({ limit: 100 });
      if (res.success) { setDistributions(res.data); setDistTotal(res.total); }
    } catch { toast({ title: 'Failed to load distributions', variant: 'destructive' }); }
    finally { setDistLoading(false); }
  }, [toast]);

  useEffect(() => { void loadMeta(); }, [loadMeta]);
  useEffect(() => { void loadStocks(); }, [loadStocks]);

  useEffect(() => {
    if (activeTab === 'central-stock') void loadCentral();
    if (activeTab === 'distribution-history') void loadDistributions();
  }, [activeTab, loadCentral, loadDistributions]);

  async function handleSubmitEdit() {
    if (!editStockId) return;
    const stock = stocks.find((s) => s.id === editStockId);
    if (!stock) return;
    try {
      setEditSubmitting(true);
      await updateBookStock({ bookId: stock.bookId, branchId: stock.branchId, stockQty: editQty });
      setEditStockId(null);
      setEditQty(0);
      await loadStocks();
      toast({ title: 'Stock updated', variant: 'success' });
    } catch (err) {
      toast({ title: 'Update failed', description: getErrorMessage(err), variant: 'destructive' });
    } finally { setEditSubmitting(false); }
  }

  const filteredStocks = stocks.filter((stock) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      (stock.book?.name || '').toLowerCase().includes(q) ||
      (stock.book?.sku || '').toLowerCase().includes(q) ||
      (stock.branch?.name || '').toLowerCase().includes(q)
    );
  });

  const centralTotalQty = centralBooks.reduce((s, b) => s + b.centralQty, 0);
  const centralBooksWithStock = centralBooks.filter((b) => b.centralQty > 0).length;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-200">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Book Inventory</h1>
            <p className="text-sm text-slate-500 font-medium">Central warehouse, branch stock, and distribution</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/books'} className="gap-2">
            <BookOpen className="h-4 w-4" />
            Books
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/books/sales'} className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Sales
          </Button>
          <Button
            onClick={() => { setDistributeOpen(true); if (centralBooks.length === 0) void loadCentral(); }}
            className="gap-2 bg-teal-600 text-white hover:bg-teal-700 hover:text-white focus-visible:text-white"
          >
            <ArrowRight className="h-4 w-4" />
            Distribute books
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                activeTab === tab.key
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Branch Stock Tab */}
      {activeTab === 'branch-stock' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search book, SKU or branch…"
                className="pl-9 h-10 rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-10 w-40 rounded-xl text-sm"><SelectValue placeholder="All Branches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={bookFilter} onValueChange={setBookFilter}>
              <SelectTrigger className="h-10 w-44 rounded-xl text-sm"><SelectValue placeholder="All Titles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Titles</SelectItem>
                {books.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={loadStocks} disabled={stockLoading} className="gap-2">
              <RefreshCw className={cn('h-4 w-4', stockLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {stockLoading ? (
              <div className="py-16 text-center"><RefreshCw className="h-6 w-6 animate-spin text-teal-400 mx-auto" /></div>
            ) : filteredStocks.length === 0 ? (
              <div className="py-20 text-center text-sm font-bold text-slate-400">No stock records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow>
                      {['Book', 'Branch', 'Stock Qty', 'Type', 'Updated', 'Actions'].map((h) => (
                        <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStocks.map((stock) => {
                      const isEditing = editStockId === stock.id;
                      return (
                        <TableRow key={stock.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                          <TableCell className="py-4">
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">{stock.book?.name || '—'}</p>
                              <p className="text-[10px] font-mono font-bold text-slate-400">{stock.book?.sku || ''}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                              <Building2 className="h-3.5 w-3.5 text-slate-400" />
                              {stock.branch?.name || '—'}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {isEditing ? (
                              <Input
                                type="number" min="0"
                                className="h-9 w-24 rounded-xl border-teal-200 bg-white font-bold text-teal-700 text-sm"
                                value={editQty}
                                onChange={(e) => setEditQty(Number(e.target.value || 0))}
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className={cn('h-2 w-2 rounded-full', stock.stockQty > 10 ? 'bg-emerald-500' : stock.stockQty > 0 ? 'bg-amber-400' : 'bg-rose-400')} />
                                <span className="text-base font-black text-slate-900 tabular-nums">{stock.stockQty}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant="outline" className={cn('rounded-full text-[10px] font-black uppercase px-2', stock.book?.isEbook ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100')}>
                              {stock.book?.isEbook ? 'Digital' : 'Physical'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 text-xs font-semibold text-slate-400">
                            {new Date(stock.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </TableCell>
                          <TableCell className="py-4">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setEditStockId(null); setEditQty(0); }}>Cancel</Button>
                                <Button size="sm" className="h-8 bg-teal-600 text-white hover:bg-teal-700 hover:text-white text-xs" onClick={handleSubmitEdit} disabled={editSubmitting}>
                                  {editSubmitting ? 'Saving…' : 'Save'}
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline" size="sm"
                                className="h-8 text-xs hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all"
                                onClick={() => { setEditStockId(stock.id); setEditQty(stock.stockQty); }}
                              >
                                Edit qty
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Central Stock Tab */}
      {activeTab === 'central-stock' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-2xl font-black text-teal-600">{centralTotalQty}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">Total Central Units</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-2xl font-black text-indigo-600">{centralBooks.length}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">Total Books</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-2xl font-black text-emerald-600">{centralBooksWithStock}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">Books In Stock</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={loadCentral} disabled={centralLoading} className="gap-2">
              <RefreshCw className={cn('h-4 w-4', centralLoading && 'animate-spin')} />
              Refresh
            </Button>
            <Button onClick={() => setDistributeOpen(true)} className="gap-2 bg-teal-600 text-white hover:bg-teal-700 hover:text-white">
              <Send className="h-4 w-4" />
              Distribute
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {centralLoading ? (
              <div className="py-16 text-center"><RefreshCw className="h-6 w-6 animate-spin text-teal-400 mx-auto" /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow>
                      {['Book', 'SKU', 'Central Stock', 'Branch Stock (total)', 'Branch Breakdown'].map((h) => (
                        <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {centralBooks.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-400 text-sm font-bold">No books found.</TableCell></TableRow>
                    ) : centralBooks.map((book) => (
                      <TableRow key={book.id} className="hover:bg-slate-50/60">
                        <TableCell className="font-bold text-slate-900">{book.name}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{book.sku}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={cn('h-2 w-2 rounded-full', book.centralQty > 20 ? 'bg-emerald-500' : book.centralQty > 0 ? 'bg-amber-400' : 'bg-rose-400')} />
                            <span className={cn('text-base font-black tabular-nums', book.centralQty === 0 ? 'text-rose-500' : 'text-slate-900')}>{book.centralQty}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-black text-indigo-600 text-base">{book.totalBranchStock}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {book.branchStock.length === 0
                              ? <span className="text-xs text-slate-300">No branch stock</span>
                              : book.branchStock.map((s) => (
                                <span key={s.branchId} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                  <Building2 className="h-3 w-3" />
                                  {s.branchName}: {s.qty}
                                </span>
                              ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Distribution History Tab */}
      {activeTab === 'distribution-history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500">{distTotal} distribution records</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadDistributions} disabled={distLoading} className="gap-2">
                <RefreshCw className={cn('h-4 w-4', distLoading && 'animate-spin')} />
                Refresh
              </Button>
              <Button onClick={() => setDistributeOpen(true)} className="gap-2 bg-teal-600 text-white hover:bg-teal-700 hover:text-white">
                <Plus className="h-4 w-4" />
                New distribution
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {distLoading ? (
              <div className="py-16 text-center"><RefreshCw className="h-6 w-6 animate-spin text-teal-400 mx-auto" /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow>
                      {['Date', 'Book', 'From', 'To Branch', 'Qty', 'Note'].map((h) => (
                        <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributions.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="py-12 text-center text-slate-400 text-sm font-bold">No distributions yet.</TableCell></TableRow>
                    ) : distributions.map((d) => (
                      <TableRow key={d.id} className="hover:bg-slate-50/60">
                        <TableCell className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                          {new Date(d.distributedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-slate-900">{d.book?.name ?? '—'}</p>
                          <p className="text-[10px] font-mono text-slate-400">{d.book?.sku}</p>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            <Warehouse className="h-3 w-3" />
                            {d.fromBranchId ? 'Branch' : 'Central'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            {d.toBranch?.name ?? '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-teal-100 text-teal-700 rounded-full font-black text-[10px] px-2">{d.quantity}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 italic">{d.note || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Distribute Modal */}
      <Dialog open={distributeOpen} onOpenChange={(o) => { if (!o) setDistributeOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black flex items-center gap-2">
              <Send className="h-5 w-5 text-teal-600" />
              Distribute Books
            </DialogTitle>
          </DialogHeader>
          <DistributeModal
            centralBooks={centralBooks}
            branches={branches}
            onSuccess={async () => {
              setDistributeOpen(false);
              await Promise.all([loadCentral(), loadStocks(), loadDistributions()]);
            }}
            onCancel={() => setDistributeOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
