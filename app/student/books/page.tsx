'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { BookMarked, ShoppingCart, Loader2, Star, Search, Filter } from 'lucide-react';
import { getPortalBooks, getMyBookPurchases, purchaseBook } from '@/lib/api/student-portal';
import { MyBookPurchasesPanel, type MyBookPurchaseRow } from '@/components/student/MyBookPurchasesPanel';
import { initInvoicePayment } from '@/lib/api/invoices';
import type { Book } from '@/lib/api/books';
import { getBranches } from '@/lib/api/branches';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function StudentBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [myPurchases, setMyPurchases] = useState<MyBookPurchaseRow[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
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
    const fetch = async () => {
      try {
        let uid: string | undefined;
        try {
          const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
          uid = raw ? (JSON.parse(raw) as { id?: string }).id : undefined;
        } catch {
          uid = undefined;
        }
        const [booksRes, branchesRes, mineRes] = await Promise.all([
          getPortalBooks(),
          getBranches(),
          uid ? getMyBookPurchases(uid) : Promise.resolve({ success: true as const, data: [] as MyBookPurchaseRow[] }),
        ]);
        if (booksRes.success && booksRes.data) setBooks(booksRes.data);
        if (branchesRes.success && branchesRes.data) setBranches(branchesRes.data);
        if (mineRes.success && mineRes.data) setMyPurchases(mineRes.data);
        else setMyPurchases([]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setPurchasesLoading(false);
      }
    };
    fetch();
  }, []);

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
      alert('কিনতে লগইন করুন');
      return;
    }
    const user = JSON.parse(userStr);
    if (String(user.role || '').toUpperCase() !== 'STUDENT') {
      setFormError('শুধুমাত্র শিক্ষার্থী অ্যাকাউন্ট দিয়ে কেনা যাবে।');
      return;
    }
    if (!recipientName.trim() || !phone.trim() || !address.trim()) {
      setFormError('নাম, মোবাইল ও ঠিকানা পূরণ করুন।');
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
      const uid = user.id as string;
      const mine = await getMyBookPurchases(uid);
      if (mine.success && mine.data) setMyPurchases(mine.data);
      throw new Error('গেটওয়ে খুলতে ব্যর্থ — অর্ডার তৈরি হয়েছে; পেমেন্ট পেজ থেকে শোধ করুন।');
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'কেনা ব্যর্থ');
    } finally {
      setPurchasingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="animate-pulse font-bold text-slate-500">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section id="my-books" className="scroll-mt-8 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">আমার বই ও অর্ডার</h2>
            <p className="text-sm font-medium text-slate-500">
              ই-বুক (অনলাইন) ও প্রিন্ট অর্ডারের অবস্থা, ইনভয়েস PDF।
            </p>
          </div>
        </div>
        <MyBookPurchasesPanel purchases={myPurchases} loading={purchasesLoading} />
      </section>

      <div className="flex justify-end">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="বই খুঁজুন"
              className="w-64 rounded-2xl border border-slate-100 bg-white py-3 pl-11 pr-4 font-medium transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button
            type="button"
            className="rounded-2xl border border-slate-100 bg-white p-3.5 text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      {books.length === 0 ? (
        <Card className="rounded-[2.5rem] border-none bg-white p-20 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50">
            <BookMarked className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="mb-2 text-2xl font-black text-slate-900">কোনো বই নেই</h3>
          <p className="font-medium text-slate-500">পরবর্তীতে আবার দেখুন</p>
        </Card>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {books.map((book) => (
            <Card
              key={book.id}
              className="group flex flex-col overflow-hidden rounded-[2rem] border-none bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-50 transition-transform duration-500 group-hover:scale-[1.02]">
                {book.thumbnailUrl ? (
                  <Image
                    src={book.thumbnailUrl}
                    alt={book.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookMarked className="h-20 w-20 text-slate-200" />
                  </div>
                )}
                <div className="absolute right-4 top-4 flex items-center gap-1 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-black text-amber-500 shadow-sm backdrop-blur-md">
                  <Star className="h-3.5 w-3.5 fill-amber-500" />
                  <span>4.8</span>
                </div>
              </div>
              <CardContent className="flex flex-1 flex-col p-5">
                <div className="flex-1 space-y-2">
                  <h3 className="line-clamp-2 font-black leading-snug text-slate-900 transition-colors group-hover:text-indigo-600">
                    {book.name}
                  </h3>
                  {book.author && <p className="text-sm font-bold text-slate-400">By {book.author}</p>}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                  <p className="text-2xl font-black text-indigo-600">৳{Number(book.price).toLocaleString()}</p>
                  <button
                    type="button"
                    onClick={() => openCheckout(book)}
                    disabled={!!purchasingId || book.price === 0}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 active:scale-95 disabled:opacity-50"
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

      <Dialog open={!!checkoutBook} onOpenChange={(o) => !o && setCheckoutBook(null)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black">অর্ডার নিশ্চিত করুন</DialogTitle>
            <DialogDescription>
              {checkoutBook?.name} — ডেলিভারি ও যোগাযোগের তথ্য দিন, তারপর অনলাইন পেমেন্ট।
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {formError ? <p className="text-sm font-semibold text-rose-600">{formError}</p> : null}
            <div className="space-y-1.5">
              <Label htmlFor="sb-name">পূর্ণ নাম</Label>
              <Input id="sb-name" className="rounded-xl" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sb-phone">মোবাইল</Label>
              <Input id="sb-phone" className="rounded-xl" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sb-address">ঠিকানা</Label>
              <Textarea
                id="sb-address"
                className="min-h-[72px] rounded-xl"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="sb-city">শহর</Label>
                <Input id="sb-city" className="rounded-xl" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sb-post">পোস্ট কোড</Label>
                <Input
                  id="sb-post"
                  className="rounded-xl"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sb-notes">নোট</Label>
              <Input id="sb-notes" className="rounded-xl" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-2xl" onClick={() => setCheckoutBook(null)}>
              বাতিল
            </Button>
            <Button className="rounded-2xl font-black" onClick={confirmPurchase} disabled={!!purchasingId}>
              {purchasingId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'পেমেন্টে যান'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
