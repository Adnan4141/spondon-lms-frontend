'use client';

import Link from 'next/link';
import { BookMarked, Package, Loader2, ExternalLink, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_ORIGIN } from '@/lib/api';
import { getInvoicePdfUrl } from '@/lib/api/invoices';
import { useToast } from '@/hooks/use-toast';
import type { Book } from '@/lib/api/books';

export type MyBookPurchaseRow = {
  id: string;
  soldAt: string;
  items: Array<{ book: Book; qty: number; lineTotal: unknown }>;
  delivery: {
    deliveryStatus: string;
    recipientName: string;
    address: string;
  } | null;
  invoice: {
    id: string;
    status: string;
    dueAmount: unknown;
    payableAmount?: unknown;
  } | null;
};

function money(n: unknown) {
  return Number(n ?? 0).toLocaleString();
}

function deliveryLabel(s: string) {
  const u = s.toUpperCase();
  if (u === 'DELIVERED') return 'ডেলিভার্ড';
  if (u === 'SHIPPED') return 'পাঠানো হয়েছে';
  if (u === 'PROCESSING') return 'প্রসেসিং';
  if (u === 'CANCELLED') return 'বাতিল';
  return 'অপেক্ষমান';
}

type Props = {
  purchases: MyBookPurchaseRow[];
  loading?: boolean;
  compact?: boolean;
};

export function MyBookPurchasesPanel({ purchases, loading, compact }: Props) {
  const { toast } = useToast();

  const openPdf = async (invoiceId: string) => {
    try {
      const res = await getInvoicePdfUrl(invoiceId);
      if (!res.success || !res.data?.pdfUrl) throw new Error((res as { message?: string }).message || 'No PDF');
      const path = res.data.pdfUrl.startsWith('http')
        ? res.data.pdfUrl
        : `${API_ORIGIN}${res.data.pdfUrl.startsWith('/') ? '' : '/'}${res.data.pdfUrl}`;
      const fr = await fetch(path, { credentials: 'include' });
      if (!fr.ok) throw new Error('PDF খুলতে ব্যর্থ');
      const blob = await fr.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      toast({
        title: 'PDF',
        description: e instanceof Error ? e.message : 'ব্যর্থ',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-3xl border border-slate-100 bg-white py-12 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        <span className="font-bold">আপনার বই লোড হচ্ছে…</span>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
        <BookMarked className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="font-bold text-slate-600">এখনও কোনো বই অর্ডার নেই</p>
        <p className="mt-1 text-sm text-slate-500">ক্যাটালগ থেকে কিনুন বা কোর্স ভর্তির সময় বই যুক্ত করুন।</p>
        <Button asChild className="mt-4 rounded-2xl font-bold" variant="outline">
          <Link href="/books">পাবলিক ক্যাটালগ</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {purchases.map((sale) => {
        const inv = sale.invoice;
        const due = inv ? Number(inv.dueAmount) : 0;
        const first = sale.items[0]?.book;
        return (
          <div
            key={sale.id}
            className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 flex-1 gap-4">
              <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                {first?.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={first.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <BookMarked className="h-6 w-6 text-slate-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-slate-900 line-clamp-2">
                  {sale.items.map((i) => i.book.name).join(', ')}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-400">
                  {new Date(sale.soldAt).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {first?.isEbook ? (
                    <Badge className="rounded-lg bg-violet-100 text-violet-800 hover:bg-violet-100">ই-বুক</Badge>
                  ) : (
                    <Badge className="rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-100">প্রিন্ট / ডেলিভারি</Badge>
                  )}
                  {sale.delivery ? (
                    <Badge variant="outline" className="rounded-lg font-bold">
                      <Package className="mr-1 h-3 w-3" />
                      {deliveryLabel(sale.delivery.deliveryStatus)}
                    </Badge>
                  ) : null}
                  {inv ? (
                    <Badge variant="outline" className="rounded-lg font-mono text-[10px]">
                      {inv.status}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <p className="text-lg font-black text-indigo-600">
                ৳{money(sale.items.reduce((s, i) => s + Number(i.lineTotal), 0))}
              </p>
              <div className="flex flex-wrap gap-2">
                {first?.isEbook ? (
                  <Button asChild size="sm" variant="outline" className="rounded-xl font-bold">
                    <Link href={`/books/${first.id}`}>
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      পড়ুন
                    </Link>
                  </Button>
                ) : null}
                {inv && due > 0 ? (
                  <Button asChild size="sm" className="rounded-xl bg-slate-900 font-bold">
                    <Link href="/student/payment">
                      <CreditCard className="mr-1 h-3.5 w-3.5" />
                      পেমেন্ট
                    </Link>
                  </Button>
                ) : null}
                {inv ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="rounded-xl font-bold"
                    onClick={() => void openPdf(inv.id)}
                  >
                    PDF
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
