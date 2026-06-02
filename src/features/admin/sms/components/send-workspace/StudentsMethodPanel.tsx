'use client';

import { useEffect, useState } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getBatches, type Batch } from '@/lib/api/batches';
import { getCourses } from '@/lib/api/courses';
import { getPrograms } from '@/lib/api/programs';
import { resolveSmsRecipients, type SmsRecipient } from '@/lib/api/sms';
import { Panel } from '../../sms-shared';
import { ToggleList } from './ToggleList';
import type { Actor, BranchOption, Option } from './types';

export function StudentsMethodPanel({ branches, actor, onResolved }: { branches: BranchOption[]; actor?: Actor; onResolved: (recipients: SmsRecipient[]) => void }) {
  const { toast } = useToast();
  const isBranchAdmin = actor?.role === 'BRANCH_ADMIN';
  const [programs, setPrograms] = useState<Option[]>([]);
  const [courses, setCourses] = useState<Option[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [branchId, setBranchId] = useState(actor?.branchId || '');
  const [programId, setProgramId] = useState('');
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [status, setStatus] = useState('ACTIVE');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      getPrograms(),
      getCourses({ all: true, status: 'ACTIVE' }),
    ]).then(([programRes, courseRes]) => {
      if (programRes.success) setPrograms((programRes.data || []).map((program) => ({ id: program.id, name: program.name })));
      if (courseRes.success) setCourses((courseRes.data || []).map((course) => ({ id: course.id, name: course.name, programId: course.programId })));
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

  const filteredCourses = courses.filter((course) => !programId || course.programId === programId);
  const batchOptions = batches
    .filter((batch) => !courseIds.length || courseIds.includes(batch.courseId))
    .map((batch) => ({ id: batch.id, name: `${batch.name}${batch.course?.name ? ` (${batch.course.name})` : ''}` }));

  async function resolve() {
    setLoading(true);
    try {
      const res = await resolveSmsRecipients({
        branchId: isBranchAdmin ? actor?.branchId || undefined : branchId || undefined,
        programId: programId || undefined,
        courseIds,
        batchIds,
        status,
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
        <div className="grid gap-3 lg:grid-cols-5">
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
                {programs.map((program) => <SelectItem key={program.id} value={program.id}>{program.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ALL">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={() => void resolve()} disabled={loading || (!branchId && isBranchAdmin && !actor?.branchId)} className="w-full gap-2">
              {loading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
              Resolve
            </Button>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <ToggleList title="Courses" options={filteredCourses} selected={courseIds} onToggle={(id) => setCourseIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])} />
          <ToggleList title="Batches" options={batchOptions} selected={batchIds} onToggle={(id) => setBatchIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])} />
        </div>
      </div>
    </Panel>
  );
}
