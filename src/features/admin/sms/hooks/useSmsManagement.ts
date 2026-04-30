'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { getBranches, type Branch } from '@/lib/api/branches';
import {
  type BulkPreview,
  type SmsBalance,
  type SmsConfig,
  type SmsLog,
  type SmsProviderBalance,
  type SmsQueueItem,
  type SmsReportRow,
  type SmsSystemSetting,
  type SmsTemplate,
  createSmsTemplate,
  getProviderBalance,
  deleteBranchSystemSettings,
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
import { defaultSystemSetting, errorMessage, renderSmsPreview, settingKey, smsLengthInfo, systemTypes } from '../sms-shared';

export type DirectSmsState = {
  to: string;
  message: string;
  scope: string;
  branchId: string;
  isMasking: boolean;
};

export type SmsManagementData = ReturnType<typeof useSmsManagementData>;
export type SmsSystemSettingsHook = ReturnType<typeof useSmsSystemSettings>;
export type SmsBulkActionsHook = ReturnType<typeof useSmsBulkActions>;
export type SmsBalancesActionsHook = ReturnType<typeof useSmsBalancesActions>;
export type SmsTemplateActionsHook = ReturnType<typeof useSmsTemplateActions>;
export type SmsGatewayActionsHook = ReturnType<typeof useSmsGatewayActions>;

export function useSmsManagementData() {
  const toast = useAdminToast();
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

  const orgBalance = balances.find((balance) => balance.scope === 'ORG' && !balance.branchId);
  const branchBalances = balances.filter((balance) => balance.scope === 'BRANCH');
  const failedQueue = queue.items.filter((item) => item.status === 'FAILED');
  const providerBalanceValue = providerBalanceError ? 'Unavailable' : providerBalance?.balanceText || '-';
  const sentSmsValue = Number(((summary?.totals as { _sum?: { successCount?: number | null } } | undefined)?._sum?.successCount) ?? 0);
  const monthlyRows = Array.isArray(summary?.monthly)
    ? summary.monthly as Array<{ month: string; successCount: number; failedCount: number; recipientCount: number }>
    : [];

  return {
    loading,
    submitting,
    setSubmitting,
    loadData,
    branches,
    templates,
    settings,
    setSettings,
    config,
    setConfig,
    queue,
    logs,
    typeReport,
    branchReport,
    programReport,
    batchReport,
    dueReport,
    paymentReport,
    resultReport,
    smsPricing,
    smsTransactions,
    orgBalance,
    branchBalances,
    failedQueue,
    providerBalanceValue,
    providerBalanceError,
    sentSmsValue,
    monthlyRows,
  };
}

export function useSmsSystemSettings({
  branches,
  settings,
  setSettings,
  submitting,
  setSubmitting,
  refresh,
}: {
  branches: Branch[];
  settings: SmsSystemSetting[];
  setSettings: Dispatch<SetStateAction<SmsSystemSetting[]>>;
  submitting: boolean;
  setSubmitting: Dispatch<SetStateAction<boolean>>;
  refresh: () => void | Promise<void>;
}) {
  const toast = useAdminToast();
  const [policyBranchId, setPolicyBranchId] = useState('');
  const [dueMonth, setDueMonth] = useState(new Date().toISOString().slice(0, 7));

  const orgSettingsByType = useMemo(() => {
    const map = new Map<string, SmsSystemSetting>();
    settings.forEach((setting) => {
      if (setting.scope === 'ORG' && !setting.branchId) map.set(setting.type, setting);
    });
    return map;
  }, [settings]);

  const branchSettingsByKey = useMemo(() => {
    const map = new Map<string, SmsSystemSetting>();
    settings.forEach((setting) => {
      if (setting.scope === 'BRANCH' && setting.branchId) map.set(settingKey(setting.type, 'BRANCH', setting.branchId), setting);
    });
    return map;
  }, [settings]);

  const selectedPolicyBranchId = policyBranchId || branches[0]?.id || '';

  const getOrgSetting = useCallback((type: string) => {
    return orgSettingsByType.get(type) || defaultSystemSetting(type);
  }, [orgSettingsByType]);

  const getBranchSetting = useCallback((branchId: string, type: string) => {
    return branchSettingsByKey.get(settingKey(type, 'BRANCH', branchId));
  }, [branchSettingsByKey]);

  const getEffectiveBranchSetting = useCallback((branchId: string, type: string) => {
    return getBranchSetting(branchId, type) || getOrgSetting(type);
  }, [getBranchSetting, getOrgSetting]);

  const saveSetting = useCallback(async (
    type: string,
    patch: Partial<SmsSystemSetting>,
    options: { scope?: 'ORG' | 'BRANCH'; branchId?: string | null } = {},
  ) => {
    const scope = options.scope || 'ORG';
    const branchId = scope === 'BRANCH' ? options.branchId || null : null;
    const current = scope === 'BRANCH' && branchId ? getBranchSetting(branchId, type) : getOrgSetting(type);
    const fallback = scope === 'BRANCH' ? getOrgSetting(type) : defaultSystemSetting(type);
    const next = {
      type,
      scope,
      branchId,
      id: current?.id || `pending-${settingKey(type, scope, branchId)}`,
      isEnabled: current?.isEnabled ?? fallback.isEnabled,
      balanceSource: current?.balanceSource ?? fallback.balanceSource,
      isMasking: current?.isMasking ?? fallback.isMasking,
      templateKey: current?.templateKey ?? fallback.templateKey,
      ...patch,
    } as SmsSystemSetting;

    setSettings((prev) => {
      const withoutOld = prev.filter((setting) => settingKey(setting.type, setting.scope, setting.branchId) !== settingKey(type, scope, branchId));
      return [...withoutOld, next];
    });

    try {
      const res = await saveSmsSystemSetting(next);
      if (res.success) {
        setSettings((prev) => {
          const withoutOld = prev.filter((setting) => settingKey(setting.type, setting.scope, setting.branchId) !== settingKey(type, scope, branchId));
          return [...withoutOld, res.data];
        });
      }
    } catch (error: unknown) {
      toast({ title: 'Setting not saved', description: errorMessage(error), variant: 'destructive' });
      refresh();
    }
  }, [getBranchSetting, getOrgSetting, refresh, setSettings, toast]);

  const queueDueReminder = useCallback(async () => {
    try {
      const res = await queueDueReminders(dueMonth);
      toast({
        title: 'Due reminders queued',
        description: res.message || 'Check the SMS queue for pending items.',
        variant: 'success',
      });
      await refresh();
    } catch (error: unknown) {
      toast({ title: 'Could not queue due reminders', description: errorMessage(error), variant: 'destructive' });
    }
  }, [dueMonth, refresh, toast]);

  const resetBranchToDefaultPolicy = useCallback(
    async (branchId: string) => {
      if (!branchId) return;
      setSubmitting(true);
      try {
        const res = await deleteBranchSystemSettings(branchId);
        if (res.success) {
          toast({
            title: 'Using organization defaults',
            description: 'Branch-specific overrides were removed for all SMS types.',
            variant: 'success',
          });
          await refresh();
        } else {
          toast({ title: 'Reset failed', description: (res as { message?: string }).message || 'Unknown error', variant: 'destructive' });
        }
      } catch (error: unknown) {
        toast({ title: 'Reset failed', description: errorMessage(error), variant: 'destructive' });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh, setSubmitting, toast],
  );

  const copyOrgDefaultsToBranch = useCallback(
    async (branchId: string) => {
      if (!branchId) return;
      setSubmitting(true);
      try {
        for (const type of systemTypes) {
          const org = getOrgSetting(type);
          await saveSetting(
            type,
            {
              isEnabled: org.isEnabled,
              balanceSource: org.balanceSource,
              isMasking: org.isMasking,
              templateKey: org.templateKey ?? null,
            },
            { scope: 'BRANCH', branchId },
          );
        }
        toast({
          title: 'Policies copied',
          description: 'This branch now has explicit overrides matching organization defaults.',
          variant: 'success',
        });
        await refresh();
      } catch (error: unknown) {
        toast({ title: 'Copy failed', description: errorMessage(error), variant: 'destructive' });
        await refresh();
      } finally {
        setSubmitting(false);
      }
    },
    [getOrgSetting, refresh, saveSetting, setSubmitting, toast],
  );

  const setAllTypesBranchBalance = useCallback(
    async (branchId: string) => {
      if (!branchId) return;
      setSubmitting(true);
      try {
        for (const type of systemTypes) {
          await saveSetting(type, { balanceSource: 'BRANCH' }, { scope: 'BRANCH', branchId });
        }
        toast({
          title: 'Balance source updated',
          description: 'All SMS types for this branch now use branch balance.',
          variant: 'success',
        });
        await refresh();
      } catch (error: unknown) {
        toast({ title: 'Update failed', description: errorMessage(error), variant: 'destructive' });
        await refresh();
      } finally {
        setSubmitting(false);
      }
    },
    [refresh, saveSetting, setSubmitting, toast],
  );

  return {
    state: {
      policyBranchId: selectedPolicyBranchId,
      dueMonth,
      submitting,
    },
    actions: {
      setPolicyBranchId,
      setDueMonth,
      getOrgSetting,
      getBranchSetting,
      getEffectiveBranchSetting,
      saveSetting,
      queueDueReminder,
      resetBranchToDefaultPolicy,
      copyOrgDefaultsToBranch,
      setAllTypesBranchBalance,
    },
  };
}

export function useSmsBulkActions({
  branchBalances,
  submitting,
  setSubmitting,
  refresh,
}: {
  branchBalances: SmsBalance[];
  submitting: boolean;
  setSubmitting: Dispatch<SetStateAction<boolean>>;
  refresh: () => void | Promise<void>;
}) {
  const toast = useAdminToast();
  const [bulkBranchId, setBulkBranchId] = useState('');
  const [bulkNumbers, setBulkNumbers] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPreview, setBulkPreview] = useState<BulkPreview | null>(null);
  /** Ensures file queue uses a preview produced from the uploaded file, not a manual-number preview. */
  const [bulkPreviewFromFile, setBulkPreviewFromFile] = useState(false);
  const [direct, setDirect] = useState<DirectSmsState>({ to: '', message: '', scope: 'ORG', branchId: '', isMasking: true });

  const selectedBranchBalance = useMemo(() => {
    if (!bulkBranchId) return undefined;
    return branchBalances.find((b) => b.branchId === bulkBranchId)?.balanceCount;
  }, [branchBalances, bulkBranchId]);

  const bulkVariableButtons = bulkPreview?.columns?.length ? bulkPreview.columns.map((column) => `{{${column}}}`) : undefined;
  const renderedBulkSamples = bulkMessage.trim() && bulkPreview?.sampleRows?.length
    ? bulkPreview.sampleRows.slice(0, 5).map((row) => renderSmsPreview(bulkMessage, row as Record<string, unknown>))
    : [];
  const bulkMessageInfo = smsLengthInfo(bulkMessage);
  const estimatedBulkCredits = (bulkPreview?.validCount || 0) * Math.max(1, bulkMessageInfo.segments);

  const setBulkFileAndResetPreview = useCallback((file: File | null) => {
    setBulkFile(file);
    setBulkPreview(null);
    setBulkPreviewFromFile(false);
  }, []);

  const handleBulkPreview = useCallback(
    async (kind: 'manual' | 'file', mobileColumn?: string) => {
      try {
        if (kind === 'manual' && !bulkNumbers.trim()) {
          toast({ title: 'No numbers', description: 'Enter at least one mobile number.', variant: 'destructive' });
          return;
        }
        if (kind === 'file' && !bulkFile) {
          toast({ title: 'Select file', description: 'Choose a CSV or Excel file first.', variant: 'destructive' });
          return;
        }

        const res =
          kind === 'manual'
            ? await previewBulkManual(bulkNumbers)
            : await previewBulkUpload(bulkFile!, mobileColumn);
        if (res.success && res.data) {
          setBulkPreview(res.data);
          setBulkPreviewFromFile(kind === 'file');
        } else toast({ title: 'Preview failed', description: res.message || 'Could not parse numbers.', variant: 'destructive' });
      } catch (error: unknown) {
        toast({ title: 'Preview failed', description: errorMessage(error), variant: 'destructive' });
      }
    },
    [bulkFile, bulkNumbers, toast],
  );

  const applyBulkMobileColumn = useCallback(
    async (column: string) => {
      if (!bulkFile || !column) return;
      await handleBulkPreview('file', column);
    },
    [bulkFile, handleBulkPreview],
  );

  const handleBulkSend = useCallback(
    async (kind: 'manual' | 'file') => {
      if (!bulkBranchId)
        return toast({ title: 'Branch required', description: 'Bulk SMS always uses branch balance.', variant: 'destructive' });
      if (!bulkMessage.trim()) return toast({ title: 'Message required', description: 'Write the SMS message before sending.', variant: 'destructive' });
        if (kind === 'file') {
          if (!bulkFile) {
            return toast({ title: 'Select file', description: 'Choose a CSV or Excel file first.', variant: 'destructive' });
          }
          if (!bulkPreview || !bulkPreviewFromFile) {
            return toast({
              title: 'Preview required',
              description: 'Preview the uploaded file before queueing so numbers and variables are validated.',
              variant: 'destructive',
            });
          }
        }
      setSubmitting(true);
      try {
        const res =
          kind === 'manual'
            ? await sendBulkManual({ branchId: bulkBranchId, numbers: bulkNumbers, message: bulkMessage })
            : bulkFile && bulkPreview
              ? await sendBulkUpload({
                  branchId: bulkBranchId,
                  message: bulkMessage,
                  file: bulkFile,
                  mobileColumn: bulkPreview.mobileColumn,
                })
              : null;
        if (!res) throw new Error('Choose a file first');
        toast({ title: 'Bulk SMS queued', description: res.message || 'Recipients were added to the queue.', variant: 'success' });
        setBulkPreview(null);
        setBulkPreviewFromFile(false);
        refresh();
      } catch (error: unknown) {
        toast({ title: 'Bulk SMS failed', description: errorMessage(error), variant: 'destructive' });
      } finally {
        setSubmitting(false);
      }
    },
    [bulkBranchId, bulkFile, bulkMessage, bulkNumbers, bulkPreview, bulkPreviewFromFile, refresh, setSubmitting, toast],
  );

  const handleDirectSend = useCallback(async () => {
    if (!direct.to.trim()) return toast({ title: 'Number required', description: 'Enter recipient mobile number.', variant: 'destructive' });
    if (!direct.message.trim()) return toast({ title: 'Message required', description: 'Write the SMS message.', variant: 'destructive' });
    if (direct.scope === 'BRANCH' && !direct.branchId) return toast({ title: 'Branch required', description: 'Select a branch balance for this SMS.', variant: 'destructive' });
    setSubmitting(true);
    try {
      const res = await sendDirectSms(direct.to, direct.message, direct.isMasking, direct.scope === 'BRANCH' ? direct.branchId : undefined, direct.scope);
      toast({ title: 'Direct SMS queued', description: res.message || 'Message added to queue.', variant: 'success' });
      setDirect((prev) => ({ ...prev, to: '', message: '' }));
      refresh();
    } catch (error: unknown) {
      toast({ title: 'Direct SMS failed', description: errorMessage(error), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [direct, refresh, setSubmitting, toast]);

  return {
    bulkState: {
      bulkBranchId,
      bulkNumbers,
      bulkMessage,
      bulkPreview,
      bulkVariableButtons,
      renderedBulkSamples,
      estimatedBulkCredits,
      selectedBranchBalance,
      bulkPreviewFromFile,
      submitting,
    },
    bulkActions: {
      setBulkBranchId,
      setBulkNumbers,
      setBulkMessage,
      setBulkFile: setBulkFileAndResetPreview,
      handleBulkPreview,
      applyBulkMobileColumn,
      handleBulkSend,
    },
    directState: {
      direct,
      setDirect,
      handleDirectSend,
    },
  };
}

export function useSmsBalancesActions({
  smsPricing,
  submitting,
  setSubmitting,
  refresh,
}: {
  smsPricing: SmsPricing;
  submitting: boolean;
  setSubmitting: Dispatch<SetStateAction<boolean>>;
  refresh: () => void | Promise<void>;
}) {
  const toast = useAdminToast();
  const [orgBalanceInput, setOrgBalanceInput] = useState('');
  const [transfer, setTransfer] = useState({ branchId: '', count: '' });
  const [purchase, setPurchase] = useState({ scope: 'BRANCH', branchId: '', quantity: '' });

  const handleBalanceUpdate = useCallback(async () => {
    if (!orgBalanceInput) return;
    setSubmitting(true);
    try {
      const res = await updateSmsBalance({ scope: 'ORG', balanceCount: Number(orgBalanceInput) });
      if (res.success) {
        toast({ title: 'Central balance updated', variant: 'success' });
        setOrgBalanceInput('');
        await refresh();
      }
    } catch (error: unknown) {
      toast({ title: 'Balance update failed', description: errorMessage(error), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [orgBalanceInput, refresh, setSubmitting, toast]);

  const handleTransfer = useCallback(async () => {
    if (!transfer.branchId || !Number(transfer.count)) return;
    setSubmitting(true);
    try {
      const res = await transferSmsBalance(transfer.branchId, Number(transfer.count));
      if (res.success) {
        toast({ title: 'Credits transferred', variant: 'success' });
        setTransfer({ branchId: '', count: '' });
        await refresh();
      }
    } catch (error: unknown) {
      toast({ title: 'Transfer failed', description: errorMessage(error), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [refresh, setSubmitting, toast, transfer]);

  const handlePurchaseSms = useCallback(async () => {
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
  }, [purchase, setSubmitting, smsPricing.minPurchase, toast]);

  return {
    state: {
      orgBalanceInput,
      transfer,
      purchase,
      smsPricing,
      submitting,
    },
    actions: {
      setOrgBalanceInput,
      setTransfer,
      setPurchase,
      handleBalanceUpdate,
      handleTransfer,
      handlePurchaseSms,
    },
  };
}

export function useSmsTemplateActions({
  templates,
  submitting,
  setSubmitting,
  refresh,
}: {
  templates: SmsTemplate[];
  submitting: boolean;
  setSubmitting: Dispatch<SetStateAction<boolean>>;
  refresh: () => void | Promise<void>;
}) {
  const toast = useAdminToast();
  const [templateForm, setTemplateForm] = useState({ key: '', body: '', isMasking: true });

  const handleSaveTemplate = useCallback(async () => {
    if (!templateForm.key.trim() || !templateForm.body.trim()) return;
    setSubmitting(true);
    try {
      const existing = templates.find((template) => template.key === templateForm.key.trim());
      const payload = { key: templateForm.key.trim(), body: templateForm.body, isMasking: templateForm.isMasking };
      const res = existing ? await updateSmsTemplate(existing.key, payload) : await createSmsTemplate(payload);
      toast({ title: 'Template saved', description: res.message || 'SMS template is ready.', variant: 'success' });
      setTemplateForm({ key: '', body: '', isMasking: true });
      refresh();
    } catch (error: unknown) {
      toast({ title: 'Template failed', description: errorMessage(error), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [refresh, setSubmitting, templateForm, templates, toast]);

  return {
    state: {
      templateForm,
      submitting,
    },
    actions: {
      setTemplateForm,
      handleSaveTemplate,
    },
  };
}

export function useSmsGatewayActions({
  config,
  setConfig,
  providerBalanceValue,
  providerBalanceError,
  submitting,
  setSubmitting,
  refresh,
}: {
  config: Partial<SmsConfig>;
  setConfig: Dispatch<SetStateAction<Partial<SmsConfig>>>;
  providerBalanceValue: string;
  providerBalanceError: string;
  submitting: boolean;
  setSubmitting: Dispatch<SetStateAction<boolean>>;
  refresh: () => void | Promise<void>;
}) {
  const toast = useAdminToast();

  const handleSaveGateway = useCallback(async () => {
    setSubmitting(true);
    try {
      await upsertSmsConfig(config);
      toast({ title: 'Gateway saved', description: 'BulkSMSBD settings updated.', variant: 'success' });
      refresh();
    } catch (error: unknown) {
      toast({ title: 'Gateway failed', description: errorMessage(error), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [config, refresh, setSubmitting, toast]);

  return {
    state: {
      config,
      providerBalanceValue,
      providerBalanceError,
      submitting,
    },
    actions: {
      setConfig,
      handleSaveGateway,
    },
  };
}
