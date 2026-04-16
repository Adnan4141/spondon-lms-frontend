'use client';

import React, { useMemo, useState } from 'react';
import type { Invoice, InvoiceItem } from '@/types/invoice';
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
  CreditCard,
  Download,
  ExternalLink,
  Lock,
  Sparkles,
  Copy,
  Wallet,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useModalStore } from '@/store/modalStore';
import { RecordPaymentDialog } from '@/components/admin/invoices/RecordPaymentDialog';

interface InvoiceDetailsViewProps {
  invoice: Invoice;
  onRefresh?: () => void | Promise<void>;
}

function getStatusBadgeClass(status: string) {
  const s = String(status).toUpperCase();
  if (s === 'PAID') return 'bg-[#EAF3DE] text-[#27500A] border-[#D4E8C4]';
  if (s === 'PARTIAL') return 'bg-[#FAEEDA] text-[#633806] border-[#F0E0C4]';
  if (s === 'ISSUED') return 'bg-[#E6F1FB] text-[#0C447C] border-[#C9DFF3]';
  if (s === 'CANCELLED') return 'bg-[#FCEBEB] text-[#791F1F] border-[#F5D0D0]';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function itemTypeBadgeClass(type: string) {
  const t = String(type).toUpperCase();
  if (t === 'COURSE') return 'bg-[#EEEDFE] text-[#3C3489] border-[#D8D4F5]';
  if (t === 'BOOK') return 'bg-[#FAEEDA] text-[#633806] border-[#F0E0C4]';
  if (t === 'ADMISSION_FEE') return 'bg-[#E6F1FB] text-[#0C447C] border-[#C9DFF3]';
  return 'bg-slate-100 text-slate-600 border-slate-200';
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

function initials(name?: string | null): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isItemCancelled(item: InvoiceItem): boolean {
  return Boolean(item.cancelled);
}

export function InvoiceDetailsView({ invoice, onRefresh }: InvoiceDetailsViewProps) {
  const { toast } = useToast();
  const { openModal, closeModal } = useModalStore();
  const [paying, setPaying] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  const dueAmount = Number(invoice.dueAmount);
  const paidAmount = Number(invoice.paidAmount);
  const totalAmount = Number(invoice.totalAmount);
  const payableAmount = Number(invoice.payableAmount) || totalAmount;
  const discountAmount = Number(invoice.discountAmount);
  const monthlyDisc = Number(invoice.monthlyDiscountAmount ?? 0);
  const status = String(invoice.status).toUpperCase();
  const isPaid = status === 'PAID';
  const isPartial = status === 'PARTIAL';
  const isCancelled = status === 'CANCELLED';

  const items = invoice.items ?? [];
  const activeItems = useMemo(() => items.filter((i) => !isItemCancelled(i)), [items]);
  const cancelledItems = useMemo(() => items.filter((i) => isItemCancelled(i)), [items]);

  const subtotalActive = useMemo(
    () => activeItems.reduce((s, i) => s + Number(i.lineTotal), 0),
    [activeItems],
  );

  const openPrintNewTab = () => {
    window.open(
      `/admin/invoices/${invoice.id}/print`,
      'invoice-preview',
      'width=860,height=1000,scrollbars=yes,resizable=yes',
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

  const openRecordPayment = () => {
    closeModal();
    queueMicrotask(() => {
      openModal({
        title: 'Record Manual Payment',
        description: `Record a payment for ${invoice.month || 'this invoice'}.`,
        className: 'sm:max-w-lg',
        content: (
          <RecordPaymentDialog
            invoice={invoice}
            onSuccess={async () => {
              await onRefresh?.();
            }}
          />
        ),
      });
    });
  };

  const copyInvoiceId = async () => {
    try {
      await navigator.clipboard.writeText(invoice.id);
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const formatCurrency = (amount: number | string) =>
    `৳${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount))}`;

  const formatCurrencyFull = (amount: number | string) =>
    `৳${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount))}`;

  const displayInvoiceRef = invoice.id.length > 18 ? `${invoice.id.slice(0, 14)}…` : invoice.id;
  const reg = invoice.student?.studentProfile?.registrationNumber;
  const updatedStr = new Date(invoice.updatedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const activityEntries = useMemo(() => {
    const rows: { dot: 'cancel' | 'update' | 'invoice'; title: string; meta: string }[] = [];
    if (invoice.replacedInvoice?.id) {
      rows.push({
        dot: 'invoice',
        title: 'Revised invoice',
        meta: `Replaces invoice ${invoice.replacedInvoice.id.slice(0, 12)}… · ${invoice.replacedInvoice.status}`,
      });
    }
    if (invoice.replacement?.id) {
      rows.push({
        dot: 'update',
        title: 'Superseded',
        meta: `New invoice ${invoice.replacement.id.slice(0, 12)}… (${invoice.replacement.status})`,
      });
    }
    if (invoice.issuedAt) {
      rows.push({
        dot: 'invoice',
        title: 'Invoice issued',
        meta: new Date(invoice.issuedAt).toLocaleString(),
      });
    }
    (invoice.payments ?? []).forEach((p) => {
      rows.push({
        dot: 'update',
        title: 'Payment recorded',
        meta: `${formatCurrencyFull(p.amount)} · ${p.method} · ${new Date(p.paidAt).toLocaleString()}${p.trxId ? ` · ${p.trxId}` : ''}`,
      });
    });
    if (rows.length === 0) {
      rows.push({
        dot: 'update',
        title: 'No activity yet',
        meta: 'Issuance and payments will appear here.',
      });
    }
    return rows;
  }, [invoice]);

  const nextDueStr = invoice.nextPaymentDueDate
    ? new Date(invoice.nextPaymentDueDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const sectionLabel = 'text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 mb-3';

  const cardClass = 'rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm';

  const rowClass = 'flex items-center justify-between gap-3 border-b border-slate-200/80 py-2.5 last:border-b-0';

  return (
    <div className="mx-auto w-full max-w-full bg-white px-4 py-1 text-slate-900 sm:px-6">
      <h2 className="sr-only">
        Invoice details for {invoice.student?.fullName ?? 'student'}
        {invoice.month ? `, billing month ${invoice.month}` : ''}
      </h2>

      {/* Student header strip (reference layout) */}
      <div className="mb-5 flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-[15px] font-medium text-[#3C3489]"
          aria-hidden
        >
          {initials(invoice.student?.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-slate-900">{invoice.student?.fullName ?? '—'}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {reg ? <>Reg. {reg}</> : <>ID {invoice.student?.mobile ?? '—'}</>}
            {' · '}
            {invoice.branch?.name ?? '—'}
            {' · '}
            Updated {updatedStr}
          </p>
        </div>
        <Badge variant="outline" className={cn('shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium', getStatusBadgeClass(status))}>
          {status}
        </Badge>
      </div>

      {/* Metrics */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-slate-50 px-3 py-3">
          <p className="text-[11px] text-slate-500">Active lines</p>
          <p className="mt-1 text-xl font-medium text-slate-900">{activeItems.length}</p>
          {cancelledItems.length > 0 ? (
            <p className="mt-0.5 text-[11px] text-[#A32D2D]">was {items.length}</p>
          ) : (
            <p className="mt-0.5 text-[11px] text-slate-400">of {items.length}</p>
          )}
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-3">
          <p className="text-[11px] text-slate-500">Subtotal (active)</p>
          <p className="mt-1 text-xl font-medium text-slate-900">{formatCurrency(subtotalActive)}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">line items</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-3">
          <p className="text-[11px] text-slate-500">Due</p>
          <p className={cn('mt-1 text-xl font-medium', dueAmount > 0 ? 'text-[#A32D2D]' : 'text-[#3B6D11]')}>
            {formatCurrency(dueAmount)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">{isPaid ? 'settled' : isPartial ? 'partial' : 'balance'}</p>
        </div>
      </div>

      {/* Settlement actions — same capabilities as before */}
      <div className={cn(cardClass, 'mb-5 flex flex-wrap gap-2')}>
        <Button type="button" variant="outline" size="sm" className="h-9 rounded-md border-slate-300 bg-transparent text-[13px] font-medium" onClick={openPrintNewTab}>
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
          Preview invoice
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-9 rounded-md border border-slate-800 bg-slate-900 text-[13px] font-medium text-white hover:bg-slate-800"
          onClick={downloadPdf}
          disabled={pdfLoading}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {pdfLoading ? 'Preparing…' : isPaid ? 'Download receipt' : 'Download PDF'}
        </Button>
        {dueAmount > 0 && !isCancelled && (
          <>
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-md bg-emerald-600 text-[13px] font-medium text-white hover:bg-emerald-700"
              onClick={handlePayViaGateway}
              disabled={paying}
            >
              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
              {paying ? 'Redirecting…' : `Pay ${formatCurrency(dueAmount)} (gateway)`}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-md border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              onClick={openRecordPayment}
            >
              <Wallet className="mr-1.5 h-3.5 w-3.5" />
              Record payment
            </Button>
          </>
        )}
      </div>

      {dueAmount > 0 && !isCancelled && (
        <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-[11px] font-medium text-slate-600">
          <span className="flex items-center gap-1 text-emerald-800">
            <Lock className="h-3 w-3" /> Secure gateway
          </span>
          <span className="mx-2 text-slate-300">·</span>
          <span className="inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            Receipt after payment
          </span>
        </div>
      )}

      {/* Line items (enrollment-style list) */}
      <p className={sectionLabel}>Charges & line items</p>
      <div className={cn(cardClass, 'mb-5')}>
        {[...activeItems, ...cancelledItems].map((item) => {
          const cancelled = isItemCancelled(item);
          return (
            <div key={item.id} className={cn(rowClass, cancelled && 'opacity-55')}>
              <div className="min-w-0">
                <p className={cn('text-sm font-medium text-slate-900', cancelled && 'text-slate-500 line-through')}>{item.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <Badge variant="outline" className={cn('rounded-md border px-2 py-0 text-[11px] font-medium', itemTypeBadgeClass(item.type))}>
                    {item.type.replace('_', ' ')}
                  </Badge>
                  {cancelled ? (
                    <Badge variant="outline" className="rounded-md border bg-[#FCEBEB] px-2 py-0 text-[11px] font-medium text-[#791F1F] border-[#F5D0D0]">
                      Cancelled
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="shrink-0 text-right">
                {!cancelled ? (
                  <span className="text-sm font-medium text-slate-900">{formatCurrency(item.lineTotal)}</span>
                ) : (
                  <span className="text-sm text-slate-400 line-through">{formatCurrency(item.lineTotal)}</span>
                )}
              </div>
            </div>
          );
        })}
        {items.length === 0 ? <p className="py-4 text-center text-sm text-slate-400">No line items.</p> : null}
      </div>

      {/* Discounts */}
      {(discountAmount > 0 || monthlyDisc > 0) && (
        <>
          <p className={sectionLabel}>Discounts</p>
          <div className={cn(cardClass, 'mb-5 space-y-0')}>
            {discountAmount > 0 ? (
              <div className={rowClass}>
                <div>
                  <p className="text-sm font-medium text-slate-900">Special discount</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    One-time{invoice.discountReference ? ` · ${invoice.discountReference}` : ''}
                  </p>
                </div>
                <span className="text-sm font-medium text-[#A32D2D]">− {formatCurrency(discountAmount)}</span>
              </div>
            ) : null}
            {monthlyDisc > 0 ? (
              <div className={rowClass}>
                <div>
                  <p className="text-sm font-medium text-slate-900">Monthly discount</p>
                  <p className="mt-0.5 text-xs text-slate-500">Recurring (this invoice)</p>
                </div>
                <span className="text-sm font-medium text-[#A32D2D]">− {formatCurrency(monthlyDisc)}</span>
              </div>
            ) : null}
          </div>
        </>
      )}

      {/* Invoice summary card */}
      <p className={sectionLabel}>Invoice summary</p>
      <div className={cn(cardClass, 'mb-5')}>
        <div className="mb-3 flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-3">
          <div className="min-w-0">
            <button
              type="button"
              onClick={copyInvoiceId}
              title="Copy full invoice ID"
              className="flex items-center gap-1.5 text-left text-[13px] font-medium text-slate-900 hover:text-indigo-600"
            >
              <Copy className="h-3.5 w-3.5 shrink-0" />
              {idCopied ? 'Copied' : displayInvoiceRef}
            </button>
            <p className="mt-1 text-xs text-slate-500">
              {invoice.month ? `Month ${invoice.month}` : 'No billing month'}
              {invoice.issuedAt ? ` · Issued ${new Date(invoice.issuedAt).toLocaleDateString()}` : ''}
            </p>
          </div>
          <Badge variant="outline" className={cn('shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium', getStatusBadgeClass(status))}>
            {status}
          </Badge>
        </div>

        <div className={rowClass}>
          <span className="text-[13px] text-slate-500">Subtotal (active lines)</span>
          <span className="text-sm font-medium text-slate-900">{formatCurrency(subtotalActive)}</span>
        </div>
        {discountAmount > 0 ? (
          <div className={rowClass}>
            <span className="text-[13px] text-slate-500">Special discount</span>
            <span className="text-sm font-medium text-[#A32D2D]">− {formatCurrency(discountAmount)}</span>
          </div>
        ) : null}
        {monthlyDisc > 0 ? (
          <div className={rowClass}>
            <span className="text-[13px] text-slate-500">Monthly discount</span>
            <span className="text-sm font-medium text-[#A32D2D]">− {formatCurrency(monthlyDisc)}</span>
          </div>
        ) : null}

        <div className="my-3 border-t border-slate-200/80" />

        <div className={rowClass}>
          <span className="text-sm font-medium text-slate-900">Total payable</span>
          <span className="text-base font-medium text-slate-900">{formatCurrency(payableAmount)}</span>
        </div>
        <div className={rowClass}>
          <span className="text-[13px] text-slate-500">Paid</span>
          <span className="text-sm font-medium text-[#3B6D11]">{formatCurrency(paidAmount)}</span>
        </div>
        <div className={rowClass}>
          <span className="text-sm font-medium text-[#A32D2D]">Due</span>
          <span className="text-base font-medium text-[#A32D2D]">{formatCurrency(dueAmount)}</span>
        </div>
        {nextDueStr ? (
          <div className={rowClass}>
            <span className="text-[13px] text-slate-500">Next payment due</span>
            <span className="text-sm font-medium text-slate-900">{nextDueStr}</span>
          </div>
        ) : null}
      </div>

      {/* Payments list (compact) */}
      <p className={sectionLabel}>Payments</p>
      <div className={cn(cardClass, 'mb-5')}>
        {invoice.payments && invoice.payments.length > 0 ? (
          invoice.payments.map((p) => (
            <div key={p.id} className={rowClass}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{formatCurrencyFull(p.amount)}</p>
                  <p className="text-[11px] text-slate-500">
                    {p.method} · {new Date(p.paidAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {p.trxId ? <span className="font-mono text-[11px] text-slate-400">{p.trxId.slice(0, 14)}…</span> : null}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <FileText className="mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No payments yet</p>
          </div>
        )}
      </div>

      {/* Activity log */}
      <p className={sectionLabel}>Activity log</p>
      <div className={cn(cardClass, 'mb-2')}>
        {activityEntries.map((log, idx) => (
          <div key={idx} className="flex gap-2.5 border-b border-slate-200/80 py-2 last:border-b-0">
            <span
              className={cn(
                'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                log.dot === 'cancel' && 'bg-[#E24B4A]',
                log.dot === 'update' && 'bg-[#639922]',
                log.dot === 'invoice' && 'bg-[#378ADD]',
              )}
              aria-hidden
            />
            <div>
              <p className="text-[13px] font-medium text-slate-900">{log.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{log.meta}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1">
          <User className="h-3.5 w-3.5" />
          {invoice.student?.mobile}
        </span>
        <span>·</span>
        <span className="inline-flex items-center gap-1">
          <Building2 className="h-3.5 w-3.5" />
          {invoice.branch?.name}
        </span>
        {invoice.month ? (
          <>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {invoice.month}
            </span>
          </>
        ) : null}
        <span>·</span>
        <span className="inline-flex items-center gap-1">
          <History className="h-3.5 w-3.5" />
          Created {new Date(invoice.createdAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
