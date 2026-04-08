'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Printer } from 'lucide-react';
import { getInvoiceById } from '@/lib/api/invoices';
import type { Invoice } from '@/types/invoice';
import { SpondonPaperInvoice } from '@/components/admin/invoices/SpondonPaperInvoice';

export default function InvoicePrintPage() {
  const params = useParams();
  const invoiceId = params.invoiceId as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getInvoiceById(invoiceId);
        if (!res.success || !res.data) {
          setError(res.message || 'Invoice not found.');
          return;
        }
        setInvoice(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load invoice.');
      } finally {
        setLoading(false);
      }
    };
    if (invoiceId) void load();
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
        <p className="text-xl font-black text-slate-900">Invoice unavailable</p>
        <p className="max-w-md text-sm font-medium text-slate-500">{error || 'Could not load invoice.'}</p>
        <button
          className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          onClick={() => window.close()}
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 print:bg-white">
      <div className="mx-auto max-w-5xl px-6 py-10 print:max-w-none print:px-0 print:py-0">
        <SpondonPaperInvoice invoice={invoice} className="print:max-w-none" />
      </div>

      {/* Floating print button — hidden when printing */}
      <button
        type="button"
        onClick={() => window.print()}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-xl transition-all hover:bg-indigo-600 hover:scale-105 active:scale-95 print:hidden"
      >
        <Printer className="h-4 w-4" />
        Print
      </button>
    </div>
  );
}
