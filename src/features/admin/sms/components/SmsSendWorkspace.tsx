'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileSpreadsheet, MessageSquare, Send, UserRoundCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import {
  dispatchSms,
  type SmsBalance,
  type SmsConfig,
  type SmsRecipient,
  type SmsTemplate,
} from '@/lib/api/sms';
import type { SmsBulkActionsHook } from '../hooks/useSmsManagement';
import { Panel, smsLengthInfo } from '../sms-shared';
import { SmsComposerPanel, type SmsComposerValue, type SmsGatewayCapability } from './SmsComposerPanel';
import { BulkUploadMethodPanel } from './send-workspace/BulkUploadMethodPanel';
import { DirectMethodPanel } from './send-workspace/DirectMethodPanel';
import { ManualNumbersMethodPanel } from './send-workspace/ManualNumbersMethodPanel';
import { RecipientPreview, RenderedPreview } from './send-workspace/RecipientPreview';
import { StudentsMethodPanel } from './send-workspace/StudentsMethodPanel';
import type { Actor, BranchOption, DirectRecipientMode, MethodMeta, SendMethod, WalletSelection } from './send-workspace/types';
import { recipientKey, renderTemplate, variablesForComposer } from './send-workspace/utils';

const METHOD_META: Record<SendMethod, MethodMeta> = {
  students: { label: 'Students', icon: UserRoundCheck, context: 'manual_students', type: 'NOTICE', source: 'DIRECT' },
  bulk: { label: 'Bulk Upload', icon: FileSpreadsheet, context: 'bulk_upload', type: 'BULK', source: 'BULK' },
  manual: { label: 'Manual Numbers', icon: MessageSquare, context: 'manual_numbers', type: 'BULK', source: 'BULK' },
  direct: { label: 'Direct SMS', icon: Send, context: 'direct', type: 'DIRECT', source: 'DIRECT' },
};

function defaultWallet(actor?: Actor): WalletSelection {
  return actor?.role === 'BRANCH_ADMIN'
    ? { scope: 'BRANCH', branchId: actor.branchId || undefined }
    : { scope: 'ORG' };
}

function balanceToNumber(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildGatewayCapability(config: Partial<SmsConfig> | undefined, rates: { maskingRate: number; nonMaskingRate: number }): SmsGatewayCapability {
  if (!config) {
    return {
      credentialsConfigured: true,
      maskingConfigured: true,
      nonMaskingConfigured: true,
      maskingSenderLabel: 'Spondon',
      nonMaskingSenderLabel: 'Non-Masking',
      maskingRate: rates.maskingRate,
      nonMaskingRate: rates.nonMaskingRate,
    };
  }

  const credentialsConfigured = Boolean(config.hasApiEmail && config.hasApiKey);
  const maskingSenderLabel = config.senderId?.trim() || 'Spondon';
  const nonMaskingSenderLabel = config.nonMaskingNumber?.trim() || 'Non-Masking';

  return {
    credentialsConfigured,
    maskingConfigured: credentialsConfigured,
    nonMaskingConfigured: credentialsConfigured,
    maskingSenderLabel,
    nonMaskingSenderLabel,
    maskingRate: Number(config.maskingRate ?? rates.maskingRate),
    nonMaskingRate: Number(config.nonMaskingRate ?? rates.nonMaskingRate),
  };
}

function queueDisabledReason(args: {
  providerError?: string;
  recipients: number;
  message: string;
  estimatedCostBdt: number;
  availableBalanceBdt?: number;
  scheduledAt?: string;
  wallet: WalletSelection;
  smsType: 'masking' | 'non_masking';
  gatewayCapability: SmsGatewayCapability;
}) {
  if (args.providerError) return args.providerError;
  if (!args.gatewayCapability.credentialsConfigured) return 'SMS gateway credentials are missing';
  if (args.smsType === 'masking' && !args.gatewayCapability.maskingConfigured) return 'Masking mask label is missing';
  if (args.smsType === 'non_masking' && !args.gatewayCapability.nonMaskingConfigured) return 'Non-masking mask label is missing';
  if (args.recipients <= 0) return 'Select recipients first';
  if (!args.message.trim()) return 'Write your message';
  if (args.wallet.scope === 'BRANCH' && !args.wallet.branchId) return 'Select a branch wallet';
  if (args.availableBalanceBdt !== undefined && args.estimatedCostBdt > args.availableBalanceBdt) return 'Insufficient balance';
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
  config,
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
  config?: Partial<SmsConfig>;
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
  const [directWallet, setDirectWallet] = useState<WalletSelection>(() => defaultWallet(actor));
  const [directRecipientMode, setDirectRecipientMode] = useState<DirectRecipientMode>('student');
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

  const handleDirectResolved = useCallback((items: SmsRecipient[], wallet: WalletSelection, mode: DirectRecipientMode) => {
    setDirectWallet(wallet);
    setDirectRecipientMode(mode);
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

  useEffect(() => {
    setDirectWallet(defaultWallet(actor));
  }, [actor, actor?.branchId, actor?.role]);

  const pickedRecipients = useMemo(() => {
    if (focused?.locked) return recipients;
    if (!selectedRecipientKeys.length) return recipients;
    const selected = new Set(selectedRecipientKeys);
    return recipients.filter((recipient, index) => selected.has(recipientKey(recipient, index)));
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
  const gatewayCapability = buildGatewayCapability(config, rates);
  const selectedSenderLabel = composer.smsType === 'masking'
    ? gatewayCapability.maskingSenderLabel
    : gatewayCapability.nonMaskingSenderLabel;
  const selectedModeLabel = composer.smsType === 'masking' ? 'Masking' : 'Non-masking';
  const estimatedCost = Math.round(totalSms * rate * 100) / 100;
  const wallet = focused
    ? { scope: focused.scope || (isBranchAdmin ? 'BRANCH' : 'ORG'), branchId: focused.branchId || (isBranchAdmin ? actor?.branchId || undefined : undefined) }
    : method === 'direct'
      ? directWallet
      : defaultWallet(actor);
  const selectedBranchBalance = wallet.branchId ? branchBalances.find((balance) => balance.branchId === wallet.branchId)?.balanceCount : undefined;
  const availableBalance = balanceToNumber(wallet.scope === 'BRANCH' ? selectedBranchBalance : orgBalance?.balanceCount);
  const disabledReason = queueDisabledReason({
    providerError: sendBlockedMessage,
    recipients: pickedRecipients.length,
    message: composer.message,
    estimatedCostBdt: estimatedCost,
    availableBalanceBdt: availableBalance,
    scheduledAt: composer.scheduledAt,
    wallet,
    smsType: composer.smsType,
    gatewayCapability,
  });
  const composerVariables = variablesForComposer({
    method: focused?.method || method,
    bulkVariables,
    directMode: directRecipientMode,
    focused: !!focused,
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
        scope: wallet.scope,
        branchId: wallet.branchId,
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
                <DirectMethodPanel
                  branches={branches}
                  actor={actor}
                  wallet={directWallet}
                  onWalletChange={setDirectWallet}
                  onResolved={handleDirectResolved}
                />
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
                variables={composerVariables}
                gatewayCapability={gatewayCapability}
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
            <SmsComposerPanel
              value={composer}
              onChange={setComposer}
              rates={rates}
              templates={templates}
              allowSchedule={focused.allowSchedule !== false}
              lockedTemplateKey={focused.templateKey}
              variables={composerVariables}
              gatewayCapability={gatewayCapability}
            />
            <RenderedPreview preview={preview} recipient={sampleRecipient} />
          </div>
        </div>
      )}

      <div className="sticky bottom-0 z-10 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 grid-cols-2 gap-2 text-sm sm:grid-cols-3 xl:grid-cols-7">
            <SummaryItem label="Method" value={focused?.contextLabel || METHOD_META[method].label} />
            <SummaryItem label="SMS Mode" value={selectedModeLabel} />
            <SummaryItem label="Sender" value={selectedSenderLabel} />
            <SummaryItem label="Recipients" value={pickedRecipients.length.toLocaleString()} />
            <SummaryItem label="Total SMS" value={totalSms.toLocaleString()} />
            <SummaryItem label="Est. Cost" value={`৳${estimatedCost.toFixed(2)}`} tone="emerald" />
            <SummaryItem
              label="Balance After"
              value={availableBalance === undefined ? '-' : `৳${Math.max(0, availableBalance - estimatedCost).toFixed(2)}`}
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
