'use client';

import { useState } from 'react';
import { createPayment, type PaymentMethod } from '@/lib/api/invoices';
import type { Invoice } from '@/types/invoice';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard } from 'lucide-react';

const methodOptions: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BKASH', label: 'bKash' },
  { value: 'BANK', label: 'Bank Transfer' },
];

const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1';

interface RecordPaymentDialogProps {
  invoice: Invoice;
  onSuccess: () => Promise<void>;
}

export function RecordPaymentDialog({ invoice, onSuccess }: RecordPaymentDialogProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();

  const dueAmount = Math.max(0, Number(invoice.dueAmount));
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [amount, setAmount] = useState<number>(dueAmount);
  const [trxId, setTrxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);

      const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const receivedByUserId = user ? JSON.parse(user)?.id : undefined;

      const res = await createPayment({
        invoiceId: invoice.id,
        method,
        amount,
        trxId: trxId.trim() || undefined,
        receivedByUserId,
      });

      if (res.success) {
        toast({ title: 'Payment recorded', description: `৳${amount} recorded successfully.`, variant: 'success' });
        closeModal();
        await onSuccess();
      } else {
        setError(res.message || 'Failed to record payment');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (v: number | string) =>
    `৳${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v))}`;

  return (
    <div className="space-y-6 px-2 py-4">
      {/* Invoice context */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-lg">
            {invoice.student?.fullName?.charAt(0) ?? '?'}
          </div>
          <div>
            <p className="font-black text-slate-900">{invoice.student?.fullName}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {invoice.month || 'No month'} &middot; Due: {formatCurrency(dueAmount)}
            </p>
          </div>
        </div>
        {invoice.items && invoice.items.length > 0 && (
          <div className="text-xs text-slate-500 space-y-0.5 pl-13">
            {invoice.items.map((item, idx) => (
              <p key={idx}>{item.title} &mdash; {formatCurrency(item.lineTotal)}</p>
            ))}
          </div>
        )}
      </div>

      {/* Payment form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className={sectionLabel}>Payment Method</label>
          <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
              {methodOptions.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-sm font-medium">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className={sectionLabel}>Amount (৳)</label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={amount || ''}
            onChange={(e) => setAmount(e.target.value === '' ? 0 : +e.target.value)}
            className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 shadow-inner"
          />
        </div>

        {method !== 'CASH' && (
          <div className="space-y-2">
            <label className={sectionLabel}>Transaction ID</label>
            <Input
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              placeholder="e.g. TRX123456"
              className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 shadow-inner"
            />
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2">{error}</p>
      )}

      <Button
        className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[11px] shadow-lg"
        onClick={handleSubmit}
        disabled={submitting || amount <= 0}
      >
        <CreditCard className="h-4 w-4 mr-2" />
        {submitting ? 'Recording...' : `Record Payment — ${formatCurrency(amount)}`}
      </Button>
    </div>
  );
}
