import { loadPublicBooksCatalogHome } from '@/lib/api/books-catalog';
import BooksCatalogPageClient from './page.client';

export default async function BooksCatalogPage() {
  let books: Awaited<ReturnType<typeof loadPublicBooksCatalogHome>>['books'] = [];
  let categories: Awaited<ReturnType<typeof loadPublicBooksCatalogHome>>['categories'] = [];

  try {
    const catalog = await loadPublicBooksCatalogHome();
    books = catalog.books;
    categories = catalog.categories;
  } catch {
    books = [];
    categories = [];
  }

  return <BooksCatalogPageClient initialBooks={books} initialCategories={categories} />;
}
