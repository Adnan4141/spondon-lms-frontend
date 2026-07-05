import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { BookSortOption, BookTypeFilter } from './student-books-utils';

type CategoryOption = { id: string; name: string };

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  sort: BookSortOption;
  onSortChange: (value: BookSortOption) => void;
  typeFilter: BookTypeFilter;
  onTypeFilterChange: (value: BookTypeFilter) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  categories: CategoryOption[];
};

const selectClass = cn(
  'h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm font-bold text-slate-600 cursor-pointer transition-all',
  'hover:bg-slate-100/50 focus-visible:bg-white focus-visible:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-100',
);

export function StudentBooksToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  typeFilter,
  onTypeFilterChange,
  categoryId,
  onCategoryChange,
  categories,
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm sm:p-4">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          placeholder="Search books by title, author, or category..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm transition-all focus-visible:border-indigo-400 focus-visible:bg-white focus-visible:ring-indigo-100"
          aria-label="Search books"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value as BookTypeFilter)}
          className={cn(selectClass, 'w-full sm:w-auto sm:min-w-[8.5rem]')}
          aria-label="Filter by book type"
        >
          <option value="all">All types</option>
          <option value="ebook">E-book</option>
          <option value="print">Print</option>
        </select>

        {categories.length > 0 ? (
          <select
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={cn(selectClass, 'w-full sm:w-auto sm:min-w-[9rem]')}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        ) : null}

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as BookSortOption)}
          className={cn(selectClass, 'w-full sm:ml-auto sm:w-auto sm:min-w-[9.5rem]')}
          aria-label="Sort books"
        >
          <option value="recent">Most recent</option>
          <option value="name">Name (A–Z)</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
        </select>
      </div>
    </div>
  );
}
