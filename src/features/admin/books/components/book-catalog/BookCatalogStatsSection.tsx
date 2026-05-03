'use client';

import type { Book } from '@/lib/api/books';
import { BookOpen, FileText, Star } from 'lucide-react';
import { StatsCard } from '../StatsCard';

type BookCatalogStatsSectionProps = {
  books: Book[];
};

export function BookCatalogStatsSection({ books }: BookCatalogStatsSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatsCard label="Total Books" value={books.length} icon={BookOpen} sub="All physical and digital titles" />
      <StatsCard label="Physical" value={books.filter((b) => !b.isEbook).length} icon={BookOpen} variant="green" />
      <StatsCard label="Ebooks" value={books.filter((b) => b.isEbook).length} icon={FileText} variant="blue" />
      <StatsCard label="Featured" value={books.filter((b) => b.featured).length} icon={Star} variant="orange" />
    </div>
  );
}
