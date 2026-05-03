'use client';

import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function BooksWorkspaceLoading() {
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
