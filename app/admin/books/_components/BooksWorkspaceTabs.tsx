'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BooksDashboardData } from '@/features/admin/books/hooks/useBooksData';
import { BookCatalogTab } from '@/features/admin/books/components/BookCatalogTab';
import { CategoriesTab } from '@/features/admin/books/components/CategoriesTab';
import { StockHistoryTab } from '@/features/admin/books/components/StockHistoryTab';
import { DistributionTab } from '@/features/admin/books/components/DistributionTab';
import { ChannelsSourcesTab } from '@/features/admin/books/components/ChannelsSourcesTab';
import { BranchSaleTab } from '@/features/admin/books/components/BranchSaleTab';
import { CourseCommerceTab } from '@/features/admin/books/components/CourseCommerceTab';
import { BOOKS_ADMIN_TABS } from './books-admin-tab-config';
import { BooksCommerceIntroCards } from './BooksCommerceIntroCards';

type BooksWorkspaceTabsProps = {
  data: BooksDashboardData;
};

export function BooksWorkspaceTabs({ data }: BooksWorkspaceTabsProps) {
  const { books, categories, branches, channels, sources, programs, refreshAll, refreshCategories } = data;

  return (
    <Tabs defaultValue="catalog" className="space-y-5">
      <div className="sticky top-0 z-10 -mx-1 px-1 pb-1 pt-0.5">
        <TabsList className="flex h-auto w-full min-w-0 flex-wrap justify-start gap-1 rounded-2xl border border-border/80 bg-muted/40 p-1.5 shadow-sm backdrop-blur-sm">
          {BOOKS_ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-xl px-3 py-2 text-xs font-medium data-[state=active]:shadow-sm sm:px-4 sm:text-sm"
              >
                <Icon className="mr-1.5 h-3.5 w-3.5 shrink-0 opacity-70 sm:mr-2 sm:h-4 sm:w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      <TabsContent value="catalog" className="mt-0 outline-none">
        <BookCatalogTab books={books} categories={categories} programs={programs} onRefresh={refreshAll} />
      </TabsContent>

      <TabsContent value="categories" className="mt-0 outline-none">
        <CategoriesTab categories={categories} onRefresh={refreshCategories} />
      </TabsContent>

      <TabsContent value="stock" className="mt-0 outline-none">
        <StockHistoryTab books={books} branches={branches} sources={sources} channels={channels} />
      </TabsContent>

      <TabsContent value="distribution" className="mt-0 outline-none">
        <DistributionTab books={books} branches={branches} channels={channels} />
      </TabsContent>

      <TabsContent value="channels" className="mt-0 outline-none">
        <ChannelsSourcesTab channels={channels} sources={sources} onRefresh={refreshAll} />
      </TabsContent>

      <TabsContent value="sales" className="mt-0 outline-none">
        <BranchSaleTab books={books} branches={branches} />
      </TabsContent>

      <TabsContent value="commerce" className="mt-0 space-y-6 outline-none">
        <BooksCommerceIntroCards />
        <CourseCommerceTab books={books} />
      </TabsContent>
    </Tabs>
  );
}
