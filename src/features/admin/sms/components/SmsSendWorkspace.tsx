'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, FileSpreadsheet, Filter, MessageSquare, RotateCcw, Search, Send, Upload, UserRoundCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { getBatches, type Batch } from '@/lib/api/batches';
import type { Branch } from '@/lib/api/branches';
import { getCourses } from '@/lib/api/courses';
import { getPrograms } from '@/lib/api/programs';
import { lookupStudentUser } from '@/lib/api/students';
import {
  dispatchSms,
  previewBulkUpload,
  resolveSmsRecipients,
  type BulkPreview,
  type SmsBalance,
  type SmsRecipient,
  type SmsTemplate,
} from '@/lib/api/sms';
import type { SmsBulkActionsHook } from '../hooks/useSmsManagement';
import { EmptyState, Metric, Panel, smsLengthInfo } from '../sms-shared';
import { SmsComposerPanel, type SmsComposerValue } from './SmsComposerPanel';
import { normalizeBdSmsNumber, validateSmsNumbers } from '../utils/sms-number';

type Actor = { id?: string | null; role?: string | null; branchId?: string | null };
type SendMethod = 'students' | 'bulk' | 'manual' | 'direct';
type Option = { id: string; name: string; programId?: string };
type BranchOption = Pick<Branch, 'id' | 'name'>;

const METHOD_META: Record<SendMethod, { label: string; icon: typeof MessageSquare; context: string; type: string; source: string }> = {
  students: { label: 'Students', icon: UserRoundCheck, context: 'manual_students', type: 'NOTICE', source: 'DIRECT' },
  bulk: { label: 'Bulk Upload', icon: FileSpreadsheet, context: 'bulk_upload', type: 'BULK', source: 'BULK' },
  manual: { label: 'Manual Numbers', icon: MessageSquare, context: 'manual_numbers', type: 'BULK', source: 'BULK' },
  direct: { label: 'Direct SMS', icon: Send, context: 'direct', type: 'DIRECT', source: 'DIRECT' },
};

function renderTemplate(template: string, vars: Record<string, unknown>) {
  return template.replace(/\{\{?\s*([a-zA-Z0-9_]+)\s*\}?\}/g, (_match, key) => {
    const value = vars[key];
    return value == null ? '' : String(value);
  });
}

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
      <div className="flex min-h-10 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <p className="text-xs font-black uppercase tracking-wider text-slate-500">{title}</p>
        <Badge variant="outline" className="text-[10px]">{selected.length} selected</Badge>
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

function queueDisabledReason(args: {
  providerError?: string;
  recipients: number;
  message: string;
  estimatedCostBdt: number;
  availableBalanceBdt?: number;
  scheduledAt?: string;
}) {
  if (args.providerError) return args.providerError;
  if (args.recipients <= 0) return 'Select recipients first';
  if (!args.message.trim()) return 'Write your message';
  if (args.availableBalanceBdt !== undefined && args.estimatedCostBdt > args.availableBalanceBdt) {
    return 'Insufficient balance';
  }
  if (args.scheduledAt && new Date(args.scheduledAt).getTime() <= Date.now()) return 'Invalid schedule time';
  return '';
}

export function SmsSendWorkspace({
  branches,
  bulkState,
  bulkActions,
  directState,
  actor,
  rates,
  templates = [],
  orgBalance,
  branchBalances = [],
  onSuccess,
  focused,
  sendBlockedMessage,
}: {
  branches: BranchOption[];
  bulkState?: SmsBulkActionsHook['bulkState'];
  bulkActions?: SmsBulkActionsHook['bulkActions'];
  directState?: SmsBulkActionsHook['directState'];
  actor?: Actor;
  rates: { maskingRate: number; nonMaskingRate: number };
  templates?: SmsTemplate[];
  orgBalance?: SmsBalance | null;
  branchBalances?: SmsBalance[];
  onSuccess?: () => void;
  sendBlockedMessage?: string;
  focused?: {
    method?: SendMethod;
    recipients: SmsRecipient[];
    contextLabel: string;
    templateKey?: string;
    defaultMessage?: string;
    context?: string;
    type?: string;
    source?: string;
    branchId?: string;
    scope?: 'ORG' | 'BRANCH';
    allowSchedule?: boolean;
    locked?: boolean;
    metadata?: Record<string, unknown>;
    dedupeScope?: { examId?: string; resultBatchId?: string; dueMonth?: string };
  };
}) {
  void bulkState;
  void bulkActions;
  void directState;
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isBranchAdmin = actor?.role === 'BRANCH_ADMIN';
  const queryTab = searchParams.get('tab') as SendMethod | null;
  const queryTemplate = searchParams.get('template') || undefined;
  const [method, setMethod] = useState<SendMethod>(focused?.method || (queryTab && METHOD_META[queryTab] ? queryTab : 'students'));
  const [recipients, setRecipients] = useState<SmsRecipient[]>(focused?.recipients || []);
  const [selectedRecipientKeys, setSelectedRecipientKeys] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [bulkVariables, setBulkVariables] = useState<string[]>([]);
  const [composer, setComposer] = useState<SmsComposerValue>({
    message: focused?.defaultMessage || 'Dear {name}, this is a notice from {institute}.',
    smsType: 'masking',
    campaignName: '',
    templateKey: focused?.templateKey || queryTemplate,
  });
  const handleRecipientsResolved = useCallback((items: SmsRecipient[]) => {
    setRecipients(items);
    setSelectedRecipientKeys([]);
  }, []);

  useEffect(() => {
    if (!focused) return;
    setMethod(focused.method || 'students');
    setRecipients(focused.recipients);
    setComposer((prev) => ({
      ...prev,
      message: focused.defaultMessage || prev.message,
      templateKey: focused.templateKey || prev.templateKey,
    }));
  }, [focused]);

  const pickedRecipients = useMemo(() => {
    if (focused?.locked) return recipients;
    if (!selectedRecipientKeys.length) return recipients;
    const selected = new Set(selectedRecipientKeys);
    return recipients.filter((recipient) => selected.has(recipient.id || recipient.phone));
  }, [focused?.locked, recipients, selectedRecipientKeys]);

  const sampleRecipient = pickedRecipients[0];
  const sampleVars = {
    institute: 'Spondon LMS',
    ...(sampleRecipient?.variables || {}),
    name: sampleRecipient?.name || sampleRecipient?.variables?.name || '',
    phone: sampleRecipient?.phone || '',
  };
  const preview = renderTemplate(composer.message, sampleVars);
  const length = smsLengthInfo(preview || composer.message);
  const smsEach = Math.max(1, length.segments);
  const totalSms = pickedRecipients.length * smsEach;
  const rate = composer.smsType === 'masking' ? rates.maskingRate : rates.nonMaskingRate;
  const estimatedCost = Math.round(totalSms * rate * 100) / 100;
  const scope = focused?.scope || (isBranchAdmin ? 'BRANCH' : 'ORG');
  const branchId = focused?.branchId || (isBranchAdmin ? actor?.branchId || undefined : undefined);
  const selectedBranchBalance = branchId ? branchBalances.find((balance) => balance.branchId === branchId)?.balanceCount : undefined;
  const availableBalance = scope === 'BRANCH' ? selectedBranchBalance : orgBalance?.balanceCount;
  const disabledReason = queueDisabledReason({
    providerError: sendBlockedMessage,
    recipients: pickedRecipients.length,
    message: composer.message,
    estimatedCostBdt: estimatedCost,
    availableBalanceBdt: availableBalance,
    scheduledAt: composer.scheduledAt,
  });

  async function queueSms() {
    if (disabledReason) return;
    setSubmitting(true);
    try {
      const res = await dispatchSms({
        recipients: pickedRecipients,
        message: composer.message.trim(),
        templateKey: composer.templateKey,
        defaultVars: { institute: 'Spondon LMS', maskingRate: rates.maskingRate, nonMaskingRate: rates.nonMaskingRate },
        smsType: composer.smsType,
        context: focused?.context || METHOD_META[method].context,
        type: focused?.type || METHOD_META[method].type,
        source: focused?.source || METHOD_META[method].source,
        scope,
        branchId,
        scheduledAt: composer.scheduledAt,
        campaignName: composer.campaignName || undefined,
        priority: method === 'direct' ? 3 : undefined,
        metadata: focused?.metadata,
        dedupeScope: focused?.dedupeScope,
      });
      toast({
        title: res.message || `${res.data.queuedCount} SMS queued`,
        description: composer.scheduledAt ? `Scheduled for ${new Date(composer.scheduledAt).toLocaleString()}` : `Estimated cost ৳${Number(res.data.estimatedCost ?? estimatedCost).toFixed(2)}`,
      });
      setSelectedRecipientKeys([]);
      if (!focused?.locked) setRecipients([]);
      onSuccess?.();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Failed to queue SMS', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {!focused?.locked ? (
        <Tabs value={method} onValueChange={(value) => setMethod(value as SendMethod)} className="space-y-4">
          <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
            {(Object.keys(METHOD_META) as SendMethod[]).map((key) => {
              const Icon = METHOD_META[key].icon;
              return (
                <TabsTrigger key={key} value={key} className="h-10 flex-none gap-2 px-3 text-xs sm:flex-1 sm:text-sm">
                  <Icon className="h-4 w-4" />
                  {METHOD_META[key].label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,.8fr)]">
            <div className="space-y-4">
              <TabsContent value="students" className="m-0">
                <StudentsMethodPanel branches={branches} actor={actor} onResolved={handleRecipientsResolved} />
              </TabsContent>
              <TabsContent value="bulk" className="m-0">
                <BulkUploadMethodPanel onResolved={handleRecipientsResolved} onVariablesChange={setBulkVariables} />
              </TabsContent>
              <TabsContent value="manual" className="m-0">
                <ManualNumbersMethodPanel onResolved={handleRecipientsResolved} />
              </TabsContent>
              <TabsContent value="direct" className="m-0">
                <DirectMethodPanel branches={branches} actor={actor} onResolved={handleRecipientsResolved} />
              </TabsContent>
              <RecipientPreview recipients={recipients} selected={selectedRecipientKeys} locked={false} onSelectionChange={setSelectedRecipientKeys} />
            </div>
            <div className="space-y-4">
              <SmsComposerPanel
                value={composer}
                onChange={setComposer}
                rates={rates}
                templates={templates}
                allowSchedule={method !== 'direct'}
                lockedTemplateKey={focused?.templateKey}
                variables={method === 'bulk' ? bulkVariables : undefined}
              />
              <RenderedPreview preview={preview} recipient={sampleRecipient} />
            </div>
          </div>
        </Tabs>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)]">
          <div className="space-y-4">
            <Panel title={focused.contextLabel}>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Recipients are locked for this action.</p>
                <p className="mt-1 text-sm text-slate-500">{pickedRecipients.length} resolved recipient{pickedRecipients.length === 1 ? '' : 's'} will receive this SMS.</p>
              </div>
            </Panel>
            <RecipientPreview recipients={recipients} selected={[]} locked onSelectionChange={() => undefined} />
          </div>
          <div className="space-y-4">
            <SmsComposerPanel value={composer} onChange={setComposer} rates={rates} templates={templates} allowSchedule={focused.allowSchedule !== false} lockedTemplateKey={focused.templateKey} />
            <RenderedPreview preview={preview} recipient={sampleRecipient} />
          </div>
        </div>
      )}

      <div className="sticky bottom-0 z-10 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 grid-cols-2 gap-2 text-sm sm:grid-cols-5">
            <SummaryItem label="Method" value={focused?.contextLabel || METHOD_META[method].label} />
            <SummaryItem label="Recipients" value={pickedRecipients.length.toLocaleString()} />
            <SummaryItem label="Total SMS" value={totalSms.toLocaleString()} />
            <SummaryItem label="Est. Cost" value={`৳${estimatedCost.toFixed(2)}`} tone="emerald" />
            <SummaryItem
              label="Balance After"
              value={
                availableBalance === undefined
                  ? '—'
                  : `৳${Math.max(0, availableBalance - estimatedCost).toFixed(2)}`
              }
              tone={availableBalance !== undefined && availableBalance - estimatedCost < 0 ? 'rose' : 'slate'}
            />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button type="button" disabled={!!disabledReason || submitting} onClick={() => void queueSms()} className="h-11 gap-2">
                  <Send className="h-4 w-4" />
                  Queue SMS
                </Button>
              </span>
            </TooltipTrigger>
            {disabledReason ? <TooltipContent>{disabledReason}</TooltipContent> : null}
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'slate' | 'emerald' | 'rose' }) {
  const toneClass = tone === 'emerald' ? 'text-emerald-700' : tone === 'rose' ? 'text-rose-700' : 'text-slate-950';
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 truncate text-sm font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function StudentsMethodPanel({ branches, actor, onResolved }: { branches: BranchOption[]; actor?: Actor; onResolved: (recipients: SmsRecipient[]) => void }) {
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

function ManualNumbersMethodPanel({ onResolved }: { onResolved: (recipients: SmsRecipient[]) => void }) {
  const [value, setValue] = useState('');
  const parsed = useMemo(() => validateSmsNumbers(value), [value]);
  const validKey = parsed.valid.join('|');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const phones = validKey ? validKey.split('|').filter(Boolean) : [];
      onResolved(phones.map((phone) => ({ phone, variables: { phone } })));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [onResolved, validKey]);

  return (
    <Panel title="Manual Numbers">
      <div className="space-y-4">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={9}
          className="resize-y bg-white"
          placeholder={'01711234567\n01811234568, 01911234569\n+8801611234570'}
        />
        <p className="text-xs text-slate-500">Accepts comma, space, or newline separated numbers. Valid numbers are normalized to 8801x format before queueing.</p>
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Valid" value={parsed.valid.length} tone="emerald" />
          <Metric label="Invalid" value={parsed.invalid.length} tone="amber" />
          <Metric label="Duplicate" value={parsed.duplicates.length} tone="slate" />
        </div>
        {parsed.invalid.length ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
            <p className="text-xs font-bold uppercase text-rose-700">Invalid numbers</p>
            <p className="mt-2 text-sm text-rose-700">{parsed.invalid.slice(0, 20).join(', ')}</p>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function BulkUploadMethodPanel({
  onResolved,
  onVariablesChange,
}: {
  onResolved: (recipients: SmsRecipient[]) => void;
  onVariablesChange: (variables: string[]) => void;
}) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [mobileColumn, setMobileColumn] = useState('');
  const [nameColumn, setNameColumn] = useState('');
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [preview, setPreview] = useState<BulkPreview | null>(null);
  const [loading, setLoading] = useState(false);

  function applyMappedRecipients(nextPreview = preview, variables = selectedVariables, nextNameColumn = nameColumn) {
    if (!nextPreview?.validRecipients?.length) {
      onResolved([]);
      onVariablesChange([]);
      return;
    }
    onVariablesChange(nextNameColumn ? [...new Set(['name', ...variables])] : variables);
    onResolved(nextPreview.validRecipients.map((recipient) => {
      const rowVars = recipient.variables || {};
      const pickedVars = variables.reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = rowVars[key];
        return acc;
      }, {});
      const displayName = nextNameColumn ? String(rowVars[nextNameColumn] || '') : recipient.name || '';
      return {
        ...recipient,
        name: displayName || recipient.name,
        variables: {
          ...pickedVars,
          ...(displayName ? { name: displayName } : {}),
          phone: recipient.phone,
        },
      };
    }));
  }

  async function previewFile(column?: string) {
    if (!file) {
      toast({ title: 'Select a CSV or Excel file first', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await previewBulkUpload(file, column || mobileColumn || undefined);
      if (!res.success) throw new Error(res.message || 'Could not preview file');
      setPreview(res.data);
      setMobileColumn(res.data.mobileColumn || column || mobileColumn);
      setNameColumn('');
      setSelectedVariables([]);
      onVariablesChange([]);
      onResolved((res.data.validRecipients || res.data.valid.map((phone) => ({ phone, variables: { phone } }))).map((recipient) => ({
        phone: recipient.phone,
        variables: { phone: recipient.phone },
      })));
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Could not preview file', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function downloadErrors() {
    if (!preview) return;
    const rows = ['type,value', ...preview.invalid.map((item) => `invalid,${JSON.stringify(item)}`), ...preview.duplicates.map((item) => `duplicate,${JSON.stringify(item)}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sms-upload-errors.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Panel title="Bulk Upload">
      <div className="space-y-4">
        <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:bg-slate-100">
          <Upload className="h-9 w-9 text-blue-600" />
          <span className="mt-3 text-sm font-semibold text-slate-900">{file ? file.name : 'Drag file or click to browse'}</span>
          <span className="mt-1 text-xs text-slate-500">Supports .csv .xlsx .xls</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            onChange={(event) => {
              const next = event.target.files?.[0] || null;
              setFile(next);
              setPreview(null);
              setMobileColumn('');
              setNameColumn('');
              setSelectedVariables([]);
              onVariablesChange([]);
              onResolved([]);
            }}
          />
        </label>
        <div className="flex flex-wrap items-end gap-3">
          {preview?.columns?.length ? (
            <div className="min-w-56">
              <Label>Mobile Column</Label>
              <Select value={mobileColumn || preview.mobileColumn || preview.columns[0]} onValueChange={(column) => { setMobileColumn(column); void previewFile(column); }}>
                <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {preview.columns.map((column) => <SelectItem key={column} value={column}>{column}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <Button type="button" onClick={() => void previewFile()} disabled={loading || !file} className="gap-2">
            {loading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Preview & Validate
          </Button>
          <Button type="button" variant="outline" disabled={!preview || (!preview.invalid.length && !preview.duplicates.length)} onClick={downloadErrors}>
            Download error report
          </Button>
        </div>
        {preview ? (
          <div className="space-y-3">
            {preview.columns?.length ? (
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Name Column (optional)</Label>
                    <Select
                      value={nameColumn || 'none'}
                      onValueChange={(value) => {
                        const next = value === 'none' ? '' : value;
                        setNameColumn(next);
                        applyMappedRecipients(preview, selectedVariables, next);
                      }}
                    >
                      <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No name column</SelectItem>
                        {preview.columns.map((column) => <SelectItem key={column} value={column}>{column}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">Message Variables</p>
                    <p className="mt-1 text-xs text-slate-500">Select Excel columns to expose as composer chips.</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {preview.columns.filter((column) => column !== (mobileColumn || preview.mobileColumn)).map((column) => (
                    <label key={column} className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                      <Checkbox
                        checked={selectedVariables.includes(column)}
                        onCheckedChange={() => {
                          const next = selectedVariables.includes(column)
                            ? selectedVariables.filter((item) => item !== column)
                            : [...selectedVariables, column];
                          setSelectedVariables(next);
                          applyMappedRecipients(preview, next, nameColumn);
                        }}
                      />
                      <span className="truncate font-semibold text-slate-700">{`{${column}}`}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Valid" value={preview.validCount} tone="emerald" />
              <Metric label="Invalid" value={preview.invalidCount} tone="amber" />
              <Metric label="Duplicate" value={preview.duplicateCount} tone="slate" />
            </div>
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    {(preview.columns || []).slice(0, 6).map((column) => <th key={column} className="px-3 py-2 text-left">{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(preview.sampleRows || []).slice(0, 10).map((row, index) => (
                    <tr key={index} className="border-t border-slate-100">
                      {(preview.columns || []).slice(0, 6).map((column) => <td key={column} className="px-3 py-2 text-slate-700">{String(row[column] ?? '')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState>Upload a file and preview it to validate mobile numbers before queueing.</EmptyState>
        )}
      </div>
    </Panel>
  );
}

function DirectMethodPanel({ branches, actor, onResolved }: { branches: BranchOption[]; actor?: Actor; onResolved: (recipients: SmsRecipient[]) => void }) {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [rawNumber, setRawNumber] = useState('');
  const [branchId, setBranchId] = useState(actor?.branchId || '');
  const isBranchAdmin = actor?.role === 'BRANCH_ADMIN';

  async function searchStudent() {
    if (!query.trim()) return;
    try {
      const res = await lookupStudentUser(query);
      if (!res.success || !res.data) throw new Error(res.message || 'Student not found');
      onResolved([{
        id: res.data.id,
        name: res.data.fullName,
        phone: normalizeBdSmsNumber(res.data.mobile) || res.data.mobile,
        variables: { name: res.data.fullName, phone: res.data.mobile, roll: res.data.registrationNumber || '' },
      }]);
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Student not found', variant: 'destructive' });
    }
  }

  function useRawNumber() {
    const normalized = normalizeBdSmsNumber(rawNumber);
    if (!normalized) {
      toast({ title: 'Enter a valid BD mobile number', variant: 'destructive' });
      return;
    }
    onResolved([{ phone: normalized, branchId: isBranchAdmin ? actor?.branchId || undefined : branchId || undefined, variables: { phone: normalized } }]);
  }

  return (
    <Panel title="Direct SMS">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div>
            <Label>Search by name / roll / mobile</Label>
            <div className="mt-1 flex gap-2">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student" className="bg-white" />
              <Button type="button" variant="outline" onClick={() => void searchStudent()} aria-label="Search student">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {!isBranchAdmin ? (
            <div>
              <Label>Balance branch</Label>
              <Select value={branchId || 'org'} onValueChange={(value) => setBranchId(value === 'org' ? '' : value)}>
                <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="org">Central balance</SelectItem>
                  {branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
        <div className="space-y-3">
          <div>
            <Label>Or raw number</Label>
            <Input value={rawNumber} onChange={(event) => setRawNumber(event.target.value)} placeholder="01711xxxxxx" className="mt-1 bg-white" />
          </div>
          <Button type="button" onClick={useRawNumber} className="gap-2">
            <Send className="h-4 w-4" />
            Use this recipient
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function RecipientPreview({
  recipients,
  selected,
  locked,
  onSelectionChange,
}: {
  recipients: SmsRecipient[];
  selected: string[];
  locked: boolean;
  onSelectionChange: (ids: string[]) => void;
}) {
  const allSelected = recipients.length > 0 && selected.length === recipients.length;
  return (
    <Panel title="Recipients">
      {recipients.length ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800">
              {selected.length ? selected.length : recipients.length} selected from {recipients.length}
            </p>
            {!locked ? (
              <Button type="button" variant="outline" size="sm" onClick={() => onSelectionChange(allSelected ? [] : recipients.map((recipient) => recipient.id || recipient.phone))}>
                {allSelected ? 'Deselect All' : 'Select All'}
              </Button>
            ) : null}
          </div>
          <div className="max-h-72 overflow-auto rounded-md border border-slate-200">
            {recipients.slice(0, 150).map((recipient, index) => {
              const key = recipient.id || recipient.phone || String(index);
              const checked = locked || !selected.length || selected.includes(key);
              return (
                <label key={`${key}-${index}`} className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-0 hover:bg-slate-50">
                  <span className="flex min-w-0 items-center gap-2">
                    {!locked ? (
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => onSelectionChange(selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key])}
                      />
                    ) : null}
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-slate-800">{String(recipient.name || recipient.variables?.name || 'Recipient')}</span>
                      <span className="block truncate text-xs text-slate-500">{String(recipient.variables?.roll || recipient.variables?.course || '')}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-slate-500">{recipient.phone}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState>Resolve or enter recipients to preview the final audience.</EmptyState>
      )}
    </Panel>
  );
}

function RenderedPreview({ preview, recipient }: { preview: string; recipient?: SmsRecipient }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-950">Message Preview</h2>
        {recipient ? <span className="truncate text-xs text-slate-500">{recipient.name || recipient.phone}</span> : null}
      </div>
      <div className="p-4">
        {preview ? (
          <p className="min-h-28 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800">{preview}</p>
        ) : (
          <div className="flex min-h-28 items-center gap-2 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
            <AlertCircle className="h-4 w-4" />
            Message preview will appear here.
          </div>
        )}
      </div>
    </section>
  );
}
