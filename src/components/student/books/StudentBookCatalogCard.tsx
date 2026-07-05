'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BookMarked, BookOpen, FileText, Loader2, ShoppingCart, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Book } from '@/lib/api/books';

type Props = {
  book: Book;
  owned?: boolean;
  purchasing?: boolean;
  onBuy: (book: Book) => void;
};

export function StudentBookCatalogCard({ book, owned, purchasing, onBuy }: Props) {
  return (
    <Card className="group flex max-h-[400px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="relative h-[160px] max-h-[180px] shrink-0 overflow-hidden rounded-xl bg-slate-50 sm:h-[180px]">
        {book.thumbnailUrl ? (
          <Image
            src={book.thumbnailUrl}
            alt={book.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookMarked className="h-16 w-16 text-slate-200" />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge
            className={cn(
              'rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-sm backdrop-blur',
              book.isEbook
                ? 'bg-violet-100/95 text-violet-800 hover:bg-violet-100'
                : 'bg-amber-100/95 text-amber-900 hover:bg-amber-100',
            )}
          >
            {book.isEbook ? (
              <>
                <FileText className="mr-1 h-3 w-3" />
                E-book
              </>
            ) : (
              <>
                <BookOpen className="mr-1 h-3 w-3" />
                Print
              </>
            )}
          </Badge>
          {book.featured ? (
            <Badge className="rounded-lg bg-amber-50/95 px-2 py-0.5 text-[10px] font-bold text-amber-700 shadow-sm">
              <Sparkles className="mr-1 h-3 w-3" />
              Featured
            </Badge>
          ) : null}
          {owned ? (
            <Badge className="rounded-lg bg-emerald-100/95 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shadow-sm">
              Owned
            </Badge>
          ) : null}
        </div>
      </div>

      <CardContent className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
        <div className="min-h-0 flex-1 space-y-1">
          {book.category?.name ? (
            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
              {book.category.name}
            </p>
          ) : null}
          <h3 className="line-clamp-2 font-black leading-snug text-slate-900 transition-colors group-hover:text-indigo-600">
            {book.name}
          </h3>
          {book.author ? (
            <p className="text-sm font-semibold text-slate-400">By {book.author}</p>
          ) : null}
        </div>

        <div className="mt-3 shrink-0 space-y-2.5 border-t border-slate-50 pt-3">
          <p className="text-lg font-black text-indigo-600 sm:text-xl">
            ৳{Number(book.price).toLocaleString()}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex-1 rounded-xl font-bold"
            >
              <Link href={`/books/${book.id}`}>Details</Link>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!!purchasing || book.price === 0 || owned}
              onClick={() => onBuy(book)}
              className="flex-1 rounded-xl bg-slate-900 font-bold text-white hover:bg-indigo-600 hover:text-white disabled:text-white/70 sm:min-w-[7rem] [&_svg]:text-white"
            >
              {purchasing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : owned ? (
                'Owned'
              ) : (
                <>
                  <ShoppingCart className="mr-1.5 h-4 w-4" />
                  Buy
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
