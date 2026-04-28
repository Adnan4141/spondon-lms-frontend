'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Bell, FileSpreadsheet, History, RefreshCw, Save, Send, Settings, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getBranches, type Branch } from '@/lib/api/branches';
import {
  BulkPreview,
  SmsBalance,
  SmsConfig,
  SmsLog,
  SmsProviderBalance,
  SmsQueueItem,
  SmsReportRow,
  SmsSystemSetting,
  SmsTemplate,
  createSmsTemplate,
  getProviderBalance,
  getSmsBalance,
  getSmsConfig,
  getSmsLogs,
  getSmsQueue,
  getSmsReportBatch,
  getSmsReportBranch,
  getSmsReportDue,
  getSmsReportPayment,
  getSmsReportProgram,
  getSmsReportResult,
  getSmsReportSummary,
  getSmsReportType,
  getSmsSystemSettings,
  getSmsTemplates,
  previewBulkManual,
  previewBulkUpload,
  queueDueReminders,
  saveSmsSystemSetting,
  sendBulkManual,
  sendBulkUpload,
  sendDirectSms,
  transferSmsBalance,
  updateSmsBalance,
  updateSmsTemplate,
  upsertSmsConfig,
} from '@/lib/api/sms';
import { getSmsPricing, getSmsTransactions, initiateSmsPurchase, type SmsPricing } from '@/lib/api/sms-purchase';

const systemTypes = ['OTP', 'PAYMENT_CONFIRMATION', 'DUE_REMINDER', 'BIRTHDAY', 'RESULT', 'ENROLLMENT_NOTICE'];

const smsTypeLabels: Record<string, string> = {
  OTP: 'OTP SMS',
  PAYMENT_CONFIRMATION: 'Payment SMS',
  DUE_REMINDER: 'Due SMS',
  BIRTHDAY: 'Birthday SMS',
  RESULT: 'Result SMS',
  ENROLLMENT_NOTICE: 'Enrollment SMS',
};

const tabItems = [
  { value: 'overview', label: 'Overview', icon: Activity },
  { value: 'system', label: 'System SMS', icon: Bell },
  { value: 'bulk', label: 'Bulk SMS', icon: FileSpreadsheet },
  { value: 'templates', label: 'Templates', icon: Save },
  { value: 'balances', label: 'Balances', icon: Wallet },
  { value: 'reports', label: 'Reports', icon: History },
  { value: 'gateway', label: 'Gateway', icon: Settings },
];

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

function smsLengthInfo(value: string) {
  const hasUnicode = /[^\x00-\x7F]/.test(value);
  const singleLimit = hasUnicode ? 70 : 160;
  const multiLimit = hasUnicode ? 67 : 153;
  const length = value.length;
  const segments = length <= singleLimit ? (length ? 1 : 0) : Math.ceil(length / multiLimit);
  return { length, segments, encoding: hasUnicode ? 'Unicode' : 'GSM' };
}

function Panel({
  title,
  children,
  action,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white ${className}`}>
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Metric({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'emerald' | 'blue' | 'amber' | 'slate' }) {
  const toneClass = {
    emerald: 'text-emerald-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    slate: 'text-slate-900',
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">{children}</p>;
}

function SmsComposer({
  label,
  value,
  onChange,
  rows = 5,
  variables = ['{{name}}', '{{amount}}', '{{month}}', '{{otp}}', '{{program}}', '{{courses}}', '{{exam}}'],
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  variables?: string[];
}) {
  const info = smsLengthInfo(value);

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <Label>{label}</Label>
        <span className="text-xs font-semibold text-slate-500">
          {info.length} chars · {info.segments} segment{info.segments === 1 ? '' : 's'} · {info.encoding}
        </span>
      </div>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} className="resize-y bg-white" />
      <div className="flex flex-wrap gap-2">
        {variables.map((variable) => (
          <button
            key={variable}
            type="button"
            onClick={() => onChange(`${value}${value && !value.endsWith(' ') ? ' ' : ''}${variable}`)}
            className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            {variable}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SmsManagementPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [balances, setBalances] = useState<SmsBalance[]>([]);
  const [settings, setSettings] = useState<SmsSystemSetting[]>([]);
  const [config, setConfig] = useState<Partial<SmsConfig>>({ provider: 'BulkSMSBD', isActive: true });
  const [providerBalance, setProviderBalance] = useState<SmsProviderBalance | null>(null);
  const [providerBalanceError, setProviderBalanceError] = useState('');
  const [queue, setQueue] = useState<{ summary: Record<string, number>; items: SmsQueueItem[] }>({ summary: {}, items: [] });
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [typeReport, setTypeReport] = useState<SmsReportRow[]>([]);
  const [branchReport, setBranchReport] = useState<SmsReportRow[]>([]);
  const [programReport, setProgramReport] = useState<SmsReportRow[]>([]);
  const [batchReport, setBatchReport] = useState<SmsReportRow[]>([]);
  const [dueReport, setDueReport] = useState<SmsLog[]>([]);
  const [paymentReport, setPaymentReport] = useState<SmsLog[]>([]);
  const [resultReport, setResultReport] = useState<SmsLog[]>([]);
  const [smsPricing, setSmsPricing] = useState<SmsPricing>({ pricePerSms: 0.5, minPurchase: 100 });
  const [smsTransactions, setSmsTransactions] = useState<Array<{ id: string; quantity: number; status: string; totalAmount: string | number; createdAt: string }>>([]);
  const [bulkBranchId, setBulkBranchId] = useState('');
  const [bulkNumbers, setBulkNumbers] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPreview, setBulkPreview] = useState<BulkPreview | null>(null);
  const [direct, setDirect] = useState({ to: '', message: '', scope: 'ORG', branchId: '', isMasking: true });
  const [templateForm, setTemplateForm] = useState({ key: '', body: '', isMasking: true });
  const [orgBalanceInput, setOrgBalanceInput] = useState('');
  const [transfer, setTransfer] = useState({ branchId: '', count: '' });
  const [purchase, setPurchase] = useState({ scope: 'BRANCH', branchId: '', quantity: '' });
  const [dueMonth, setDueMonth] = useState(new Date().toISOString().slice(0, 7));

  const orgBalance = balances.find((balance) => balance.scope === 'ORG' && !balance.branchId);
  const branchBalances = balances.filter((balance) => balance.scope === 'BRANCH');
  const failedQueue = queue.items.filter((item) => item.status === 'FAILED');
  const settingsByType = useMemo(() => {
    const map = new Map<string, SmsSystemSetting>();
    settings.forEach((setting) => {
      if (setting.scope === 'ORG' && !setting.branchId) map.set(setting.type, setting);
    });
    return map;
  }, [settings]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        branchRes,
        configRes,
        templateRes,
        balanceRes,
        queueRes,
        logsRes,
        settingsRes,
        summaryRes,
        typeRes,
        branchUsageRes,
        programUsageRes,
        batchUsageRes,
        dueRes,
        paymentRes,
        resultRes,
        providerRes,
        pricingRes,
        txRes,
      ] = await Promise.allSettled([
        getBranches(),
        getSmsConfig(),
        getSmsTemplates(),
        getSmsBalance(),
        getSmsQueue(),
        getSmsLogs({ page: 1, limit: 20 }),
        getSmsSystemSettings(),
        getSmsReportSummary(),
        getSmsReportType(),
        getSmsReportBranch(),
        getSmsReportProgram(),
        getSmsReportBatch(),
        getSmsReportDue({ limit: 20 }),
        getSmsReportPayment({ limit: 20 }),
        getSmsReportResult({ limit: 20 }),
        getProviderBalance(),
        getSmsPricing(),
        getSmsTransactions({ page: 1, limit: 8 }),
      ]);

      if (branchRes.status === 'fulfilled' && branchRes.value.success) setBranches(branchRes.value.data || []);
      if (configRes.status === 'fulfilled' && configRes.value.success && configRes.value.data) setConfig(configRes.value.data);
      if (templateRes.status === 'fulfilled' && templateRes.value.success) setTemplates(templateRes.value.data || []);
      if (balanceRes.status === 'fulfilled' && balanceRes.value.success) setBalances(balanceRes.value.data || []);
      if (queueRes.status === 'fulfilled' && queueRes.value.success) setQueue(queueRes.value.data || { summary: {}, items: [] });
      if (logsRes.status === 'fulfilled' && logsRes.value.success) setLogs(logsRes.value.data || []);
      if (settingsRes.status === 'fulfilled' && settingsRes.value.success) setSettings(settingsRes.value.data?.settings || []);
      if (summaryRes.status === 'fulfilled' && summaryRes.value.success) setSummary(summaryRes.value.data);
      if (typeRes.status === 'fulfilled' && typeRes.value.success) setTypeReport(typeRes.value.data || []);
      if (branchUsageRes.status === 'fulfilled' && branchUsageRes.value.success) setBranchReport(branchUsageRes.value.data || []);
      if (programUsageRes.status === 'fulfilled' && programUsageRes.value.success) setProgramReport(programUsageRes.value.data || []);
      if (batchUsageRes.status === 'fulfilled' && batchUsageRes.value.success) setBatchReport(batchUsageRes.value.data || []);
      if (dueRes.status === 'fulfilled' && dueRes.value.success) setDueReport(dueRes.value.data || []);
      if (paymentRes.status === 'fulfilled' && paymentRes.value.success) setPaymentReport(paymentRes.value.data || []);
      if (resultRes.status === 'fulfilled' && resultRes.value.success) setResultReport(resultRes.value.data || []);
      if (providerRes.status === 'fulfilled') {
        if (providerRes.value.success) {
          setProviderBalance(providerRes.value.data);
          setProviderBalanceError('');
        } else {
          setProviderBalance(providerRes.value.data || null);
          setProviderBalanceError(providerRes.value.message || 'Provider balance unavailable');
        }
      } else {
        setProviderBalance(null);
        setProviderBalanceError('Provider balance unavailable');
      }
      if (pricingRes.status === 'fulfilled' && pricingRes.value.success) setSmsPricing(pricingRes.value.data);
      if (txRes.status === 'fulfilled' && txRes.value.success) setSmsTransactions(txRes.value.data || []);
    } catch (error: unknown) {
      toast({ title: 'SMS data failed', description: errorMessage(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function saveSetting(type: string, patch: Partial<SmsSystemSetting>) {
    const current = settingsByType.get(type);
    const next = {
      type,
      scope: 'ORG' as const,
      isEnabled: current?.isEnabled ?? true,
      balanceSource: current?.balanceSource ?? 'ORG',
      isMasking: current?.isMasking ?? true,
      templateKey: current?.templateKey ?? null,
      ...patch,
    };

    setSettings((prev) => prev.map((setting) => (setting.type === type && setting.scope === 'ORG' && !setting.branchId ? { ...setting, ...next } : setting)));
    try {
      const res = await saveSmsSystemSetting(next);
      if (res.success) {
        setSettings((prev) => {
          const withoutOld = prev.filter((setting) => !(setting.type === type && setting.scope === 'ORG' && !setting.branchId));
          return [...withoutOld, res.data];
        });
      }
    } catch (error: unknown) {
      toast({ title: 'Setting not saved', description: errorMessage(error), variant: 'destructive' });
      loadData();
    }
  }

  async function handleBulkPreview(kind: 'manual' | 'file') {
    try {
      if (kind === 'manual' && !bulkNumbers.trim()) {
        toast({ title: 'No numbers', description: 'Enter at least one mobile number.', variant: 'destructive' });
        return;
      }
      if (kind === 'file' && !bulkFile) {
        toast({ title: 'Select file', description: 'Choose a CSV or Excel file first.', variant: 'destructive' });
        return;
      }

      const res = kind === 'manual' ? await previewBulkManual(bulkNumbers) : await previewBulkUpload(bulkFile!);
      if (res.success && res.data) setBulkPreview(res.data);
      else toast({ title: 'Preview failed', description: res.message || 'Could not parse numbers.', variant: 'destructive' });
    } catch (error: unknown) {
      toast({ title: 'Preview failed', description: errorMessage(error), variant: 'destructive' });
    }
  }

  async function handleBulkSend(kind: 'manual' | 'file') {
    if (!bulkBranchId) return toast({ title: 'Branch required', description: 'Bulk SMS always uses branch balance.', variant: 'destructive' });
    if (!bulkMessage.trim()) return toast({ title: 'Message required', description: 'Write the SMS message before sending.', variant: 'destructive' });
    setSubmitting(true);
    try {
      const res = kind === 'manual'
        ? await sendBulkManual({ branchId: bulkBranchId, numbers: bulkNumbers, message: bulkMessage })
        : bulkFile
          ? await sendBulkUpload({ branchId: bulkBranchId, message: bulkMessage, file: bulkFile })
          : null;
      if (!res) throw new Error('Choose a file first');
      toast({ title: 'Bulk SMS queued', description: res.message || 'Recipients were added to the queue.', variant: 'success' });
      setBulkPreview(null);
      loadData();
    } catch (error: unknown) {
      toast({ title: 'Bulk SMS failed', description: errorMessage(error), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDirectSend() {
    if (!direct.to.trim()) return toast({ title: 'Number required', description: 'Enter recipient mobile number.', variant: 'destructive' });
    if (!direct.message.trim()) return toast({ title: 'Message required', description: 'Write the SMS message.', variant: 'destructive' });
    if (direct.scope === 'BRANCH' && !direct.branchId) return toast({ title: 'Branch required', description: 'Select a branch balance for this SMS.', variant: 'destructive' });
    setSubmitting(true);
    try {
      const res = await sendDirectSms(direct.to, direct.message, direct.isMasking, direct.scope === 'BRANCH' ? direct.branchId : undefined, direct.scope);
      toast({ title: 'Direct SMS queued', description: res.message || 'Message added to queue.', variant: 'success' });
      setDirect((prev) => ({ ...prev, to: '', message: '' }));
      loadData();
    } catch (error: unknown) {
      toast({ title: 'Direct SMS failed', description: errorMessage(error), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveTemplate() {
    if (!templateForm.key.trim() || !templateForm.body.trim()) return;
    setSubmitting(true);
    try {
      const existing = templates.find((template) => template.key === templateForm.key.trim());
      const payload = { key: templateForm.key.trim(), body: templateForm.body, isMasking: templateForm.isMasking };
      const res = existing ? await updateSmsTemplate(existing.key, payload) : await createSmsTemplate(payload);
      toast({ title: 'Template saved', description: res.message || 'SMS template is ready.', variant: 'success' });
      setTemplateForm({ key: '', body: '', isMasking: true });
      loadData();
    } catch (error: unknown) {
      toast({ title: 'Template failed', description: errorMessage(error), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveGateway() {
    setSubmitting(true);
    try {
      await upsertSmsConfig(config);
      toast({ title: 'Gateway saved', description: 'BulkSMSBD settings updated.', variant: 'success' });
      loadData();
    } catch (error: unknown) {
      toast({ title: 'Gateway failed', description: errorMessage(error), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBalanceUpdate() {
    if (!orgBalanceInput) return;
    setSubmitting(true);
    try {
      const res = await updateSmsBalance({ scope: 'ORG', balanceCount: Number(orgBalanceInput) });
      if (res.success) {
        toast({ title: 'Central balance updated', variant: 'success' });
        setOrgBalanceInput('');
        await loadData();
      }
    } catch (error: unknown) {
      toast({ title: 'Balance update failed', description: errorMessage(error), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTransfer() {
    if (!transfer.branchId || !Number(transfer.count)) return;
    setSubmitting(true);
    try {
      const res = await transferSmsBalance(transfer.branchId, Number(transfer.count));
      if (res.success) {
        toast({ title: 'Credits transferred', variant: 'success' });
        setTransfer({ branchId: '', count: '' });
        await loadData();
      }
    } catch (error: unknown) {
      toast({ title: 'Transfer failed', description: errorMessage(error), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePurchaseSms() {
    const quantity = Number(purchase.quantity);
    if (!quantity || quantity < smsPricing.minPurchase) {
      return toast({ title: 'Invalid quantity', description: `Minimum purchase is ${smsPricing.minPurchase} SMS.`, variant: 'destructive' });
    }
    if (purchase.scope === 'BRANCH' && !purchase.branchId) {
      return toast({ title: 'Branch required', description: 'Select a branch for branch balance purchase.', variant: 'destructive' });
    }
    setSubmitting(true);
    try {
      const res = await initiateSmsPurchase({
        scope: purchase.scope,
        branchId: purchase.scope === 'BRANCH' ? purchase.branchId : undefined,
        quantity,
      });
      if (res.success && res.data?.GatewayPageURL) {
        window.location.href = res.data.GatewayPageURL;
        return;
      }
      toast({ title: 'Purchase failed', description: 'Payment gateway did not return a redirect URL.', variant: 'destructive' });
    } catch (error: unknown) {
      toast({ title: 'Purchase failed', description: errorMessage(error), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  const providerBalanceValue = providerBalanceError ? 'Unavailable' : providerBalance?.balanceText || '-';
  const sentSmsValue = Number(((summary?.totals as { _sum?: { successCount?: number | null } } | undefined)?._sum?.successCount) ?? 0);
  const monthlyRows = Array.isArray(summary?.monthly)
    ? summary.monthly as Array<{ month: string; successCount: number; failedCount: number; recipientCount: number }>
    : [];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-slate-950">SMS Control Center</h1>
            <p className="truncate text-sm text-slate-500">Unified queue, automated policies, bulk SMS, balance, and reports</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="shrink-0 gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Central Balance" value={orgBalance?.balanceCount ?? '-'} tone="emerald" />
          <Metric label="Provider Balance" value={providerBalanceValue} tone="blue" />
          <Metric label="Queue Pending" value={queue.summary?.PENDING ?? 0} tone="amber" />
          <Metric label="Sent SMS" value={sentSmsValue} tone="slate" />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <TabsList className="flex h-auto w-max min-w-full justify-start gap-1 rounded-lg border border-slate-200 bg-white p-1 sm:w-full sm:flex-wrap">
              {tabItems.map(({ value, label, icon: Icon }) => (
                <TabsTrigger key={value} value={value} className="h-9 flex-none gap-2 px-3 text-xs sm:flex-1 sm:text-sm">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <Panel title="Queue Status">
                <div className="grid gap-3 sm:grid-cols-4">
                  {['PENDING', 'SENDING', 'SENT', 'FAILED'].map((status) => (
                    <div key={status} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-500">{status}</p>
                      <p className="mt-1 text-xl font-bold text-slate-950">{queue.summary?.[status] ?? 0}</p>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Gateway Status">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-slate-200 p-3">
                    <p className="text-xs font-semibold text-slate-500">Provider</p>
                    <p className="mt-1 truncate font-semibold">{config.provider || 'BulkSMSBD'}</p>
                  </div>
                  <div className="rounded-md border border-slate-200 p-3">
                    <p className="text-xs font-semibold text-slate-500">Gateway</p>
                    <Badge variant="outline" className={config.isActive === false ? 'border-red-200 text-red-700' : 'border-emerald-200 text-emerald-700'}>
                      {config.isActive === false ? 'Inactive' : 'Active'}
                    </Badge>
                  </div>
                  <div className="rounded-md border border-slate-200 p-3">
                    <p className="text-xs font-semibold text-slate-500">Provider Balance</p>
                    <p className={providerBalanceError ? 'mt-1 truncate font-semibold text-amber-700' : 'mt-1 truncate font-semibold'}>
                      {providerBalanceValue}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 p-3">
                    <p className="text-xs font-semibold text-slate-500">Masking ID</p>
                    <p className="mt-1 truncate font-semibold">{config.senderId || '-'}</p>
                  </div>
                </div>
                {providerBalanceError && (
                  <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {providerBalanceError}
                  </p>
                )}
              </Panel>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Recent Queue">
                <div className="space-y-2">
                  {queue.items.slice(0, 8).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{item.mobile}</p>
                        <p className="truncate text-xs text-slate-500">{item.type || 'SMS'} · priority {item.priority}</p>
                      </div>
                      <Badge variant="outline">{item.status}</Badge>
                    </div>
                  ))}
                  {queue.items.length === 0 && <EmptyState>No queued SMS yet.</EmptyState>}
                </div>
              </Panel>
              <Panel title="Recent Failed SMS">
                <div className="space-y-2">
                  {failedQueue.slice(0, 8).map((item) => (
                    <div key={item.id} className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm">
                      <p className="font-semibold text-red-800">{item.mobile}</p>
                      <p className="truncate text-xs text-red-600">{item.message}</p>
                    </div>
                  ))}
                  {failedQueue.length === 0 && <EmptyState>No failed queue items in the latest queue window.</EmptyState>}
                </div>
              </Panel>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Panel title="Automated SMS Policies">
              <div className="space-y-2">
                {systemTypes.map((type) => {
                  const setting = settingsByType.get(type) || ({ type, isEnabled: true, balanceSource: 'ORG', isMasking: true } as SmsSystemSetting);
                  const templateSelectValue = setting.templateKey && templates.some((template) => template.key === setting.templateKey) ? setting.templateKey : 'default';
                  return (
                    <div key={type} className="grid gap-3 rounded-md border border-slate-200 p-3 lg:grid-cols-[1.3fr_.8fr_.75fr_1fr] lg:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <Switch checked={setting.isEnabled} onCheckedChange={(checked) => saveSetting(type, { isEnabled: checked })} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">{smsTypeLabels[type] || type}</p>
                          <p className="text-xs text-slate-500">{setting.isEnabled ? 'Enabled' : 'Disabled'} automated queueing</p>
                        </div>
                      </div>
                      <Select value={setting.balanceSource} onValueChange={(value) => saveSetting(type, { balanceSource: value as 'ORG' | 'BRANCH' })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ORG">Central Balance</SelectItem>
                          <SelectItem value="BRANCH">Branch Balance</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={setting.isMasking ? 'masking' : 'non-masking'} onValueChange={(value) => saveSetting(type, { isMasking: value === 'masking' })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masking">Masking</SelectItem>
                          <SelectItem value="non-masking">Non-masking</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={templateSelectValue} onValueChange={(value) => saveSetting(type, { templateKey: value === 'default' ? null : value })}>
                        <SelectTrigger><SelectValue placeholder="Template" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default message</SelectItem>
                          {templates.map((template) => <SelectItem key={template.key} value={template.key}>{template.key}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </Panel>
            <Panel title="Monthly Due Reminder">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label>Billing month</Label>
                  <Input type="month" value={dueMonth} onChange={(event) => setDueMonth(event.target.value)} className="mt-1 bg-white" />
                </div>
                <Button
                  type="button"
                  disabled={submitting}
                  onClick={async () => {
                    try {
                      const res = await queueDueReminders(dueMonth);
                      toast({ title: 'Due reminders queued', description: res.message || 'Check the SMS queue for pending items.', variant: 'success' });
                      await loadData();
                    } catch (error: unknown) {
                      toast({ title: 'Could not queue due reminders', description: errorMessage(error), variant: 'destructive' });
                    }
                  }}
                >
                  Queue Due SMS
                </Button>
              </div>
            </Panel>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_.85fr]">
              <Panel title="Branch Bulk SMS">
                <div className="space-y-4">
                  <div>
                    <Label>Branch</Label>
                    <Select value={bulkBranchId} onValueChange={setBulkBranchId}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select branch" /></SelectTrigger>
                      <SelectContent>{branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-slate-500">Bulk SMS always deducts from the selected branch balance.</p>
                  </div>
                  <div>
                    <Label>Manual numbers</Label>
                    <Textarea value={bulkNumbers} onChange={(event) => setBulkNumbers(event.target.value)} rows={5} placeholder="01700000001, 01700000002" className="mt-1 resize-y bg-white" />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => handleBulkPreview('manual')}>Preview</Button>
                      <Button type="button" onClick={() => handleBulkSend('manual')} disabled={submitting} className="gap-2">
                        <Send className="h-4 w-4" /> Queue Manual
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <Label>Excel or CSV upload</Label>
                    <Input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setBulkFile(event.target.files?.[0] || null)} className="mt-1 bg-white" />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => handleBulkPreview('file')}>Preview File</Button>
                      <Button type="button" onClick={() => handleBulkSend('file')} disabled={submitting}>Queue File</Button>
                    </div>
                  </div>
                  <SmsComposer label="Bulk message" value={bulkMessage} onChange={setBulkMessage} rows={5} />
                </div>
              </Panel>
              <Panel title="Validation Preview">
                {bulkPreview ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <Metric label="Valid" value={bulkPreview.validCount} tone="emerald" />
                      <Metric label="Invalid" value={bulkPreview.invalidCount} tone="amber" />
                      <Metric label="Duplicate" value={bulkPreview.duplicateCount} tone="slate" />
                    </div>
                    <div className="rounded-md border border-slate-200 p-3 text-sm text-slate-600">
                      Keep one recipient per row, use BD format 01XXXXXXXXX, and preview before queueing.
                    </div>
                    <div className="max-h-56 overflow-auto rounded-md border border-slate-200">
                      {bulkPreview.invalid.length > 0
                        ? bulkPreview.invalid.map((item) => <p key={item} className="border-b border-slate-100 px-3 py-2 text-sm text-red-600">{item}</p>)
                        : <p className="px-3 py-2 text-sm text-slate-500">No invalid numbers in preview.</p>}
                    </div>
                  </div>
                ) : (
                  <EmptyState>Preview manual numbers or an Excel file to see valid, invalid, and duplicate counts.</EmptyState>
                )}
              </Panel>
            </div>
            <Panel title="Single Direct SMS">
              <div className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
                <div className="space-y-3">
                  <div>
                    <Label>Recipient mobile</Label>
                    <Input value={direct.to} onChange={(event) => setDirect((prev) => ({ ...prev, to: event.target.value }))} placeholder="01700000001" className="mt-1 bg-white" />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Select value={direct.scope} onValueChange={(value) => setDirect((prev) => ({ ...prev, scope: value, branchId: value === 'ORG' ? '' : prev.branchId }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ORG">Central Balance</SelectItem>
                        <SelectItem value="BRANCH">Branch Balance</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={direct.branchId || 'none'} disabled={direct.scope !== 'BRANCH'} onValueChange={(value) => setDirect((prev) => ({ ...prev, branchId: value === 'none' ? '' : value }))}>
                      <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select branch</SelectItem>
                        {branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                    <Label>Masking</Label>
                    <Switch checked={direct.isMasking} onCheckedChange={(checked) => setDirect((prev) => ({ ...prev, isMasking: checked }))} />
                  </div>
                </div>
                <div className="space-y-3">
                  <SmsComposer label="Direct message" value={direct.message} onChange={(message) => setDirect((prev) => ({ ...prev, message }))} rows={5} variables={['{{name}}', '{{amount}}', '{{month}}']} />
                  <Button type="button" onClick={handleDirectSend} disabled={submitting} className="gap-2">
                    <Send className="h-4 w-4" /> Queue Direct SMS
                  </Button>
                </div>
              </div>
            </Panel>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
              <Panel title="Template Editor">
                <div className="space-y-3">
                  <div>
                    <Label>Template key</Label>
                    <Input placeholder="DUE_REMINDER_DEFAULT" value={templateForm.key} onChange={(event) => setTemplateForm((prev) => ({ ...prev, key: event.target.value }))} className="mt-1 bg-white" />
                  </div>
                  <SmsComposer label="Template body" rows={8} value={templateForm.body} onChange={(body) => setTemplateForm((prev) => ({ ...prev, body }))} />
                  <div className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                    <Label>Masking default</Label>
                    <Switch checked={templateForm.isMasking} onCheckedChange={(checked) => setTemplateForm((prev) => ({ ...prev, isMasking: checked }))} />
                  </div>
                  <Button type="button" onClick={handleSaveTemplate} disabled={submitting} className="gap-2">
                    <Save className="h-4 w-4" /> Save Template
                  </Button>
                </div>
              </Panel>
              <Panel title="Templates">
                <div className="space-y-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
                      onClick={() => setTemplateForm({ key: template.key, body: template.body, isMasking: template.isMasking })}
                    >
                      <p className="truncate font-semibold text-slate-950">{template.key}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{template.body}</p>
                    </button>
                  ))}
                  {templates.length === 0 && <EmptyState>No templates created yet.</EmptyState>}
                </div>
              </Panel>
            </div>
          </TabsContent>

          <TabsContent value="balances" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
              <div className="space-y-4">
                <Panel title="Central Balance">
                  <div className="space-y-3">
                    <p className="text-3xl font-bold text-emerald-700">{orgBalance?.balanceCount ?? 0}</p>
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <Input type="number" placeholder="Set central balance" value={orgBalanceInput} onChange={(event) => setOrgBalanceInput(event.target.value)} className="bg-white" />
                      <Button type="button" onClick={handleBalanceUpdate} disabled={submitting}>Update</Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[1fr_130px_auto]">
                      <Select value={transfer.branchId} onValueChange={(value) => setTransfer((prev) => ({ ...prev, branchId: value }))}>
                        <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
                        <SelectContent>{branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" placeholder="Count" value={transfer.count} onChange={(event) => setTransfer((prev) => ({ ...prev, count: event.target.value }))} className="bg-white" />
                      <Button type="button" variant="outline" onClick={handleTransfer} disabled={submitting}>Transfer</Button>
                    </div>
                  </div>
                </Panel>
                <Panel title="Purchase SMS">
                  <div className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Select value={purchase.scope} onValueChange={(value) => setPurchase((prev) => ({ ...prev, scope: value, branchId: value === 'ORG' ? '' : prev.branchId }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BRANCH">Branch Balance</SelectItem>
                          <SelectItem value="ORG">Central Balance</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={purchase.branchId || 'none'} disabled={purchase.scope !== 'BRANCH'} onValueChange={(value) => setPurchase((prev) => ({ ...prev, branchId: value === 'none' ? '' : value }))}>
                        <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select branch</SelectItem>
                          {branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input type="number" placeholder={`Quantity, min ${smsPricing.minPurchase}`} value={purchase.quantity} onChange={(event) => setPurchase((prev) => ({ ...prev, quantity: event.target.value }))} className="bg-white" />
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-semibold">Estimated total</p>
                      <p className="mt-1 text-2xl font-bold">৳ {(Number(purchase.quantity || 0) * smsPricing.pricePerSms).toFixed(2)}</p>
                      <p className="text-xs text-slate-500">৳{smsPricing.pricePerSms} per SMS</p>
                    </div>
                    <Button type="button" onClick={handlePurchaseSms} disabled={submitting}>Buy Credits</Button>
                  </div>
                </Panel>
              </div>
              <Panel title="Branch Balances">
                <div className="grid gap-2 md:grid-cols-2">
                  {branchBalances.map((balance) => (
                    <div key={balance.id} className="rounded-md border border-slate-200 p-3">
                      <p className="truncate font-semibold">{balance.branch?.name || 'Branch'}</p>
                      <p className="mt-1 text-2xl font-bold">{balance.balanceCount}</p>
                    </div>
                  ))}
                  {branchBalances.length === 0 && <EmptyState>No branch balances available.</EmptyState>}
                </div>
                {smsTransactions.length > 0 && (
                  <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold">Recent purchases</p>
                    <div className="mt-2 space-y-2">
                      {smsTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm">
                          <span>{tx.quantity} SMS</span>
                          <Badge variant="outline">{tx.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Panel title="Monthly Summary">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {monthlyRows.slice(-8).map((row) => (
                  <div key={row.month} className="rounded-md border border-slate-200 p-3">
                    <p className="text-xs font-semibold text-slate-500">{row.month}</p>
                    <p className="mt-1 text-xl font-bold">{row.successCount}</p>
                    <p className="text-xs text-slate-500">{row.failedCount} failed</p>
                  </div>
                ))}
                {monthlyRows.length === 0 && <EmptyState>No monthly SMS data yet.</EmptyState>}
              </div>
            </Panel>
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Usage By Type">
                <div className="space-y-2">
                  {typeReport.map((row) => (
                    <div key={row.type || 'unknown'} className="rounded-md border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate font-semibold">{row.type || 'Unknown'}</p>
                        <p className="text-sm text-slate-500">{row._sum?.successCount || 0} sent</p>
                      </div>
                      <div className="mt-2 h-2 rounded bg-slate-100">
                        <div className="h-2 rounded bg-blue-600" style={{ width: `${Math.min(100, Number(row._sum?.successCount || 0))}%` }} />
                      </div>
                    </div>
                  ))}
                  {typeReport.length === 0 && <EmptyState>No type usage yet.</EmptyState>}
                </div>
              </Panel>
              <Panel title="Branch Usage">
                <div className="space-y-2">
                  {branchReport.map((row) => (
                    <div key={row.branchId || 'central'} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                      <p className="truncate font-semibold">{branches.find((branch) => branch.id === row.branchId)?.name || 'Central / Unknown'}</p>
                      <p className="text-sm text-slate-500">{row._sum?.successCount || 0} sent</p>
                    </div>
                  ))}
                  {branchReport.length === 0 && <EmptyState>No branch usage yet.</EmptyState>}
                </div>
              </Panel>
              <Panel title="Program Usage">
                <div className="space-y-2">
                  {programReport.slice(0, 8).map((row) => (
                    <div key={row.programId || 'none'} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                      <p className="truncate font-semibold">{row.programId || 'Not tagged'}</p>
                      <p className="text-sm text-slate-500">{row._sum?.successCount || 0} sent</p>
                    </div>
                  ))}
                  {programReport.length === 0 && <EmptyState>No program-tagged SMS yet.</EmptyState>}
                </div>
              </Panel>
              <Panel title="Batch Usage">
                <div className="space-y-2">
                  {batchReport.slice(0, 8).map((row) => (
                    <div key={row.batchId || 'none'} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                      <p className="truncate font-semibold">{row.batchId || 'Not tagged'}</p>
                      <p className="text-sm text-slate-500">{row._sum?.successCount || 0} sent</p>
                    </div>
                  ))}
                  {batchReport.length === 0 && <EmptyState>No batch-tagged SMS yet.</EmptyState>}
                </div>
              </Panel>
            </div>
            <Panel title="Operational Reports">
              <div className="grid gap-3 md:grid-cols-3">
                <Metric label="Due SMS" value={dueReport.reduce((sum, row) => sum + row.successCount, 0)} tone="amber" />
                <Metric label="Payment SMS" value={paymentReport.reduce((sum, row) => sum + row.successCount, 0)} tone="emerald" />
                <Metric label="Result SMS" value={resultReport.reduce((sum, row) => sum + row.successCount, 0)} tone="blue" />
              </div>
            </Panel>
            <Panel title="SMS History">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                      <th className="py-2 pr-3">Type</th>
                      <th className="py-2 pr-3">Scope</th>
                      <th className="py-2 pr-3">Recipients</th>
                      <th className="py-2 pr-3">Success</th>
                      <th className="py-2 pr-3">Failed</th>
                      <th className="py-2 pr-3">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100">
                        <td className="py-2 pr-3">{log.type || '-'}</td>
                        <td className="py-2 pr-3">{log.scope}</td>
                        <td className="py-2 pr-3">{log.recipientCount}</td>
                        <td className="py-2 pr-3">{log.successCount}</td>
                        <td className="py-2 pr-3">{log.failedCount}</td>
                        <td className="max-w-md truncate py-2 pr-3">{log.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {logs.length === 0 && <EmptyState>No SMS history yet.</EmptyState>}
              </div>
            </Panel>
          </TabsContent>

          <TabsContent value="gateway" className="space-y-4">
            <Panel title="BulkSMSBD Gateway">
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 lg:col-span-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">Provider balance</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold text-slate-950">{providerBalanceValue}</span>
                    <Badge variant="outline" className={providerBalanceError ? 'border-amber-200 text-amber-700' : 'border-emerald-200 text-emerald-700'}>
                      {providerBalanceError ? 'Gateway error' : 'Connected'}
                    </Badge>
                  </div>
                  {providerBalanceError && <p className="mt-2 text-sm text-amber-700">{providerBalanceError}</p>}
                </div>
                <div>
                  <Label>Provider</Label>
                  <Input value={config.provider || 'BulkSMSBD'} onChange={(event) => setConfig((prev) => ({ ...prev, provider: event.target.value }))} className="mt-1 bg-white" />
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input value={config.apiKey || ''} onChange={(event) => setConfig((prev) => ({ ...prev, apiKey: event.target.value }))} className="mt-1 bg-white" />
                </div>
                <div>
                  <Label>Masking Sender ID</Label>
                  <Input value={config.senderId || ''} onChange={(event) => setConfig((prev) => ({ ...prev, senderId: event.target.value }))} className="mt-1 bg-white" />
                </div>
                <div>
                  <Label>Non-masking Number</Label>
                  <Input value={config.nonMaskingNumber || ''} onChange={(event) => setConfig((prev) => ({ ...prev, nonMaskingNumber: event.target.value }))} className="mt-1 bg-white" />
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-200 p-3 lg:col-span-2">
                  <Label>Active gateway</Label>
                  <Switch checked={config.isActive ?? true} onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, isActive: checked }))} />
                </div>
                <Button type="button" onClick={handleSaveGateway} disabled={submitting} className="w-fit gap-2">
                  <Save className="h-4 w-4" /> Save Gateway
                </Button>
              </div>
            </Panel>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
