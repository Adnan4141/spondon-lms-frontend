'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Loader2,
  Sparkles,
  Truck,
  Users,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { getPublicBook, type PublicBook } from '@/lib/api/books';
import { getBranches } from '@/lib/api/branches';
import { getBookAccess, purchaseBook, type BookAccessData } from '@/lib/api/student-portal';
import { initInvoicePayment } from '@/lib/api/invoices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

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

export default function PublicBookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;

  const [book, setBook] = useState<PublicBook | null>(null);
  const [access, setAccess] = useState<BookAccessData | null>(null);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [purchaseHint, setPurchaseHint] = useState<string | null>(null);

  const refreshAccess = useCallback(async () => {
    const u = readUser();
    const res = await getBookAccess(bookId, u?.id);
    if (res.success && res.data) setAccess(res.data);
  }, [bookId]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const [bookRes, branchRes] = await Promise.all([getPublicBook(bookId), getBranches()]);
        if (bookRes.success && bookRes.data) setBook(bookRes.data);
        else setLoadError('বই পাওয়া যায়নি।');
        if (branchRes.success) setBranches(branchRes.data || []);
        const u = readUser();
        const accRes = await getBookAccess(bookId, u?.id);
        if (accRes.success && accRes.data) setAccess(accRes.data);
      } catch {
        setLoadError('লোড ব্যর্থ।');
      } finally {
        setLoading(false);
      }
    })();
  }, [bookId]);

  const openCheckout = () => {
    setPurchaseHint(null);
    const u = readUser();
    if (!u?.id) {
      router.replace(`/login?redirect=${encodeURIComponent(`/books/${bookId}`)}`);
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
      <div className="min-h-screen bg-[#060a12] text-white flex flex-col items-center justify-center px-6">
        <p className="text-rose-400 font-semibold mb-4">{loadError}</p>
        <Button asChild variant="outline" className="rounded-2xl border-white/20 text-white">
          <Link href="/">হোম</Link>
        </Button>
      </div>
    );
  }

  if (loading || !book) {
    return (
      <div className="min-h-screen bg-[#060a12] flex items-center justify-center text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
      </div>
    );
  }

  const isFree = Number(book.price) <= 0;
  const collaborators = book.collaborators || [];
  const readUrl = access?.readUrl || null;
  const showRead = Boolean(access?.hasAccess && book.isEbook && readUrl);

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="absolute bottom-0 -left-20 h-[360px] w-[360px] rounded-full bg-indigo-600/20 blur-[100px]" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            হোম
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-[0.25em] text-emerald-400/90">Digital library</span>
          </div>
          <Link
            href="/login?redirect=/student/books"
            className="text-sm font-bold text-white/80 hover:text-white"
          >
            শিক্ষার্থী লগইন
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f172a] shadow-2xl shadow-black/40">
            <Image
              src={book.thumbnailUrl || 'https://placehold.co/600x800?text=Book'}
              alt={book.name}
              fill
              className="object-contain p-4"
              unoptimized
              priority
            />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />
          </div>

          <div className="space-y-8">
            <div>
              <Badge className="mb-3 rounded-full border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                {book.isEbook ? 'ই-বুক' : 'প্রিন্ট / অফলাইন'}
              </Badge>
              <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                {book.name}
              </h1>
              {book.author ? (
                <p className="mt-2 text-sm font-bold text-slate-500">— {book.author}</p>
              ) : null}
              <p className="mt-4 text-base leading-relaxed text-slate-400">
                {book.description || 'প্রিমিয়াম লার্নিং ম্যাটেরিয়াল।'}
              </p>
            </div>

            {collaborators.length > 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md">
                <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-indigo-300">
                  <Users className="h-4 w-4" />
                  সহযোগী দল
                </div>
                <div className="flex flex-wrap gap-3">
                  {collaborators.map((c) => (
                    <div
                      key={`${c.user.id}-${c.role}`}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-black text-white">
                        {c.user.fullName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-white">{c.user.fullName}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{c.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-end gap-6 border-t border-white/10 pt-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">মূল্য</p>
                <p className="mt-1 text-4xl font-black text-emerald-400">{isFree ? 'FREE' : `৳${book.price}`}</p>
              </div>
            </div>

            {purchaseHint ? <p className="text-sm font-semibold text-rose-400">{purchaseHint}</p> : null}

            {access?.reason === 'payment_pending' && access.invoice ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                <p className="font-black text-amber-200">পেমেন্ট বাকি</p>
                <p className="mt-1 text-amber-100/90">
                  ইনভয়েস স্ট্যাটাস: {access.invoice.status} · বাকি ৳{access.invoice.dueAmount}
                </p>
                <Button asChild className="mt-3 rounded-xl bg-amber-500 text-black hover:bg-amber-400">
                  <Link href="/student/payment">পেমেন্ট পোর্টাল</Link>
                </Button>
              </div>
            ) : null}

            {!book.isEbook && access?.reason === 'physical_purchase' && access.delivery ? (
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                  <Truck className="h-4 w-4" />
                  ডেলিভারি / বুকিং
                </div>
                <p className="mt-2 font-bold text-white">{access.delivery.recipientName}</p>
                <p className="text-sm text-slate-400">{access.delivery.phone}</p>
                <p className="mt-2 text-sm text-slate-300">{access.delivery.address}</p>
                {access.delivery.deliveryStatus ? (
                  <Badge className="mt-3 bg-emerald-500/20 text-emerald-200">{access.delivery.deliveryStatus}</Badge>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              {showRead && readUrl ? (
                <>
                  <Button
                    asChild
                    className="h-12 rounded-2xl bg-emerald-500 px-8 font-black text-[#060a12] hover:bg-emerald-400"
                  >
                    <a href={readUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-4 w-4" />
                      পড়ুন / PDF
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="h-12 rounded-2xl border-white/20 text-white">
                    <a href={readUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      নতুন ট্যাবে খুলুন
                    </a>
                  </Button>
                </>
              ) : null}

              {book.isEbook && !isFree && !access?.hasAccess ? (
                <Button
                  onClick={openCheckout}
                  className="h-12 rounded-2xl bg-white px-8 font-black text-[#060a12] hover:bg-emerald-400 hover:text-[#060a12]"
                >
                  পেমেন্ট করে কিনুন <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : null}

              {isFree && book.isEbook && !readUser()?.id ? (
                <Button asChild variant="outline" className="h-12 rounded-2xl border-white/20 text-white">
                  <Link href={`/login?redirect=${encodeURIComponent(`/books/${bookId}`)}`}>পড়তে লগইন করুন</Link>
                </Button>
              ) : null}

              <Button asChild variant="ghost" className="h-12 rounded-2xl text-slate-400 hover:text-white">
                <Link href="/student/books">
                  <BookOpen className="mr-2 h-4 w-4" />
                  পোর্টালের তালিকা
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-lg rounded-3xl border-slate-200 bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle className="font-black">অনলাইন কেনাকাটা</DialogTitle>
            <DialogDescription>{book.name}</DialogDescription>
          </DialogHeader>
          {formError && <p className="text-sm text-rose-600">{formError}</p>}
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>পূর্ণ নাম</Label>
                <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <Label>মোবাইল</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div>
              <Label>ঠিকানা</Label>
              <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>শহর</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <Label>পোস্ট কোড</Label>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div>
              <Label>নোট</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setCheckoutOpen(false)} disabled={submitting}>
              বাতিল
            </Button>
            <Button className="rounded-xl font-black" onClick={pay} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'পেমেন্টে যান'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
