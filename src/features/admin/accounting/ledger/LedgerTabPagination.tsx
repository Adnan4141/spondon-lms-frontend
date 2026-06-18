'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function LedgerTabPagination({ total, page, totalPages, loading, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-400">
      <span>{total} entries found</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onPrev} disabled={page <= 1 || loading} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 transition-colors hover:bg-slate-50 disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span>Page {page} / {totalPages}</span>
        <button type="button" onClick={onNext} disabled={page >= totalPages || loading} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 transition-colors hover:bg-slate-50 disabled:opacity-40">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
