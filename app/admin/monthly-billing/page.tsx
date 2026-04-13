'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getCourses } from '@/lib/api/courses';
import { getEnrollments } from '@/lib/api/enrollments';
import { getBranches } from '@/lib/api/branches';
import { generateMonthlyInvoices } from '@/lib/api/invoices';
import type { Branch } from '@/lib/api/branches';
import type { Course } from '@/types/course';
import type { Enrollment } from '@/lib/api/enrollments';
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
  CalendarRange,
  ChevronRight,
  CreditCard,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MonthlyBillingPage() {
  const { toast, toasts, removeToast } = useToast();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [branchId, setBranchId] = useState<string>('all');
  const [courseId, setCourseId] = useState<string>('all');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [monthlyCourses, setMonthlyCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [brRes, cRes, eRes] = await Promise.all([
        getBranches(),
        getCourses({ status: 'ACTIVE', limit: 200 }),
        getEnrollments({ status: 'ACTIVE', limit: 500 }),
      ]);
      if (brRes.success && brRes.data) setBranches(brRes.data);
      if (cRes.success && cRes.data) setMonthlyCourses(cRes.data);
      if (eRes.success && eRes.data) setEnrollments(eRes.data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load billing data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const monthlyEnrollments = enrollments.filter((e) => e.billingType === 'MONTHLY');
  const filteredPreview = monthlyEnrollments.filter((e) => {
    if (branchId !== 'all' && e.branchId !== branchId) return false;
    if (courseId !== 'all' && e.courseId !== courseId) return false;
    if (e.billingStartMonth && e.billingStartMonth > month) return false;
    return true;
  });

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const body: { month: string; branchId?: string; courseId?: string } = { month };
      if (branchId !== 'all') body.branchId = branchId;
      if (courseId !== 'all') body.courseId = courseId;
      const res = await generateMonthlyInvoices(body);
      if (res.success && res.data) {
        const d = res.data;
        toast({
          title: 'Invoices generated',
          description: `${d.invoicesCreated} created · ${d.skipped} skipped for ${d.month}.`,
          variant: 'success',
        });
        if (d.errors?.length) {
          toast({
            title: 'Some enrollments failed',
            description: d.errors.slice(0, 4).join(' · '),
            variant: 'destructive',
          });
        }
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
      setGenerating(false);
    }
  };

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
              Generate recurring invoices for all <strong className="text-slate-800">active</strong> enrollments in courses
              marked <Badge className="mx-0.5 bg-violet-600">MONTHLY</Badge>. Students are skipped until their{' '}
              <strong className="text-slate-800">billing start month</strong>; existing invoices for the same course and month
              are never duplicated.
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

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Monthly courses (active)', value: monthlyCourses.length, icon: Sparkles },
          { label: 'Active monthly enrollments', value: monthlyEnrollments.length, icon: CreditCard },
          { label: 'Eligible this run (preview)', value: filteredPreview.length, icon: Info },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-indigo-600">
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {loading ? '—' : card.value}
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
          <div className="space-y-2 min-w-[220px] flex-1 max-w-md">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Course (optional)</label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="h-11 rounded-xl font-medium">
                <SelectValue placeholder="All monthly courses" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-64">
                <SelectItem value="all">All monthly courses</SelectItem>
                {monthlyCourses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.slug} · {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
            <Button
              type="button"
              className="h-11 rounded-xl text-white bg-slate-900 px-6 font-bold hover:bg-indigo-600"
              onClick={handleGenerate}
              disabled={generating || loading}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
               
                  Generate invoices
                </>
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs font-medium text-slate-500 leading-relaxed">
          Discounts and scholarships from the benefits module are applied per student when invoices are created. Use{' '}
          <Link href="/admin/enrollments" className="font-bold text-indigo-600 hover:underline">
            Enrollments
          </Link>{' '}
          to set or fix billing start months.
        </p>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between gap-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">Preview (eligible rows)</h2>
          <span className="text-xs font-bold text-slate-400">{filteredPreview.length} enrollments</span>
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          {loading ? (
            <div className="p-16 flex justify-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredPreview.length === 0 ? (
            <p className="p-10 text-center text-sm font-medium text-slate-500">
              No active monthly enrollments match these filters for {month}, or billing has not started yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold">Student</TableHead>
                  <TableHead className="font-bold">Course</TableHead>
                  <TableHead className="font-bold">Branch</TableHead>
                  <TableHead className="font-bold">Billing start</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPreview.slice(0, 80).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.student?.fullName ?? '—'}</TableCell>
                    <TableCell className="text-slate-600">
                      {e.course?.slug} · {e.course?.name}
                    </TableCell>
                    <TableCell className="text-slate-600">{e.branch?.name ?? '—'}</TableCell>
                    <TableCell>{e.billingStartMonth || <span className="text-slate-400">Any month</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        {filteredPreview.length > 80 && (
          <p className="px-6 py-3 text-xs font-medium text-slate-500 border-t border-slate-100">
            Showing first 80 rows. Generation still processes all matching enrollments on the server.
          </p>
        )}
      </section>
    </div>
  );
}
