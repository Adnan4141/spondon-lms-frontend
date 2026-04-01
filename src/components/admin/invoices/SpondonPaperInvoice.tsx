'use client';

import React from 'react';
import { Invoice } from '@/types/invoice';
import { cn } from '@/lib/utils';

function formatAmount(value: number | string) {
  return new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 }).format(Number(value));
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

  return (
    <div
      className={cn(
        'mx-auto max-w-[640px] rounded-sm border border-slate-300 bg-white p-8 text-slate-900 shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none',
        className
      )}
    >
      <p className="text-lg font-bold">Spondon</p>
      <p className="text-xs text-slate-600">
        {invoice.branch?.vatRegNo ? `VAT reg. no: ${invoice.branch.vatRegNo}` : 'VAT reg. no:'}
      </p>
      {invoice.branch?.name ? <p className="text-sm font-semibold">{invoice.branch.name}</p> : null}
      {invoice.branch?.address ? <p className="whitespace-pre-wrap text-xs text-slate-700">{invoice.branch.address}</p> : null}
      {invoice.branch?.phone ? <p className="text-xs text-slate-600">Phone: {invoice.branch.phone}</p> : null}
      <div className="my-4 border-t border-slate-300" />
      <p className="text-base font-bold">Invoice</p>
      <p className="text-xs text-slate-800">Invoice ID: {invoice.id}</p>
      {invoice.month ? <p className="text-xs text-slate-800">Billing month: {invoice.month}</p> : null}
      <p className="text-xs text-slate-800">Branch: {invoice.branch?.name || '—'}</p>
      <p className="text-xs text-slate-800">Status: {invoice.status}</p>
      {lastPayment ? (
        <p className="text-xs text-slate-800">
          Payment date: {new Date(lastPayment.paidAt).toLocaleString('en-GB')}
        </p>
      ) : null}
      <p className="mt-3 text-sm font-semibold">{invoice.student?.fullName}</p>
      <p className="text-xs text-slate-800">Registration no: {regNo}</p>
      <p className="text-xs text-slate-800">Mobile: {invoice.student?.mobile || '—'}</p>
      <div className="my-4 border-t border-slate-300" />
      <div className="grid grid-cols-12 gap-1 border-b border-slate-800 pb-1 text-[10px] font-bold uppercase">
        <span className="col-span-5">Course / Item</span>
        <span className="col-span-2">Qty</span>
        <span className="col-span-2 text-right">Unit</span>
        <span className="col-span-3 text-right">Fee (BDT)</span>
      </div>
      {(invoice.items || []).map((item) => (
        <div key={item.id} className="grid grid-cols-12 gap-1 border-b border-slate-200 py-2 text-xs">
          <span className="col-span-5 font-medium">{item.title}</span>
          <span className="col-span-2 text-slate-600">{item.qty}</span>
          <span className="col-span-2 text-right text-slate-600">{formatAmount(item.unitPrice)}</span>
          <span className="col-span-3 text-right font-semibold">{formatAmount(item.lineTotal)}</span>
        </div>
      ))}
      <div className="mt-4 space-y-1 text-xs">
        <div className="flex justify-between font-semibold">
          <span>Total (VAT included)</span>
          <span>{formatAmount(invoice.totalAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Paid amount</span>
          <span>{formatAmount(invoice.paidAmount)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Balance due</span>
          <span>{formatAmount(invoice.dueAmount)}</span>
        </div>
      </div>
      {lastPayment ? (
        <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-700">
          <p className="font-bold">Payment information</p>
          <p>Payment branch: {invoice.branch?.name || '—'}</p>
          <p>Payment method: {String(lastPayment.method).toLowerCase()}</p>
          {lastPayment.receivedBy?.fullName ? <p>Payment received by: {lastPayment.receivedBy.fullName}</p> : null}
        </div>
      ) : null}
      <p className="mt-6 text-[10px] text-slate-500">Thank you for your payment.</p>
      <p className="text-[10px] text-slate-500">This invoice is system generated, no signature is required.</p>
    </div>
  );
}
