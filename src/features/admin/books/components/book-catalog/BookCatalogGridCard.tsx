'use client';

import Link from 'next/link';
import type { Book } from '@/lib/api/books';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, ExternalLink, FileText, PencilLine } from 'lucide-react';
import { bookStockState, stripCatalogHtml } from './book-catalog-utils';

type BookCatalogGridCardProps = {
  book: Book;
  onOpenDetail: (book: Book) => void;
  onOpenEdit: (book: Book) => void;
  onPreviewPdf: (book: Book) => void;
};

export function BookCatalogGridCard({ book, onOpenDetail, onOpenEdit, onPreviewPdf }: BookCatalogGridCardProps) {
  const state = bookStockState(book);
  const description = stripCatalogHtml(book.description);

  return (
    <article className="group overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-4/3 bg-muted">
        {book.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.thumbnailUrl}
            alt={book.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl font-black text-muted-foreground">
            {book.name.slice(0, 1)}
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge className={state.className} variant="outline">
            {state.label}
          </Badge>
          {book.featured ? (
            <Badge className="border-amber-500/20 bg-amber-50 text-amber-700">Featured</Badge>
          ) : null}
        </div>
        <div className="absolute bottom-3 right-3 rounded-lg bg-background/95 px-3 py-1.5 text-lg font-black text-primary shadow-sm">
          ৳{Number(book.price).toLocaleString()}
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div>
          <h3 className="line-clamp-2 text-lg font-black text-foreground">{book.name}</h3>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{book.sku}</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">{book.author || 'Author not set'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{book.isEbook ? 'E-Book' : 'Physical'}</Badge>
          {book.category ? <Badge variant="outline">{book.category.name}</Badge> : null}
          {book.program ? <Badge variant="outline">{book.program.name}</Badge> : null}
        </div>
        <p className="line-clamp-3 min-h-18 text-sm leading-6 text-slate-500">
          {description || 'No storefront description has been written yet for this title.'}
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Central</p>
            <p className="mt-1 font-black text-foreground">
              {book.isEbook ? 'Digital' : Number(book.centralQty || 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Pages</p>
            <p className="mt-1 font-black text-foreground">
              {Number(book.pageCount || 0) > 0 ? Number(book.pageCount).toLocaleString() : 'Not set'}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenDetail(book)}>
            <Eye className="mr-2 h-4 w-4" />
            Details
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenEdit(book)}>
            <PencilLine className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/books/${book.id}`} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Public
            </Link>
          </Button>
          {book.isEbook && book.fileUrl ? (
            <Button type="button" variant="outline" size="sm" onClick={() => onPreviewPdf(book)}>
              <FileText className="mr-2 h-4 w-4" />
              Preview
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
