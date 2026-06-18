import {
  getBookCategories,
  getPublicBooksCatalog,
  type BookCategory,
  type PublicCatalogBook,
} from './books';

const BOOKS_PER_CATEGORY_SHELF = 12;

export type PublicBooksCatalogHome = {
  books: PublicCatalogBook[];
  categories: BookCategory[];
};

/** Loads category shelves for the public books catalog without one huge flat list. */
export async function loadPublicBooksCatalogHome(): Promise<PublicBooksCatalogHome> {
  const categoriesRes = await getBookCategories();
  const categories = categoriesRes.success && categoriesRes.data ? categoriesRes.data : [];

  if (categories.length === 0) {
    return { books: [], categories: [] };
  }

  const bookResponses = await Promise.all(
    categories.map((category) =>
      getPublicBooksCatalog({ categoryId: category.id, limit: BOOKS_PER_CATEGORY_SHELF }),
    ),
  );

  const seen = new Set<string>();
  const books: PublicCatalogBook[] = [];

  for (const res of bookResponses) {
    if (!res.success || !res.data) continue;
    for (const book of res.data) {
      if (seen.has(book.id)) continue;
      seen.add(book.id);
      books.push(book);
    }
  }

  return { books, categories };
}

export async function loadPublicCategoryBooksPage(categorySlug: string): Promise<{
  category: BookCategory | null;
  categories: BookCategory[];
  books: PublicCatalogBook[];
}> {
  const categoriesRes = await getBookCategories();
  const categories = categoriesRes.success && categoriesRes.data ? categoriesRes.data : [];
  const category = categories.find((item) => item.slug === categorySlug) ?? null;

  if (!category) {
    return { category: null, categories, books: [] };
  }

  const booksRes = await getPublicBooksCatalog({ categoryId: category.id, limit: 120 });
  const books = booksRes.success && booksRes.data ? booksRes.data : [];

  return { category, categories, books };
}
