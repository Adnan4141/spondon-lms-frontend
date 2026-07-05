'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Users,
  Search,
  RefreshCw,
  Mail,
  Phone,
  BookOpen,
  Layers,
  User,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTeacherSession } from '@/components/teacher/useTeacherSession';
import { currentTeacherStudentsMonth } from '@/lib/api/teacher-students';
import { useTeacherStudents } from './useTeacherStudents';

const SEARCH_DEBOUNCE_MS = 400;

function formatMonthLabel(month: string) {
  try {
    return format(parseISO(`${month}-01`), 'MMMM yyyy');
  } catch {
    return month;
  }
}

export function TeacherStudentsPageContent() {
  const { user, authChecked } = useTeacherSession();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [month, setMonth] = useState(currentTeacherStudentsMonth());
  const [courseFilter, setCourseFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [page, setPage] = useState(1);

  const debouncedSearchRef = useRef(debouncedSearch);
  debouncedSearchRef.current = debouncedSearch;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = searchInput.trim();
      if (next !== debouncedSearchRef.current) {
        setDebouncedSearch(next);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [month, courseFilter, batchFilter, debouncedSearch]);

  const filters = useMemo(
    () => ({
      month,
      courseId: courseFilter,
      batchId: batchFilter,
      search: debouncedSearch,
      page,
    }),
    [month, courseFilter, batchFilter, debouncedSearch, page],
  );

  const {
    courses,
    summary,
    students,
    pagination,
    activeMonth,
    batchOptions,
    loading,
    error,
    refetch,
  } = useTeacherStudents(user?.id, filters);

  if (!authChecked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading students…
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm font-bold text-slate-700">Sign in required</p>
        <p className="text-sm text-slate-500">Please log in as a teacher to view your students.</p>
      </div>
    );
  }

  const totalPages = pagination?.pages ?? 1;
  const totalStudents = summary?.uniqueStudents ?? 0;

  return (
    <div className="space-y-6 pb-20 text-slate-900">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-slate-200/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Active Students
              </p>
              <p className="text-2xl font-black text-slate-900">{totalStudents}</p>
            </div>
          </div>
          <p className="mt-3 text-xs font-medium text-slate-500">
            Unique students in your courses for {formatMonthLabel(activeMonth)}
          </p>
        </div>

        <div className="rounded-[24px] border border-slate-200/60 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-3">
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
            By Course
          </p>
          <div className="flex flex-wrap gap-2">
            {(summary?.byCourse ?? []).length > 0 ? (
              summary!.byCourse.map((item) => (
                <div
                  key={item.courseId}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"
                >
                  {item.courseName}
                  <span className="ml-2 rounded-md bg-white px-2 py-0.5 text-indigo-600">
                    {item.studentCount}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm font-medium text-slate-400">No active students this month.</p>
            )}
          </div>
        </div>
      </div>

      <section className="space-y-4 rounded-[24px] border border-slate-200/60 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">My Students</h2>
            <p className="text-sm font-medium text-slate-500">
              Students active in your assigned courses for {formatMonthLabel(activeMonth)}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-8 w-[150px] border-none bg-transparent p-0 text-sm font-bold shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name, email or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-9 text-sm font-medium"
            />
          </div>

          <Select
            value={courseFilter}
            onValueChange={(value) => {
              setCourseFilter(value);
              setBatchFilter('all');
            }}
          >
            <SelectTrigger className="h-10 w-[180px] rounded-xl border-slate-200 text-sm font-bold">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={batchFilter} onValueChange={setBatchFilter}>
            <SelectTrigger className="h-10 w-[160px] rounded-xl border-slate-200 text-sm font-bold">
              <SelectValue placeholder="All Batches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batchOptions.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="h-10 w-10 rounded-xl p-0"
            onClick={() => void refetch()}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>

        <div className="overflow-hidden rounded-[20px] border border-slate-100">
          {error ? (
            <div className="p-16 text-center">
              <p className="text-sm font-bold text-rose-600">
                {error instanceof Error ? error.message : 'Failed to load students'}
              </p>
            </div>
          ) : loading && students.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                Loading students...
              </p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-300">
                <User className="h-8 w-8" />
              </div>
              <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">
                No active students for {formatMonthLabel(activeMonth)}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 bg-slate-50/80 hover:bg-slate-50/80">
                      <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Student
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Your Course
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Batch
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Branch
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Access
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((row) => (
                      <TableRow key={row.id} className="border-slate-50 hover:bg-slate-50/60">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-600">
                              {row.student.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{row.student.fullName}</p>
                              <div className="mt-1 space-y-0.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                  <Mail className="h-3 w-3" />
                                  {row.student.email || 'No email'}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                  <Phone className="h-3 w-3" />
                                  {row.student.mobile}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                              <BookOpen className="h-4 w-4" />
                            </div>
                            <div>
                              {row.program?.name ? (
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                                  {row.program.name}
                                </p>
                              ) : null}
                              <p className="text-sm font-bold text-slate-700">{row.course.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                            <Layers className="h-4 w-4 text-slate-300" />
                            {row.batch?.name || '—'}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-sm font-bold text-slate-600">
                          {row.branch.name}
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              'rounded-lg border px-2 py-0.5 text-[9px] font-black uppercase shadow-none',
                              row.accessStatus === 'FULL_ACCESS'
                                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                : 'border-amber-100 bg-amber-50 text-amber-700',
                            )}
                          >
                            {row.accessStatus.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 ? (
                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                  <p className="text-xs font-bold text-slate-500">
                    Page {pagination?.page ?? 1} of {totalPages} · {pagination?.total ?? 0} rows
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      disabled={(pagination?.page ?? 1) <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      disabled={(pagination?.page ?? 1) >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
