'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Program } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  RefreshCw,
  Search,
  Trash2,
  GraduationCap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { ProgramForm, ProgramDetailsView, ProgramCascadeDeleteModal } from '@/features/admin/programs';
import { resolveProgramThumbnail } from '@/features/admin/programs/utils';
import { useProgramsList } from '@/lib/query/hooks/useProgramsList';
import { queryKeys } from '@/lib/query/admin-query';
import { cn } from '@/lib/utils';

function ProgramsTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="border-slate-100">
          <TableCell className="px-8 py-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-slate-100 animate-pulse shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-40 rounded-lg bg-slate-100 animate-pulse" />
                <div className="h-3 w-24 rounded-lg bg-slate-50 animate-pulse" />
              </div>
            </div>
          </TableCell>
          <TableCell className="py-5"><div className="h-4 w-48 rounded-lg bg-slate-100 animate-pulse" /></TableCell>
          <TableCell className="py-5"><div className="h-6 w-20 rounded-lg bg-slate-100 animate-pulse" /></TableCell>
          <TableCell className="py-5"><div className="h-6 w-24 rounded-lg bg-slate-100 animate-pulse" /></TableCell>
          <TableCell className="py-5"><div className="h-6 w-20 rounded-lg bg-slate-100 animate-pulse" /></TableCell>
          <TableCell className="px-8 py-5"><div className="h-8 w-28 rounded-xl bg-slate-100 animate-pulse mx-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

function ProgramTableRow({
  program,
  onView,
  onEdit,
  onDelete,
}: {
  program: Program;
  onView: (program: Program) => void;
  onEdit: (program: Program) => void;
  onDelete: (program: Program) => void;
}) {
  const thumb = resolveProgramThumbnail(program.thumbnail);
  const courseCount = program._count?.courses ?? 0;

  return (
    <TableRow className="group border-slate-100 transition-colors hover:bg-slate-50/80">
      <TableCell className="px-8 py-5">
        <div className="flex items-center gap-4">
          {thumb ? (
            <div className="h-12 w-12 rounded-xl overflow-hidden shadow-sm border border-slate-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumb}
                alt={program.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 border border-dashed border-slate-200 shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
          )}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base truncate">
              {program.name}
            </span>
            <span className="text-sm font-medium text-slate-400 uppercase tracking-tighter">
              ID: {program.id.slice(0, 8)}…
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="max-w-xs py-5">
        <p className="truncate text-base font-medium text-slate-500">
          {program.description || 'No description provided.'}
        </p>
      </TableCell>
      <TableCell className="py-5">
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] font-black uppercase tracking-widest rounded-lg border-0',
            program.paymentCircle === 'MONTHLY'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-blue-50 text-blue-700',
          )}
        >
          {program.paymentCircle === 'MONTHLY' ? 'Monthly' : 'One-time'}
        </Badge>
      </TableCell>
      <TableCell className="py-5">
        {program.paymentCircle === 'MONTHLY' && program.admissionFeeEnabled ? (
          <span className="text-sm font-bold text-emerald-700">
            ৳{Number(program.admissionFeeAmount ?? 0).toLocaleString()}
          </span>
        ) : (
          <span className="text-sm font-medium text-slate-400">—</span>
        )}
      </TableCell>
      <TableCell className="py-5">
        <span className="text-sm font-bold text-slate-700">{courseCount}</span>
      </TableCell>
      <TableCell className="py-5">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold text-slate-400">
            Added: {new Date(program.createdAt).toLocaleDateString()}
          </span>
          <span className="text-sm font-bold text-slate-500">
            Mod: {new Date(program.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-8 py-5">
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
            onClick={() => onView(program)}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-xl border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
            onClick={() => onEdit(program)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
            onClick={() => onDelete(program)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function ProgramsPage() {
  const queryClient = useQueryClient();
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();
  const { data: programs = [], isLoading, isFetching, error, refetch } = useProgramsList();
  const [searchQuery, setSearchQuery] = useState('');
  const [cascadeDeleteTarget, setCascadeDeleteTarget] = useState<Program | null>(null);

  const invalidatePrograms = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.programs.all });
  };

  const filteredPrograms = useMemo(
    () =>
      programs.filter(
        (program) =>
          program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          program.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [programs, searchQuery],
  );

  const showSkeleton = isLoading && programs.length === 0;
  const showEmpty = !showSkeleton && filteredPrograms.length === 0;

  const handleViewProgram = (program: Program) => {
    openModal({
      title: 'Program details',
      description: 'See basic info about this program.',
      className: 'sm:max-w-4xl',
      content: <ProgramDetailsView program={program} />,
    });
  };

  const handleEditProgram = (program: Program) => {
    openModal({
      title: 'Edit program',
      description: 'Change the name, description or image.',
      className: 'sm:max-w-2xl',
      content: <ProgramForm program={program} onSuccess={invalidatePrograms} />,
    });
  };

  const handleCreateProgram = () => {
    openModal({
      title: 'Add program',
      description: 'Create a new program for your courses.',
      className: 'sm:max-w-2xl',
      content: <ProgramForm onSuccess={invalidatePrograms} />,
    });
  };

  return (
    <div className="space-y-8 text-slate-900">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap flex-1 items-center gap-4">
            <div className="min-w-[300px] flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="Search programs by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner"
                />
              </div>
            </div>
            <Button
              variant="outline"
              className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            </Button>
          </div>

          <Button
            className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
            onClick={handleCreateProgram}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Program
          </Button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-rose-700">
            {error instanceof Error ? error.message : 'Failed to load programs'}
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()} className="shrink-0">
            Retry
          </Button>
        </div>
      )}

      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Program Registry</h2>
            <p className="mt-0.5 text-base font-bold text-indigo-500">Institutional baseline</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {searchQuery
              ? `${filteredPrograms.length} of ${programs.length}`
              : `${programs.length} program${programs.length !== 1 ? 's' : ''}`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-b border-slate-100">
                <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Program Name</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Curriculum Scope</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Payment</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Admission Fee</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Courses</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Timeline</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showSkeleton ? (
                <ProgramsTableSkeleton />
              ) : showEmpty ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-20 text-center">
                    <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">
                      {searchQuery ? 'No matching programs identified.' : 'No programs yet. Create your first program.'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrograms.map((program) => (
                  <ProgramTableRow
                    key={program.id}
                    program={program}
                    onView={handleViewProgram}
                    onEdit={handleEditProgram}
                    onDelete={setCascadeDeleteTarget}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <Toaster toasts={toasts} removeToast={removeToast} />

      {cascadeDeleteTarget && (
        <ProgramCascadeDeleteModal
          programId={cascadeDeleteTarget.id}
          programPreview={{
            name: cascadeDeleteTarget.name,
            courseCount: cascadeDeleteTarget._count?.courses,
          }}
          onClose={() => setCascadeDeleteTarget(null)}
          onDeleted={(courseCount) => {
            setCascadeDeleteTarget(null);
            void invalidatePrograms();
            toast({
              title: 'Deleted successfully',
              description: `Program and ${courseCount} course${courseCount !== 1 ? 's' : ''} deleted successfully.`,
              variant: 'success',
            });
          }}
        />
      )}
    </div>
  );
}
