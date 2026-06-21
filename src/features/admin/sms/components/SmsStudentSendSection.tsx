'use client';

import { useEffect, useMemo, useState } from 'react';
import { Filter, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getBatches, type Batch } from '@/lib/api/batches';
import { getCourses } from '@/lib/api/courses';
import { resolveSmsRecipients, type SmsRecipient } from '@/lib/api/sms';
import type { Branch } from '@/lib/api/branches';
import { Panel, smsLengthInfoForTemplate } from '../sms-shared';
import { SmsSendDrawer } from './SmsSendDrawer';

type Actor = { role?: string | null; branchId?: string | null };
type Option = { id: string; name: string };

function ToggleList({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: Option[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-3 py-2">
        <p className="text-xs font-black uppercase tracking-wider text-slate-500">{title}</p>
      </div>
      <div className="max-h-52 space-y-1 overflow-auto p-2">
        {options.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-slate-400">No options found.</p>
        ) : options.map((option) => (
          <label key={option.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-50">
            <Checkbox checked={selected.includes(option.id)} onCheckedChange={() => onToggle(option.id)} />
            <span className="font-medium text-slate-700">{option.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function SmsStudentSendSection({
  branches,
  actor,
  rates,
  onSuccess,
}: {
  branches: Branch[];
  actor?: Actor;
  rates: { maskingRate: number; nonMaskingRate: number };
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const isSuperAdmin = actor?.role === 'SUPER_ADMIN';
  const [courses, setCourses] = useState<Option[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [branchId, setBranchId] = useState(actor?.branchId || '');
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [recipients, setRecipients] = useState<SmsRecipient[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    getCourses({ all: true, status: 'ACTIVE' }).then((res) => {
      if (res.success) setCourses((res.data || []).map((course) => ({ id: course.id, name: course.name })));
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const selectedBranchId = isSuperAdmin ? branchId : actor?.branchId || '';
    const courseId = courseIds[0];
    getBatches({ all: true, status: 'ACTIVE', ...(selectedBranchId ? { branchId: selectedBranchId } : {}), ...(courseId ? { courseId } : {}) })
      .then((res) => {
        if (res.success) setBatches(res.data || []);
      })
      .catch(() => undefined);
  }, [actor?.branchId, branchId, courseIds, isSuperAdmin]);

  async function loadRecipients() {
    setLoading(true);
    try {
      const res = await resolveSmsRecipients({
        branchId: isSuperAdmin ? branchId || undefined : actor?.branchId || undefined,
        courseIds,
        batchIds,
        studentIds: selectedStudentIds.length ? selectedStudentIds : undefined,
      });
      setRecipients(res.data.recipients || []);
      setSelectedStudentIds([]);
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Failed to resolve recipients', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const pickedRecipients = useMemo(() => {
    if (!selectedStudentIds.length) return recipients;
    return recipients.filter((recipient) => recipient.id && selectedStudentIds.includes(recipient.id));
  }, [recipients, selectedStudentIds]);

  const defaultMessage = '{name}, notice from {institute}.';
  const parts = smsLengthInfoForTemplate(defaultMessage).segments || 1;
  const estimatedCost = Math.round(pickedRecipients.length * parts * rates.maskingRate * 100) / 100;

  const batchOptions = batches
    .filter((batch) => !courseIds.length || courseIds.includes(batch.courseId))
    .map((batch) => ({ id: batch.id, name: `${batch.name}${batch.course?.name ? ` (${batch.course.name})` : ''}` }));

  return (
    <Panel title="Send to Students">
      <div className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-4">
          {isSuperAdmin ? (
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
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Recipients</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{pickedRecipients.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Estimated Cost</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">৳{estimatedCost.toFixed(2)}</p>
          </div>
          <div className="flex items-end gap-2">
            <Button type="button" variant="outline" onClick={() => void loadRecipients()} disabled={loading} className="gap-2">
              <Filter className="h-4 w-4" /> Resolve
            </Button>
            <Button type="button" onClick={() => setDrawerOpen(true)} disabled={!pickedRecipients.length} className="gap-2">
              <Send className="h-4 w-4" /> Send
            </Button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <ToggleList
            title="Courses"
            options={courses}
            selected={courseIds}
            onToggle={(id) => setCourseIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])}
          />
          <ToggleList
            title="Batches"
            options={batchOptions}
            selected={batchIds}
            onToggle={(id) => setBatchIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])}
          />
        </div>

        <div className="rounded-lg border border-slate-200">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Optional Student Pick</p>
          </div>
          <div className="max-h-64 overflow-auto p-2">
            {recipients.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-slate-400">Resolve recipients to cherry-pick individual students.</p>
            ) : recipients.map((recipient) => (
              <label key={recipient.id || recipient.phone} className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-slate-50">
                <span className="flex items-center gap-2">
                  <Checkbox
                    checked={!!recipient.id && selectedStudentIds.includes(recipient.id)}
                    onCheckedChange={() => {
                      if (!recipient.id) return;
                      setSelectedStudentIds((prev) => prev.includes(recipient.id!) ? prev.filter((id) => id !== recipient.id) : [...prev, recipient.id!]);
                    }}
                  />
                  <span className="font-semibold text-slate-800">{recipient.name}</span>
                </span>
                <span className="text-xs text-slate-500">{recipient.phone}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <SmsSendDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        recipients={pickedRecipients}
        defaultMessage={defaultMessage}
        defaultVars={{ institute: 'Spondon LMS', maskingRate: rates.maskingRate, nonMaskingRate: rates.nonMaskingRate }}
        contextLabel="Student SMS"
        context="manual"
        branchId={isSuperAdmin ? branchId || undefined : actor?.branchId || undefined}
        scope={isSuperAdmin && !branchId ? 'ORG' : 'BRANCH'}
        onSuccess={onSuccess}
      />
    </Panel>
  );
}
