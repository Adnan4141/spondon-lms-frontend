'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { BookMarked, ShoppingCart, Loader2, Star, Search, Filter } from 'lucide-react';
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
      alert('কিনতে লগইন করুন');
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
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'কেনা ব্যর্থ');
    } finally {
      setPurchasingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-slate-500 font-bold animate-pulse">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">বই</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">কোর্সের বই কিনুন</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="বই খুঁজুন" 
                className="pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64 font-medium"
              />
           </div>
           <button className="p-3.5 rounded-2xl bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter className="h-5 w-5" />
           </button>
        </div>
      </div>

      {books.length === 0 ? (
        <Card className="rounded-[2.5rem] border-none bg-white p-20 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookMarked className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">কোনো বই নেই</h3>
          <p className="text-slate-500 font-medium">পরবর্তীতে আবার দেখুন</p>
        </Card>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {books.map((book) => (
            <Card key={book.id} className="group flex flex-col rounded-[2rem] border-none bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden">
              <div className="aspect-[3/4] bg-slate-50 rounded-2xl relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                {book.thumbnailUrl ? (
                  <Image src={book.thumbnailUrl} alt={book.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookMarked className="h-20 w-20 text-slate-200" />
                  </div>
                )}
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md shadow-sm flex items-center gap-1 text-xs font-black text-amber-500">
                   <Star className="h-3.5 w-3.5 fill-amber-500" />
                   <span>4.8</span>
                </div>
              </div>
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex-1 space-y-2">
                   <h3 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                     {book.name}
                   </h3>
                   {book.author && <p className="text-sm font-bold text-slate-400">By {book.author}</p>}
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                   <p className="text-2xl font-black text-indigo-600">
                     ৳{Number(book.price).toLocaleString()}
                   </p>
                   <button
                     onClick={() => handlePurchase(book.id)}
                     disabled={!!purchasingId}
                     className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-900 text-white hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-lg shadow-slate-200 active:scale-95"
                   >
                     {purchasingId === book.id ? (
                       <Loader2 className="h-5 w-5 animate-spin" />
                     ) : (
                       <ShoppingCart className="h-5 w-5" />
                     )}
                   </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
