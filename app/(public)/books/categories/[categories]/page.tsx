import { notFound } from 'next/navigation';
import { loadPublicCategoryBooksPage } from '@/lib/api/books-catalog';
import CategoryBooksPageClient from './CategoryBooksPageClient';

type PageProps = {
  params: Promise<{ categories: string }>;
};

export default async function CategoryBooksPage({ params }: PageProps) {
  const { categories } = await params;
  const categorySlug = decodeURIComponent(categories);

  const { category, categories: allCategories, books } = await loadPublicCategoryBooksPage(categorySlug);

  if (!category) {
    notFound();
  }

  return (
    <CategoryBooksPageClient category={category} categories={allCategories} books={books} />
  );
}
