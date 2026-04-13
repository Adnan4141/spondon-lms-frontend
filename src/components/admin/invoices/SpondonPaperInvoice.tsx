'use client';

import React from 'react';
import { Invoice } from '@/types/invoice';
import { cn } from '@/lib/utils';

function formatAmount(value: number | string) {
  return new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 }).format(Number(value));
}

function getInitials(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function SpondonPaperInvoice({
  invoice,
  className,
}: {
  invoice: Invoice;
  className?: string;
}) {
  const lastPayment = [...(invoice.payments || [])].sort(
    (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
  )[0];
  const regNo = invoice.student?.studentProfile?.registrationNumber || '—';

  const statusColor: Record<string, string> = {
    PAID: 'bg-green-50 text-green-700 border border-green-200',
    UNPAID: 'bg-red-50 text-red-700 border border-red-200',
    PARTIAL: 'bg-amber-50 text-amber-700 border border-amber-200',
  };
  const statusClass =
    statusColor[invoice.status?.toUpperCase?.()] ?? 'bg-slate-100 text-slate-600';

  return (
    <div
      className={cn(
        'mx-auto max-w-[620px] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between bg-[#1a1a2e] px-7 py-6">
        <div>
          <p className="text-2xl font-semibold text-white">Spondon</p>
          <p className="mt-0.5 text-xs text-white/50">
            {invoice.branch?.vatRegNo
              ? `VAT reg. no: ${invoice.branch.vatRegNo}`
              : 'VAT reg. no: —'}
          </p>
        </div>
        <span className="mt-1 rounded-md border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-white/75">
          Invoice
        </span>
      </div>

      {/* Branch + Invoice meta */}
      <div className="grid grid-cols-2 gap-4 border-b border-slate-100 bg-slate-50 px-7 py-5">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Branch
          </p>
          {invoice.branch?.name && (
            <p className="text-sm font-semibold text-slate-800">{invoice.branch.name}</p>
          )}
          {invoice.branch?.address && (
            <p className="mt-0.5 whitespace-pre-wrap text-xs text-slate-500">
              {invoice.branch.address}
            </p>
          )}
          {invoice.branch?.phone && (
            <p className="mt-0.5 text-xs text-slate-500">{invoice.branch.phone}</p>
          )}
        </div>
        <div className="text-right">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Invoice details
          </p>
          <p className="text-xs text-slate-700">
            ID: <span className="font-semibold">#{invoice.id}</span>
          </p>
          {invoice.month && (
            <p className="mt-0.5 text-xs text-slate-700">
              Billing: <span className="font-semibold">{invoice.month}</span>
            </p>
          )}
          <div className="mt-2 flex justify-end">
            <span
              className={cn(
                'rounded-md px-2.5 py-0.5 text-[11px] font-semibold',
                statusClass
              )}
            >
              {invoice.status}
            </span>
          </div>
        </div>
      </div>

      {/* Student info */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-7 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a1a2e] text-sm font-semibold text-white">
          {getInitials(invoice.student?.fullName)}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800">
            {invoice.student?.fullName || '—'}
          </p>
          <p className="text-xs text-slate-500">
            Reg no: {regNo}
            {invoice.student?.mobile ? ` · ${invoice.student.mobile}` : ''}
          </p>
        </div>
        {lastPayment && (
          <div className="text-right">
            <p className="text-[10px] text-slate-400">Paid on</p>
            <p className="text-xs font-semibold text-slate-700">
              {new Date(lastPayment.paidAt).toLocaleString('en-GB')}
            </p>
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="px-7 py-5">
        <div className="mb-2 grid grid-cols-12 gap-2 border-b border-slate-800 pb-2">
          <span className="col-span-5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Course / Item
          </span>
          <span className="col-span-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Qty
          </span>
          <span className="col-span-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Unit
          </span>
          <span className="col-span-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Fee (BDT)
          </span>
        </div>
        {(invoice.items || []).map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-12 gap-2 border-b border-slate-100 py-2.5"
          >
            <span className="col-span-5 text-[13px] font-medium text-slate-800">
              {item.title}
            </span>
            <span className="col-span-2 text-[13px] text-slate-500">{item.qty}</span>
            <span className="col-span-2 text-right text-[13px] text-slate-500">
              {formatAmount(item.unitPrice)}
            </span>
            <span className="col-span-3 text-right text-[13px] font-semibold text-slate-800">
              {formatAmount(item.lineTotal)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-7 py-4">
        <div className="w-52 space-y-1.5">
          <div className="flex justify-between text-[13px]">
            <span className="text-slate-500">Total (VAT incl.)</span>
            <span className="font-semibold text-slate-800">
              {formatAmount(invoice.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-slate-500">Paid amount</span>
            <span className="font-semibold text-slate-800">
              {formatAmount(invoice.paidAmount)}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-[14px]">
            <span className="font-semibold text-slate-800">Balance due</span>
            <span
              className={cn(
                'font-semibold',
                Number(invoice.dueAmount) === 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {formatAmount(invoice.dueAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment info */}
      {lastPayment && (
        <div className="border-t border-slate-100 px-7 py-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Payment information
          </p>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-[10px] text-slate-400">Branch</p>
              <p className="text-xs font-medium text-slate-700">
                {invoice.branch?.name || '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Method</p>
              <p className="text-xs font-medium capitalize text-slate-700">
                {String(lastPayment.method).toLowerCase()}
              </p>
            </div>
            {lastPayment.receivedBy?.fullName && (
              <div>
                <p className="text-[10px] text-slate-400">Received by</p>
                <p className="text-xs font-medium text-slate-700">
                  {lastPayment.receivedBy.fullName}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-7 py-3">
        <p className="text-[11px] text-slate-400">Thank you for your payment.</p>
        <p className="text-[11px] text-slate-400">
          System generated · no signature required
        </p>
      </div>
    </div>
  );
}