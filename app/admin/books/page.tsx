'use client';

import { useBooksData } from '@/features/admin/books/hooks/useBooksData';
import { BooksWorkspaceHeader } from './_components/BooksWorkspaceHeader';
import { BooksWorkspaceLoading } from './_components/BooksWorkspaceLoading';
import { BooksWorkspaceTabs } from './_components/BooksWorkspaceTabs';

export default function BooksPage() {
  const data = useBooksData();

  if (data.loading) {
    return <BooksWorkspaceLoading />;
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-12">
      <BooksWorkspaceHeader bookCount={data.books.length} channelCount={data.channels.length} onRefresh={data.refreshAll} />
      <BooksWorkspaceTabs data={data} />
    </div>
  );
}
