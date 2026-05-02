'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Book } from '@/lib/api/books';
import { BookOpen, Boxes, FileText, Link2, Sparkles, Tag } from 'lucide-react';
import { BookAdminModal } from './BookAdminModal';

export function BookDetailDialog({
  book,
  open,
  onClose,
  onPreviewPdf,
}: {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onPreviewPdf?: (book: Book) => void;
}) {
  if (!book) return null;

  const linkedCourses = book.courseBooks ?? [];

  return (
    <BookAdminModal
      open={open}
      onClose={onClose}
      title={book.name}
      subtitle="Detailed book view using the shared books modal standard"
    >
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <section className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <div className="aspect-[3/4] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            {book.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={book.thumbnailUrl} alt={book.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-5xl font-black text-slate-300">{book.name.slice(0, 1)}</div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Price</p>
              <p className="mt-2 text-2xl font-black text-slate-900">৳{Number(book.price).toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Central Stock</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{book.centralQty || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Format</p>
              <p className="mt-2 text-base font-black text-slate-900">{book.isEbook ? 'E-Book / PDF' : 'Physical Print'}</p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Inventory Snapshot</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">{book.name}</h3>
                <p className="mt-1 text-sm text-slate-500">SKU {book.sku}{book.author ? ` · ${book.author}` : ''}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{book.isEbook ? 'E-Book' : 'Physical'}</Badge>
                {book.featured ? <Badge className="border-amber-200 bg-amber-50 text-amber-700">Featured</Badge> : null}
                {book.category ? <Badge variant="outline">{book.category.name}</Badge> : null}
                {book.program ? <Badge variant="outline">{book.program.name}</Badge> : null}
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <BookOpen className="h-4 w-4 text-slate-500" />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">MRP</p>
                <p className="mt-1 text-lg font-black text-slate-900">{book.mrp ? `৳${Number(book.mrp).toLocaleString()}` : 'Not set'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <Boxes className="h-4 w-4 text-slate-500" />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Sale Items</p>
                <p className="mt-1 text-lg font-black text-slate-900">{book._count?.saleItems || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <Link2 className="h-4 w-4 text-slate-500" />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Linked Courses</p>
                <p className="mt-1 text-lg font-black text-slate-900">{linkedCourses.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <Sparkles className="h-4 w-4 text-slate-500" />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Collaborators</p>
                <p className="mt-1 text-lg font-black text-slate-900">{book.collaborators?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-500" />
                <h4 className="text-base font-black text-slate-900">Description</h4>
              </div>
              <p className="text-sm leading-7 text-slate-600">{book.description?.trim() || 'No book description has been added yet.'}</p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Link2 className="h-4 w-4 text-slate-500" />
                <h4 className="text-base font-black text-slate-900">Course-linked Books</h4>
              </div>
              {linkedCourses.length > 0 ? (
                <div className="space-y-3">
                  {linkedCourses.map((linked) => (
                    <div key={`${linked.courseId}-${linked.bookId}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-900">{linked.course?.name || 'Untitled course'}</p>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{linked.isFree ? 'Included for free' : 'Paid add-on'}</p>
                        </div>
                        <Badge variant="outline">{linked.isFree ? 'Free' : `৳${Number(book.price).toLocaleString()}`}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">This title is not linked to any course yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-black text-slate-900">Actions</h4>
                <p className="text-sm text-slate-500">Use the same modal standard for preview flows instead of drawers.</p>
              </div>
              {book.isEbook && book.fileUrl && onPreviewPdf ? (
                <Button variant="outline" className="rounded-2xl" onClick={() => onPreviewPdf(book)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Preview PDF
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </BookAdminModal>
  );
}