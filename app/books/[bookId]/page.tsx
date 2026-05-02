'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2, Users, Truck, PieChart, Library, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPublicBook, getPublicBooksCatalog, type PublicBook, type PublicCatalogBook } from '@/lib/api/books';
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
import { BookHeroSection } from '@/components/books/BookHeroSection';
import { PublicSamplePdfDialog } from '@/components/books/PublicSamplePdfDialog';
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
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);

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
  const [samplePreviewOpen, setSamplePreviewOpen] = useState(false);
  const [relatedBooks, setRelatedBooks] = useState<PublicCatalogBook[]>([]);

  useEffect(() => {
    setCurrentUser(readUser());

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'user') {
        setCurrentUser(readUser());
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    setBookmarked(readBookmarkSet().has(bookId));
  }, [bookId]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const [bookRes, branchRes, relatedRes] = await Promise.all([
          getPublicBook(bookId),
          getBranches(),
          getPublicBooksCatalog({ limit: 80 }),
        ]);
        if (bookRes.success && bookRes.data) setBook(bookRes.data);
        else setLoadError('বই পাওয়া যায়নি।');
        if (branchRes.success) setBranches(branchRes.data || []);
        if (relatedRes.success && relatedRes.data) setRelatedBooks(relatedRes.data);
        const accRes = await getBookAccess(bookId, currentUser?.id);
        if (accRes.success && accRes.data) setAccess(accRes.data);
      } catch {
        setLoadError('লোড ব্যর্থ।');
      } finally {
        setLoading(false);
      }
    })();
  }, [bookId, currentUser?.id]);

  const categoryLabel = useMemo(() => {
    return book?.category?.name?.trim() || book?.courseBooks?.[0]?.course?.name?.trim() || null;
  }, [book]);

  const recommendedBooks = useMemo(() => {
    if (!book) return [];

    const matches = relatedBooks.filter((candidate) => {
      if (candidate.id === book.id) return false;
      if (book.categoryId && candidate.categoryId === book.categoryId) return true;
      if (!book.categoryId && categoryLabel && candidate.category?.name === categoryLabel) return true;
      return false;
    });

    return matches.slice(0, 4);
  }, [book, categoryLabel, relatedBooks]);

  const isLoggedIn = Boolean(currentUser?.id);
  const isStudent = String(currentUser?.role || '').toUpperCase() === 'STUDENT';

  const openCheckout = () => {
    setPurchaseHint(null);
    const u = currentUser || readUser();
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
    const u = currentUser || readUser();
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
  const showStudentLibraryLink = isStudent;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-100">
      <Header />

      <div className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] pt-28 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(#0f172a_0.8px,transparent_0.8px)] bg-size-[26px_26px] opacity-[0.04]" />

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
            onOpenSamplePreview={() => setSamplePreviewOpen(true)}
          />
        </div>
      </div>

      {showStudentLibraryLink ? (
        <div className="relative border-b border-slate-200 bg-white py-6">
          <div className="absolute inset-0 bg-linear-to-r from-emerald-500/5 via-transparent to-sky-500/5" />
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between lg:px-12 relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200">
                <Library className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-900">আপনার নিজস্ব লাইব্রেরি</p>
                <p className="text-xs font-bold text-slate-500">কেনা ই-বুক ও প্রিন্ট অর্ডার এক জায়গায় দেখুন।</p>
              </div>
            </div>
            <Link
              href="/student/books#my-books"
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-emerald-500/20 transition-all hover:bg-emerald-700 hover:scale-[1.02] active:scale-95"
            >
              আমার বই সংগ্রহ
            </Link>
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16 items-start">
          <div className="space-y-12">
            <div className="rounded-[48px] border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="border-b border-slate-100 px-10 pt-6">
                <BookTabs active={activeTab} onChange={setActiveTab} />
              </div>
              <div className="p-12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
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

          <aside className="space-y-10 sticky top-32">
            {!isLoggedIn && (
              <div className="rounded-[40px] border border-indigo-200 bg-linear-to-b from-indigo-50 to-white p-10 shadow-xl shadow-indigo-900/5">
                <h4 className="text-xl font-black text-indigo-900">ছাত্র অ্যাকাউন্ট প্রয়োজন</h4>
                <p className="mt-3 text-sm font-medium text-slate-600 leading-relaxed">
                  কেনা, পেমেন্ট স্ট্যাটাস এবং বই লাইব্রেরি দেখতে লগইন করুন।
                </p>
                <Button asChild className="mt-6 h-14 w-full rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 font-black">
                  <Link href={`/login?redirect=${encodeURIComponent(`/books/${bookId}`)}`}>
                    লগইন করুন <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}

            {isLoggedIn && !isStudent && (
              <div className="rounded-[40px] border border-amber-200 bg-linear-to-b from-amber-50 to-white p-10 shadow-xl shadow-amber-900/5">
                <h4 className="text-xl font-black text-amber-900">এই অ্যাকাউন্টে কেনা যাবে না</h4>
                <p className="mt-3 text-sm font-medium text-slate-600 leading-relaxed">
                  শুধুমাত্র শিক্ষার্থী অ্যাকাউন্ট দিয়ে বই কেনা, পেমেন্ট ও লাইব্রেরি ফিচার ব্যবহার করা যাবে।
                </p>
              </div>
            )}

            {collaborators.length > 0 && (
              <div className="rounded-[40px] border border-slate-200/60 bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="mb-8 flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                    <Users className="h-6 w-6" />
                  </div>
                  <h4 className="text-2xl font-black tracking-tight text-slate-900">সহযোগী দল</h4>
                </div>
                <div className="space-y-6">
                  {collaborators.map((c) => (
                    <div
                      key={`${c.user.id}-${c.role}`}
                      className="group flex items-center gap-5"
                    >
                      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-lg font-black text-slate-600 transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-6">
                        {c.user.fullName?.charAt(0) || '?'}
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white border-2 border-indigo-50 flex items-center justify-center">
                           <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{c.user.fullName}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{c.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isStudent && access?.reason === 'payment_pending' && access.invoice && (
              <div className="rounded-[40px] border border-amber-200 bg-linear-to-b from-amber-50 to-white p-10 shadow-xl shadow-amber-900/5">
                <div className="mb-6 flex items-center gap-4 text-amber-900">
                  <div className="p-3 rounded-2xl bg-amber-100 ring-1 ring-amber-200">
                    <PieChart className="h-6 w-6" />
                  </div>
                  <h4 className="text-2xl font-black">পেমেন্ট বাকি</h4>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-amber-800">বাকি ৳{access.invoice.dueAmount}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/60">ইনভয়েস: {access.invoice.status}</p>
                </div>
                <Button asChild className="mt-8 w-full h-16 rounded-2xl bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-200 transition-all active:scale-95 font-black">
                  <Link href="/student/payment">পেমেন্ট সম্পন্ন করুন</Link>
                </Button>
              </div>
            )}

            {isStudent && !book.isEbook && access?.reason === 'physical_purchase' && access.delivery && (
              <div className="rounded-[40px] border border-emerald-200 bg-linear-to-b from-emerald-50 to-white p-10 shadow-xl shadow-emerald-900/5">
                <div className="mb-6 flex items-center gap-4 text-emerald-900">
                  <div className="p-3 rounded-2xl bg-emerald-100 ring-1 ring-emerald-200">
                    <Truck className="h-6 w-6" />
                  </div>
                  <h4 className="text-2xl font-black">ডেলিভারি ট্র্যাকিং</h4>
                </div>
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="font-black text-slate-900 text-lg">{access.delivery.recipientName}</p>
                    <p className="text-sm font-bold text-slate-500">{access.delivery.phone}</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-emerald-100 shadow-sm">
                    <p className="text-sm font-bold text-slate-600 leading-relaxed">
                      {access.delivery.address}
                    </p>
                  </div>
                  {access.delivery.deliveryStatus && (
                    <div className="flex items-center gap-3 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-lg shadow-emerald-200">
                       <div className="h-2 w-2 rounded-full bg-white animate-ping"></div>
                       <span className="text-xs font-black uppercase tracking-widest">{access.delivery.deliveryStatus}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

           
          </aside>
        </div>

        {recommendedBooks.length > 0 ? (
          <section className="mt-20 space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Recommendations</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">আরও কিছু বই আপনার জন্য</h2>
                <p className="mt-2 text-sm text-slate-500">Same category, same storefront flow, and faster discovery from this detail page.</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                <Sparkles className="h-4 w-4" />
                {categoryLabel || 'Related'} picks
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {recommendedBooks.map((item) => (
                <Link key={item.id} href={`/books/${item.id}`} className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative aspect-4/5 overflow-hidden bg-slate-100">
                    {item.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.thumbnailUrl} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl font-black text-slate-300">{item.name.slice(0, 1)}</div>
                    )}
                  </div>
                  <div className="space-y-3 p-5">
                    <div>
                      <h3 className="line-clamp-2 text-lg font-black leading-tight text-slate-950 group-hover:text-emerald-600">{item.name}</h3>
                      {item.author ? <p className="mt-1 text-sm text-slate-500">{item.author}</p> : null}
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-2xl font-black text-slate-950">{Number(item.price) <= 0 ? 'FREE' : `৳${Number(item.price).toLocaleString()}`}</span>
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Details</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-xl rounded-[40px] border-white/20 bg-white/95 backdrop-blur-2xl text-slate-900 shadow-[0_32px_64px_rgba(0,0,0,0.15)] ring-1 ring-slate-200/50 p-0 overflow-hidden">
          <div className="bg-linear-to-r from-indigo-600 to-violet-700 px-10 py-10 text-white">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black tracking-tight text-white mb-2">শিপিং তথ্য</DialogTitle>
              <DialogDescription className="text-indigo-100 font-bold text-base opacity-90 leading-relaxed">
                বইটি আপনার ঠিকানায় পৌঁছে দিতে নিচের তথ্যগুলো সঠিকভাবে পূরণ করুন। <br/>
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase tracking-widest">{book.name}</span>
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-10 space-y-8">
            {formError && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold flex items-center gap-3"
              >
                <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                {formError}
              </motion.div>
            )}

            <div className="grid gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">প্রাপকের নাম</Label>
                  <Input 
                    value={recipientName} 
                    onChange={(e) => setRecipientName(e.target.value)} 
                    placeholder="আপনার নাম লিখুন"
                    className="h-16 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold px-6 text-lg" 
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">মোবাইল নম্বর</Label>
                  <Input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="০১৭XXXXXXXX"
                    className="h-16 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold px-6 text-lg" 
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">পূর্ণ ঠিকানা</Label>
                <Textarea 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  placeholder="গ্রাম/রাস্তা, পোস্ট অফিস, উপজেলা"
                  rows={3} 
                  className="rounded-2xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold px-6 py-4 text-lg resize-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">শহর</Label>
                  <Input 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                    placeholder="শহরের নাম"
                    className="h-16 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold px-6 text-lg" 
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">পোস্ট কোড</Label>
                  <Input 
                    value={postalCode} 
                    onChange={(e) => setPostalCode(e.target.value)} 
                    placeholder="১২৩৪"
                    className="h-16 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold px-6 text-lg" 
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">অতিরিক্ত নোট (ঐচ্ছিক)</Label>
                <Input 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="যেমন: বাড়ির পাশে বড় আম গাছ"
                  className="h-16 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold px-6 text-lg" 
                />
              </div>
            </div>

            <DialogFooter className="gap-4 pt-4">
              <Button 
                variant="outline" 
                className="h-16 flex-1 rounded-2xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50" 
                onClick={() => setCheckoutOpen(false)} 
                disabled={submitting}
              >
                বাতিল
              </Button>
              <Button 
                className="h-16 flex-2 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 active:scale-[0.98] transition-all text-lg group"
                onClick={pay} 
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    পেমেন্টে যান <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <PublicSamplePdfDialog
        open={samplePreviewOpen}
        onClose={() => setSamplePreviewOpen(false)}
        bookName={book.name}
        sampleUrl={null}
      />
    </div>
  );
}
