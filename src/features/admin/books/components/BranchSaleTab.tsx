'use client';

import { useMemo, useState } from 'react';
import { createBookSale, type Book } from '@/lib/api/books';
import type { Branch } from '@/lib/api/branches';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CartItem {
  bookId: string;
  name: string;
  price: number;
  qty: number;
}

export function BranchSaleTab({
  books,
  branches,
  onSaleRecorded,
}: {
  books: Book[];
  branches: Branch[];
  onSaleRecorded?: () => void | Promise<void>;
}) {
  const toast = useAdminToast();
  const [locationType, setLocationType] = useState<'CENTRAL' | 'BRANCH'>('BRANCH');
  const [branchId, setBranchId] = useState('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saving, setSaving] = useState(false);

  const visibleBooks = useMemo(() => books.filter((book) => !book.isEbook && (!search.trim() || book.name.toLowerCase().includes(search.toLowerCase()) || book.sku.toLowerCase().includes(search.toLowerCase()))), [books, search]);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const addToCart = (book: Book) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.bookId === book.id);
      if (existing) {
        return prev.map((item) => item.bookId === book.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { bookId: book.id, name: book.name, price: Number(book.price), qty: 1 }];
    });
  };

  const handleSubmit = async () => {
    if (!branchId || cart.length === 0) {
      toast({ title: 'Branch and items required', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      await createBookSale({
        branchId,
        sellingPointType: locationType,
        items: cart.map((item) => ({ bookId: item.bookId, qty: item.qty, unitPrice: item.price })),
      });
      setCart([]);
      toast({ title: 'Sale recorded', description: locationType === 'CENTRAL' ? 'Sold from central stock.' : 'Sold from branch stock.', variant: 'success' });
      await onSaleRecorded?.();
    } catch (error) {
      toast({ title: 'Sale failed', description: error instanceof Error ? error.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Selling Location</Label>
            <Select value={locationType} onValueChange={(value) => setLocationType(value as 'CENTRAL' | 'BRANCH')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BRANCH">Branch</SelectItem>
                <SelectItem value="CENTRAL">Central Warehouse</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Branch Context</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>
                {branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Search Book</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Book name or SKU" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleBooks.map((book) => (
            <article key={book.id} className="rounded-2xl border border-border bg-background p-4">
              <h3 className="line-clamp-2 font-bold">{book.name}</h3>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{book.sku}</p>
              <p className="mt-3 text-lg font-black text-primary">৳{Number(book.price).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Central qty: {book.centralQty || 0}</p>
              <Button className="mt-4 w-full" variant="outline" onClick={() => addToCart(book)}>Add to Cart</Button>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-black">Offline Sale Cart</h3>
        <div className="space-y-3">
          {cart.map((item) => (
            <div key={item.bookId} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">৳{item.price.toLocaleString()} each</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setCart((prev) => prev.map((entry) => entry.bookId === item.bookId ? { ...entry, qty: Math.max(1, entry.qty - 1) } : entry))}>-</Button>
                <span className="w-6 text-center font-bold">{item.qty}</span>
                <Button size="sm" variant="outline" onClick={() => setCart((prev) => prev.map((entry) => entry.bookId === item.bookId ? { ...entry, qty: entry.qty + 1 } : entry))}>+</Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4">
          <div className="flex items-center justify-between text-sm"><span>Items</span><span>{cart.reduce((sum, item) => sum + item.qty, 0)}</span></div>
          <div className="mt-2 flex items-center justify-between text-lg font-black"><span>Total</span><span>৳{total.toLocaleString()}</span></div>
          <Button className="mt-4 w-full rounded-2xl" onClick={handleSubmit} disabled={saving || cart.length === 0}>{saving ? 'Recording...' : 'Confirm Sale'}</Button>
          <p className="mt-3 text-xs text-muted-foreground">Current backend still requires a branch context even when selling from central. This implementation records central vs branch via sellingPointType while preserving the existing API contract.</p>
        </div>
      </section>
    </div>
  );
}
