'use client';

import { useEffect, useState } from 'react';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  type Invoice,
  type InvoiceStatus,
  type InvoiceItemType,
  type CreateInvoiceDto,
  type CreateInvoiceItemDto,
  type UpdateInvoiceDto,
} from '@/lib/api/invoices';
import { getBranches } from '@/lib/api/branches';
import { getStudents } from '@/lib/api/students';
import type { Branch } from '@/lib/api/branches';
import type { Student } from '@/lib/api/students';
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
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  DollarSign,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

const statusOptions: (InvoiceStatus | 'all')[] = ['all', 'DRAFT', 'ISSUED', 'PAID', 'PARTIAL', 'CANCELLED'];
const itemTypeOptions: InvoiceItemType[] = ['COURSE', 'BOOK', 'FEE', 'OTHER'];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function InvoicesPage() {
  const { toast, toasts, removeToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('');

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState<Invoice | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Form states
  const [editForm, setEditForm] = useState<UpdateInvoiceDto>({
    status: 'DRAFT',
    discountAmount: 0,
    scholarshipAmount: 0,
  });
  const [createForm, setCreateForm] = useState<CreateInvoiceDto>({
    studentUserId: '',
    branchId: '',
    month: '',
    status: 'DRAFT',
    discountAmount: 0,
    scholarshipAmount: 0,
    items: [],
  });
  const [invoiceItems, setInvoiceItems] = useState<CreateInvoiceItemDto[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (branchFilter !== 'all') params.branchId = branchFilter;
      if (monthFilter) params.month = monthFilter;

      const response = await getInvoices(params);
      if (response.success && response.data) {
        setInvoices(response.data);
      } else {
        setError(response.message || 'Failed to load invoices');
        setInvoices([]);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await getBranches();
      if (response.success && response.data) {
        setBranches(response.data || []);
      }
    } catch (err: unknown) {
      console.error('Failed to load branches:', err);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await getStudents({ role: 'STUDENT' });
      if (response.success && response.data) {
        setStudents(response.data || []);
      }
    } catch (err: unknown) {
      console.error('Failed to load students:', err);
    }
  };

  useEffect(() => {
    loadInvoices();
    loadBranches();
    loadStudents();
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [statusFilter, branchFilter, monthFilter]);

  const fetchInvoiceDetails = async (invoiceId: string) => {
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      const response = await getInvoiceById(invoiceId);

      if (response.success && response.data) {
        setInvoiceDetails(response.data);
        const invoice = response.data;
        setEditForm({
          status: invoice.status,
          discountAmount: Number(invoice.discountAmount),
          scholarshipAmount: Number(invoice.scholarshipAmount),
        });
        return response.data;
      }

      throw new Error(response.message || 'Failed to load invoice details');
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setDetailsError(message);
      setInvoiceDetails(null);
      return null;
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewInvoice = async (invoiceId: string) => {
    setViewDialogOpen(true);
    await fetchInvoiceDetails(invoiceId);
  };

  const handleEditInvoice = async (invoiceId: string) => {
    setEditDialogOpen(true);
    setEditError(null);
    await fetchInvoiceDetails(invoiceId);
  };

  const handleEditSubmit = async () => {
    if (!invoiceDetails) return;

    try {
      setEditSubmitting(true);
      setEditError(null);
      const payload: UpdateInvoiceDto = {
        status: editForm.status,
        discountAmount: editForm.discountAmount,
        scholarshipAmount: editForm.scholarshipAmount,
      };

      await updateInvoice(invoiceDetails.id, payload);
      setEditDialogOpen(false);
      await loadInvoices();

      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err) || 'Failed to update invoice';
      setEditError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCreateSubmit = async () => {
    if (!createForm.studentUserId || !createForm.branchId || invoiceItems.length === 0) {
      setCreateError('Student, branch, and at least one item are required');
      toast({
        title: 'Error',
        description: 'Student, branch, and at least one item are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError(null);
      const payload: CreateInvoiceDto = {
        ...createForm,
        items: invoiceItems,
      };

      await createInvoice(payload);
      setCreateDialogOpen(false);
      setCreateForm({
        studentUserId: '',
        branchId: '',
        month: '',
        status: 'DRAFT',
        discountAmount: 0,
        scholarshipAmount: 0,
        items: [],
      });
      setInvoiceItems([]);
      await loadInvoices();

      toast({
        title: 'Success',
        description: 'Invoice created successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err) || 'Failed to create invoice';
      setCreateError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteInvoice(invoiceId);
      await loadInvoices();

      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err) || 'Failed to delete invoice',
        variant: 'destructive',
      });
    }
  };

  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { type: 'COURSE', title: '', qty: 1, unitPrice: 0 }]);
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const updateInvoiceItem = (index: number, field: keyof CreateInvoiceItemDto, value: any) => {
    const updated = [...invoiceItems];
    updated[index] = { ...updated[index], [field]: value };
    setInvoiceItems(updated);
  };

  const calculateTotals = () => {
    const totalAmount = invoiceItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
    const discountAmount = createForm.discountAmount || 0;
    const scholarshipAmount = createForm.scholarshipAmount || 0;
    const payableAmount = totalAmount - discountAmount - scholarshipAmount;
    return { totalAmount, discountAmount, scholarshipAmount, payableAmount };
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.student?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.student?.mobile.includes(searchQuery) ||
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isDetailsReady = !detailsLoading && invoiceDetails !== null;
  const totalInvoices = invoices.length;
  const draftCount = invoices.filter((i) => i.status === 'DRAFT').length;
  const issuedCount = invoices.filter((i) => i.status === 'ISSUED').length;
  const paidCount = invoices.filter((i) => i.status === 'PAID').length;
  const totalRevenue = invoices
    .filter((i) => i.status === 'PAID' || i.status === 'PARTIAL')
    .reduce((sum, i) => sum + Number(i.paidAmount), 0);

  const formatCurrency = (amount: number | string) => {
    return `৳${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount))}`;
  };

  return (
    <div className="space-y-4">
      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Invoice Management</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Manage invoices, payments, and billing for all students.
            </p>
          </div>
          <Button className="mt-1 bg-primary hover:bg-primary/90" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Invoices</p>
          <p className="mt-2 text-2xl font-semibold">{totalInvoices}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Draft</p>
          <p className="mt-2 text-2xl font-semibold">{draftCount}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Issued</p>
          <p className="mt-2 text-2xl font-semibold">{issuedCount}</p>
        </article>
        <article className="glass-panel p-3.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Revenue</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalRevenue)}</p>
        </article>
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[260px] flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student name, mobile, or invoice ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-border bg-background pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as InvoiceStatus | 'all')}>
            <SelectTrigger className="h-10 w-[180px] border-border bg-background">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt === 'all' ? 'All Status' : opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="h-10 w-[180px] border-border bg-background">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            placeholder="Month (YYYY-MM)"
            className="h-10 w-[180px] border-border bg-background"
          />
          <Button variant="outline" className="h-10" onClick={loadInvoices}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">{error}</div>
      )}

      <section className="glass-panel overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Invoice Catalog</h2>
            <p className="text-xs text-muted-foreground">Browse and maintain all invoices</p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <FileText className="h-4 w-4" />
            <span>{totalInvoices} Total Records</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? 'No invoices found matching your search.' : 'No invoices found. Create your first invoice.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Invoice ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-muted/45">
                  <TableCell className="font-mono text-xs">{invoice.id.slice(0, 8)}...</TableCell>
                  <TableCell className="font-medium">{invoice.student?.fullName || '-'}</TableCell>
                  <TableCell>{invoice.branch?.name || '-'}</TableCell>
                  <TableCell>{invoice.month || '-'}</TableCell>
                  <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                  <TableCell>{formatCurrency(invoice.paidAmount)}</TableCell>
                  <TableCell>{formatCurrency(invoice.dueAmount)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        invoice.status === 'PAID'
                          ? 'default'
                          : invoice.status === 'ISSUED'
                            ? 'secondary'
                            : invoice.status === 'PARTIAL'
                              ? 'outline'
                              : invoice.status === 'CANCELLED'
                                ? 'destructive'
                                : 'secondary'
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewInvoice(invoice.id)}
                        title="View Invoice"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditInvoice(invoice.id)} title="Edit Invoice">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        title="Delete Invoice"
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

      {/* View Invoice Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>View complete invoice information and payment history.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {detailsLoading && <p className="text-sm text-muted-foreground py-6">Loading details...</p>}
            {!detailsLoading && detailsError && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive my-6">
                {detailsError}
              </div>
            )}

            {isDetailsReady && invoiceDetails && (
              <div className="space-y-5 text-sm py-6">
                {/* Basic Information */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Basic Information</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Invoice ID</p>
                      <p className="mt-1 font-mono text-xs">{invoiceDetails.id}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Status</p>
                      <p className="mt-1">
                        <Badge
                          variant={
                            invoiceDetails.status === 'PAID'
                              ? 'default'
                              : invoiceDetails.status === 'ISSUED'
                                ? 'secondary'
                                : invoiceDetails.status === 'PARTIAL'
                                  ? 'outline'
                                  : invoiceDetails.status === 'CANCELLED'
                                    ? 'destructive'
                                    : 'secondary'
                          }
                        >
                          {invoiceDetails.status}
                        </Badge>
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Student</p>
                      <p className="mt-1 font-medium">{invoiceDetails.student?.fullName || '-'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{invoiceDetails.student?.mobile || '-'}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Branch</p>
                      <p className="mt-1 font-medium">{invoiceDetails.branch?.name || '-'}</p>
                    </div>
                    {invoiceDetails.month && (
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-xs uppercase text-muted-foreground">Month</p>
                        <p className="mt-1 font-medium">{invoiceDetails.month}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Invoice Items */}
                {invoiceDetails.items && invoiceDetails.items.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Invoice Items</p>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Type</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoiceDetails.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Badge variant="outline">{item.type}</Badge>
                              </TableCell>
                              <TableCell>{item.title}</TableCell>
                              <TableCell className="text-right">{item.qty}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                              <TableCell className="text-right font-semibold">{formatCurrency(item.lineTotal)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Financial Summary */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Financial Summary</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Total Amount</p>
                      <p className="mt-1 text-lg font-semibold">{formatCurrency(invoiceDetails.totalAmount)}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Discount</p>
                      <p className="mt-1 text-lg font-semibold">{formatCurrency(invoiceDetails.discountAmount)}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Scholarship</p>
                      <p className="mt-1 text-lg font-semibold">{formatCurrency(invoiceDetails.scholarshipAmount)}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Payable Amount</p>
                      <p className="mt-1 text-lg font-semibold">{formatCurrency(invoiceDetails.payableAmount)}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Paid Amount</p>
                      <p className="mt-1 text-lg font-semibold text-green-600">{formatCurrency(invoiceDetails.paidAmount)}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Due Amount</p>
                      <p className="mt-1 text-lg font-semibold text-red-600">{formatCurrency(invoiceDetails.dueAmount)}</p>
                    </div>
                  </div>
                </div>

                {/* Payments */}
                {invoiceDetails.payments && invoiceDetails.payments.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Payment History</p>
                    <div className="space-y-2">
                      {invoiceDetails.payments.map((payment) => (
                        <div key={payment.id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{formatCurrency(payment.amount)}</p>
                              <p className="text-xs text-muted-foreground">
                                {payment.method} • {new Date(payment.paidAt).toLocaleString()}
                              </p>
                              {payment.trxId && (
                                <p className="text-xs text-muted-foreground">Transaction ID: {payment.trxId}</p>
                              )}
                            </div>
                            {payment.receivedBy && (
                              <Badge variant="outline">Received by {payment.receivedBy.fullName}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Timestamps</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs uppercase text-muted-foreground">Created At</p>
                      <p className="mt-1 text-sm">
                        {new Date(invoiceDetails.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {invoiceDetails.issuedAt && (
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-xs uppercase text-muted-foreground">Issued At</p>
                        <p className="mt-1 text-sm">
                          {new Date(invoiceDetails.issuedAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] sm:max-w-2xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>Update invoice status and adjustments.</DialogDescription>
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
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={editForm.status}
                    onValueChange={(v) => setEditForm((prev) => ({ ...prev, status: v as InvoiceStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.filter((opt) => opt !== 'all').map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Discount Amount</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.discountAmount}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, discountAmount: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Scholarship Amount</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.scholarshipAmount}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, scholarshipAmount: Number(e.target.value) || 0 }))
                      }
                    />
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

      {/* Create Invoice Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl flex flex-col p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 sticky top-0 bg-background z-10 border-b shadow-sm">
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Create a new invoice for a student.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-4 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Student *</label>
                  <Select
                    value={createForm.studentUserId}
                    onValueChange={(v) => setCreateForm((prev) => ({ ...prev, studentUserId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.fullName} ({student.mobile})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Branch *</label>
                  <Select
                    value={createForm.branchId}
                    onValueChange={(v) => setCreateForm((prev) => ({ ...prev, branchId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a branch" />
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month (YYYY-MM)</label>
                  <Input
                    type="month"
                    value={createForm.month}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, month: e.target.value }))}
                    placeholder="2024-01"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={createForm.status}
                    onValueChange={(v) => setCreateForm((prev) => ({ ...prev, status: v as InvoiceStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.filter((opt) => opt !== 'all').map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Invoice Items *</label>
                  <Button type="button" variant="outline" size="sm" onClick={addInvoiceItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
                {invoiceItems.map((item, idx) => (
                  <div key={idx} className="grid gap-2 sm:grid-cols-6 items-end border rounded-lg p-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Type</label>
                      <Select
                        value={item.type}
                        onValueChange={(v) => updateInvoiceItem(idx, 'type', v as InvoiceItemType)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {itemTypeOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs font-medium">Title</label>
                      <Input
                        value={item.title}
                        onChange={(e) => updateInvoiceItem(idx, 'title', e.target.value)}
                        placeholder="Item title"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Qty</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateInvoiceItem(idx, 'qty', Number(e.target.value) || 1)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Unit Price</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateInvoiceItem(idx, 'unitPrice', Number(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeInvoiceItem(idx)}
                      className="h-9 w-9"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {invoiceItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No items added. Click "Add Item" to start.</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 border-t pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Discount Amount</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={createForm.discountAmount}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, discountAmount: Number(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scholarship Amount</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={createForm.scholarshipAmount}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, scholarshipAmount: Number(e.target.value) || 0 }))
                    }
                  />
                </div>
              </div>

              {invoiceItems.length > 0 && (
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(calculateTotals().totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Discount:</span>
                    <span>{formatCurrency(calculateTotals().discountAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Scholarship:</span>
                    <span>{formatCurrency(calculateTotals().scholarshipAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-semibold">Payable Amount:</span>
                    <span className="text-lg font-bold">{formatCurrency(calculateTotals().payableAmount)}</span>
                  </div>
                </div>
              )}

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
              {createSubmitting ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
