'use client';

import { memo, useMemo } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { STUDENTS_PAGE_SIZES } from '@/features/admin/students/useStudentsPageQuery';
import type { BranchOption, Student } from '../types';
import { avatarHue } from '../utils';
import { RowActions } from './RowActions';
import { StudentAdminBadge } from './StudentAdminBadge';

function StudentsTableComponent({
  students,
  totalStudents,
  branches,
  loading,
  page,
  totalPages,
  pageSize,
  onPageChange,
  onLimitChange,
  onViewEnrollments,
  onAction,
}: {
  students: Student[];
  totalStudents: number;
  branches: BranchOption[];
  loading: boolean;
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onViewEnrollments: (student: Student) => void;
  onAction: (action: string, student: Student) => void;
}) {
  const branchById = useMemo(() => new Map(branches.map((b) => [b.id, b.name])), [branches]);
  const start = totalStudents === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(totalStudents, (page - 1) * pageSize + students.length);
  const pages = Math.max(1, totalPages);
  const pageNumbers = useMemo(() => {
    const items = new Set<number>([1, pages, page - 1, page, page + 1]);
    return Array.from(items)
      .filter((p) => p >= 1 && p <= pages)
      .sort((a, b) => a - b);
  }, [page, pages]);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-100">
              {['Reg No', 'Full Name', 'Mobile', 'Branch', 'Enrollments', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">Loading students…</td></tr>
            )}
            {!loading && students.map(s => {
              const enrollCount = s._count?.enrollments ?? 0;
              const hue = avatarHue(s.fullName);
              return (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5"><span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-mono text-xs">{s.regNo}</span></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0" style={{ background: `hsl(${hue},55%,90%)`, color: `hsl(${hue},45%,35%)` }}>{s.fullName.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-slate-900">{s.fullName}</p>
                        {s.email && <p className="text-[11px] text-slate-400">{s.email}</p>}
                        <p className="text-[11px] text-rose-600 font-mono mt-0.5">{s.regNo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-mono text-xs">{s.mobile}</td>
                  <td className="px-4 py-3.5"><StudentAdminBadge label={branchById.get(s.branchId) ?? (s.branchId || '—')} color="slate" /></td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => onViewEnrollments(s)} className={cn('font-bold text-sm px-2.5 py-1 rounded-lg cursor-pointer transition-colors', enrollCount > 0 ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-slate-400 bg-slate-100')}>
                      {enrollCount} {enrollCount === 1 ? 'enrollment' : 'enrollments'}
                    </button>
                  </td>
                  <td className="px-4 py-3.5"><StudentAdminBadge label={s.status} color={s.status === 'ACTIVE' ? 'green' : 'red'} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => onAction('enroll', s)} className="gap-1.5 h-7 px-2.5 text-xs"><BookOpen className="h-3 w-3" /> Enroll</Button>
                      <Button
                        size="sm"
                        disabled={enrollCount === 0}
                        title={enrollCount === 0 ? 'Add an enrollment first' : undefined}
                        onClick={() => onAction('payment', s)}
                        className={cn(
                          'gap-1.5 h-7 px-2.5 text-xs bg-indigo-600 text-white hover:bg-indigo-700',
                          enrollCount === 0 && 'opacity-50 cursor-not-allowed',
                        )}
                      >
                        <CreditCard className="h-3 w-3" /> Pay
                      </Button>
                      <RowActions student={s} onAction={onAction} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && students.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">No students found matching your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <p className="text-xs text-slate-400">Showing {start}-{end} of {totalStudents} students</p>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(value) => onLimitChange(Number(value))}>
            <SelectTrigger className="h-8 w-[96px] rounded-lg text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STUDENTS_PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={loading || page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="h-8"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </Button>
          {pageNumbers.map((p, idx) => {
            const prev = pageNumbers[idx - 1];
            const gap = prev && p - prev > 1;
            return (
              <span key={p} className="flex items-center gap-1">
                {gap && <span className="px-1.5 text-xs text-slate-400">…</span>}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onPageChange(p)}
                  className={cn(
                    'h-8 min-w-8 rounded-lg border px-2 text-xs font-medium transition-colors',
                    p === page
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                  )}
                >
                  {p}
                </button>
              </span>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={loading || page >= pages}
            onClick={() => onPageChange(page + 1)}
            className="h-8"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export const StudentsTable = memo(StudentsTableComponent);
