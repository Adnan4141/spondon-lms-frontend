'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BooksDashboardData } from '@/features/admin/books/hooks/useBooksData';
import { BookCatalogTab } from '@/features/admin/books/components/BookCatalogTab';
import { CategoriesTab } from '@/features/admin/books/components/CategoriesTab';
import { StockHistoryTab } from '@/features/admin/books/components/StockHistoryTab';
import { DistributionTab } from '@/features/admin/books/components/DistributionTab';
import { ChannelsSourcesTab } from '@/features/admin/books/components/ChannelsSourcesTab';
import { OnlineSalesTab } from '@/features/admin/books/components/OnlineSalesTab';
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
        <TabsList className="flex h-auto w-full min-w-0 flex-wrap justify-start gap-1 rounded-xl border border-border/70 bg-card p-1 shadow-sm backdrop-blur-sm">
          {BOOKS_ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-950 sm:px-4 sm:text-sm"
              >
                <Icon className="mr-1.5 h-3.5 w-3.5 shrink-0 sm:mr-2 sm:h-4 sm:w-4" />
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

      <TabsContent value="online-sales" className="mt-0 outline-none">
        <OnlineSalesTab />
      </TabsContent>

      <TabsContent value="commerce" className="mt-0 space-y-6 outline-none">
        <BooksCommerceIntroCards />
        <CourseCommerceTab books={books} />
      </TabsContent>
    </Tabs>
  );
}
