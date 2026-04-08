'use client';

import { useEffect, useState } from 'react';
import {
  getInvoices,
  getInvoiceById,
  deleteInvoice,
} from '@/lib/api/invoices';
import { getBranches } from '@/lib/api/branches';
import { getStudents } from '@/lib/api/students';
import type { Branch } from '@/lib/api/branches';
import type { Student } from '@/types/student';
import type { Invoice, InvoiceStatus } from '@/types/invoice';
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
  CreditCard,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  DollarSign,
  FileText,
  Layers,
  ArrowRight,
  TrendingUp,
  History,
  Building2,
  User,
  Receipt,
  Clock as ClockIcon,
  Calendar,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { InvoiceForm } from '@/components/admin/invoices/InvoiceForm';
import { InvoiceDetailsView } from '@/components/admin/invoices/InvoiceDetailsView';
import { RecordPaymentDialog } from '@/components/admin/invoices/RecordPaymentDialog';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import { generateMonthlyInvoices } from '@/lib/api/invoices';
import { MonthPicker } from '@/components/ui/month-picker';
import { cn } from '@/lib/utils';

const statusOptions: (InvoiceStatus | 'all')[] = ['all', 'DRAFT', 'ISSUED', 'PAID', 'PARTIAL', 'CANCELLED'];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

function getStatusBadgeClass(status: string) {
  if (status === 'PAID') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black';
  if (status === 'PARTIAL') return 'bg-amber-50 text-amber-700 border-amber-100 font-black';
  if (status === 'ISSUED') return 'bg-blue-50 text-blue-700 border-blue-100 font-black';
  if (status === 'CANCELLED') return 'bg-rose-50 text-rose-700 border-rose-100 font-black';
  return 'bg-slate-50 text-slate-600 border-slate-200 font-black';
}

export default function InvoicesPage() {
  const { openModal } = useModalStore();
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const bid = params.get('branchId');
    if (bid) setBranchFilter(bid);
    const openId = params.get('open');
    if (openId) {
      // Auto-open the specific invoice detail view after initial data load
      setTimeout(() => void handleViewInvoice(openId), 800);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (branchFilter !== 'all') params.branchId = branchFilter;
      if (monthFilter) params.month = monthFilter;

      const response = await getInvoices(params);
      if (response.success && response.data) setInvoices(response.data);
      else setInvoices([]);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await getBranches();
      if (response.success && response.data) setBranches(response.data);
    } catch (err) { console.error(err); }
  };

  const loadStudents = async () => {
    try {
      const response = await getStudents({ role: 'STUDENT' });
      if (response.success && response.data) setStudents(response.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    loadInvoices();
    loadBranches();
    loadStudents();
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [statusFilter, branchFilter, monthFilter]);

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const res = await getInvoiceById(invoiceId);
      if (res.success && res.data) {
        openModal({
          title: 'Invoice Details',
          description: 'View invoice info.',
          className: 'sm:max-w-4xl',
          content: <InvoiceDetailsView invoice={res.data} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load invoice data', variant: 'destructive' });
    }
  };

  const handleEditInvoice = async (invoiceId: string) => {
    try {
      const res = await getInvoiceById(invoiceId);
      if (res.success && res.data) {
        openModal({
          title: 'Edit Invoice',
          description: 'Update invoice details.',
          className: 'sm:max-w-2xl',
          content: <InvoiceForm branches={branches} students={students} invoice={res.data} onSuccess={loadInvoices} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load invoice for editing', variant: 'destructive' });
    }
  };

  const handleCreateInvoice = () => {
    openModal({
      title: 'Add Invoice',
      description: 'Create a new invoice.',
      className: 'sm:max-w-4xl',
      content: <InvoiceForm branches={branches} students={students} onSuccess={loadInvoices} />,
    });
  };

  const handleGenerateDues = async () => {
    const month = monthFilter || new Date().toISOString().slice(0, 7);
    
    openModal({
      title: 'Generate Monthly Dues',
      description: `Create monthly invoices for ${month}?`,
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm"
          description={`Generate invoices for ${month}?`}
          variant="info"
          onConfirm={async () => {
            try {
              setLoading(true);
              const res = await generateMonthlyInvoices({ month });
              if (res.success && res.data) {
                await loadInvoices();
                const d = res.data;
                toast({
                  title: 'Done',
                  description: `${d.invoicesCreated} invoices created for ${d.month} · ${d.skipped} skipped.`,
                  variant: 'success',
                });
                if (d.errors?.length) {
                  toast({
                    title: 'Some rows failed',
                    description: d.errors.slice(0, 3).join(' · '),
                    variant: 'destructive',
                  });
                }
              } else {
                toast({ title: 'Error', description: res.message || 'Generation failed', variant: 'destructive' });
              }
            } catch (err: any) {
              toast({ title: 'Error', description: err.message, variant: 'destructive' });
            } finally {
              setLoading(false);
            }
          }}
        />
      ),
    });
  };

  const handleRecordPayment = async (invoiceId: string) => {
    try {
      const res = await getInvoiceById(invoiceId);
      if (res.success && res.data) {
        openModal({
          title: 'Record Manual Payment',
          description: `Record a payment for ${res.data.month || 'this invoice'}.`,
          className: 'sm:max-w-lg',
          content: <RecordPaymentDialog invoice={res.data} onSuccess={loadInvoices} />,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load invoice', variant: 'destructive' });
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    openModal({
      title: 'Delete Invoice',
      description: 'Delete this invoice? This cannot be undone.',
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm Delete"
          description="Remove this invoice permanently?"
          variant="danger"
          onConfirm={async () => {
            try {
              await deleteInvoice(invoiceId);
              await loadInvoices();
              toast({ title: 'Success', description: 'Invoice record purged successfully', variant: 'success' });
            } catch (err) {
              toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
            }
          }}
        />
      ),
    });
  };

  const filteredInvoices = invoices.filter(
    (i) =>
      i.student?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.student?.mobile.includes(searchQuery) ||
      i.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number | string) => {
    return `৳${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount))}`;
  };

  return (
    <div className="space-y-8 text-slate-900">
      {/* Filter Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap flex-1 items-center gap-4">
            <div className="min-w-[300px] flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="Search by student, phone, or invoice ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white text-sm font-medium shadow-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                {statusOptions.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-sm font-medium">
                    {opt === 'all' ? 'All Status' : opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" onClick={loadInvoices}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-slate-200 bg-white px-6 font-black uppercase tracking-widest text-[10px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              onClick={handleGenerateDues}
            >
              <Zap className="mr-2 h-4 w-4 text-amber-500" />
              Generate Monthly Dues
            </Button>
            <Button
              className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
              onClick={handleCreateInvoice}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Invoice
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
           <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-10 w-[220px] rounded-xl border-slate-200 bg-slate-50/50 font-bold text-[10px] uppercase tracking-widest text-slate-500">
                 <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                 <SelectItem value="all" className="text-[10px] font-bold uppercase py-2">All Branches</SelectItem>
                 {branches.map(b => <SelectItem key={b.id} value={b.id} className="text-[10px] font-bold uppercase py-2">{b.name}</SelectItem>)}
              </SelectContent>
           </Select>

           <div className="relative h-10 w-[220px]">
              <MonthPicker 
                value={monthFilter} 
                onChange={setMonthFilter}
                placeholder="Resolution Month"
                className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 focus:bg-white transition-all shadow-sm"
              />
           </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Invoices</h2>
            <p className="mt-0.5 text-base font-bold text-indigo-500">All invoices</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Invoices
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No invoices found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Invoice</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Details</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Payable</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Due</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((i) => (
                  <TableRow key={i.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                    <TableCell className="px-8 py-5">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-500 text-base shadow-sm">
                             {i.student?.fullName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                             <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{i.student?.fullName}</span>
                             <span className="text-xs font-mono font-black text-slate-400 uppercase tracking-tighter">SID: {i.id.slice(0, 12)}</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-base font-bold text-slate-600">
                             <Building2 className="h-3.5 w-3.5 text-rose-500" />
                             {i.branch?.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm font-black text-slate-400 uppercase tracking-widest">
                             <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                             {i.month || 'GLOBAL'}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-5 text-right font-black text-slate-900 text-base">{formatCurrency(i.payableAmount)}</TableCell>
                    <TableCell className="py-5 text-right font-black text-rose-600 text-base">
                       {Number(i.dueAmount) > 0 ? formatCurrency(i.dueAmount) : '-'}
                    </TableCell>
                    <TableCell className="py-5">
                       <Badge variant="outline" className={cn("rounded-lg text-[9px] font-black uppercase tracking-widest px-2.5 py-1", getStatusBadgeClass(String(i.status)))}>
                         {i.status}
                       </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                       <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            onClick={() => handleViewInvoice(i.id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            onClick={() => handleEditInvoice(i.id)}
                          >
                            Edit
                          </Button>
                          {Number(i.dueAmount) > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-xl border-emerald-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm"
                              onClick={() => handleRecordPayment(i.id)}
                            >
                              Pay
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                            onClick={() => handleDeleteInvoice(i.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
