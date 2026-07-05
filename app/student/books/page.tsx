'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, BookOpen, RefreshCw, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MyBookPurchasesPanel } from '@/components/student/MyBookPurchasesPanel';
import { StudentBooksStats } from '@/components/student/books/StudentBooksStats';
import { StudentBooksToolbar } from '@/components/student/books/StudentBooksToolbar';
import { StudentBookCatalogGrid } from '@/components/student/books/StudentBookCatalogGrid';
import { StudentBooksCheckoutDialog } from '@/components/student/books/StudentBooksCheckoutDialog';
import { StudentBooksSkeleton } from '@/components/student/books/StudentBooksSkeleton';
import {
  computeBookStats,
  deriveCategories,
  filterBooks,
  sortBooks,
  type BookSortOption,
  type BookTypeFilter,
} from '@/components/student/books/student-books-utils';
import { useStudentBooks } from '@/lib/query/hooks/useStudentBooks';
import { purchaseBook } from '@/lib/api/student-portal';
import { initInvoicePayment } from '@/lib/api/invoices';
import type { Book } from '@/lib/api/books';

type BooksTab = 'library' | 'catalog';

function resolveInitialTab(purchasesCount: number): BooksTab {
  if (typeof window === 'undefined') return purchasesCount > 0 ? 'library' : 'catalog';
  const hash = window.location.hash.replace('#', '');
  if (hash === 'my-books' || hash === 'library') return 'library';
  if (hash === 'catalog') return 'catalog';
  return purchasesCount > 0 ? 'library' : 'catalog';
}

export default function StudentBooksPage() {
  const {
    books,
    purchases,
    branches,
    studentId,
    authChecked,
    isLoading,
    isError,
    error,
    refetch,
    refetchPurchases,
  } = useStudentBooks();

  const [activeTab, setActiveTab] = useState<BooksTab>('catalog');
  const [tabReady, setTabReady] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<BookSortOption>('recent');
  const [typeFilter, setTypeFilter] = useState<BookTypeFilter>('all');
  const [categoryId, setCategoryId] = useState('all');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [checkoutBook, setCheckoutBook] = useState<Book | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isLoading) return;
    setActiveTab(resolveInitialTab(purchases.length));
    setTabReady(true);
  }, [isLoading, purchases.length]);

  const syncHash = useCallback((tab: BooksTab) => {
    if (typeof window === 'undefined') return;
    const hash = tab === 'library' ? 'my-books' : 'catalog';
    window.history.replaceState(null, '', `${window.location.pathname}#${hash}`);
  }, []);

  const handleTabChange = (value: string) => {
    const tab = value as BooksTab;
    setActiveTab(tab);
    syncHash(tab);
  };

  const stats = useMemo(
    () => computeBookStats(purchases, books.length),
    [purchases, books.length],
  );

  const categories = useMemo(() => deriveCategories(books), [books]);

  const filteredBooks = useMemo(() => {
    const matched = filterBooks(books, search, typeFilter, categoryId);
    return sortBooks(matched, sort);
  }, [books, search, typeFilter, categoryId, sort]);

  const openCheckout = (book: Book) => {
    setFormError(null);
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const u = raw ? JSON.parse(raw) : null;
      setRecipientName(String(u?.fullName || '').trim());
      setPhone(String(u?.mobile || '').trim());
    } catch {
      setRecipientName('');
      setPhone('');
    }
    setAddress('');
    setCity('');
    setPostalCode('');
    setNotes('');
    setCheckoutBook(book);
  };

  const confirmPurchase = async () => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!userStr) {
      alert('Please log in to purchase');
      return;
    }
    const user = JSON.parse(userStr);
    if (String(user.role || '').toUpperCase() !== 'STUDENT') {
      setFormError('Only student accounts can make purchases.');
      return;
    }
    if (!recipientName.trim() || !phone.trim() || !address.trim()) {
      setFormError('Please fill in your name, phone, and address.');
      return;
    }
    if (!checkoutBook) return;
    setPurchasingId(checkoutBook.id);
    setFormError(null);
    try {
      const purchaseRes = await purchaseBook({
        studentUserId: user.id,
        bookId: checkoutBook.id,
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
      if (!purchaseRes.success || !purchaseRes.data?.id) {
        throw new Error((purchaseRes as { message?: string }).message || 'Failed to create order');
      }
      const invoiceId = purchaseRes.data.id;
      const paymentRes = await initInvoicePayment(invoiceId);
      if (paymentRes.success && paymentRes.data?.GatewayPageURL) {
        window.location.href = paymentRes.data.GatewayPageURL;
        return;
      }
      setCheckoutBook(null);
      await refetchPurchases();
      setActiveTab('library');
      syncHash('library');
      throw new Error('Failed to open payment gateway — order created; please pay from the payment page.');
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Purchase failed');
    } finally {
      setPurchasingId(null);
    }
  };

  if (!authChecked || isLoading || !tabReady) {
    return <StudentBooksSkeleton />;
  }

  if (!studentId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="mb-4 text-sm text-slate-600">Please log in to view your books.</p>
        <Button asChild>
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-10 text-center">
        <AlertCircle className="mx-auto mb-3 h-9 w-9 text-rose-500" />
        <p className="font-semibold text-slate-900">Could not load books</p>
        <p className="mt-1 mb-5 text-sm text-slate-600">
          {error instanceof Error ? error.message : 'Please try again.'}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <StudentBooksStats
        orderCount={stats.orderCount}
        ebookCount={stats.ebookCount}
        pendingPayments={stats.pendingPayments}
        catalogCount={stats.catalogCount}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-5">
        <div className="overflow-x-auto">
          <TabsList
            variant="line"
            className="h-auto w-full min-w-0 justify-start gap-1 border-b border-slate-200/80 pb-0 sm:gap-2"
          >
            <TabsTrigger
              value="library"
              className="gap-2 px-3 pb-3 text-sm font-semibold data-[state=active]:font-bold data-[state=active]:text-indigo-600 data-[state=active]:after:bg-indigo-600 sm:px-4"
            >
              <BookOpen className="h-4 w-4" />
              My Library
              {stats.orderCount > 0 ? (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black text-indigo-700">
                  {stats.orderCount}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger
              value="catalog"
              className="gap-2 px-3 pb-3 text-sm font-semibold data-[state=active]:font-bold data-[state=active]:text-indigo-600 data-[state=active]:after:bg-indigo-600 sm:px-4"
            >
              <ShoppingBag className="h-4 w-4" />
              Catalog
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="library" id="my-books" className="scroll-mt-8 space-y-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 sm:text-xl">My Books & Orders</h2>
            <p className="text-sm font-medium text-slate-500">
              E-book access, print delivery status, and invoice PDFs.
            </p>
          </div>
          <MyBookPurchasesPanel
            purchases={purchases}
            onBrowseCatalog={() => handleTabChange('catalog')}
          />
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 sm:text-xl">Browse Catalog</h2>
            <p className="text-sm font-medium text-slate-500">
              Search and purchase e-books or print editions.
            </p>
          </div>

          <StudentBooksToolbar
            search={search}
            onSearchChange={setSearch}
            sort={sort}
            onSortChange={setSort}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            categories={categories}
          />

          <StudentBookCatalogGrid
            books={filteredBooks}
            ownedBookIds={stats.ownedBookIds}
            purchasingId={purchasingId}
            onBuy={openCheckout}
            searchQuery={search}
          />
        </TabsContent>
      </Tabs>

      <StudentBooksCheckoutDialog
        book={checkoutBook}
        open={!!checkoutBook}
        onOpenChange={(open) => !open && setCheckoutBook(null)}
        formError={formError}
        recipientName={recipientName}
        onRecipientNameChange={setRecipientName}
        phone={phone}
        onPhoneChange={setPhone}
        address={address}
        onAddressChange={setAddress}
        city={city}
        onCityChange={setCity}
        postalCode={postalCode}
        onPostalCodeChange={setPostalCode}
        notes={notes}
        onNotesChange={setNotes}
        purchasing={!!purchasingId}
        onConfirm={() => void confirmPurchase()}
      />
    </div>
  );
}
