'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useBooksData } from '@/features/admin/books/hooks/useBooksData';
import { StockHistoryTab } from '@/features/admin/books/components/StockHistoryTab';
import { DeletedStockHistoryTab } from '@/features/admin/books/components/DeletedStockHistoryTab';
import { DistributionTab } from '@/features/admin/books/components/DistributionTab';
import { defaultStockPageFilters, type StockPageSharedFilters } from '@/features/admin/books/components/stock-page-filters';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import { BooksRouteHeader } from '../_components/BooksRouteHeader';
import { BooksWorkspaceLoading } from '../_components/BooksWorkspaceLoading';
import { ArrowRightLeft, Boxes, RefreshCw, Trash2 } from 'lucide-react';

export default function BooksStockPage() {
  const data = useBooksData();
  const { user } = useAdminSession();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isBranchAdmin = user?.role === 'BRANCH_ADMIN';
  const [sharedFilters, setSharedFilters] = useState<StockPageSharedFilters>(() => defaultStockPageFilters());

  if (data.loading) {
    return <BooksWorkspaceLoading />;
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 px-1 pb-12">
      <BooksRouteHeader
        title="Stock & Distribution"
        subtitle={
          isBranchAdmin
            ? 'Review stock movements and incoming distributions for your branch only. Recording or correcting stock requires Super Admin or Accounts.'
            : 'Receive, transfer, distribute, correct, and audit physical book inventory separately from catalog setup.'
        }
      >
        <Button variant="outline" className="h-10 gap-2 rounded-xl" onClick={() => void data.refreshAll()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </BooksRouteHeader>

      <Tabs defaultValue="history" className="space-y-5">
        <TabsList className="flex h-auto w-full min-w-0 flex-wrap justify-start gap-1 rounded-xl border border-border/70 bg-card p-1 shadow-sm">
          <TabsTrigger value="history" className="rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white">
            <Boxes className="mr-2 h-4 w-4" />
            Stock History
          </TabsTrigger>
          <TabsTrigger value="distribution" className="rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Distribution
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-0 outline-none">
          <StockHistoryTab
            books={data.books}
            branches={data.branches}
            sources={data.sources}
            channels={data.channels}
            sharedFilters={sharedFilters}
            onSharedFiltersChange={setSharedFilters}
          />
        </TabsContent>

        <TabsContent value="distribution" className="mt-0 outline-none">
          <DistributionTab
            books={data.books}
            branches={data.branches}
            channels={data.channels}
            sharedFilters={sharedFilters}
            onSharedFiltersChange={setSharedFilters}
          />
        </TabsContent>

        {isSuperAdmin ? (
          <TabsContent value="deleted" className="mt-0 outline-none">
            <DeletedStockHistoryTab books={data.books} sharedFilters={sharedFilters} />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
