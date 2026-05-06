'use client';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, RefreshCw, Store, TrendingUp } from 'lucide-react';

type BooksWorkspaceHeaderProps = {
  bookCount: number;
  channelCount: number;
  onRefresh: () => Promise<void>;
};

export function BooksWorkspaceHeader({ bookCount, channelCount, onRefresh }: BooksWorkspaceHeaderProps) {
  return (
    <Card className="overflow-hidden rounded-xl border-border/70 bg-card shadow-sm">
      <CardHeader className="px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Books workspace</p>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Inventory & catalog</CardTitle>
            <CardDescription className="max-w-2xl text-pretty text-sm leading-relaxed">
              Manage catalog records, stock, distribution, branch sales, channels, and course attachments from one operational surface.
            </CardDescription>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[520px]">
            <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/25 px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-slate-700 shadow-sm dark:text-slate-200">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-lg font-bold tabular-nums text-foreground">{bookCount}</span>
                <span className="block truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Books</span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/25 px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-slate-700 shadow-sm dark:text-slate-200">
                <Store className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-lg font-bold tabular-nums text-foreground">{channelCount}</span>
                <span className="block truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Channels</span>
              </div>
            </div>
            <Button variant="outline" className="h-full min-h-15 justify-start rounded-lg px-3" onClick={() => void onRefresh()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
              <TrendingUp className="ml-auto h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
