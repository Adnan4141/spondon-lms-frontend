'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { verifySmsPurchase } from '@/lib/api/sms-purchase';

function SuccessContent() {
  const searchParams = useSearchParams();
  const tranId = searchParams.get('tran_id');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!tranId) return;
    verifySmsPurchase(tranId)
      .then((res) => setVerified(res.success))
      .catch(() => setVerified(false));
  }, [tranId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-10 shadow-xl text-center">
        <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">SMS Purchase Successful</h1>
        <p className="text-slate-500 mb-6">
          {verified ? 'SMS credits have been added to your wallet.' : 'Verifying your purchase...'}
        </p>
        <Link href="/admin/sms">
          <Button className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700">
            Back to SMS Center
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function SmsPurchaseSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
