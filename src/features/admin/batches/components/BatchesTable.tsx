import type { Batch } from '@/lib/api/batches';
import { BookOpen, LayoutGrid, MapPin, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { getStatusBadgeClass } from '../batches-page-utils';

type BatchesTableProps = {
  loading: boolean;
  error: string | null;
  batches: Batch[];
  onView: (id: string) => void;
  onRoutine: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function BatchesTable({
  loading,
  error,
  batches,
  onView,
  onRoutine,
  onEdit,
  onDelete,
}: BatchesTableProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Batch List</h2>
          <p className="mt-0.5 text-base font-bold text-indigo-500">All batches</p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {batches.length} Batches
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-4 p-12 text-center sm:p-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Loading batches...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center sm:p-20">
          <p className="font-black text-xs uppercase tracking-[0.2em] text-rose-500">{error}</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="p-12 text-center sm:p-20">
          <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No batches found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[920px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-b border-slate-100">
                <TableHead className="px-6 font-black text-xs uppercase tracking-widest text-slate-400 sm:px-8">
                  Batch
                </TableHead>
                <TableHead className="font-black text-xs uppercase tracking-widest text-slate-400">
                  Course & Branch
                </TableHead>
                <TableHead className="font-black text-xs uppercase tracking-widest text-slate-400">
                  Status
                </TableHead>
                <TableHead className="font-black text-xs uppercase tracking-widest text-slate-400">
                  Dates
                </TableHead>
                <TableHead className="font-black text-xs uppercase tracking-widest text-slate-400 text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow
                  key={batch.id}
                  className="group border-slate-100 transition-colors hover:bg-slate-50/80"
                >
                  <TableCell className="px-6 py-5 sm:px-8">
                    <div className="flex flex-col">
                      <span className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {batch.name}
                      </span>
                      <span className="text-sm font-medium text-slate-400">
                        ID: {batch.id.slice(0, 8)}...
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-base font-bold text-slate-600">
                        <BookOpen className="h-3 w-3 text-indigo-500" />
                        {batch.course?.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-400">
                        <MapPin className="h-4 w-4 text-rose-500" />
                        {batch.branch?.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-lg text-xs font-black uppercase tracking-widest px-2.5 py-1',
                          getStatusBadgeClass(String(batch.status)),
                        )}
                      >
                        {batch.status}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="rounded-lg bg-slate-50 border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest px-2.5 py-1"
                      >
                        {batch._count?.enrollments || 0} enrolled
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-slate-400">
                        Starts:{' '}
                        {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : 'TBA'}
                      </span>
                      <span className="text-sm font-bold text-slate-500">
                        Ends:{' '}
                        {batch.endDate ? new Date(batch.endDate).toLocaleDateString() : 'Continuous'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 rounded-xl border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                        onClick={() => onView(batch.id)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 gap-1.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all shadow-sm"
                        onClick={() => onRoutine(batch.id)}
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Routine
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 rounded-xl border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                        onClick={() => onEdit(batch.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                        onClick={() => onDelete(batch.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
