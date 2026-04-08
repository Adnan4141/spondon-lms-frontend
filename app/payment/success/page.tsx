'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getInvoiceById } from '@/lib/api/invoices';
import type { Invoice } from '@/types/invoice';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const invoiceId = searchParams.get('invoice_id');
  const [verifying, setVerifying] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [redirectHref, setRedirectHref] = useState('/admin');

  // Determine role-based redirect base
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      const role = raw ? (JSON.parse(raw) as { role?: string })?.role : null;
      if (role === 'STUDENT') setRedirectHref('/student');
      else if (role === 'TEACHER') setRedirectHref('/teacher');
      else if (role === 'BRANCH_ADMIN') setRedirectHref('/admin/branch');
      else setRedirectHref('/admin');
    } catch {
      setRedirectHref('/');
    }
  }, []);

  // Fetch invoice to confirm payment recorded
  useEffect(() => {
    const verify = async () => {
      if (invoiceId) {
        try {
          const res = await getInvoiceById(invoiceId);
          if (res.success && res.data) setInvoice(res.data);
        } catch {
          // silently ignore — still show success UI
        }
      }
      // brief pause so the success message is readable
      await new Promise((r) => setTimeout(r, 1500));
      setVerifying(false);
    };
    void verify();
  }, [invoiceId]);

  // Auto-redirect after showing success
  useEffect(() => {
    if (!verifying) {
      const dest = invoiceId ? `/admin/invoices?open=${invoiceId}` : redirectHref;
      const t = setTimeout(() => router.replace(dest), 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [verifying, invoiceId, redirectHref, router]);

  const invoiceViewUrl = invoiceId ? `/admin/invoices/${invoiceId}/print` : null;
  const invoiceListUrl = invoiceId ? `/admin/invoices?open=${invoiceId}` : redirectHref;

  const formatCurrency = (v: number | string) =>
    `৳${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(Number(v))}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-10 shadow-xl text-center">
        <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          {verifying ? (
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          ) : (
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          )}
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-2">
          {verifying ? 'Processing payment…' : 'Payment Successful'}
        </h1>

        {verifying ? (
          <p className="text-slate-500 mb-6">Confirming your transaction, please wait.</p>
        ) : (
          <>
            <p className="text-slate-500 mb-4">Your payment has been processed successfully.</p>
            {invoice && (
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
                  <span className="text-emerald-700">{formatCurrency(invoice.paidAmount)}</span>
                </div>
                {Number(invoice.dueAmount) > 0 && (
                  <div className="flex justify-between text-sm font-bold text-slate-700">
                    <span>Remaining</span>
                    <span className="text-rose-600">{formatCurrency(invoice.dueAmount)}</span>
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-slate-400 mb-6">Redirecting to your invoice in a moment…</p>
          </>
        )}

        {!verifying && (
          <div className="flex flex-col gap-3">
            {invoiceViewUrl && (
              <button
                onClick={() =>
                  window.open(invoiceViewUrl, 'invoice-preview', 'width=860,height=1000,scrollbars=yes,resizable=yes')
                }
                className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50 transition-all"
              >
                <ExternalLink className="h-4 w-4" />
                Preview Invoice
              </button>
            )}
            <Link href={invoiceListUrl}>
              <Button className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black">
                <FileText className="mr-2 h-4 w-4" />
                View Invoice
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
