'use client';

import { useBooksData } from '@/features/admin/books/hooks/useBooksData';
import { BooksWorkspaceLoading } from './_components/BooksWorkspaceLoading';
import { BooksWorkspaceTabs } from './_components/BooksWorkspaceTabs';
import { BooksRouteHeader } from '@/features/admin/books';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function BooksPage() {
  const data = useBooksData();

  if (data.loading) {
    return <BooksWorkspaceLoading />;
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 px-1 pb-12">
      <BooksRouteHeader
        title="Book Catalog"
        subtitle="Manage book records, categories, channels, course links, covers, PDFs, pricing, and public catalog setup."
      >
        <Button variant="outline" className="h-10 gap-2 rounded-xl" onClick={() => void data.refreshAll()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </BooksRouteHeader>
      <BooksWorkspaceTabs data={data} />
    </div>
  );
}
