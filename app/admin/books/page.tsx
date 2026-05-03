'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  { value: 'stock', label: 'Stock history', icon: Boxes },
  { value: 'distribution', label: 'Distribution', icon: ArrowRightLeft },
  { value: 'channels', label: 'Channels & sources', icon: RadioTower },
  { value: 'sales', label: 'Offline sales', icon: ShoppingCart },
  { value: 'commerce', label: 'Course commerce', icon: ReceiptText },
] as const;

export default function BooksPage() {
  const data = useBooksData();

  if (data.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md border-dashed py-10 shadow-none">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-semibold text-foreground">Loading books workspace…</p>
            <p className="text-xs text-muted-foreground">Fetching catalog, branches, and channels.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-12">
      <Card className="overflow-hidden border-border/80 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Books workspace</p>
              <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">Inventory & catalog</CardTitle>
              <CardDescription className="max-w-2xl text-pretty text-sm leading-relaxed">
                Manage titles, categories, stock movements, distribution, sales channels, branch sales, and how books attach to courses — from one place.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
              <div className="flex min-w-22 flex-col rounded-xl border border-border bg-background px-4 py-2.5 text-center shadow-sm">
                <span className="text-lg font-bold tabular-nums text-foreground">{data.books.length}</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Books</span>
              </div>
              <div className="flex min-w-22 flex-col rounded-xl border border-border bg-background px-4 py-2.5 text-center shadow-sm">
                <span className="text-lg font-bold tabular-nums text-foreground">{data.channels.length}</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Channels</span>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => void data.refreshAll()}>
                Refresh data
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="catalog" className="space-y-5">
        <div className="sticky top-0 z-10 -mx-1 px-1 pb-1 pt-0.5">
          <TabsList className="flex h-auto w-full min-w-0 flex-wrap justify-start gap-1 rounded-2xl border border-border/80 bg-muted/40 p-1.5 shadow-sm backdrop-blur-sm">
            {tabs.map((tab) => {
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
          <BookCatalogTab books={data.books} categories={data.categories} programs={data.programs} onRefresh={data.refreshAll} />
        </TabsContent>

        <TabsContent value="categories" className="mt-0 outline-none">
          <CategoriesTab categories={data.categories} onRefresh={data.refreshCategories} />
        </TabsContent>

        <TabsContent value="stock" className="mt-0 outline-none">
          <StockHistoryTab books={data.books} branches={data.branches} sources={data.sources} channels={data.channels} />
        </TabsContent>

        <TabsContent value="distribution" className="mt-0 outline-none">
          <DistributionTab books={data.books} branches={data.branches} channels={data.channels} />
        </TabsContent>

        <TabsContent value="channels" className="mt-0 outline-none">
          <ChannelsSourcesTab channels={data.channels} sources={data.sources} onRefresh={data.refreshAll} />
        </TabsContent>

        <TabsContent value="sales" className="mt-0 outline-none">
          <BranchSaleTab books={data.books} branches={data.branches} />
        </TabsContent>

        <TabsContent value="commerce" className="mt-0 space-y-6 outline-none">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Course-linked books</CardTitle>
                    <CardDescription className="mt-1 text-xs leading-relaxed">
                      Course modals and receipts can list each linked book as its own line with a clear subtotal.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Public sample PDFs</CardTitle>
                    <CardDescription className="mt-1 text-xs leading-relaxed">
                      Storefront book pages use a shared preview modal; empty states show until a sample file is attached.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          <CourseCommerceTab books={data.books} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
