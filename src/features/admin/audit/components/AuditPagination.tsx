import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZES = [25, 50, 100] as const;

export function AuditPagination({
  page,
  pages,
  total,
  rangeFrom,
  rangeTo,
  limit,
  loading,
  onPrev,
  onNext,
  onLimitChange,
}: {
  page: number;
  pages: number;
  total: number;
  rangeFrom: number;
  rangeTo: number;
  limit: number;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onLimitChange: (limit: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
      <span>
        {total > 0
          ? `Showing ${rangeFrom}–${rangeTo} of ${total.toLocaleString()}`
          : 'No records'}
      </span>
      <div className="flex items-center gap-2">
        <Select
          value={String(limit)}
          onValueChange={(v) => onLimitChange(Number(v))}
        >
          <SelectTrigger className="h-7 w-[88px] rounded-lg text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 rounded-lg px-2.5 text-xs"
          disabled={page <= 1 || loading}
          onClick={onPrev}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </Button>
        <span className="tabular-nums text-slate-500">
          {page} / {pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 rounded-lg px-2.5 text-xs"
          disabled={page >= pages || loading}
          onClick={onNext}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
