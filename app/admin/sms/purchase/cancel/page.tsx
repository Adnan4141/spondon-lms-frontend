'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SmsPurchaseCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-10 shadow-xl text-center">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Purchase Cancelled</h1>
        <p className="text-slate-500 mb-6">You cancelled the SMS purchase. No charges were made.</p>
        <Link href="/admin/sms">
          <Button variant="outline" className="w-full h-12 rounded-2xl">
            Back to SMS Center
          </Button>
        </Link>
      </div>
    </div>
  );
}
