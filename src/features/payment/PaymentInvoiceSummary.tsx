import type { Invoice } from '@/types/invoice';
import { formatPaymentCurrency } from './payment-utils';

export function PaymentInvoiceSummary({ invoice }: { invoice: Invoice }) {
  return (
    <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-left space-y-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-2">Invoice Summary</p>
      <div className="flex justify-between text-sm font-bold text-slate-700">
        <span>Student</span>
        <span>{invoice.student?.fullName || '—'}</span>
      </div>
      <div className="flex justify-between text-sm font-bold text-slate-700">
        <span>Status</span>
        <span className={
          invoice.status === 'PAID' ? 'text-emerald-600' :
          invoice.status === 'PARTIAL' ? 'text-amber-600' : 'text-slate-600'
        }>
          {invoice.status}
        </span>
      </div>
      <div className="flex justify-between text-sm font-bold text-slate-700">
        <span>Paid</span>
        <span className="text-emerald-700">{formatPaymentCurrency(invoice.paidAmount)}</span>
      </div>
      {Number(invoice.dueAmount) > 0 && (
        <div className="flex justify-between text-sm font-bold text-slate-700">
          <span>Remaining</span>
          <span className="text-rose-600">{formatPaymentCurrency(invoice.dueAmount)}</span>
        </div>
      )}
    </div>
  );
}
