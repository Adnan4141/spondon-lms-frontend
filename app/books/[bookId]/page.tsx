'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Users, Truck, ExternalLink, PieChart, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { BookHeroSection } from '@/components/books/BookHeroSection';
import { BookTabs, type BookTabId } from '@/components/books/BookTabs';
import { BookOverviewSection } from '@/components/books/BookOverviewSection';
import { BookContentsSection } from '@/components/books/BookContentsSection';
import { BookReviewsPlaceholder } from '@/components/books/BookReviewsPlaceholder';
import { Header } from '@/components/layout/Header';

const BOOKMARK_KEY = 'spondon_bookmarked_books';

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

function readBookmarkSet(): Set<string> {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeBookmarkSet(ids: Set<string>) {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...ids]));
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
  const [activeTab, setActiveTab] = useState<BookTabId>('overview');
  const [bookmarked, setBookmarked] = useState(false);

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

  useEffect(() => {
    setBookmarked(readBookmarkSet().has(bookId));
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

  const categoryLabel = useMemo(() => {
    const first = book?.courseBooks?.[0]?.course?.name;
    return first?.trim() || null;
  }, [book]);

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
    if (!u?.id) {
      router.replace(`/login?redirect=${encodeURIComponent(`/books/${bookId}`)}`);
      return;
    }
    if (!book) return;
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

  const toggleBookmark = () => {
    const next = readBookmarkSet();
    if (next.has(bookId)) next.delete(bookId);
    else next.add(bookId);
    writeBookmarkSet(next);
    setBookmarked(next.has(bookId));
  };

  const onStartReading = () => {
    const url = access?.readUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center px-6">
        <p className="text-rose-600 font-semibold mb-4">{loadError}</p>
        <Button asChild variant="outline" className="rounded-xl border-slate-200">
          <Link href="/">হোম</Link>
        </Button>
      </div>
    );
  }

  if (loading || !book) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  const isFree = Number(book.price) <= 0;
  const collaborators = book.collaborators || [];
  const readUrl = access?.readUrl || null;
  const showRead = Boolean(access?.hasAccess && book.isEbook && readUrl);
  const showStudentLibraryLink = true;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
      <Header />

      {/* Hero Section - Matching Course Detail Style */}
      <div className="relative bg-[#0F172A] pt-32 pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.05] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <BookHeroSection
            book={book}
            bookId={bookId}
            categoryLabel={categoryLabel}
            isFree={isFree}
            showRead={showRead}
            readUrl={readUrl}
            bookmarked={bookmarked}
            onToggleBookmark={toggleBookmark}
            onBuy={openCheckout}
            purchaseHint={purchaseHint}
            onStartReading={onStartReading}
          />
        </div>
      </div>

      {showStudentLibraryLink ? (
        <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-violet-700 text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-12">
            <div className="flex items-center gap-3 text-sm font-bold text-indigo-100">
              <Library className="h-5 w-5 shrink-0 text-white" />
              <span>শিক্ষার্থী হিসেবে কেনা ই-বুক ও প্রিন্ট অর্ডার এক জায়গায় দেখুন।</span>
            </div>
            <Link
              href="/student/books#my-books"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-2.5 text-xs font-black uppercase tracking-widest text-indigo-700 shadow-lg transition-transform hover:scale-[1.02]"
            >
              আমার বই
            </Link>
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
          <div className="lg:col-span-2 space-y-12">
            <div className="overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-50 px-8 pt-4">
                <BookTabs active={activeTab} onChange={setActiveTab} />
              </div>
              <div className="p-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activeTab === 'overview' && (
                      <BookOverviewSection description={book.description} outline={book.outline} />
                    )}
                    {activeTab === 'contents' && <BookContentsSection outline={book.outline} />}
                    {activeTab === 'reviews' && (
                      <div className="py-10">
                        <BookReviewsPlaceholder />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <aside className="space-y-8">
            {collaborators.length > 0 && (
              <div className="rounded-[40px] border border-slate-100 bg-white p-8 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <h4 className="text-xl font-black tracking-tight text-slate-900">সহযোগী দল</h4>
                </div>
                <div className="space-y-4">
                  {collaborators.map((c) => (
                    <div
                      key={`${c.user.id}-${c.role}`}
                      className="group flex items-center gap-4 rounded-3xl border border-slate-50 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-md hover:border-indigo-100"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-sm font-black text-indigo-700">
                        {c.user.fullName?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-900">{c.user.fullName}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{c.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {access?.reason === 'payment_pending' && access.invoice && (
              <div className="rounded-[40px] border border-amber-100 bg-amber-50/50 p-8">
                <div className="mb-4 flex items-center gap-3 text-amber-900">
                  <PieChart className="h-5 w-5" />
                  <h4 className="text-xl font-black">পেমেন্ট বাকি</h4>
                </div>
                <p className="text-sm font-bold text-amber-800 opacity-80">
                  ইনভয়েস স্ট্যাটাস: {access.invoice.status} · বাকি ৳{access.invoice.dueAmount}
                </p>
                <Button asChild className="mt-6 w-full h-14 rounded-2xl bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-200/50 transition-all active:scale-95">
                  <Link href="/student/payment">পেমেন্ট পোর্টাল</Link>
                </Button>
              </div>
            )}

            {!book.isEbook && access?.reason === 'physical_purchase' && access.delivery && (
              <div className="rounded-[40px] border border-emerald-100 bg-emerald-50/50 p-8">
                <div className="mb-4 flex items-center gap-3 text-emerald-900">
                  <Truck className="h-5 w-5" />
                  <h4 className="text-xl font-black">ডেলিভারি ট্র্যাকিং</h4>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="font-black text-slate-900">{access.delivery.recipientName}</p>
                    <p className="text-sm font-bold text-slate-500">{access.delivery.phone}</p>
                  </div>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed bg-white p-4 rounded-2xl border border-emerald-50">
                    {access.delivery.address}
                  </p>
                  {access.delivery.deliveryStatus && (
                    <Badge className="px-4 py-2 rounded-xl bg-emerald-600 text-white border-none shadow-md shadow-emerald-100 font-black text-[10px] uppercase tracking-widest">
                      {access.delivery.deliveryStatus}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-lg rounded-[32px] border-white bg-white/90 backdrop-blur-xl text-slate-900 shadow-2xl ring-1 ring-slate-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">অনলাইন কেনাকাটা</DialogTitle>
            <DialogDescription className="font-bold text-indigo-600">{book.name}</DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold animate-shake">
              {formError}
            </div>
          )}
          <div className="grid gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">পূর্ণ নাম</Label>
                <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="h-14 rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white focus:ring-indigo-500/10 transition-all font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">মোবাইল</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-14 rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white focus:ring-indigo-500/10 transition-all font-bold" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">ঠিকানা</Label>
              <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white focus:ring-indigo-500/10 transition-all font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">শহর</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-14 rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white focus:ring-indigo-500/10 transition-all font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">পোস্ট কোড</Label>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="h-14 rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white focus:ring-indigo-500/10 transition-all font-bold" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">নোট</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-14 rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white focus:ring-indigo-500/10 transition-all font-bold" />
            </div>
          </div>
          <DialogFooter className="gap-3 mt-6">
            <Button variant="outline" className="h-14 rounded-2xl px-8 border-slate-200 font-bold" onClick={() => setCheckoutOpen(false)} disabled={submitting}>
              বাতিল
            </Button>
            <Button className="h-14 rounded-2xl px-10 font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-95 transition-all" onClick={pay} disabled={submitting}>
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'পেমেন্টে যান'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
