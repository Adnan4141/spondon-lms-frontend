'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SmsPurchaseFailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-10 shadow-xl text-center">
        <div className="h-20 w-20 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-10 w-10 text-rose-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">SMS Purchase Failed</h1>
        <p className="text-slate-500 mb-6">Your SMS purchase could not be completed. No charges were made.</p>
        <Link href="/admin/sms">
          <Button variant="outline" className="w-full h-12 rounded-2xl">
            Back to SMS Center
          </Button>
        </Link>
      </div>
    </div>
  );
}
