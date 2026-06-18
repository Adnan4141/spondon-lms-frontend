'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createOfflineBookSale,
  getBooks,
  getBookSales,
  getBookStock,
  type Book,
  type BookSale,
  type BookStock,
  type OfflineBookSaleResponse,
} from '@/lib/api/books';
import { openInvoicePdfInNewTab } from '@/lib/api/invoices';
import { getBranches, type Branch } from '@/lib/api/branches';
import { searchStudentSmsSuggestions, type StudentSmsSuggestion } from '@/lib/api/students';
import { API_ORIGIN } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { BooksRouteHeader } from '@/features/admin/books';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import {
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  Minus,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  UserRound,
} from 'lucide-react';

type CartItem = {
  bookId: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
  available: number;
};

type ActiveTab = 'sale' | 'history';

function money(value: number | string | null | undefined) {
  return `৳${Number(value || 0).toLocaleString()}`;
}

function absolutePdfUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function OfflineBookSalesPageContent() {
  const { toast, toasts, removeToast } = useToast();
  const { user } = useAdminSession();
  const isBranchAdmin = user?.role === 'BRANCH_ADMIN';
  const [branches, setBranches] = useState<Branch[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [stockRows, setStockRows] = useState<BookStock[]>([]);
  const [students, setStudents] = useState<StudentSmsSuggestion[]>([]);
  const [branchId, setBranchId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentSmsSuggestion | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<OfflineBookSaleResponse | null>(null);
  const [discountAmount, setDiscountAmount] = useState('0');
  const [activeTab, setActiveTab] = useState<ActiveTab>('sale');
  const [salesHistory, setSalesHistory] = useState<BookSale[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyBranchId, setHistoryBranchId] = useState('all');
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

  const loadBaseData = useCallback(async () => {
    setLoading(true);
    try {
      const [branchesRes, booksRes] = await Promise.all([getBranches(), getBooks({ isEbook: false })]);
      const allBranches = branchesRes.success && branchesRes.data ? branchesRes.data : [];
      const nextBranches = isBranchAdmin && user?.branchId
        ? allBranches.filter((branch) => branch.id === user.branchId)
        : allBranches;
      setBranches(nextBranches);
      setBooks(booksRes.success && booksRes.data ? booksRes.data.filter((book) => !book.isEbook) : []);
      setBranchId((current) => (isBranchAdmin && user?.branchId ? user.branchId : current || nextBranches[0]?.id || ''));
      setHistoryBranchId((current) => (isBranchAdmin && user?.branchId ? user.branchId : current || 'all'));
    } catch (error) {
      toast({ title: 'Load failed', description: error instanceof Error ? error.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [isBranchAdmin, toast, user?.branchId]);

  const loadBranchStock = useCallback(async (nextBranchId: string) => {
    if (!nextBranchId) {
      setStockRows([]);
      return;
    }
    const res = await getBookStock({ branchId: nextBranchId });
    setStockRows(res.success && res.data ? res.data : []);
  }, []);

  const loadInvoiceHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await getBookSales({
        branchId: historyBranchId === 'all' ? undefined : historyBranchId,
        limit: 100,
      });
      setSalesHistory(res.success && res.data ? res.data : []);
    } catch (error) {
      toast({
        title: 'History load failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setHistoryLoading(false);
    }
  }, [historyBranchId, toast]);

  useEffect(() => {
    void loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    void loadBranchStock(branchId);
    setCart([]);
    setReceipt(null);
  }, [branchId, loadBranchStock]);

  useEffect(() => {
    if (activeTab === 'history') void loadInvoiceHistory();
  }, [activeTab, loadInvoiceHistory]);

  useEffect(() => {
    const query = studentSearch.trim();
    if (query.length < 2) {
      setStudents([]);
      return;
    }
    const timeout = window.setTimeout(async () => {
      setStudentLoading(true);
      try {
        const res = await searchStudentSmsSuggestions({ q: query, limit: 8 });
        setStudents(res.success && res.data ? res.data : []);
      } catch {
        setStudents([]);
      } finally {
        setStudentLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [studentSearch]);

  const stockByBookId = useMemo(
    () => new Map(stockRows.map((row) => [row.bookId, Number(row.stockQty || 0)])),
    [stockRows],
  );

  const visibleBooks = useMemo(() => {
    const query = bookSearch.trim().toLowerCase();
    return books
      .map((book) => ({ book, available: stockByBookId.get(book.id) || 0 }))
      .filter(({ book, available }) => {
        if (available <= 0) return false;
        if (!query) return true;
        return `${book.name} ${book.sku} ${book.author || ''}`.toLowerCase().includes(query);
      })
      .slice(0, 24);
  }, [bookSearch, books, stockByBookId]);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const discount = Math.min(total, Math.max(0, Number(discountAmount || 0)));
  const payableTotal = Math.max(0, total - discount);
  const pdfUrl = absolutePdfUrl(receipt?.pdfUrl || receipt?.invoice.pdfUrl);
  const filteredSalesHistory = salesHistory.filter((sale) => {
    const query = historySearch.trim().toLowerCase();
    if (!query) return true;
    const invoiceNo = sale.invoice?.invoiceNumber || sale.invoiceId || '';
    const student = sale.student?.fullName || '';
    const mobile = sale.student?.mobile || '';
    const booksText = sale.items?.map((item) => `${item.book?.name || ''} ${item.book?.sku || ''}`).join(' ') || '';
    return `${invoiceNo} ${student} ${mobile} ${booksText}`.toLowerCase().includes(query);
  });

  const addToCart = (book: Book, available: number) => {
    setReceipt(null);
    setCart((prev) => {
      const existing = prev.find((item) => item.bookId === book.id);
      if (existing) {
        return prev.map((item) => item.bookId === book.id ? { ...item, qty: Math.min(item.available, item.qty + 1) } : item);
      }
      return [...prev, { bookId: book.id, name: book.name, sku: book.sku, price: Number(book.price), qty: 1, available }];
    });
  };

  const updateQty = (bookId: string, delta: number) => {
    setReceipt(null);
    setCart((prev) => prev.map((item) => (
      item.bookId === bookId ? { ...item, qty: Math.min(item.available, Math.max(1, item.qty + delta)) } : item
    )));
  };

  const resetSale = () => {
    setSelectedStudent(null);
    setStudentSearch('');
    setStudents([]);
    setCart([]);
    setReceipt(null);
    setDiscountAmount('0');
  };

  const submitSale = async () => {
    if (!branchId) {
      toast({ title: 'Select a branch', variant: 'destructive' });
      return;
    }
    if (!selectedStudent) {
      toast({ title: 'Select a student', variant: 'destructive' });
      return;
    }
    if (cart.length === 0) {
      toast({ title: 'Add at least one book', variant: 'destructive' });
      return;
    }
    const invalid = cart.find((item) => item.qty > item.available);
    if (invalid) {
      toast({ title: 'Stock unavailable', description: `${invalid.name} has only ${invalid.available} copies.`, variant: 'destructive' });
      return;
    }
    if (discount < 0 || discount > total) {
      toast({ title: 'Invalid discount', description: 'Discount must be between 0 and the subtotal.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const res = await createOfflineBookSale({
        branchId,
        studentUserId: selectedStudent.id,
        discountAmount: discount,
        items: cart.map((item) => ({ bookId: item.bookId, qty: item.qty })),
      });
      if (!res.success || !res.data) throw new Error(res.message || 'Sale failed');
      setReceipt(res.data);
      toast({ title: 'Paid invoice generated', variant: 'success' });
      await loadBranchStock(branchId);
      await loadInvoiceHistory();
      setCart([]);
    } catch (error) {
      toast({ title: 'Sale failed', description: error instanceof Error ? error.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openInvoicePdf = async (invoiceId?: string | null) => {
    if (!invoiceId) return;
    setPdfLoadingId(invoiceId);
    try {
      await openInvoicePdfInNewTab(invoiceId);
    } catch (error) {
      toast({
        title: 'PDF failed',
        description: error instanceof Error ? error.message : 'Could not open invoice PDF',
        variant: 'destructive',
      });
    } finally {
      setPdfLoadingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-375 space-y-5 px-1 pb-12">
      <Toaster toasts={toasts} removeToast={removeToast} />

      <BooksRouteHeader
        title="Offline Book Sale"
        subtitle="Branch counter sale to student with branch stock validation and paid invoice PDF receipt."
      >
        <Button type="button" variant="outline" className="h-10 gap-2 rounded-xl" onClick={() => { void loadBaseData(); if (branchId) void loadBranchStock(branchId); void loadInvoiceHistory(); }} disabled={loading || historyLoading}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </BooksRouteHeader>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('sale')}
          className={cn(
            'flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-black transition-colors',
            activeTab === 'sale' ? 'bg-sky-700 text-white' : 'text-slate-600 hover:bg-slate-50',
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          New Sale
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={cn(
            'flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-black transition-colors',
            activeTab === 'history' ? 'bg-sky-700 text-white' : 'text-slate-600 hover:bg-slate-50',
          )}
        >
          <ReceiptText className="h-4 w-4" />
          Invoice History
        </button>
      </div>

      {activeTab === 'sale' && receipt ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-emerald-950">Sale completed</h2>
                <p className="mt-1 text-sm font-semibold text-emerald-800">
                  Invoice {receipt.invoice.invoiceNumber || receipt.invoice.id.slice(0, 8)} · {money(receipt.invoice.payableAmount ?? receipt.invoice.paidAmount ?? receipt.invoice.totalAmount)} · {receipt.invoice.status}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {pdfUrl ? (
                <>
                  <Button type="button" className="gap-2 bg-emerald-700 text-white hover:bg-emerald-800" onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}>
                    <FileText className="h-4 w-4" />
                    View PDF
                  </Button>
                  <Button asChild variant="outline" className="gap-2 border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100">
                    <a href={pdfUrl} download>
                      Download PDF
                    </a>
                  </Button>
                </>
              ) : null}
              <Button type="button" variant="outline" className="bg-white" onClick={resetSale}>New Sale</Button>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'history' ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Offline Sale Invoice History</h2>
              <p className="text-xs font-semibold text-slate-500">
                Latest 100 book sale invoices from your allowed branch scope.
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <Select value={historyBranchId} onValueChange={setHistoryBranchId} disabled={isBranchAdmin}>
                <SelectTrigger className="h-10 w-full rounded-xl bg-slate-50 font-bold sm:w-48">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  {!isBranchAdmin ? <SelectItem value="all">All Branches</SelectItem> : null}
                  {branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative min-w-0 flex-1 sm:w-80 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  className="h-10 rounded-xl bg-slate-50 pl-9 font-semibold"
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  placeholder="Invoice, student, mobile, book"
                />
              </div>
              <Button type="button" variant="outline" className="h-10 gap-2 rounded-xl" onClick={() => void loadInvoiceHistory()} disabled={historyLoading}>
                <RefreshCw className={cn('h-4 w-4', historyLoading && 'animate-spin')} />
                Reload
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Books</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3 text-right">Payable</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-14 text-center text-slate-400">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </td>
                  </tr>
                ) : filteredSalesHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-14 text-center text-sm font-bold text-slate-400">
                      No offline sale invoice found.
                    </td>
                  </tr>
                ) : filteredSalesHistory.map((sale) => {
                  const invoice = sale.invoice;
                  const invoiceLabel = invoice?.invoiceNumber || sale.invoiceId?.slice(0, 8) || sale.id.slice(0, 8);
                  const booksText = sale.items?.map((item) => `${item.book?.name || 'Book'} x${item.qty}`).join(', ') || 'No items';
                  const date = invoice?.issuedAt || sale.soldAt || sale.createdAt;
                  return (
                    <tr key={sale.id} className="align-top hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <p className="font-black text-slate-900">{invoiceLabel}</p>
                        <p className="text-xs font-semibold text-slate-400">{sale.id.slice(0, 8)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{sale.student?.fullName || 'Unknown student'}</p>
                        <p className="text-xs font-semibold text-slate-400">{sale.student?.mobile || 'No mobile'}</p>
                      </td>
                      <td className="max-w-80 px-4 py-3">
                        <p className="line-clamp-2 font-semibold text-slate-600">{booksText}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-600">{sale.branch?.name || '-'}</td>
                      <td className="px-4 py-3 text-right font-black text-slate-900">
                        {money(invoice?.payableAmount ?? sale.totalAmount)}
                        {Number(invoice?.discountAmount || sale.discountAmount || 0) > 0 ? (
                          <p className="text-xs font-semibold text-emerald-600">Discount {money(invoice?.discountAmount ?? sale.discountAmount)}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-700">
                          {invoice?.status || 'SALE'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-500">
                        {date ? new Date(date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 rounded-lg bg-white"
                          onClick={() => void openInvoicePdf(sale.invoiceId)}
                          disabled={!sale.invoiceId || pdfLoadingId === sale.invoiceId}
                        >
                          {pdfLoadingId === sale.invoiceId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-5">
          <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Selling Branch</Label>
              <Select value={branchId} onValueChange={setBranchId} disabled={isBranchAdmin}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 font-bold"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Student</Label>
              {selectedStudent ? (
                <div className="flex h-11 items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">{selectedStudent.fullName}</p>
                    <p className="truncate text-xs text-slate-500">
                      {selectedStudent.mobile}
                      {selectedStudent.registrationNumber ? ` · ${selectedStudent.registrationNumber}` : ''}
                      {selectedStudent.branchName ? ` · ${selectedStudent.branchName}` : ''}
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="outline" className="h-8 bg-white" onClick={() => setSelectedStudent(null)}>Change</Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input className="h-11 rounded-xl bg-slate-50 pl-9 font-semibold" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Name, mobile, registration" />
                  {studentSearch.trim().length >= 2 ? (
                    <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                      {studentLoading ? (
                        <div className="flex items-center gap-2 px-3 py-3 text-sm font-semibold text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Searching...</div>
                      ) : students.length === 0 ? (
                        <div className="px-3 py-3 text-sm font-semibold text-slate-400">No student found.</div>
                      ) : students.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                          onClick={() => { setSelectedStudent(student); setStudentSearch(''); setStudents([]); }}
                        >
                          <UserRound className="h-4 w-4 text-sky-600" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-black text-slate-900">{student.fullName}</span>
                            <span className="block truncate text-xs text-slate-500">
                              {student.mobile}
                              {student.registrationNumber ? ` · ${student.registrationNumber}` : ''}
                              {student.branchName ? ` · ${student.branchName}` : ''}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Branch Stock Books</h2>
                <p className="text-xs font-semibold text-slate-500">
                  Only physical books with available stock in the selected selling branch are shown. Students from any branch can be billed.
                </p>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input className="h-10 rounded-xl bg-slate-50 pl-9 font-semibold" value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} placeholder="Search book or SKU" />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : visibleBooks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm font-bold text-slate-400">
                No branch stock books found. Ask Super Admin or Accounts to distribute stock to this branch.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {visibleBooks.map(({ book, available }) => (
                  <article key={book.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="min-h-20">
                      <h3 className="line-clamp-2 text-sm font-black text-slate-900">{book.name}</h3>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{book.sku}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-black text-sky-700">{money(book.price)}</p>
                        <p className="text-xs font-semibold text-slate-500">Stock: {available}</p>
                      </div>
                      <Button type="button" variant="outline" className="rounded-xl bg-white" onClick={() => addToCart(book, available)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Sale Cart</h2>
              <p className="text-xs font-semibold text-slate-500">Paid receipt will be generated.</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>

          <div className="space-y-3">
            {cart.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm font-bold text-slate-400">No books added.</div>
            ) : cart.map((item) => (
              <div key={item.bookId} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">{item.name}</p>
                    <p className="text-xs font-semibold text-slate-500">{item.sku} · {money(item.price)}</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" className="h-8 w-8 p-0 text-rose-600" onClick={() => setCart((prev) => prev.filter((entry) => entry.bookId !== item.bookId))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => updateQty(item.bookId, -1)}><Minus className="h-3.5 w-3.5" /></Button>
                    <span className="w-8 text-center text-sm font-black">{item.qty}</span>
                    <Button type="button" size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => updateQty(item.bookId, 1)} disabled={item.qty >= item.available}><Plus className="h-3.5 w-3.5" /></Button>
                  </div>
                  <p className="text-sm font-black text-slate-900">{money(item.price * item.qty)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm font-bold text-slate-600"><span>Items</span><span>{totalQty}</span></div>
            <div className="mt-2 flex items-center justify-between text-sm font-bold text-slate-600"><span>Subtotal</span><span>{money(total)}</span></div>
            <div className="mt-3 space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Overall Discount</Label>
              <Input
                type="number"
                min="0"
                max={String(total)}
                step="0.01"
                value={discountAmount}
                onChange={(event) => setDiscountAmount(event.target.value)}
                className="h-10 rounded-xl bg-white font-semibold"
                placeholder="0"
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm font-bold text-slate-600"><span>Discount</span><span>- {money(discount)}</span></div>
            <div className="mt-2 flex items-center justify-between text-lg font-black text-slate-950"><span>Payable</span><span>{money(payableTotal)}</span></div>
          </div>

          <Button type="button" className="mt-4 h-11 w-full gap-2 rounded-xl bg-sky-700 text-white hover:bg-sky-800" onClick={() => void submitSale()} disabled={saving || cart.length === 0}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ReceiptText className="h-4 w-4" />}
            Confirm Paid Sale
          </Button>
        </aside>
      </div>
      )}
    </div>
  );
}
