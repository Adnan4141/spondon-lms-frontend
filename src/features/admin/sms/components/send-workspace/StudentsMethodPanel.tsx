'use client';

import { useEffect, useMemo, useState } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { buildMonthOptions, currentMonth, formatMonthLabel } from '@/features/admin/attendance/attendance-utils';
import { getBatches, type Batch } from '@/lib/api/batches';
import { getCourses } from '@/lib/api/courses';
import { getPrograms } from '@/lib/api/programs';
import { resolveSmsRecipients, type SmsRecipient } from '@/lib/api/sms';
import { Panel } from '../../sms-shared';
import { ToggleList } from './ToggleList';
import type { Actor, BranchOption, Option } from './types';

type ProgramOption = Option & { paymentCircle?: 'MONTHLY' | 'ONE_TIME' };
type CourseOption = Option & { programId: string; startMonth?: string | null; endMonth?: string | null };

function isProgramMonthly(programs: ProgramOption[], programId: string): boolean {
  return programs.find((p) => p.id === programId)?.paymentCircle === 'MONTHLY';
}

export function StudentsMethodPanel({ branches, actor, onResolved }: { branches: BranchOption[]; actor?: Actor; onResolved: (recipients: SmsRecipient[]) => void }) {
  const { toast } = useToast();
  const isBranchAdmin = actor?.role === 'BRANCH_ADMIN';
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [branchId, setBranchId] = useState(actor?.branchId || '');
  const [programId, setProgramId] = useState('');
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [status, setStatus] = useState('ACTIVE');
  const [month, setMonth] = useState('');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      getPrograms(),
      getCourses({ all: true, status: 'ACTIVE' }),
    ]).then(([programRes, courseRes]) => {
      if (programRes.success) {
        setPrograms((programRes.data || []).map((program) => ({
          id: program.id,
          name: program.name,
          paymentCircle: program.paymentCircle,
        })));
      }
      if (courseRes.success) {
        setCourses((courseRes.data || []).map((course) => ({
          id: course.id,
          name: course.name,
          programId: course.programId,
          startMonth: course.startMonth,
          endMonth: course.endMonth,
        })));
      }
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const selectedBranchId = isBranchAdmin ? actor?.branchId || '' : branchId;
    getBatches({
      all: true,
      status: status === 'ACTIVE' ? 'ACTIVE' : undefined,
      ...(programId ? { programId } : {}),
      ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
    }).then((res) => {
      if (res.success) setBatches(res.data || []);
    }).catch(() => undefined);
  }, [actor?.branchId, branchId, isBranchAdmin, programId, status]);

  const isMonthlyContext = useMemo(() => {
    if (programId && isProgramMonthly(programs, programId)) return true;
    if (courseIds.length) {
      return courseIds.some((id) => {
        const course = courses.find((c) => c.id === id);
        if (!course) return false;
        return isProgramMonthly(programs, course.programId);
      });
    }
    return false;
  }, [programId, courseIds, programs, courses]);

  useEffect(() => {
    if (isMonthlyContext) {
      setMonth((prev) => prev || currentMonth());
    } else {
      setMonth('');
      setShowMonthPicker(false);
    }
  }, [isMonthlyContext]);

  const monthOptions = useMemo(() => {
    const selectedCourses = courses.filter((c) => courseIds.includes(c.id));
    if (selectedCourses.length > 0) {
      const withBounds = selectedCourses.filter((c) => c.startMonth || c.endMonth);
      if (withBounds.length > 0) {
        const startMonth = withBounds.reduce(
          (min, c) => (!min || (c.startMonth && c.startMonth < min) ? c.startMonth! : min),
          withBounds[0].startMonth as string | undefined,
        );
        const endMonth = withBounds.reduce(
          (max, c) => (!max || (c.endMonth && c.endMonth > max) ? c.endMonth! : max),
          withBounds[0].endMonth as string | undefined,
        );
        return buildMonthOptions({ startMonth, endMonth });
      }
    }
    if (programId) {
      const programCourses = courses.filter((c) => c.programId === programId);
      const withBounds = programCourses.filter((c) => c.startMonth || c.endMonth);
      if (withBounds.length > 0) {
        const startMonth = withBounds.reduce(
          (min, c) => (!min || (c.startMonth && c.startMonth < min) ? c.startMonth! : min),
          withBounds[0].startMonth as string | undefined,
        );
        const endMonth = withBounds.reduce(
          (max, c) => (!max || (c.endMonth && c.endMonth > max) ? c.endMonth! : max),
          withBounds[0].endMonth as string | undefined,
        );
        return buildMonthOptions({ startMonth, endMonth });
      }
    }
    return buildMonthOptions();
  }, [courses, courseIds, programId]);

  const filteredCourses = useMemo(() => {
    let list = courses.filter((course) => !programId || course.programId === programId);
    if (isMonthlyContext && month) {
      list = list.filter((course) => {
        if (!course.startMonth && !course.endMonth) return true;
        if (course.startMonth && course.startMonth > month) return false;
        if (course.endMonth && course.endMonth < month) return false;
        return true;
      });
    }
    return list;
  }, [courses, programId, isMonthlyContext, month]);
  const batchOptions = batches
    .filter((batch) => !courseIds.length || courseIds.includes(batch.courseId))
    .map((batch) => ({ id: batch.id, name: `${batch.name}${batch.course?.name ? ` (${batch.course.name})` : ''}` }));

  async function resolve() {
    if (isMonthlyContext && !month) {
      toast({ title: 'Select active month for monthly program', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await resolveSmsRecipients({
        branchId: isBranchAdmin ? actor?.branchId || undefined : branchId || undefined,
        programId: programId || undefined,
        courseIds,
        batchIds,
        status,
        month: month || undefined,
      });
      onResolved(res.data.recipients || []);
      toast({ title: `${res.data.count || res.data.recipients.length} recipients resolved` });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Failed to resolve recipients', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel title="Students">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {!isBranchAdmin ? (
            <div>
              <Label>Branch</Label>
              <Select value={branchId || 'all'} onValueChange={(value) => setBranchId(value === 'all' ? '' : value)}>
                <SelectTrigger className="mt-1 bg-white"><SelectValue placeholder="All branches" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div>
            <Label>Program</Label>
            <Select value={programId || 'all'} onValueChange={(value) => { setProgramId(value === 'all' ? '' : value); setCourseIds([]); setBatchIds([]); }}>
              <SelectTrigger className="mt-1 bg-white"><SelectValue placeholder="All programs" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programs</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}{program.paymentCircle === 'MONTHLY' ? ' · Monthly' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="BLOCKED">Inactive</SelectItem>
                <SelectItem value="ALL">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={`flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${isMonthlyContext ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-slate-50/40'}`}>
          <div className="min-w-0 flex-1 space-y-2">
            {isMonthlyContext ? (
              <>
                <p className="text-sm text-amber-900">
                  Monthly billing — recipients active in{' '}
                  <span className="font-semibold">{formatMonthLabel(month || currentMonth())}</span>
                  {!showMonthPicker ? (
                    <button
                      type="button"
                      className="ml-2 text-xs font-medium text-amber-800 underline underline-offset-2 hover:text-amber-950"
                      onClick={() => setShowMonthPicker(true)}
                    >
                      Change month
                    </button>
                  ) : null}
                </p>
                {showMonthPicker ? (
                  <div className="max-w-xs">
                    <Label className="text-xs text-amber-800">Select month</Label>
                    <Select
                      value={month || currentMonth()}
                      onValueChange={(value) => {
                        setMonth(value);
                        setCourseIds([]);
                        setBatchIds([]);
                      }}
                    >
                      <SelectTrigger className="mt-1 bg-white">
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-slate-600">
                Resolve currently active students by branch, program, course, and batch.
              </p>
            )}
          </div>
          <Button
            type="button"
            onClick={() => void resolve()}
            disabled={loading || (isBranchAdmin && !actor?.branchId)}
            className="w-full shrink-0 gap-2 sm:w-auto"
          >
            {loading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
            Resolve
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <ToggleList title="Courses" options={filteredCourses} selected={courseIds} onToggle={(id) => setCourseIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])} />
          <ToggleList title="Batches" options={batchOptions} selected={batchIds} onToggle={(id) => setBatchIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])} />
        </div>
      </div>
    </Panel>
  );
}
