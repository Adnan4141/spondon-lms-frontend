'use client';

import React, { useState } from 'react';
import { Invoice } from '@/types/invoice';
import { initInvoicePayment, getInvoicePdfUrl } from '@/lib/api/invoices';
import { API_ORIGIN } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SpondonPaperInvoice } from '@/components/admin/invoices/SpondonPaperInvoice';
import { 
  User, 
  Building2, 
  Calendar, 
  History,
  CheckCircle2, 
  Hash,
  Activity,
  CreditCard,
  Phone,
  Clock,
  Receipt,
  Download,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface InvoiceDetailsViewProps {
  invoice: Invoice;
  onRefresh?: () => void;
}

function getStatusBadgeClass(status: string) {
  const s = String(status).toUpperCase();
  if (s === 'PAID') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black';
  if (s === 'PARTIAL') return 'bg-amber-50 text-amber-700 border-amber-100 font-black';
  if (s === 'ISSUED') return 'bg-blue-50 text-blue-700 border-blue-100 font-black';
  if (s === 'CANCELLED') return 'bg-rose-50 text-rose-700 border-rose-100 font-black';
  return 'bg-slate-100 text-slate-600 border-slate-200 font-black';
}

function resolvePdfUrl(relativeOrAbsolute: string): string {
  if (relativeOrAbsolute.startsWith('http://') || relativeOrAbsolute.startsWith('https://')) {
    return relativeOrAbsolute;
  }
  return `${API_ORIGIN}${relativeOrAbsolute.startsWith('/') ? '' : '/'}${relativeOrAbsolute}`;
}

async function fetchPdfAsObjectUrl(apiPdfPath: string): Promise<string> {
  const fileUrl = resolvePdfUrl(apiPdfPath);
  const fr = await fetch(fileUrl);
  if (!fr.ok) throw new Error('PDF file fetch failed');
  const blob = await fr.blob();
  return URL.createObjectURL(blob);
}

export function InvoiceDetailsView({ invoice }: InvoiceDetailsViewProps) {
  const { toast } = useToast();
  const [paying, setPaying] = useState(false);
  const [panel, setPanel] = useState<'details' | 'pdf'>('details');
  const [pdfLoading, setPdfLoading] = useState(false);
  const dueAmount = Number(invoice.dueAmount);

  const loadPdfAndShow = async () => {
    setPanel('pdf');
  };

  const openPdfNewTab = async () => {
    window.open(`/admin/invoices/${invoice.id}/print`, '_blank', 'noopener,noreferrer');
  };

  const downloadPdf = async () => {
    try {
      setPdfLoading(true);
      const res = await getInvoicePdfUrl(invoice.id);
      if (!res.success || !res.data?.pdfUrl) {
        toast({
          title: 'PDF unavailable',
          description: res.message || 'Could not generate invoice PDF.',
          variant: 'destructive',
        });
        return;
      }
      const objectUrl = await fetchPdfAsObjectUrl(res.data.pdfUrl);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `invoice-${invoice.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (e) {
      console.error(e);
      toast({ title: 'PDF error', description: 'Could not download invoice PDF.', variant: 'destructive' });
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePayViaGateway = async () => {
    if (dueAmount <= 0) return;
    try {
      setPaying(true);
      const res = await initInvoicePayment(invoice.id);
      if (res.success && res.data?.GatewayPageURL) {
        window.location.href = res.data.GatewayPageURL;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPaying(false);
    }
  };

  const formatCurrency = (amount: number | string) => {
    return `৳${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount))}`;
  };

  if (panel === 'pdf') {
    return (
      <div className="flex flex-col bg-white text-slate-900">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2 rounded-xl font-bold"
            onClick={() => {
              setPanel('details');
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to invoice
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-10 gap-2 rounded-xl font-bold"
            onClick={openPdfNewTab}
          >
            <ExternalLink className="h-4 w-4" />
            Open print view
          </Button>
          <button
            type="button"
            onClick={downloadPdf}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
        <div className="max-h-[72vh] overflow-auto rounded-b-xl bg-slate-100 p-6">
          <SpondonPaperInvoice invoice={invoice} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar">
        <div className="mb-8 rounded-[28px] border border-slate-200 bg-slate-50/80 p-6">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Official statement (print)</p>
          <SpondonPaperInvoice invoice={invoice} />
        </div>
        <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2 rounded-xl font-bold"
            onClick={loadPdfAndShow}
            disabled={pdfLoading}
          >
            <FileText className="h-4 w-4" />
            View print
          </Button>
          <Button
            type="button"
            className="h-10 gap-2 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800 hover:text-white"
            onClick={downloadPdf}
            disabled={pdfLoading}
          >
            <Download className="h-4 w-4" />
            {pdfLoading ? 'Preparing…' : 'Download PDF'}
          </Button>
        </div>
        {/* Header Hero Card */}
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-50/50 p-8 shadow-sm mb-10">
           <div className="absolute top-0 right-0 p-6">
              <Badge variant="outline" className={cn("rounded-xl px-4 py-2 text-[10px] uppercase tracking-widest", getStatusBadgeClass(invoice.status))}>
                {invoice.status}
              </Badge>
           </div>
           
           <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="relative">
                 <div className="h-24 w-24 rounded-[32px] bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-3xl font-black shadow-xl">
                    <Receipt className="h-10 w-10" />
                 </div>
                 <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-2xl border-4 border-white bg-indigo-500 flex items-center justify-center shadow-sm">
                    <ShieldCheck className="h-4 w-4 text-white" />
                 </div>
              </div>

              <div className="space-y-4 text-center md:text-left">
                 <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Invoice</h2>
                    <p className="text-sm font-mono font-bold text-indigo-600">#{invoice.id.slice(0, 12)}…</p>
                 </div>
                 
                 <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2">
                    <div className="flex items-center gap-2 text-base font-bold text-slate-500">
                       <User className="h-4 w-4 text-indigo-500" />
                       {invoice.student?.fullName}
                    </div>
                    <div className="flex items-center gap-2 text-base font-bold text-slate-500">
                       <Building2 className="h-4 w-4 text-rose-500" />
                       {invoice.branch?.name}
                    </div>
                    {invoice.month && (
                      <div className="flex items-center gap-2 text-base font-bold text-slate-500">
                         <Calendar className="h-4 w-4 text-emerald-500" />
                         {invoice.month}
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>

        {/* Pay via SSL - when due */}
        {dueAmount > 0 && (
          <div className="mb-6 flex justify-end">
            <Button onClick={handlePayViaGateway} disabled={paying} className="h-12 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest shadow-lg">
              <CreditCard className="mr-2 h-4 w-4" />
              {paying ? 'Redirecting...' : 'Pay via SSL Gateway'}
            </Button>
          </div>
        )}

        {/* Financial Core Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
           {[
             { label: 'Total Amount', value: formatCurrency(invoice.totalAmount), icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
             { label: 'Adjustments', value: formatCurrency(Number(invoice.discountAmount) + Number(invoice.scholarshipAmount)), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
             { label: 'Paid Amount', value: formatCurrency(invoice.paidAmount), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
             { label: 'Outstanding', value: formatCurrency(invoice.dueAmount), icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
           ].map((stat, i) => (
             <div key={i} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-2xl", stat.bg, stat.color)}>
                   <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="mt-1 text-base font-black text-slate-900">{stat.value}</p>
             </div>
           ))}
        </div>

        {Number(invoice.discountAmount) > 0 && invoice.discountReference ? (
          <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50/50 px-4 py-3 text-sm font-bold text-amber-950">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Discount reference</span>
            <p className="mt-1">{invoice.discountReference}</p>
          </div>
        ) : null}

        {/* Statement Items */}
        <div className="space-y-6 mb-10">
           <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">
              <Activity className="h-4 w-4" />
              Itemized Statement
           </h3>
           <div className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm">
              <Table>
                 <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-b border-slate-100">
                       <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Classification</TableHead>
                       <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Description</TableHead>
                       <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Quantity</TableHead>
                       <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Unit Price</TableHead>
                       <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Line Total</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {invoice.items?.map((item) => (
                       <TableRow key={item.id} className="border-slate-50">
                          <TableCell>
                             <Badge variant="outline" className="rounded-lg bg-slate-50 border-slate-200 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">{item.type}</Badge>
                          </TableCell>
                          <TableCell className="text-base font-bold text-slate-700">{item.title}</TableCell>
                          <TableCell className="text-right text-base font-medium text-slate-500">{item.qty}</TableCell>
                          <TableCell className="text-right text-base font-medium text-slate-500">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right text-base font-black text-slate-900">{formatCurrency(item.lineTotal)}</TableCell>
                       </TableRow>
                    ))}
                 </TableBody>
              </Table>
           </div>
        </div>

        {/* Payment History & Adjustments */}
        <div className="grid gap-10 lg:grid-cols-2">
           <div>
              <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-4">
                 <TrendingUp className="h-4 w-4" />
                 Transaction History
              </h3>
              <div className="space-y-3">
                 {invoice.payments && invoice.payments.length > 0 ? (
                    invoice.payments.map((p) => (
                       <div key={p.id} className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-emerald-200 transition-all">
                          <div className="flex items-center gap-3">
                             <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4" />
                             </div>
                             <div className="flex flex-col">
                                <span className="text-base font-bold text-slate-800">{formatCurrency(p.amount)}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.method} • {new Date(p.paidAt).toLocaleDateString()}</span>
                             </div>
                          </div>
                          {p.trxId && <Badge variant="outline" className="rounded-lg text-[9px] font-mono text-slate-400 uppercase">{p.trxId.slice(0, 10)}</Badge>}
                       </div>
                    ))
                 ) : (
                    <div className="flex flex-col items-center justify-center p-10 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50">
                       <CreditCard className="h-8 w-8 text-slate-300 mb-3" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No transactions recorded</p>
                    </div>
                 )}
              </div>
           </div>

           <div>
              <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                 <History className="h-4 w-4" />
                 System Audit
              </h3>
              <div className="grid gap-4">
                 <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                    <span className="text-base font-bold text-slate-500">Initialized At</span>
                    <span className="text-base font-black text-slate-900">{new Date(invoice.createdAt).toLocaleString()}</span>
                 </div>
                 <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                    <span className="text-base font-bold text-slate-500">Authorization Status</span>
                    <span className="text-base font-black text-indigo-600">{invoice.status}</span>
                 </div>
                 {invoice.issuedAt && (
                   <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                      <span className="text-base font-bold text-slate-500">Emission Date</span>
                      <span className="text-base font-black text-slate-900">{new Date(invoice.issuedAt).toLocaleString()}</span>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
