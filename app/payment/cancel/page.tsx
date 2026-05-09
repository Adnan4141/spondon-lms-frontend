'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PaymentCancelPage() {
  let backHref = '/admin/invoices';
  let backLabel = 'Back to Invoices';
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const role = raw ? (JSON.parse(raw) as { role?: string })?.role : null;
    if (role === 'STUDENT') {
      backHref = '/student/payment';
      backLabel = 'Back to Payments';
    }
  } catch {
    backHref = '/';
    backLabel = 'Back';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-10 shadow-xl text-center">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Payment Cancelled</h1>
        <p className="text-slate-500 mb-6">You cancelled the payment. No charges were made.</p>
        <Link href={backHref}>
          <Button variant="outline" className="w-full h-12 rounded-2xl">
            {backLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
}
