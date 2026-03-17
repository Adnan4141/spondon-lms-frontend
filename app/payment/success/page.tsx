'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function SuccessContent() {
  const searchParams = useSearchParams();
  const tranId = searchParams.get('tran_id');
  const invoiceId = searchParams.get('invoice_id');
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVerifying(false), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-10 shadow-xl text-center">
        <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Payment Successful</h1>
        <p className="text-slate-500 mb-6">
          {verifying ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying...
            </span>
          ) : (
            'Your payment has been processed successfully.'
          )}
        </p>
        {tranId && <p className="text-xs font-mono text-slate-400 mb-6">Transaction: {tranId}</p>}
        <Link href={invoiceId ? '/admin/invoices' : '/admin'}>
          <Button className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
