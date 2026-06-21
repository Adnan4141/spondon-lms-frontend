'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminFilters } from '@/lib/query/hooks/useAdminFilters';
import {
  generateMonthlyInvoices,
  getMissingMonthlyInvoices,
  type MissingMonthlyInvoiceRow,
  type MissingMonthlyInvoicesResult,
} from '@/lib/api/invoices';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { MonthPicker } from '@/components/ui/month-picker';
import {
  AlertTriangle,
  CalendarRange,
  ChevronRight,
  CreditCard,
  ExternalLink,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
  UserX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function buildMonthlyBillingHref(filters: {
  month: string;
  branchId: string;
  programId: string;
  courseId: string;
}) {
  const params = new URLSearchParams();
  params.set('month', filters.month);
  if (filters.branchId !== 'all') params.set('branchId', filters.branchId);
  if (filters.programId !== 'all') params.set('programId', filters.programId);
  if (filters.courseId !== 'all') params.set('courseId', filters.courseId);
  return `/admin/monthly-billing?${params.toString()}`;
}

export default function MonthlyBillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, toasts, removeToast } = useToast();
  const { data: adminFilters, isLoading: isMetaLoading } = useAdminFilters();

  const [month, setMonth] = useState(() => searchParams.get('month') || new Date().toISOString().slice(0, 7));
  const [branchId, setBranchId] = useState<string>(() => searchParams.get('branchId') || 'all');
  const [programId, setProgramId] = useState<string>(() => searchParams.get('programId') || 'all');
  const [courseId, setCourseId] = useState<string>(() => searchParams.get('courseId') || 'all');
  const [coverage, setCoverage] = useState<MissingMonthlyInvoicesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingMissing, setGeneratingMissing] = useState(false);
  const [generatingStudentId, setGeneratingStudentId] = useState<string | null>(null);
  const pageLoading = loading || isMetaLoading;

  const monthlyPrograms = useMemo(
    () => (adminFilters?.programs ?? []).filter((program) => program.paymentCircle === 'MONTHLY'),
    [adminFilters?.programs],
  );

  const monthlyProgramIds = useMemo(
    () => new Set(monthlyPrograms.map((program) => program.id)),
    [monthlyPrograms],
  );

  const monthlyCourses = useMemo(
    () => (adminFilters?.courses ?? []).filter((course) => monthlyProgramIds.has(course.programId)),
    [adminFilters?.courses, monthlyProgramIds],
  );

  const filteredCourses = useMemo(() => {
    if (programId === 'all') return monthlyCourses;
    return monthlyCourses.filter((course) => course.programId === programId);
  }, [monthlyCourses, programId]);

  const branches = adminFilters?.branches ?? [];
  const missingStudents = coverage?.students ?? [];

  useEffect(() => {
    router.replace(
      buildMonthlyBillingHref({ month, branchId, programId, courseId }),
      { scroll: false },
    );
  }, [month, branchId, programId, courseId, router]);

  useEffect(() => {
    if (programId !== 'all' && !monthlyProgramIds.has(programId)) {
      setProgramId('all');
    }
  }, [monthlyProgramIds, programId]);

  useEffect(() => {
    if (courseId !== 'all' && !filteredCourses.some((course) => course.id === courseId)) {
      setCourseId('all');
    }
  }, [courseId, filteredCourses]);

  const loadCoverage = useCallback(async () => {
    try {
      setLoading(true);
      const params: {
        month: string;
        branchId?: string;
        courseId?: string;
        programId?: string;
      } = { month };
      if (branchId !== 'all') params.branchId = branchId;
      if (programId !== 'all') params.programId = programId;
      if (courseId !== 'all') params.courseId = courseId;
      const res = await getMissingMonthlyInvoices(params);
      if (res.success && res.data) {
        setCoverage(res.data);
      } else {
        setCoverage(null);
        toast({ title: 'Error', description: res.message || 'Failed to load billing coverage', variant: 'destructive' });
      }
    } catch {
      setCoverage(null);
      toast({ title: 'Error', description: 'Failed to load billing coverage', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [branchId, courseId, month, programId, toast]);

  useEffect(() => {
    void loadCoverage();
  }, [loadCoverage]);

  const runGenerate = async (options: { onlyMissing?: boolean; studentUserId?: string }) => {
    const { onlyMissing, studentUserId } = options;
    const setBusy = studentUserId
      ? (busy: boolean) => setGeneratingStudentId(busy ? studentUserId : null)
      : onlyMissing
        ? setGeneratingMissing
        : setGenerating;
    try {
      setBusy(true);
      const body: {
        month: string;
        branchId?: string;
        courseId?: string;
        programId?: string;
        onlyMissing?: boolean;
        studentUserId?: string;
      } = { month };
      if (onlyMissing) body.onlyMissing = true;
      if (studentUserId) body.studentUserId = studentUserId;
      if (branchId !== 'all') body.branchId = branchId;
      if (programId !== 'all') body.programId = programId;
      if (courseId !== 'all') body.courseId = courseId;
      const res = await generateMonthlyInvoices(body);
      if (res.success && res.data) {
        const d = res.data;
        toast({
          title: studentUserId
            ? 'Invoice generated'
            : onlyMissing
              ? 'Missing invoices generated'
              : 'Invoices generated',
          description: `${d.invoicesCreated} created${d.invoicesUpdated ? ` · ${d.invoicesUpdated} updated` : ''} · ${d.skipped} skipped for ${d.month}.`,
          variant: 'success',
        });
        if (d.errors?.length) {
          toast({
            title: 'Some students failed',
            description: d.errors.slice(0, 4).join(' · '),
            variant: 'destructive',
          });
        }
        await loadCoverage();
      } else {
        toast({ title: 'Error', description: res.message || 'Generation failed', variant: 'destructive' });
      }
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Request failed',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const studentHref = (row: MissingMonthlyInvoiceRow) =>
    row.registrationNumber
      ? `/admin/students/${encodeURIComponent(row.registrationNumber)}`
      : null;

  return (
    <div className="space-y-8 pb-12 text-slate-900">
      <Toaster toasts={toasts} removeToast={removeToast} />

      <div className="rounded-[28px] border border-slate-200 bg-linear-to-br from-violet-50/80 via-white to-indigo-50/40 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-xs font-bold text-violet-800">
              <CalendarRange className="h-3.5 w-3.5" />
              Monthly course billing
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Monthly billing hub</h1>
            <p className="text-sm font-medium leading-relaxed text-slate-600">
              Find students who are <strong className="text-slate-800">billable</strong> for a month but are missing
              invoice line items for their courses, then generate only the missing rows or run a full batch.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-11 shrink-0 rounded-xl border-slate-200 bg-white font-bold"
          >
            <Link href="/admin/invoices" className="gap-2">
              View invoices
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Monthly programs', value: monthlyPrograms.length, icon: Sparkles },
          { label: 'Billable this month', value: coverage?.billableCount, icon: CreditCard },
          { label: 'Fully invoiced', value: coverage?.invoicedCount, icon: Info },
          { label: 'Missing invoices', value: coverage?.missingCount, icon: UserX, highlight: (coverage?.missingCount ?? 0) > 0 },
        ].map((card) => (
          <div
            key={card.label}
            className={cn(
              'rounded-2xl border bg-white p-5 shadow-sm',
              card.highlight ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200',
            )}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-indigo-600">
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
            <p className={cn('mt-1 text-2xl font-black', card.highlight ? 'text-amber-700' : 'text-slate-900')}>
              {pageLoading ? '—' : card.value ?? 0}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-black text-slate-900">Run generation</h2>
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Target month</label>
            <MonthPicker value={month} onChange={setMonth} />
          </div>
          <div className="space-y-2 min-w-[200px]">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Branch</label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="h-11 rounded-xl font-medium">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 min-w-[220px]">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Program (optional)</label>
            <Select
              value={programId}
              onValueChange={(value) => {
                setProgramId(value);
                setCourseId('all');
              }}
            >
              <SelectTrigger className="h-11 rounded-xl font-medium">
                <SelectValue placeholder="All monthly programs" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-64">
                <SelectItem value="all">All monthly programs</SelectItem>
                {monthlyPrograms.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 min-w-[220px] flex-1 max-w-md">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Course (optional)</label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="h-11 rounded-xl font-medium">
                <SelectValue placeholder="All monthly courses" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-64">
                <SelectItem value="all">All monthly courses</SelectItem>
                {filteredCourses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl"
              onClick={() => void loadCoverage()}
              disabled={pageLoading}
            >
              <RefreshCw className={cn('h-4 w-4', pageLoading && 'animate-spin')} />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl font-bold"
              onClick={() => void runGenerate({ onlyMissing: true })}
              disabled={generatingMissing || generating || pageLoading || missingStudents.length === 0}
            >
              {generatingMissing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>Generate missing only ({missingStudents.length})</>
              )}
            </Button>
            <Button
              type="button"
              className="h-11 rounded-xl text-white bg-slate-900 px-6 font-bold hover:bg-indigo-600"
              onClick={() => void runGenerate({})}
              disabled={generating || generatingMissing || pageLoading || (coverage?.billableCount ?? 0) === 0}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>Generate all billable ({coverage?.billableCount ?? 0})</>
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs font-medium text-slate-500 leading-relaxed">
          Missing means a billable course line item is absent on a non-cancelled invoice for the selected month.
          Use <strong>Generate missing only</strong> for the students listed below.
        </p>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">Missing invoices</h2>
            {(coverage?.missingCount ?? 0) > 0 ? (
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {coverage?.missingCount} students
              </Badge>
            ) : null}
          </div>
          <span className="text-xs font-bold text-slate-400">
            {month} · live from database
          </span>
        </div>
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          {pageLoading ? (
            <div className="p-16 flex justify-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : missingStudents.length === 0 ? (
            <p className="p-10 text-center text-sm font-medium text-slate-500">
              All billable students have invoice line items for {month}.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold">Student</TableHead>
                  <TableHead className="font-bold">Reg #</TableHead>
                  <TableHead className="font-bold">Mobile</TableHead>
                  <TableHead className="font-bold">Branch</TableHead>
                  <TableHead className="font-bold">Program / Courses</TableHead>
                  <TableHead className="font-bold">Billing start</TableHead>
                  <TableHead className="font-bold">Last invoice</TableHead>
                  <TableHead className="font-bold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missingStudents.map((row) => {
                  const href = studentHref(row);
                  const isGenerating = generatingStudentId === row.studentUserId;
                  return (
                    <TableRow key={row.studentUserId}>
                      <TableCell className="font-medium">
                        {href ? (
                          <Link href={href} className="inline-flex items-center gap-1 hover:text-indigo-600">
                            {row.fullName}
                            <ExternalLink className="h-3 w-3 opacity-40" />
                          </Link>
                        ) : (
                          row.fullName
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {row.registrationNumber ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{row.mobile}</TableCell>
                      <TableCell className="text-xs text-slate-600">{row.branchName}</TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {row.programName} · {row.billableCourseNames.join(', ')}
                      </TableCell>
                      <TableCell className="text-xs">{row.billingStartMonth ?? '—'}</TableCell>
                      <TableCell className="text-xs text-slate-500">{row.lastInvoiceMonth ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg font-bold"
                          disabled={isGenerating || generating || generatingMissing}
                          onClick={() => void runGenerate({ studentUserId: row.studentUserId })}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              Generating…
                            </>
                          ) : (
                            'Generate'
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </section>
    </div>
  );
}
