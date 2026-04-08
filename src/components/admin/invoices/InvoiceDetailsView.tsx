'use client';

import React, { useState } from 'react';
import { Invoice } from '@/types/invoice';
import { initInvoicePayment, getInvoicePdfUrl } from '@/lib/api/invoices';
import { API_ORIGIN } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  User,
  Building2,
  Calendar,
  History,
  CheckCircle2,
  Activity,
  CreditCard,
  Receipt,
  Download,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Lock,
  Sparkles,
  Copy,
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
  const [pdfLoading, setPdfLoading] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  const dueAmount = Number(invoice.dueAmount);
  const paidAmount = Number(invoice.paidAmount);
  const totalAmount = Number(invoice.totalAmount);
  const payableAmount = Number(invoice.payableAmount) || totalAmount;
  const discountAmount = Number(invoice.discountAmount) + Number(invoice.scholarshipAmount);
  const status = String(invoice.status).toUpperCase();
  const isPaid = status === 'PAID';
  const isPartial = status === 'PARTIAL';
  const isCancelled = status === 'CANCELLED';

  const openPrintNewTab = () => {
    window.open(
      `/admin/invoices/${invoice.id}/print`,
      'invoice-preview',
      'width=860,height=1000,scrollbars=yes,resizable=yes'
    );
  };

  const downloadPdf = async () => {
    try {
      setPdfLoading(true);
      const res = await getInvoicePdfUrl(invoice.id);
      if (!res.success || !res.data?.pdfUrl) {
        toast({
          title: 'Something went wrong',
          description: res.message || 'Could not generate invoice PDF. Please try again.',
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
      toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'destructive' });
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
      } else {
        toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setPaying(false);
    }
  };

  const copyInvoiceId = async () => {
    try {
      await navigator.clipboard.writeText(invoice.id);
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    } catch {
      // fallback silently
    }
  };

  const formatCurrency = (amount: number | string) => {
    return `৳${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount))}`;
  };

  const statusLabel = isPaid ? 'All Set' : isPartial ? 'Partially Paid' : isCancelled ? 'Cancelled' : 'Action Needed';
  const statusMessage = isPaid
    ? 'This invoice is fully paid'
    : isPartial
    ? `You still need to pay ${formatCurrency(dueAmount)}`
    : isCancelled
    ? 'This invoice has been cancelled'
    : 'You have an unpaid balance';
  const contextActionText = isPaid
    ? 'Download your receipt'
    : isPartial
    ? 'Complete your remaining payment'
    : 'Pay now to complete this invoice';

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar">

        {/* Status Banner */}
        <div className={cn(
          'mb-6 flex items-center justify-between gap-4 rounded-2xl border px-5 py-4',
          isPaid ? 'border-emerald-100 bg-emerald-50/60' :
          isPartial ? 'border-amber-100 bg-amber-50/60' :
          isCancelled ? 'border-slate-200 bg-slate-50' :
          'border-rose-100 bg-rose-50/60'
        )}>
          <div className="flex items-center gap-3">
            {isPaid
              ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              : isCancelled
              ? <AlertCircle className="h-5 w-5 text-slate-400 shrink-0" />
              : <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
            }
            <div>
              <p className={cn('text-sm font-black', isPaid ? 'text-emerald-800' : isCancelled ? 'text-slate-600' : isPartial ? 'text-amber-800' : 'text-rose-800')}>
                {statusLabel}
              </p>
              <p className={cn('text-xs font-bold', isPaid ? 'text-emerald-600' : isCancelled ? 'text-slate-500' : isPartial ? 'text-amber-600' : 'text-rose-600')}>
                {statusMessage}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={cn('rounded-xl px-3 py-1 text-[10px] uppercase tracking-widest shrink-0', getStatusBadgeClass(invoice.status))}>
            {invoice.status}
          </Badge>
        </div>

        {/* Header Hero Card */}
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-slate-50/50 p-8 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="relative shrink-0">
              <div className="h-24 w-24 rounded-[32px] bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl">
                <Receipt className="h-10 w-10" />
              </div>
              <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-2xl border-4 border-white bg-indigo-500 flex items-center justify-center shadow-sm">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="space-y-4 text-center md:text-left flex-1">
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Invoice</h2>
                <button
                  type="button"
                  onClick={copyInvoiceId}
                  title="Click to copy invoice ID"
                  className="inline-flex items-center gap-1.5 text-sm font-mono font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {idCopied ? 'Invoice ID copied' : `#${invoice.id.slice(0, 12)}…`}
                </button>
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
              <p className="text-xs font-bold text-slate-400">{contextActionText}</p>
            </div>
            {/* PDF Actions */}
            <div className="flex flex-col gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                className="h-9 gap-2 rounded-xl font-bold text-sm"
                onClick={openPrintNewTab}
              >
                <ExternalLink className="h-4 w-4" />
                Preview Invoice
              </Button>
              <Button
                type="button"
                className="h-9 gap-2 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800 text-sm"
                onClick={downloadPdf}
                disabled={pdfLoading}
              >
                <Download className="h-4 w-4" />
                {pdfLoading ? 'Preparing your invoice…' : isPaid ? 'Download your receipt' : 'Download Invoice'}
              </Button>
            </div>
          </div>
        </div>

        {/* Pay CTA + Trust signals */}
        {dueAmount > 0 && !isCancelled && (
          <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-black text-slate-800">Amount due: {formatCurrency(dueAmount)}</p>
              <div className="flex flex-wrap gap-4 text-[11px] font-bold text-slate-500">
                <span className="flex items-center gap-1"><Lock className="h-3 w-3 text-emerald-600" /> Your payment is secure and encrypted</span>
                <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-indigo-500" /> You&apos;ll receive a receipt after payment</span>
              </div>
            </div>
            <Button
              onClick={handlePayViaGateway}
              disabled={paying}
              className="h-12 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shrink-0"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {paying ? 'Processing payment…' : `Pay ${formatCurrency(dueAmount)} now`}
            </Button>
          </div>
        )}

        {/* Summary */}
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Summary</h3>

        {/* Payment progress bar */}
        {payableAmount > 0 && !isCancelled && (
          <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-600">
                {isPaid
                  ? 'All payments completed 🎉'
                  : `You've paid ${formatCurrency(paidAmount)} out of ${formatCurrency(payableAmount)}`}
              </span>
              <span className="text-sm font-black text-slate-900">
                {isPaid ? 100 : Math.round(Math.min(100, (paidAmount / payableAmount) * 100))}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn('h-2 rounded-full transition-all', isPaid ? 'bg-emerald-500' : 'bg-indigo-500')}
                style={{ width: `${isPaid ? 100 : Math.min(100, (paidAmount / payableAmount) * 100)}%` }}
              />
            </div>
            {isPartial && (
              <p className="mt-2 text-xs font-bold text-amber-600">You still need to pay {formatCurrency(dueAmount)}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: `Total bill: ${formatCurrency(totalAmount)}`, value: formatCurrency(invoice.totalAmount), icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: discountAmount > 0 ? `You saved ${formatCurrency(discountAmount)}` : 'Discounts & Adjustments', value: formatCurrency(discountAmount), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: `You've paid ${formatCurrency(paidAmount)} so far`, value: formatCurrency(invoice.paidAmount), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: dueAmount > 0 ? `You still owe ${formatCurrency(dueAmount)}` : 'Nothing due', value: formatCurrency(invoice.dueAmount), icon: AlertCircle, color: dueAmount > 0 ? 'text-rose-600' : 'text-emerald-600', bg: dueAmount > 0 ? 'bg-rose-50' : 'bg-emerald-50' },
          ].map((stat, i) => (
            <div key={i} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-2xl', stat.bg, stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black leading-snug text-slate-400 mb-1">{stat.label}</p>
              <p className="text-base font-black text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {Number(invoice.discountAmount) > 0 && invoice.discountReference ? (
          <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50/50 px-4 py-3 text-sm font-bold text-amber-950">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Discount reference</span>
            <p className="mt-1">{invoice.discountReference}</p>
          </div>
        ) : null}

        {/* Charges Table */}
        <div className="space-y-2 mb-10">
          <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">
            <Activity className="h-4 w-4" />
            What you&apos;re being charged for
          </h3>
          <p className="text-xs font-bold text-slate-400">Here&apos;s a breakdown of your charges</p>
          <div className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm mt-3">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Type</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Description</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Qty</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Price</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Total</TableHead>
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

        {/* Your Payments & Invoice Info */}
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-4">
              <TrendingUp className="h-4 w-4" />
              Your payments
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
                  <p className="text-sm font-bold text-slate-500 text-center">No payments yet.</p>
                  <p className="text-xs font-bold text-slate-400 text-center mt-1">Once you make a payment, it will appear here.</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
              <History className="h-4 w-4" />
              Invoice Info
            </h3>
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                <span className="text-base font-bold text-slate-500">Created On</span>
                <span className="text-base font-black text-slate-900">{new Date(invoice.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                <span className="text-base font-bold text-slate-500">Status</span>
                <span className="text-base font-black text-indigo-600">{invoice.status}</span>
              </div>
              {invoice.issuedAt && (
                <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                  <span className="text-base font-bold text-slate-500">Date Issued</span>
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

