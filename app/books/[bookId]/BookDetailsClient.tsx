'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { BookHeroSection } from '@/components/books/BookHeroSection';
import { BookTabs, type BookTabId } from '@/components/books/BookTabs';
import { BookOverviewSection } from '@/components/books/BookOverviewSection';
import dynamic from 'next/dynamic';
import { getProtectedBookDownload, type PublicBook } from '@/lib/api/books';

const PublicSamplePdfDialog = dynamic(
  () => import('@/components/books/PublicSamplePdfDialog').then((m) => m.PublicSamplePdfDialog),
  { ssr: false },
);

function readHasAuth() {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('auth_token'));
}

export function BookDetailsClient({ initialBook, bookId }: { initialBook: PublicBook; bookId: string }) {
  const router = useRouter();

  const book = initialBook;
  const [activeTab, setActiveTab] = useState<BookTabId>('overview');
  const [sampleOpen, setSampleOpen] = useState(false);
  const [hasAuth] = useState(readHasAuth);
  const [purchaseHint, setPurchaseHint] = useState<string | null>(null);

  const isFree = useMemo(() => {
    return Number(book.price) <= 0 || Boolean(book.courseBooks?.some((linked) => linked.isFree));
  }, [book]);

  const categoryLabel = book?.category?.name || null;
  const showRead = Boolean(book?.isEbook && isFree && hasAuth);

  const startReading = async () => {
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

          <section className="relative overflow-hidden rounded-[40px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,#ecfdf5_0%,#ffffff_36%,#eff6ff_100%)] px-5 py-8 shadow-[0_30px_90px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10">
            <BookHeroSection
              book={book}
              bookId={bookId}
              categoryLabel={categoryLabel}
              isFree={isFree}
              showRead={showRead}
              readUrl={null}
              onBuy={() => void handleBuy()}
              purchaseHint={purchaseHint}
              onStartReading={() => void startReading()}
              onOpenSamplePreview={() => setSampleOpen(true)}
            />
          </section>


          <section className="mt-10 rounded-[36px] border border-slate-200 bg-white px-6 shadow-sm sm:px-8">
            <BookTabs active={activeTab} onChange={setActiveTab} />
            {activeTab === 'overview' ? <BookOverviewSection description={book.description} outline={book.outline} /> : null}
          </section>
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
