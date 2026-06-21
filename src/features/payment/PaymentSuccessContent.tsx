'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getInvoiceById, openInvoicePdfInNewTab } from '@/lib/api/invoices';
import type { Invoice } from '@/types/invoice';
import { PaymentInvoiceSummary } from './PaymentInvoiceSummary';
import { PaymentSmsNotice } from './PaymentSmsNotice';
import { getPaymentSuccessDestination, getRoleHome, getStoredRole } from './payment-utils';
import { usePaymentSuccessRedirect } from './usePaymentSuccessRedirect';

export function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoice_id');
  const enrolled = searchParams.get('enrolled') === '1';
  const [verifying, setVerifying] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [role] = useState<string | null>(() => getStoredRole());
  const [pdfOpening, setPdfOpening] = useState(false);
  const redirectHref = getRoleHome(role);

  useEffect(() => {
    const verify = async () => {
      if (invoiceId) {
        try {
          const res = await getInvoiceById(invoiceId);
          if (res.success && res.data) setInvoice(res.data);
        } catch {
          // still show success UI
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setVerifying(false);
    };
    void verify();
  }, [invoiceId]);

  usePaymentSuccessRedirect({ verifying, role, invoiceId, redirectHref });

  const invoiceListUrl = getPaymentSuccessDestination(role, invoiceId, redirectHref);

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
            <PaymentSmsNotice enrolled={enrolled} />
            {invoice ? <PaymentInvoiceSummary invoice={invoice} /> : null}
            <p className="text-xs text-slate-400 mb-6">
              Redirecting to {role === 'STUDENT' ? 'your payments' : 'your invoice'} in a moment…
            </p>
          </>
        )}

        {!verifying && (
          <div className="flex flex-col gap-3">
            {invoiceId ? (
              <button
                type="button"
                disabled={pdfOpening}
                onClick={() => {
                  setPdfOpening(true);
                  void openInvoicePdfInNewTab(invoiceId).catch(console.error).finally(() => setPdfOpening(false));
                }}
                className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                {pdfOpening ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                View Invoice PDF
              </button>
            ) : null}
            <Link href={invoiceListUrl}>
              <Button className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black">
                <FileText className="mr-2 h-4 w-4" />
                {role === 'STUDENT' ? 'Back to Payments' : 'View Invoice'}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
