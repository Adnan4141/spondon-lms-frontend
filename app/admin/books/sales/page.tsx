'use client';

import { useEffect, useMemo, useState } from 'react';
import { getBranches } from '@/lib/api/branches';
import { getBooks, createBookSale, getBookSales, type Book, type BookSale } from '@/lib/api/books';
import type { Branch } from '@/lib/api/branches';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  CreditCard,
  FileText,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Building2,
  CheckCircle2,
  ShoppingCart,
  BookOpen,
  Warehouse,
  Truck,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface CartItem {
  book: Book;
  qty: number;
  unitPrice: number;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function BookSalesPage() {
  const { toast, toasts, removeToast } = useToast();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [sales, setSales] = useState<BookSale[]>([]);

  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSales, setLoadingSales] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create sale dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [saleBranchId, setSaleBranchId] = useState<string>('');
  const [saleStudentId, setSaleStudentId] = useState<string>('');
  const [saleInvoiceId, setSaleInvoiceId] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedBookForCart, setSelectedBookForCart] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [saleDeliveryEnabled, setSaleDeliveryEnabled] = useState(false);
  const [deliveryRecipientName, setDeliveryRecipientName] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryPostalCode, setDeliveryPostalCode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const resetCreateSaleForm = () => {
    setSaleBranchId('');
    setSaleStudentId('');
    setSaleInvoiceId('');
    setCartItems([]);
    setSelectedBookForCart('');
    setSelectedQty(1);
    setSaleDeliveryEnabled(false);
    setDeliveryRecipientName('');
    setDeliveryPhone('');
    setDeliveryAddress('');
    setDeliveryCity('');
    setDeliveryPostalCode('');
    setDeliveryNotes('');
  };

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

  const loadSales = async () => {
    try {
      setLoadingSales(true);
      setError(null);
      const params: any = {};
      if (selectedBranchId && selectedBranchId !== 'all') params.branchId = selectedBranchId;
      const response = await getBookSales(params);
      if (response.success && response.data) {
        setSales(response.data || []);
      } else {
        setSales([]);
        setError(response.message || 'Failed to load book sales');
      }
    } catch (err: unknown) {
      setSales([]);
      setError(getErrorMessage(err) || 'Failed to load book sales');
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    loadBranches();
    loadBooks();
  }, []);

  useEffect(() => {
    loadSales();
  }, [selectedBranchId]);

  const filteredSales = sales.filter((sale) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const studentName = sale.student?.fullName?.toLowerCase() || '';
    const mobile = sale.student?.mobile || '';
    const branchName = sale.branch?.name.toLowerCase() || '';
    return (
      studentName.includes(q) ||
      mobile.includes(searchQuery) ||
      branchName.includes(q) ||
      (sale.invoiceId || '').toLowerCase().includes(q)
    );
  });

  const handleAddToCart = () => {
    if (!selectedBookForCart) {
      toast({ title: 'Requirement', description: 'Select a material to add to cart', variant: 'destructive' });
      return;
    }
    const book = books.find((b) => b.id === selectedBookForCart);
    if (!book) return;
    if (selectedQty <= 0) {
      toast({ title: 'Invalid Quantity', description: 'Minimum requirement is 1 unit', variant: 'destructive' });
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.book.id === book.id);
      if (existing) {
        return prev.map((item) =>
          item.book.id === book.id ? { ...item, qty: item.qty + selectedQty } : item
        );
      }
      return [...prev, { book, qty: selectedQty, unitPrice: Number(book.price) }];
    });
    setSelectedBookForCart('');
    setSelectedQty(1);
  };

  const handleUpdateCartQty = (bookId: string, qty: number) => {
    setCartItems((prev) => prev.map((item) => item.book.id === bookId ? { ...item, qty: qty || 1 } : item));
  };

  const handleRemoveCartItem = (bookId: string) => {
    setCartItems((prev) => prev.filter((item) => item.book.id !== bookId));
  };

  const cartTotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0), [cartItems]);

  const handleCreateSale = async () => {
    if (!saleBranchId) {
      toast({ title: 'Branch Required', description: 'Please identify the originating branch', variant: 'destructive' });
      return;
    }
    if (cartItems.length === 0) {
      toast({ title: 'Empty Cart', description: 'Add at least one material to the session', variant: 'destructive' });
      return;
    }
    if (saleDeliveryEnabled) {
      const name = deliveryRecipientName.trim();
      const phone = deliveryPhone.trim();
      const address = deliveryAddress.trim();
      if (!name || !phone || !address) {
        toast({
          title: 'Delivery details',
          description: 'Recipient name, phone, and address are required when delivery is enabled.',
          variant: 'destructive',
        });
        return;
      }
    }
    try {
      setCreateSubmitting(true);
      await createBookSale({
        branchId: saleBranchId,
        studentUserId: saleStudentId || undefined,
        invoiceId: saleInvoiceId || undefined,
        items: cartItems.map((item) => ({
          bookId: item.book.id,
          qty: item.qty,
          unitPrice: item.unitPrice,
        })),
        delivery:
          saleDeliveryEnabled
            ? {
                recipientName: deliveryRecipientName.trim(),
                phone: deliveryPhone.trim(),
                address: deliveryAddress.trim(),
                city: deliveryCity.trim() || undefined,
                postalCode: deliveryPostalCode.trim() || undefined,
                notes: deliveryNotes.trim() || undefined,
              }
            : undefined,
      });
      setCreateDialogOpen(false);
      resetCreateSaleForm();
      await loadSales();
      toast({ title: 'Transaction Secured', description: 'The sale has been successfully registered and invoiced.', variant: 'success' });
    } catch (err: unknown) {
      toast({ title: 'Operation Failed', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 text-slate-900">
      {/* Filter & Actions Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap flex-1 items-center gap-4">
            <div className="min-w-[300px] flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="Search by student identity, mobile, or invoice reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                />
              </div>
            </div>
            
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger className="h-12 w-[220px] rounded-2xl border-slate-200 bg-white text-sm font-medium shadow-sm">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                <SelectItem value="all" className="text-sm font-medium">Global Network</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id} className="text-sm font-medium">
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" onClick={loadSales}>
              <RefreshCw className={`h-4 w-4 ${loadingSales ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-slate-200 bg-white px-6 font-black uppercase tracking-widest text-[10px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              onClick={() => window.location.href = '/admin/books'}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Books
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-slate-200 bg-white px-6 font-black uppercase tracking-widest text-[10px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              onClick={() => window.location.href = '/admin/books/stock'}
            >
              <Warehouse className="mr-2 h-4 w-4" />
              Stock Ledger
            </Button>
            <Button
              className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Record Transaction
            </Button>
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Sales Repository</h2>
            <p className="mt-0.5 text-base font-bold text-indigo-500">Consolidated history of material transactions</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Sales
          </div>
        </div>

        {loadingSales ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Loading...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No sale records identified.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Timestamp</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Node</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Beneficiary</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Billing Ref</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Payload</TableHead>
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                    <TableCell className="px-8 py-5">
                       <span className="text-sm font-bold text-slate-600">
                         {new Date(sale.soldAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-bold text-slate-700">{sale.branch?.name || '-'}</span>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{sale.student?.fullName || 'Walk-in'}</span>
                          <span className="text-[10px] font-black uppercase text-slate-400">{sale.student?.mobile || 'No Linked Account'}</span>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       {sale.invoiceId ? (
                         <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                            <FileText className="h-3.5 w-3.5" />
                            {sale.invoiceId.slice(0, 8)}...
                         </div>
                       ) : (
                         <span className="text-[10px] font-black uppercase text-slate-300">Unlinked</span>
                       )}
                    </TableCell>
                    <TableCell className="py-5">
                       <Badge variant="outline" className="rounded-lg bg-slate-50 text-[10px] font-black uppercase tracking-widest">
                         {sale.items?.length || 0} Line Items
                       </Badge>
                    </TableCell>
                    <TableCell className="py-5">
                      {sale.delivery ? (
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="outline"
                            className="w-fit rounded-lg border-emerald-200 bg-emerald-50 text-[10px] font-black uppercase tracking-widest text-emerald-800"
                          >
                            <Truck className="mr-1 inline h-3 w-3" />
                            {sale.delivery.deliveryStatus || 'PENDING'}
                          </Badge>
                          <span className="max-w-[180px] truncate text-[10px] font-bold text-slate-500" title={sale.delivery.recipientName}>
                            {sale.delivery.recipientName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black uppercase text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-8 py-5 text-right font-black text-slate-900 text-base">
                       ৳{Number(sale.totalAmount).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Create Sale Dialog */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) resetCreateSaleForm();
        }}
      >
        <DialogContent className="max-h-[90vh] sm:max-w-5xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>New Sale</DialogTitle>
            <DialogDescription>Record a book sale. An invoice will be created automatically.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 no-scrollbar">
            <div className="space-y-8 py-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Originating Node *</label>
                  <Select value={saleBranchId} onValueChange={setSaleBranchId}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Beneficiary UID (Optional)</label>
                  <Input
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 shadow-inner"
                    value={saleStudentId}
                    onChange={(e) => setSaleStudentId(e.target.value)}
                    placeholder="Student User ID"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">External Invoice Ref</label>
                  <Input
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 shadow-inner"
                    value={saleInvoiceId}
                    onChange={(e) => setSaleInvoiceId(e.target.value)}
                    placeholder="Existing Invoice ID"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-slate-100 bg-slate-50/40 p-5">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="sale-delivery-enabled"
                    checked={saleDeliveryEnabled}
                    onCheckedChange={(checked) => setSaleDeliveryEnabled(Boolean(checked))}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <label htmlFor="sale-delivery-enabled" className="flex cursor-pointer items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-800">
                      <Truck className="h-4 w-4 text-indigo-600" />
                      Record delivery / shipping details
                    </label>
                    <p className="text-xs font-medium text-slate-500">
                      Optional. Creates a delivery record linked to this sale for fulfillment tracking.
                    </p>
                  </div>
                </div>
                {saleDeliveryEnabled && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Recipient name *</label>
                      <Input
                        className="h-11 rounded-2xl border-slate-200 bg-white px-4 text-base font-bold text-slate-900"
                        value={deliveryRecipientName}
                        onChange={(e) => setDeliveryRecipientName(e.target.value)}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Phone *</label>
                      <Input
                        className="h-11 rounded-2xl border-slate-200 bg-white px-4 text-base font-bold text-slate-900"
                        value={deliveryPhone}
                        onChange={(e) => setDeliveryPhone(e.target.value)}
                        placeholder="Contact number"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">City</label>
                      <Input
                        className="h-11 rounded-2xl border-slate-200 bg-white px-4 text-base font-bold text-slate-900"
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Address *</label>
                      <Textarea
                        className="min-h-[88px] rounded-2xl border-slate-200 bg-white px-4 py-3 text-base font-bold text-slate-900"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Street, area, instructions"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Postal code</label>
                      <Input
                        className="h-11 rounded-2xl border-slate-200 bg-white px-4 text-base font-bold text-slate-900"
                        value={deliveryPostalCode}
                        onChange={(e) => setDeliveryPostalCode(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Notes</label>
                      <Textarea
                        className="min-h-[72px] rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Optional internal or courier notes"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                     <ShoppingCart className="h-4 w-4 text-indigo-600" />
                     <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Transaction Cart</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={selectedBookForCart} onValueChange={setSelectedBookForCart}>
                      <SelectTrigger className="h-10 w-[280px] rounded-xl border-slate-200 bg-white font-bold text-sm">
                        <SelectValue placeholder="Select book" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 bg-white shadow-2xl">
                        {books.map((book) => (
                          <SelectItem key={book.id} value={book.id} className="font-medium">{book.name} (৳{Number(book.price)})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      className="h-10 w-20 rounded-xl border-slate-200 font-black text-center"
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(Number(e.target.value || 1))}
                    />
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm" onClick={handleAddToCart}>
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {cartItems.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <ShoppingBag className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cart is currently empty.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-sm bg-white">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-b border-slate-100">
                          <TableHead className="px-6 font-black text-[10px] uppercase tracking-widest text-slate-400">Book</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Qty</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Unit Price</TableHead>
                          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Line Total</TableHead>
                          <TableHead className="px-6 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cartItems.map((item) => (
                          <TableRow key={item.book.id} className="border-slate-50">
                            <TableCell className="px-6 py-4">
                               <div className="flex flex-col">
                                  <span className="font-bold text-slate-900">{item.book.name}</span>
                                  <span className="text-[10px] font-black uppercase text-slate-400">{item.book.sku}</span>
                               </div>
                            </TableCell>
                            <TableCell className="w-24">
                              <Input
                                type="number"
                                min="1"
                                className="h-9 rounded-lg border-slate-200 font-bold text-center"
                                value={item.qty}
                                onChange={(e) => handleUpdateCartQty(item.book.id, Number(e.target.value || 1))}
                              />
                            </TableCell>
                            <TableCell className="font-bold text-slate-600">৳{item.unitPrice.toLocaleString()}</TableCell>
                            <TableCell className="font-black text-slate-900">৳{(item.unitPrice * item.qty).toLocaleString()}</TableCell>
                            <TableCell className="px-6 text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleRemoveCartItem(item.book.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 px-6 py-4">
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                        Total Cart Value
                      </span>
                      <span className="text-xl font-black text-indigo-600 tabular-nums">
                        ৳{cartTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 bg-background border-t shadow-lg mt-auto">
            <Button variant="outline" className="rounded-xl px-6" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl bg-slate-900 px-8 hover:bg-indigo-600 transition-all shadow-lg" onClick={handleCreateSale} disabled={createSubmitting}>
              {createSubmitting ? 'Saving...' : 'Save & Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
