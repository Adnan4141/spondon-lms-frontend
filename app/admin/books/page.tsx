'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  ArrowRightLeft,
  BookOpen,
  Boxes,
  Building2,
  Loader2,
  RadioTower,
  ReceiptText,
  ShoppingCart,
  Tags,
} from 'lucide-react';
import { useBooksData } from '@/features/admin/books/hooks/useBooksData';
import { BookCatalogTab } from '@/features/admin/books/components/BookCatalogTab';
import { CategoriesTab } from '@/features/admin/books/components/CategoriesTab';
import { StockHistoryTab } from '@/features/admin/books/components/StockHistoryTab';
import { DistributionTab } from '@/features/admin/books/components/DistributionTab';
import { ChannelsSourcesTab } from '@/features/admin/books/components/ChannelsSourcesTab';
import { BranchSaleTab } from '@/features/admin/books/components/BranchSaleTab';
import { CourseCommerceTab } from '@/features/admin/books/components/CourseCommerceTab';

const tabs = [
  { value: 'catalog', label: 'Catalog', icon: BookOpen },
  { value: 'categories', label: 'Categories', icon: Tags },
  { value: 'stock', label: 'Stock History', icon: Boxes },
  { value: 'distribution', label: 'Distribution', icon: ArrowRightLeft },
  { value: 'channels', label: 'Channels & Sources', icon: RadioTower },
  { value: 'sales', label: 'Offline Sales', icon: ShoppingCart },
  { value: 'commerce', label: 'Course Commerce', icon: ReceiptText },
] as const;

export default function BooksPage() {
  const data = useBooksData();

  if (data.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="font-semibold">Loading books dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-[32px] border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground">Books Operations</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">Book Inventory, Distribution, and Course Commerce</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              First implementation slice: catalog management, grouped categories, stock timeline ledger, branch/channel distribution, source tracking, and offline sales entry.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm">
              <p className="font-black text-foreground">{data.books.length}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Books</p>
            </div>
            <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm">
              <p className="font-black text-foreground">{data.channels.length}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Channels</p>
            </div>
            <Button variant="outline" className="rounded-2xl" onClick={() => void data.refreshAll()}>
              Refresh
            </Button>
          </div>
        </div>
      </section>

      <Tabs defaultValue="catalog" className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="h-auto min-w-full justify-start gap-1 rounded-[24px] bg-muted/50 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="rounded-2xl px-4 py-2.5 text-sm font-semibold">
                  <Icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="catalog">
          <BookCatalogTab books={data.books} categories={data.categories} programs={data.programs} onRefresh={data.refreshAll} />
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesTab categories={data.categories} onRefresh={data.refreshCategories} />
        </TabsContent>

        <TabsContent value="stock">
          <StockHistoryTab books={data.books} branches={data.branches} sources={data.sources} channels={data.channels} />
        </TabsContent>

        <TabsContent value="distribution">
          <DistributionTab books={data.books} branches={data.branches} channels={data.channels} />
        </TabsContent>

        <TabsContent value="channels">
          <ChannelsSourcesTab channels={data.channels} sources={data.sources} onRefresh={data.refreshAll} />
        </TabsContent>

        <TabsContent value="sales">
          <BranchSaleTab books={data.books} branches={data.branches} />
        </TabsContent>

        <TabsContent value="commerce">
          <div className="space-y-6">
            <section className="grid gap-6 xl:grid-cols-2">
              <article className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary"><Building2 className="h-5 w-5" /></div>
                  <div>
                    <h3 className="text-xl font-black">Course-linked books preview</h3>
                    <p className="text-sm text-muted-foreground">Preview the course materials modal and the receipt layout with linked book names.</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>Course detail book lists now have a dedicated modal target instead of relying on future drawers.</li>
                  <li>Receipt preview breaks out each linked book as a separate line item with a clear books subtotal.</li>
                  <li>The same white, responsive `max-w-5xl` dialog standard is used here for future expansion.</li>
                </ul>
              </article>
              <article className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary"><ReceiptText className="h-5 w-5" /></div>
                  <div>
                    <h3 className="text-xl font-black">Storefront sample preview target</h3>
                    <p className="text-sm text-muted-foreground">Public book details now have a standardized sample preview modal ready for demo PDF uploads.</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>The public book page opens a white responsive preview modal instead of needing a custom one-off dialog later.</li>
                  <li>If a sample PDF is not attached yet, the modal shows a clear empty state instead of a broken iframe.</li>
                  <li>This keeps storefront preview behavior aligned with admin-side books dialogs.</li>
                </ul>
              </article>
            </section>

            <CourseCommerceTab books={data.books} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}