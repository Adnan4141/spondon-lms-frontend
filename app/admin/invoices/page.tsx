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
import type { Student } from '@/lib/api/students';
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
  Sparkles,
  ArrowRight,
  TrendingUp,
  History,
  Building2,
  User,
  Receipt,
  Clock as ClockIcon,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { InvoiceForm } from '@/components/admin/invoices/InvoiceForm';
import { InvoiceDetailsView } from '@/components/admin/invoices/InvoiceDetailsView';
import { cn } from '@/lib/utils';

const statusOptions: (InvoiceStatus | 'all')[] = ['all', 'DRAFT', 'ISSUED', 'PAID', 'PARTIAL', 'CANCELLED'];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

function getStatusBadgeClass(status: string) {
  const s = String(status).toUpperCase();
  if (s === 'PAID') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black';
  if (s === 'PARTIAL') return 'bg-amber-50 text-amber-700 border-amber-100 font-black';
  if (s === 'ISSUED') return 'bg-blue-50 text-blue-700 border-blue-100 font-black';
  if (s === 'CANCELLED') return 'bg-rose-50 text-rose-700 border-rose-100 font-black';
  return 'bg-slate-100 text-slate-600 border-slate-200 font-black';
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
          title: 'Invoice Intelligence',
          description: 'Detailed statement items, payments, and financial audit.',
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
          title: 'Modify Statement',
          description: 'Update lifecycle status or financial adjustments.',
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
      title: 'Initialize Statement',
      description: 'Authorize a new institutional invoice for a student.',
      className: 'sm:max-w-4xl',
      content: <InvoiceForm branches={branches} students={students} onSuccess={loadInvoices} />,
    });
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;
    try {
      await deleteInvoice(invoiceId);
      await loadInvoices();
      toast({ title: 'Success', description: 'Invoice record purged successfully', variant: 'success' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
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

  const totalRevenue = invoices
    .filter((i) => i.status === 'PAID' || i.status === 'PARTIAL')
    .reduce((sum, i) => sum + Number(i.paidAmount), 0);

  const totalOutstanding = invoices
    .filter(i => i.status !== 'CANCELLED')
    .reduce((sum, i) => sum + Number(i.dueAmount), 0);

  return (
    <div className="space-y-8 text-slate-900">
      {/* Header Section */}
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.03),transparent_40%)]" />
        
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 border border-indigo-100/50 shadow-sm">
              <Receipt className="h-3.5 w-3.5" />
              Financial Workspace
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Billing <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Ledger</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
              Manage student statements, track collections, and coordinate institutional revenue streams from a unified premium workspace.
            </p>
          </div>

          <Button
            className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
            onClick={handleCreateInvoice}
          >
            <Plus className="mr-2 h-4 w-4" />
            Initialize Invoice
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Volume', value: invoices.length, color: 'from-blue-600 to-cyan-500', icon: FileText },
          { label: 'Revenue Collected', value: formatCurrency(totalRevenue), color: 'from-emerald-600 to-teal-500', icon: TrendingUp },
          { label: 'Outstanding Balance', value: formatCurrency(totalOutstanding), color: 'from-rose-600 to-pink-600', icon: CreditCard },
          { label: 'Issued Pending', value: invoices.filter(i => i.status === 'ISSUED').length, color: 'from-amber-600 to-orange-500', icon: ClockIcon },
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

      {/* Filter Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[300px] flex-1">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                placeholder="Search by student, mobile, or statement ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="h-12 w-[160px] rounded-2xl border-slate-200 bg-white font-bold text-xs uppercase tracking-widest text-slate-600 shadow-sm">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
              {statusOptions.map((opt) => (
                <SelectItem key={opt} value={opt} className="font-bold text-xs uppercase tracking-widest py-3">
                  {opt === 'all' ? 'All Status' : opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" onClick={loadInvoices}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
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

           <div className="relative h-10 w-[200px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input 
                type="month" 
                value={monthFilter} 
                onChange={(e) => setMonthFilter(e.target.value)}
                className="h-10 w-full rounded-xl border-slate-200 bg-slate-50/50 pl-9 font-bold text-[10px] uppercase tracking-widest text-slate-500 focus:bg-white transition-all shadow-sm"
              />
           </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Statement Registry</h2>
            <p className="mt-0.5 text-xs font-bold text-indigo-500">Institutional financial database</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {invoices.length} Total Statements
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Synchronizing Data...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No matching statements identified.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Statement Identity</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Context</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Net Payable</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Outstanding</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Authorization</TableHead>
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((i) => (
                  <TableRow key={i.id} className="group border-slate-100 transition-colors hover:bg-slate-50/80">
                    <TableCell className="px-8 py-5">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-500 text-xs shadow-sm">
                             {i.student?.fullName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                             <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">{i.student?.fullName}</span>
                             <span className="text-xs font-mono font-black text-slate-400 uppercase tracking-tighter">SID: {i.id.slice(0, 12)}</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                             <Building2 className="h-3.5 w-3.5 text-rose-500" />
                             {i.branch?.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-widest">
                             <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                             {i.month || 'GLOBAL'}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-5 text-right font-black text-slate-900 text-sm">{formatCurrency(i.payableAmount)}</TableCell>
                    <TableCell className="py-5 text-right font-black text-rose-600 text-sm">
                       {Number(i.dueAmount) > 0 ? formatCurrency(i.dueAmount) : '—'}
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
