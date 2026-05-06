'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2, ReceiptText, ShieldCheck, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { BookHeroSection } from '@/components/books/BookHeroSection';
import { BookTabs, type BookTabId } from '@/components/books/BookTabs';
import { BookOverviewSection } from '@/components/books/BookOverviewSection';
import { BookContentsSection } from '@/components/books/BookContentsSection';
import { PublicSamplePdfDialog } from '@/components/books/PublicSamplePdfDialog';
import { getProtectedBookDownload, getPublicBook, type PublicBook } from '@/lib/api/books';

function readHasAuth() {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('auth_token'));
}

function readBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('bookmarks');
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export default function PublicBookDetailsPage() {
  const params = useParams<{ bookId: string }>();
  const router = useRouter();
  const bookId = decodeURIComponent(String(params?.bookId || ''));

  const [book, setBook] = useState<PublicBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BookTabId>('overview');
  const [bookmarked, setBookmarked] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [hasAuth, setHasAuth] = useState(false);
  const [purchaseHint, setPurchaseHint] = useState<string | null>(null);

  useEffect(() => {
    setHasAuth(readHasAuth());
    setBookmarked(readBookmarks().includes(bookId));
  }, [bookId]);

  useEffect(() => {
    let isActive = true;

    async function loadBook() {
      if (!bookId) return;
      try {
        setLoading(true);
        setError(null);
        const response = await getPublicBook(bookId);
        if (!isActive) return;
        setBook(response.success && response.data ? response.data : null);
      } catch (loadError) {
        if (!isActive) return;
        setError(loadError instanceof Error ? loadError.message : 'এই বইটি লোড করা যায়নি।');
      } finally {
        if (isActive) setLoading(false);
      }
    }

    void loadBook();
    return () => {
      isActive = false;
    };
  }, [bookId]);

  const isFree = useMemo(() => {
    if (!book) return false;
    return Number(book.price) <= 0 || Boolean(book.courseBooks?.some((linked) => linked.isFree));
  }, [book]);

  const categoryLabel = book?.category?.name || null;
  const showRead = Boolean(book?.isEbook && isFree && hasAuth);

  const toggleBookmark = () => {
    const existing = new Set(readBookmarks());
    if (existing.has(bookId)) existing.delete(bookId);
    else existing.add(bookId);
    localStorage.setItem('bookmarks', JSON.stringify(Array.from(existing)));
    setBookmarked(existing.has(bookId));
  };

  const startReading = async () => {
    if (!book) return;
    if (!hasAuth) {
      router.push(`/login?redirect=${encodeURIComponent(`/books/${bookId}`)}`);
      return;
    }

    try {
      const response = await getProtectedBookDownload(book.id);
      if (response.fileUrl) {
        window.open(response.fileUrl, '_blank', 'noopener,noreferrer');
        setPurchaseHint(null);
        return;
      }
      setPurchaseHint(response.message || 'এই বইটি এখনও পড়ার জন্য উপলব্ধ নয়।');
    } catch (downloadError) {
      setPurchaseHint(downloadError instanceof Error ? downloadError.message : 'এই মুহূর্তে ই-বুক খোলা যাচ্ছে না।');
    }
  };

  const handleBuy = async () => {
    if (!book) return;
    if (!hasAuth) {
      router.push(`/login?redirect=${encodeURIComponent(`/books/${bookId}`)}`);
      return;
    }
    if (book.isEbook) {
      await startReading();
      return;
    }
    setPurchaseHint(
      'মুদ্রিত বইয়ের চেকআউট শীঘ্রই যুক্ত হবে। এখন অর্ডার করতে অ্যাডমিন বিক্রয় বা সাপোর্টের সাথে যোগাযোগ করুন।',
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-emerald-100">
      <Header />

      <main className="pb-20 pt-28 sm:pt-0">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-8 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
            <Button asChild variant="ghost" className="h-10 rounded-2xl px-3 text-slate-600 hover:bg-white">
              <Link href="/books">
                <ArrowLeft className="mr-2 h-4 w-4" />
                বইয়ের তালিকায় ফিরে যান
              </Link>
            </Button>
            {categoryLabel ? <span>/ {categoryLabel}</span> : null}
          </div>

          {loading ? (
            <div className="flex min-h-[50vh] items-center justify-center rounded-[36px] border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 text-slate-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                বইয়ের বিস্তারিত লোড হচ্ছে…
              </div>
            </div>
          ) : error || !book ? (
            <section className="rounded-[36px] border border-rose-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h1 className="mt-6 text-3xl font-black text-slate-950">বইটি উপলব্ধ নয়</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {error || 'জনসাধারণের ক্যাটালগ থেকে এই বইটি লোড করা যায়নি।'}
              </p>
              <Button asChild className="mt-6 rounded-2xl bg-slate-950 text-white hover:bg-slate-800">
                <Link href="/books">সব বই দেখুন</Link>
              </Button>
            </section>
          ) : (
            <>
              <section className="relative overflow-hidden rounded-[40px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,#ecfdf5_0%,#ffffff_36%,#eff6ff_100%)] px-5 py-8 shadow-[0_30px_90px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10">
                <BookHeroSection
                  book={book}
                  bookId={bookId}
                  categoryLabel={categoryLabel}
                  isFree={isFree}
                  showRead={showRead}
                  readUrl={null}
                  bookmarked={bookmarked}
                  onToggleBookmark={toggleBookmark}
                  onBuy={() => void handleBuy()}
                  purchaseHint={purchaseHint}
                  onStartReading={() => void startReading()}
                  onOpenSamplePreview={() => setSampleOpen(true)}
                />
              </section>


              <section className="mt-10 rounded-[36px] border border-slate-200 bg-white px-6 shadow-sm sm:px-8">
                <BookTabs active={activeTab} onChange={setActiveTab} />
                {activeTab === 'overview' ? <BookOverviewSection description={book.description} outline={book.outline} /> : null}
                {activeTab === 'contents' ? <BookContentsSection outline={book.outline} /> : null}
                {activeTab === 'reviews' ? (
                  <div className="py-12">
                    <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                      <ReceiptText className="mx-auto h-8 w-8 text-slate-400" />
                      <h3 className="mt-4 text-2xl font-black text-slate-900">রিভিউ এখনও চালু হয়নি</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        পাঠকের রিভিউ ও রেটিং শীঘ্রই যুক্ত করা হবে। এখন ক্যাটালগের তথ্য দেখে বই বেছে নিতে পারেন।
                      </p>
                    </div>
                  </div>
                ) : null}
              </section>
            </>
          )}
        </div>
      </main>

      <PublicSamplePdfDialog
        open={sampleOpen}
        onClose={() => setSampleOpen(false)}
        bookName={book?.name || 'বই'}
        sampleUrl={book?.demoReadUrl || null}
      />

      <Footer />
    </div>
  );
}