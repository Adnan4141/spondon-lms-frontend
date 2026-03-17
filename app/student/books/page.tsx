'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookMarked, ShoppingCart, Loader2 } from 'lucide-react';
import { getPortalBooks, purchaseBook } from '@/lib/api/student-portal';
import { initInvoicePayment } from '@/lib/api/invoices';
import type { Book } from '@/lib/api/books';
import { getBranches } from '@/lib/api/branches';

export default function StudentBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [booksRes, branchesRes] = await Promise.all([
          getPortalBooks(),
          getBranches(),
        ]);
        if (booksRes.success && booksRes.data) setBooks(booksRes.data);
        if (branchesRes.success && branchesRes.data) setBranches(branchesRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handlePurchase = async (bookId: string, branchId?: string) => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!userStr) {
      alert('Please log in to purchase');
      return;
    }
    const user = JSON.parse(userStr);
    setPurchasingId(bookId);
    try {
      const purchaseRes = await purchaseBook({
        studentUserId: user.id,
        bookId,
        branchId: branchId || branches[0]?.id,
      });
      if (!purchaseRes.success || !purchaseRes.data?.id) {
        throw new Error(purchaseRes.message || 'Failed to create order');
      }
      const invoiceId = purchaseRes.data.id;
      const paymentRes = await initInvoicePayment(invoiceId);
      if (paymentRes.success && paymentRes.data?.GatewayPageURL) {
        window.location.href = paymentRes.data.GatewayPageURL;
      } else {
        throw new Error('Failed to initiate SSL payment');
      }
    } catch (e: any) {
      alert(e.message || 'Purchase failed');
    } finally {
      setPurchasingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-slate-900">Books</h1>
      {books.length === 0 ? (
        <Card className="rounded-2xl p-12 text-center">
          <BookMarked className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="font-bold text-slate-500">No books available</p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <Card key={book.id} className="rounded-2xl overflow-hidden">
              <div className="aspect-[3/4] bg-slate-100 relative">
                {book.thumbnailUrl ? (
                  <img src={book.thumbnailUrl} alt={book.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookMarked className="h-16 w-16 text-slate-300" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-black text-slate-900">{book.name}</h3>
                {book.author && <p className="text-sm text-slate-500">{book.author}</p>}
                <p className="font-bold text-indigo-600 mt-2">৳{Number(book.price).toLocaleString()}</p>
                <button
                  onClick={() => handlePurchase(book.id)}
                  disabled={!!purchasingId}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {purchasingId === book.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  Pay via SSL
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
