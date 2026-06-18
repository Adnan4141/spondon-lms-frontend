import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { getPublicBook, type PublicBook } from '@/lib/api/books';
import {
  absoluteSiteUrl,
  compactDescription,
  jsonLdScript,
  ORGANIZATION_NAME,
  SITE_NAME,
  SITE_URL,
  toAbsoluteImageUrl,
} from '@/lib/seo';
import { BookDetailsClient } from './BookDetailsClient';

type BookRouteParams = Promise<{ bookId: string }>;

async function loadBook(bookId: string): Promise<PublicBook | null> {
  try {
    const res = await getPublicBook(bookId);
    if (res.success && res.data) return res.data;
  } catch {
    // Handled by notFound/metadata fallback.
  }
  return null;
}

function bookDescription(book: PublicBook): string {
  const fallbackParts = [
    book.author ? `By ${book.author}` : null,
    book.category?.name,
    book.isEbook ? 'eBook' : 'Printed book',
    `${book.name} from ${SITE_NAME}.`,
  ].filter(Boolean);

  return compactDescription(book.description, fallbackParts.join('. '));
}

function bookImage(book: PublicBook): string | undefined {
  if (!book.thumbnailUrl) return undefined;
  return toAbsoluteImageUrl(resolveAttachmentUrl(book.thumbnailUrl, API_ORIGIN));
}

export async function generateMetadata({ params }: { params: BookRouteParams }): Promise<Metadata> {
  const { bookId } = await params;
  const decodedBookId = decodeURIComponent(bookId);
  const book = await loadBook(decodedBookId);

  if (!book) {
    return {
      title: 'Book Not Found',
      robots: { index: false, follow: false },
    };
  }

  const canonical = absoluteSiteUrl(`/books/${encodeURIComponent(book.id)}`);
  const description = bookDescription(book);
  const image = bookImage(book);

  return {
    title: book.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'bn_BD',
      siteName: SITE_NAME,
      title: `${book.name} | ${SITE_NAME}`,
      description,
      url: canonical,
      images: image ? [{ url: image, alt: book.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${book.name} | ${SITE_NAME}`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

function buildBookSchema(book: PublicBook) {
  const canonical = absoluteSiteUrl(`/books/${encodeURIComponent(book.id)}`);
  const image = bookImage(book);
  const description = bookDescription(book);

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: book.name,
      url: canonical,
      image,
      description,
      isbn: book.sku || undefined,
      author: book.author ? { '@type': 'Person', name: book.author } : undefined,
      bookFormat: book.isEbook ? 'https://schema.org/EBook' : 'https://schema.org/Paperback',
      numberOfPages: book.pageCount || undefined,
      publisher: {
        '@type': 'EducationalOrganization',
        name: ORGANIZATION_NAME,
        url: SITE_URL,
      },
      offers: {
        '@type': 'Offer',
        price: Number(book.price) || 0,
        priceCurrency: 'BDT',
        availability:
          book.isEbook || (book.centralQty ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: canonical,
      },
      isPartOf: book.courseBooks?.map((linked) => ({
        '@type': 'Course',
        name: linked.course.name,
        url: absoluteSiteUrl(`/course/${encodeURIComponent(linked.course.slug || linked.course.id)}`),
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: book.name,
      image,
      description,
      sku: book.sku,
      brand: {
        '@type': 'Brand',
        name: SITE_NAME,
      },
      offers: {
        '@type': 'Offer',
        price: Number(book.price) || 0,
        priceCurrency: 'BDT',
        availability:
          book.isEbook || (book.centralQty ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: canonical,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Books', item: absoluteSiteUrl('/books') },
        { '@type': 'ListItem', position: 3, name: book.name, item: canonical },
      ],
    },
  ];
}

export default async function PublicBookDetailsPage({ params }: { params: BookRouteParams }) {
  const { bookId } = await params;
  const decodedBookId = decodeURIComponent(bookId);
  const book = await loadBook(decodedBookId);

  if (!book) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(buildBookSchema(book)) }}
      />
      <BookDetailsClient initialBook={book} bookId={decodedBookId} />
    </>
  );
}
