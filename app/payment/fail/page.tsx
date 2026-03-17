'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function FailContent() {
  const searchParams = useSearchParams();
  const tranId = searchParams.get('tran_id');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-10 shadow-xl text-center">
        <div className="h-20 w-20 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-10 w-10 text-rose-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Payment Failed</h1>
        <p className="text-slate-500 mb-6">Your payment could not be processed. Please try again.</p>
        {tranId && <p className="text-xs font-mono text-slate-400 mb-6">Transaction: {tranId}</p>}
        <Link href="/admin/invoices">
          <Button variant="outline" className="w-full h-12 rounded-2xl">
            Back to Invoices
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-10 w-10 border-2 border-rose-500 border-t-transparent rounded-full" /></div>}>
      <FailContent />
    </Suspense>
  );
}
