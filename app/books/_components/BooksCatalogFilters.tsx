'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BookCategory } from '@/lib/api/books';

type BooksCatalogFiltersProps = {
  categories: BookCategory[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  resultCount: number;
  activeCategory: BookCategory | null;
  searchQuery: string;
  onReset: () => void;
};

export function BooksCatalogFilters({
  categories,
  selectedCategory,
  onSelectCategory,
  resultCount,
  activeCategory,
  searchQuery,
  onReset,
}: BooksCatalogFiltersProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[30px] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">লাইভ ফিল্টার</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">ক্যাটাগরি ও ক্যাটালগ ফিল্টার</h2>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <Button
              type="button"
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className="shrink-0 rounded-full"
              onClick={() => onSelectCategory('all')}
            >
              সব ক্যাটাগরি
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                type="button"
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                className="shrink-0 rounded-full"
                onClick={() => onSelectCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 shadow-none">
              {resultCount} টি ফলাফল
            </Badge>
            {activeCategory ? (
              <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 shadow-none">
                {activeCategory.name}
              </Badge>
            ) : null}
            {searchQuery.trim() ? (
              <Badge className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 shadow-none">
                সার্চ: {searchQuery.trim()}
              </Badge>
            ) : null}
            <Button type="button" variant="outline" className="rounded-full" onClick={onReset}>
              রিসেট
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
