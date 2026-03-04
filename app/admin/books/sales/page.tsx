'use client';

import { useEffect, useMemo, useState } from 'react';
import { getBranches } from '@/lib/api/branches';
import { getBooks, createBookSale, getBookSales, type Book, type BookSale } from '@/lib/api/books';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

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

  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
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
      if (selectedBranchId) params.branchId = selectedBranchId;
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

  const totalSales = sales.length;
  const totalAmount = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  const handleAddToCart = () => {
    if (!selectedBookForCart) {
      toast({
        title: 'Error',
        description: 'Select a book to add to the cart',
        variant: 'destructive',
      });
      return;
    }
    const book = books.find((b) => b.id === selectedBookForCart);
    if (!book) return;
    if (selectedQty <= 0) {
      toast({
        title: 'Error',
        description: 'Quantity must be at least 1',
        variant: 'destructive',
      });
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.book.id === book.id);
      if (existing) {
        return prev.map((item) =>
          item.book.id === book.id
            ? { ...item, qty: item.qty + selectedQty }
            : item,
        );
      }
      return [
        ...prev,
        { book, qty: selectedQty, unitPrice: book.price },
      ];
    });
    setSelectedBookForCart('');
    setSelectedQty(1);
  };

  const handleUpdateCartQty = (bookId: string, qty: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.book.id === bookId ? { ...item, qty: qty || 1 } : item,
      ),
    );
  };

  const handleRemoveCartItem = (bookId: string) => {
    setCartItems((prev) => prev.filter((item) => item.book.id !== bookId));
  };

  const cartTotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + item.unitPrice * item.qty,
        0,
      ),
    [cartItems],
  );

  const handleCreateSale = async () => {
    if (!saleBranchId) {
      toast({
        title: 'Error',
        description: 'Select a branch for the sale',
        variant: 'destructive',
      });
      return;
    }
    if (cartItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Add at least one book to the cart',
        variant: 'destructive',
      });
      return;
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
      });
      setCreateDialogOpen(false);
      setSaleBranchId('');
      setSaleStudentId('');
      setSaleInvoiceId('');
      setCartItems([]);
      await loadSales();
      toast({
        title: 'Success',
        description: 'Book sale recorded successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to create book sale',
        variant: 'destructive',
      });
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Book Sales</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Manage offline and online book sales, and keep invoice-friendly records of sold materials.
            </p>
          </div>
          <Button
            className="mt-1 bg-primary hover:bg-primary/90"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Sales</p>
          <p className="mt-2 text-2xl font-semibold">{totalSales}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Amount</p>
          <p className="mt-2 text-2xl font-semibold">
            {totalAmount.toLocaleString('en-US', {
              style: 'currency',
              currency: 'BDT',
              maximumFractionDigits: 2,
            })}
          </p>
        </article>
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[260px] flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student, mobile, branch, or invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-border bg-background pl-10"
              />
            </div>
          </div>
          <div className="min-w-[220px]">
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
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
          <Button variant="outline" className="h-10" onClick={loadSales}>
            <RefreshCw className={`h-4 w-4 ${loadingSales ? 'animate-spin' : ''}`} />
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
            <h2 className="text-base font-semibold tracking-tight">Recent Book Sales</h2>
            <p className="text-xs text-muted-foreground">
              Offline and online sales, ready for invoice references.
            </p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <ShoppingBag className="h-4 w-4" />
            <span>{totalSales} Total Records</span>
          </div>
        </div>

        {loadingSales ? (
          <div className="p-8 text-center text-muted-foreground">Loading book sales...</div>
        ) : filteredSales.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? 'No sales found matching your search.' : 'No book sales recorded yet.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Sold At</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-muted/45">
                  <TableCell className="text-sm">
                    {new Date(sale.soldAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>{sale.branch?.name || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {sale.student?.fullName || 'Walk-in'}
                      </span>
                      {sale.student?.mobile && (
                        <span className="text-xs text-muted-foreground">
                          {sale.student.mobile}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {sale.invoiceId ? (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <FileText className="h-3 w-3" />
                        {sale.invoiceId}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sale.items?.length || 0} items</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="tabular-nums">
                      {sale.totalAmount.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'BDT',
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {/* Create Sale Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>New Book Sale</DialogTitle>
            <DialogDescription>
              Record an offline or online sale. Items will appear as invoice-ready descriptions.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-4 py-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Branch *</label>
                  <Select
                    value={saleBranchId}
                    onValueChange={setSaleBranchId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Student ID (optional)</label>
                  <Input
                    value={saleStudentId}
                    onChange={(e) => setSaleStudentId(e.target.value)}
                    placeholder="Student user ID (if linked)"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Invoice ID (optional)</label>
                  <Input
                    value={saleInvoiceId}
                    onChange={(e) => setSaleInvoiceId(e.target.value)}
                    placeholder="Invoice reference"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Cart Items</p>
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedBookForCart}
                      onValueChange={setSelectedBookForCart}
                    >
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Select book" />
                      </SelectTrigger>
                      <SelectContent>
                        {books.map((book) => (
                          <SelectItem key={book.id} value={book.id}>
                            {book.name} ({book.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(Number(e.target.value || 1))}
                      className="w-20"
                    />
                    <Button variant="outline" size="icon" onClick={handleAddToCart}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {cartItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No items in the cart. Select a book and quantity to add.
                  </p>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead>Book</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Line Total</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cartItems.map((item) => (
                          <TableRow key={item.book.id}>
                            <TableCell className="font-medium">
                              {item.book.name}
                              <span className="ml-2 text-xs text-muted-foreground">
                                {item.book.sku}
                              </span>
                            </TableCell>
                            <TableCell className="w-24">
                              <Input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={(e) =>
                                  handleUpdateCartQty(item.book.id, Number(e.target.value || 1))
                                }
                              />
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.unitPrice.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'BDT',
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="text-sm tabular-nums">
                              {(item.unitPrice * item.qty).toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'BDT',
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveCartItem(item.book.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
                      <span className="text-muted-foreground">
                        {cartItems.length} item(s) in cart
                      </span>
                      <span className="font-semibold tabular-nums">
                        Total:{' '}
                        {cartTotal.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'BDT',
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 bg-background border-t shadow-lg mt-auto">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSale} disabled={createSubmitting}>
              {createSubmitting ? 'Recording...' : 'Record Sale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

