'use client';

import { useMemo, useState } from 'react';
import type { Book } from '@/lib/api/books';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ReceiptText, Sparkles } from 'lucide-react';
import { BookAdminModal } from './BookAdminModal';

type CourseCommerceRow = {
  courseId: string;
  courseName: string;
  books: Array<{
    bookId: string;
    name: string;
    sku: string;
    price: number;
    isFree: boolean;
    isEbook: boolean;
  }>;
  payableTotal: number;
};

function formatMoney(value: number) {
  return `৳${Number(value).toLocaleString()}`;
}

export function CourseCommerceTab({ books }: { books: Book[] }) {
  const [linkedPreviewId, setLinkedPreviewId] = useState<string | null>(null);
  const [receiptPreviewId, setReceiptPreviewId] = useState<string | null>(null);

  const courseRows = useMemo<CourseCommerceRow[]>(() => {
    const courseMap = new Map<string, CourseCommerceRow>();

    for (const book of books) {
      for (const linked of book.courseBooks ?? []) {
        const courseId = linked.course?.id || linked.courseId;
        if (!courseId) continue;

        const existing = courseMap.get(courseId) ?? {
          courseId,
          courseName: linked.course?.name || 'Untitled course',
          books: [],
          payableTotal: 0,
        };

        const row = {
          bookId: book.id,
          name: book.name,
          sku: book.sku,
          price: Number(book.price || 0),
          isFree: linked.isFree,
          isEbook: Boolean(book.isEbook),
        };

        existing.books.push(row);
        if (!row.isFree) existing.payableTotal += row.price;
        courseMap.set(courseId, existing);
      }
    }

    return [...courseMap.values()].sort((left, right) => left.courseName.localeCompare(right.courseName));
  }, [books]);

  const linkedPreview = courseRows.find((row) => row.courseId === linkedPreviewId) ?? null;
  const receiptPreview = courseRows.find((row) => row.courseId === receiptPreviewId) ?? null;

  if (courseRows.length === 0) {
    return (
      <section className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-xl font-black text-slate-900">Course-linked books will appear here</h3>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Once books are linked with courses, this tab will preview the course materials modal and the receipt layout that includes linked book names.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="grid gap-6 xl:grid-cols-2">
        {courseRows.map((row) => (
          <article key={row.courseId} className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground">Course Commerce</p>
                <h3 className="mt-2 text-2xl font-black text-foreground">{row.courseName}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {row.books.length} linked title{row.books.length > 1 ? 's' : ''} · {formatMoney(row.payableTotal)} payable books total
                </p>
              </div>
              <Badge variant="outline">{row.books.filter((book) => !book.isFree).length} paid</Badge>
            </div>

            <div className="mt-5 space-y-3">
              {row.books.slice(0, 3).map((book) => (
                <div key={book.bookId} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-black text-slate-900">{book.name}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{book.sku}</p>
                  </div>
                  <Badge className={book.isFree ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700'}>
                    {book.isFree ? 'Free' : formatMoney(book.price)}
                  </Badge>
                </div>
              ))}
              {row.books.length > 3 ? (
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">+ {row.books.length - 3} more linked book entries</p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="outline" className="rounded-2xl" onClick={() => setLinkedPreviewId(row.courseId)}>
                <BookOpen className="mr-2 h-4 w-4" />
                View linked books
              </Button>
              <Button variant="outline" className="rounded-2xl" onClick={() => setReceiptPreviewId(row.courseId)}>
                <ReceiptText className="mr-2 h-4 w-4" />
                Preview receipt
              </Button>
            </div>
          </article>
        ))}
      </section>

      <BookAdminModal
        open={Boolean(linkedPreview)}
        onClose={() => setLinkedPreviewId(null)}
        title={linkedPreview ? `${linkedPreview.courseName} · Linked Books` : 'Linked Books'}
        subtitle="Shared books modal standard for course detail book lists"
      >
        {linkedPreview ? (
          <div className="space-y-4">
            {linkedPreview.books.map((book) => (
              <div key={book.bookId} className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div>
                  <p className="text-lg font-black text-slate-900">{book.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{book.sku}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{book.isEbook ? 'E-Book' : 'Physical'}</Badge>
                  <Badge className={book.isFree ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700'}>
                    {book.isFree ? 'Included for free' : formatMoney(book.price)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </BookAdminModal>

      <BookAdminModal
        open={Boolean(receiptPreview)}
        onClose={() => setReceiptPreviewId(null)}
        title={receiptPreview ? `${receiptPreview.courseName} · Money Receipt Preview` : 'Money Receipt Preview'}
        subtitle="Receipt preview showing linked book names and book subtotal"
      >
        {receiptPreview ? (
          <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Money Receipt</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">{receiptPreview.courseName}</h3>
                <p className="mt-1 text-sm text-slate-500">Linked books are broken out as separate receipt line items.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Books Total</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{formatMoney(receiptPreview.payableTotal)}</p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200 bg-white">
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                <span>Line Item</span>
                <span>Qty</span>
                <span>Amount</span>
              </div>
              <div className="divide-y divide-slate-200">
                <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-4 text-sm">
                  <div>
                    <p className="font-black text-slate-900">Course Fee</p>
                    <p className="text-xs text-slate-500">Core tuition line stays separate from books.</p>
                  </div>
                  <span className="font-semibold text-slate-600">1</span>
                  <span className="font-black text-slate-900">Custom</span>
                </div>
                {receiptPreview.books.map((book) => (
                  <div key={book.bookId} className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-4 text-sm">
                    <div>
                      <p className="font-black text-slate-900">{book.name}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">BOOK · {book.sku}</p>
                    </div>
                    <span className="font-semibold text-slate-600">1</span>
                    <span className="font-black text-slate-900">{book.isFree ? 'Free' : formatMoney(book.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </BookAdminModal>
    </>
  );
}