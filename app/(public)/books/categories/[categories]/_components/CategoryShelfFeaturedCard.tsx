'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { BookCategory, PublicCatalogBook } from '@/lib/api/books';

type CategoryShelfFeaturedCardProps = {
  category: BookCategory;
  categoryBooks: PublicCatalogBook[];
  previews: PublicCatalogBook[];
  gradientClass: string;
  /** Shelf accent ring/shadow classes from `shelfRingClass`. */
  ringClass?: string;
};

export function CategoryShelfFeaturedCard({
  category,
  categoryBooks,
  previews,
  gradientClass,
  ringClass,
}: CategoryShelfFeaturedCardProps) {
  return (
    <article
      className={`overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl md:col-span-2 xl:col-span-1 xl:rounded-[28px] ${ringClass ?? ''}`}
    >
      <div className={`relative overflow-hidden bg-linear-to-r ${gradientClass} p-5 text-white`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle,#fff_1px,transparent_1px)] bg-size-[18px_18px] opacity-10" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold backdrop-blur">
              {category.name.slice(0, 1)}
            </div>
            <div>
              <h3 className="text-lg font-bold">{category.name}</h3>
              <p className="mt-1 line-clamp-1 text-sm text-white/85">
                {category.description?.trim() || 'এই শেলফে ক্যাটালগের বই ও ক্যাটাগরি তথ্য দেখানো হয়।'}
              </p>
            </div>
          </div>

          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
            {categoryBooks.length} টি বই
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center">
          {previews.map((book, previewIndex) => (
            <div
              key={book.id}
              className={`${previewIndex > 0 ? '-mr-3 sm:-mr-4' : ''} relative h-18 w-14 overflow-hidden rounded-lg border-2 border-white shadow-md sm:h-20 sm:w-16`}
            >
              <Image
                src={book.thumbnailUrl || 'https://placehold.co/320x480?text=%E0%A6%AC%E0%A6%88'}
                alt={book.name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ))}

          {categoryBooks.length > previews.length ? (
            <div className="ml-4 flex h-14 w-12 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-600 sm:ml-5 sm:h-16 sm:w-14">
              +{categoryBooks.length - previews.length}
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end">
          <Link href={`/books/categories/${category.slug}`} className="text-sm font-semibold text-blue-600">
            বিস্তারিত →
          </Link>
        </div>
      </div>
    </article>
  );
}
