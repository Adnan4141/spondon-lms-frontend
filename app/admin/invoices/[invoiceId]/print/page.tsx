'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getInvoiceById } from '@/lib/api/invoices';
import type { Invoice } from '@/types/invoice';
import { Button } from '@/components/ui/button';
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
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/admin/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to invoices
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 print:bg-white">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900">Invoice Print View</h1>
            <p className="text-sm font-medium text-slate-500">This view uses HTML so Bangla text stays readable in the browser.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/admin/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button type="button" className="rounded-xl" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 print:max-w-none print:px-0 print:py-0">
        <SpondonPaperInvoice invoice={invoice} className="print:max-w-none" />
      </div>
    </div>
  );
}
