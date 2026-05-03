'use client';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type BooksWorkspaceHeaderProps = {
  bookCount: number;
  channelCount: number;
  onRefresh: () => Promise<void>;
};

export function BooksWorkspaceHeader({ bookCount, channelCount, onRefresh }: BooksWorkspaceHeaderProps) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Books workspace</p>
            <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">Inventory & catalog</CardTitle>
            <CardDescription className="max-w-2xl text-pretty text-sm leading-relaxed">
              Manage titles, categories, stock movements, distribution, sales channels, branch sales, and how books attach
              to courses — from one place.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
            <div className="flex min-w-22 flex-col rounded-xl border border-border bg-background px-4 py-2.5 text-center shadow-sm">
              <span className="text-lg font-bold tabular-nums text-foreground">{bookCount}</span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Books</span>
            </div>
            <div className="flex min-w-22 flex-col rounded-xl border border-border bg-background px-4 py-2.5 text-center shadow-sm">
              <span className="text-lg font-bold tabular-nums text-foreground">{channelCount}</span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Channels</span>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => void onRefresh()}>
              Refresh data
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
