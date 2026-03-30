'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { getBookById, type Book } from '@/lib/api/books';
import { getBranches } from '@/lib/api/branches';
import { purchaseBook } from '@/lib/api/student-portal';
import { initInvoicePayment } from '@/lib/api/invoices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type LocalUser = { id: string; role?: string; fullName?: string; mobile?: string };

function readUser(): LocalUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    return null;
  }
}

export default function BookDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;
  const [book, setBook] = useState<Book | null>(null);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [purchaseHint, setPurchaseHint] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoadError(null);
        const [bookRes, branchRes] = await Promise.all([getBookById(bookId), getBranches()]);
        if (bookRes.success && bookRes.data) setBook(bookRes.data as Book);
        else setLoadError('বই পাওয়া যায়নি।');
        if (branchRes.success) setBranches(branchRes.data || []);
      } catch (err) {
        console.error(err);
        setLoadError('বই লোড করা যায়নি।');
      }
    })();
  }, [bookId]);

  const openCheckout = () => {
    setPurchaseHint(null);
    const u = readUser();
    if (!u?.id) {
      router.replace(`/login?redirect=${encodeURIComponent(`/student/books/${bookId}`)}`);
      return;
    }
    if (String(u.role || '').toUpperCase() !== 'STUDENT') {
      setPurchaseHint('শুধুমাত্র শিক্ষার্থী অ্যাকাউন্ট দিয়ে কেনা যাবে।');
      return;
    }
    setRecipientName(u.fullName || '');
    setPhone(u.mobile || '');
    setAddress('');
    setCity('');
    setPostalCode('');
    setNotes('');
    setFormError(null);
    setCheckoutOpen(true);
  };

  const pay = async () => {
    const u = readUser();
    if (!u || !book) return;
    if (String(u.role || '').toUpperCase() !== 'STUDENT') {
      setFormError('শুধুমাত্র শিক্ষার্থী অ্যাকাউন্ট দিয়ে কেনা যাবে।');
      return;
    }
    if (!recipientName.trim() || !phone.trim() || !address.trim()) {
      setFormError('নাম, মোবাইল ও ঠিকানা পূরণ করুন।');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const purchaseRes = await purchaseBook({
        studentUserId: u.id,
        bookId: book.id,
        branchId: branches[0]?.id,
        delivery: {
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim() || undefined,
          postalCode: postalCode.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });
      if (!purchaseRes.success || !purchaseRes.data?.id) throw new Error('অর্ডার তৈরি ব্যর্থ');
      const paymentRes = await initInvoicePayment(purchaseRes.data.id);
      if (paymentRes.success && paymentRes.data?.GatewayPageURL) {
        window.location.href = paymentRes.data.GatewayPageURL;
        return;
      }
      throw new Error('পেমেন্ট শুরু করা যায়নি');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'পেমেন্ট ব্যর্থ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-4 text-center">
        <p className="text-rose-600 font-semibold">{loadError}</p>
        <Link href="/student/books" className="inline-flex items-center gap-2 text-indigo-600 font-semibold">
          <ArrowLeft className="h-4 w-4" /> সব বই
        </Link>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-slate-500">
        লোড হচ্ছে…
      </div>
    );
  }

  const isFree = Number(book.price) === 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <Link href="/" className="text-slate-500 hover:text-indigo-600 font-medium">
          হোম
        </Link>
        <span className="text-slate-300">/</span>
        <Link href="/student/books" className="inline-flex items-center gap-2 text-indigo-600 font-semibold">
          <ArrowLeft className="h-4 w-4" /> সব বই
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-slate-200 bg-slate-50">
          <Image
            src={book.thumbnailUrl || 'https://placehold.co/600x800?text=Book'}
            alt={book.name}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <div className="space-y-4">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500">Digital Book</p>
          <h1 className="text-3xl font-black text-slate-900 leading-tight">{book.name}</h1>
          <p className="text-sm text-slate-600">{book.description || 'বইয়ের বিস্তারিত নেই।'}</p>
          <div className="flex items-center gap-3">
            <span className="text-emerald-600 text-3xl font-black">
              {isFree ? 'FREE' : `৳${book.price}`}
            </span>
          </div>
          {purchaseHint ? <p className="text-sm font-semibold text-rose-600">{purchaseHint}</p> : null}
          <div className="flex flex-wrap gap-2">
            {isFree ? (
              <p className="text-sm font-medium text-slate-600">
                এই বই ফ্রি — শিক্ষার্থী পোর্টালের বই তালিকা থেকে পড়ুন।
              </p>
            ) : (
              <Button onClick={openCheckout} className="rounded-2xl">
                পেমেন্ট করে কিনুন <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={checkoutOpen} onOpenChange={(o) => setCheckoutOpen(o)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>অনলাইন কেনাকাটা</DialogTitle>
            <DialogDescription>{book.name}</DialogDescription>
          </DialogHeader>
          {formError && <p className="text-sm text-rose-600">{formError}</p>}
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>পূর্ণ নাম</Label>
                <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
              </div>
              <div>
                <Label>মোবাইল</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>ঠিকানা</Label>
              <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>শহর</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <Label>পোস্ট কোড</Label>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>নোট</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCheckoutOpen(false)} disabled={submitting}>
              বাতিল
            </Button>
            <Button onClick={pay} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'পেমেন্টে যান'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
