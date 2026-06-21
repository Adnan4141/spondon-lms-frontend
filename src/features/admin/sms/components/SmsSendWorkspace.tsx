'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileSpreadsheet, MessageSquare, Send, UserRoundCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { DueRecipientReviewPanel } from './due-reminder/DueRecipientReviewPanel';
import { DueReminderStepper, type DueReminderStep } from './due-reminder/DueReminderStepper';
import { DueReminderSuccessPanel } from './due-reminder/DueReminderSuccessPanel';
import {
  clearDueReminderDraft,
  loadDueReminderDraft,
  recipientHasInvalidMobile,
  saveDueReminderDraft,
} from './due-reminder/due-reminder-utils';

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
  queueButtonLabel,
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
  queueButtonLabel?: string;
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
    stepped?: boolean;
    recipientVariant?: 'default' | 'due';
    alreadyRemindedIds?: string[];
    draftStorageKey?: string;
    defaultCampaignName?: string;
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
  const [activeStep, setActiveStep] = useState<DueReminderStep>('review');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [sendResult, setSendResult] = useState<{ queuedCount: number; estimatedCost: number; scheduledAt?: string } | null>(null);
  const isSteppedDue = Boolean(focused?.locked && focused?.stepped);
  const remindedSet = useMemo(() => new Set(focused?.alreadyRemindedIds || []), [focused?.alreadyRemindedIds]);

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

  const recipientSignature = useMemo(
    () => (focused?.recipients || []).map((recipient, index) => recipientKey(recipient, index)).join('|'),
    [focused?.recipients],
  );

  useEffect(() => {
    if (!focused?.stepped) {
      setSelectedRecipientKeys([]);
      return;
    }
    setActiveStep('review');
    setConfirmChecked(false);
    setSendResult(null);
    setSelectedRecipientKeys(focused.recipients.map((recipient, index) => recipientKey(recipient, index)));
  }, [focused?.stepped, recipientSignature, focused?.recipients]);

  useEffect(() => {
    if (!isSteppedDue || !focused?.defaultCampaignName) return;
    setComposer((prev) => ({
      ...prev,
      campaignName: prev.campaignName || focused.defaultCampaignName || '',
    }));
  }, [focused?.defaultCampaignName, isSteppedDue, recipientSignature]);

  useEffect(() => {
    if (!isSteppedDue || !focused?.draftStorageKey) return;
    const draft = loadDueReminderDraft(focused.draftStorageKey);
    if (!draft) return;
    setComposer((prev) => ({
      ...prev,
      message: draft.message || prev.message,
      smsType: draft.smsType || prev.smsType,
      scheduledAt: draft.scheduledAt,
    }));
  }, [focused?.draftStorageKey, isSteppedDue, recipientSignature]);

  useEffect(() => {
    if (!isSteppedDue || !focused?.draftStorageKey) return;
    saveDueReminderDraft(focused.draftStorageKey, {
      message: composer.message,
      smsType: composer.smsType,
      scheduledAt: composer.scheduledAt,
    });
  }, [composer.message, composer.scheduledAt, composer.smsType, focused?.draftStorageKey, isSteppedDue]);

  useEffect(() => {
    setDirectWallet(defaultWallet(actor));
  }, [actor, actor?.branchId, actor?.role]);

  const pickedRecipients = useMemo(() => {
    if (focused?.locked && focused?.stepped) {
      if (!selectedRecipientKeys.length) return [];
      const selected = new Set(selectedRecipientKeys);
      return recipients.filter((recipient, index) => selected.has(recipientKey(recipient, index)));
    }
    if (focused?.locked) return recipients;
    if (!selectedRecipientKeys.length) return recipients;
    const selected = new Set(selectedRecipientKeys);
    return recipients.filter((recipient, index) => selected.has(recipientKey(recipient, index)));
  }, [focused?.locked, focused?.stepped, recipients, selectedRecipientKeys]);

  const deliverableRecipients = useMemo(
    () => pickedRecipients.filter((recipient, index) => {
      const key = recipient.id || recipientKey(recipient, index);
      return !remindedSet.has(key) && !recipientHasInvalidMobile(recipient);
    }),
    [pickedRecipients, remindedSet],
  );
  const invalidSelectedCount = useMemo(
    () => pickedRecipients.filter((recipient) => recipientHasInvalidMobile(recipient)).length,
    [pickedRecipients],
  );

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
  const totalSms = (isSteppedDue ? deliverableRecipients.length : pickedRecipients.length) * smsEach;
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
    recipients: isSteppedDue ? deliverableRecipients.length : pickedRecipients.length,
    message: composer.message,
    estimatedCostBdt: estimatedCost,
    availableBalanceBdt: availableBalance,
    scheduledAt: composer.scheduledAt,
    wallet,
    smsType: composer.smsType,
    gatewayCapability,
  });
  const requiresConfirmAck = isSteppedDue && deliverableRecipients.length >= 2;
  const confirmBlockedReason = activeStep === 'confirm' && requiresConfirmAck && !confirmChecked
    ? 'Confirm before sending due reminders'
    : '';
  const reviewContinueDisabled = pickedRecipients.length === 0 ? 'Select at least one recipient' : '';
  const messageContinueDisabled = !composer.message.trim() ? 'Write your message' : '';
  const sendBlockedReason = isSteppedDue && deliverableRecipients.length === 0 && pickedRecipients.length > 0
    ? invalidSelectedCount === pickedRecipients.length
      ? 'All selected students have invalid mobile numbers'
      : 'All selected students were already reminded this month'
    : (disabledReason || confirmBlockedReason);
  const composerVariables = variablesForComposer({
    method: focused?.method || method,
    bulkVariables,
    directMode: directRecipientMode,
    focused: !!focused,
  });

  async function queueSms() {
    if (disabledReason || confirmBlockedReason) return;
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
        variant: 'success',
      });
      if (isSteppedDue && focused?.draftStorageKey) {
        clearDueReminderDraft(focused.draftStorageKey);
      }
      if (isSteppedDue) {
        setSendResult({
          queuedCount: res.data.queuedCount,
          estimatedCost: Number(res.data.estimatedCost ?? estimatedCost),
          scheduledAt: composer.scheduledAt,
        });
        return;
      }
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
      ) : isSteppedDue ? (
        sendResult ? (
          <DueReminderSuccessPanel
            queuedCount={sendResult.queuedCount}
            estimatedCost={sendResult.estimatedCost}
            scheduledAt={sendResult.scheduledAt}
            onDone={() => {
              setSendResult(null);
              onSuccess?.();
            }}
          />
        ) : (
        <div className="space-y-4">
          <DueReminderStepper activeStep={activeStep} onStepClick={setActiveStep} />
          {activeStep === 'review' ? (
            <DueRecipientReviewPanel
              recipients={recipients}
              selectedKeys={selectedRecipientKeys}
              alreadyRemindedIds={focused.alreadyRemindedIds || []}
              onSelectionChange={setSelectedRecipientKeys}
            />
          ) : null}
          {activeStep === 'message' ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.85fr)]">
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
          ) : null}
          {activeStep === 'confirm' ? (
            <div className="space-y-4">
              <section className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-bold text-slate-950">Final Confirmation</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <SummaryItem label="Selected" value={pickedRecipients.length.toLocaleString()} />
                  <SummaryItem label="Will Send" value={deliverableRecipients.length.toLocaleString()} tone="emerald" />
                  <SummaryItem label="Already Reminded" value={(pickedRecipients.length - deliverableRecipients.length - invalidSelectedCount).toLocaleString()} tone="amber" />
                  <SummaryItem label="Invalid Mobile" value={invalidSelectedCount.toLocaleString()} tone="rose" />
                  <SummaryItem label="Est. Cost" value={`৳${estimatedCost.toFixed(2)}`} tone="emerald" />
                </div>
                {composer.campaignName ? (
                  <p className="mt-4 text-sm text-slate-600">
                    Campaign: <strong>{composer.campaignName}</strong>
                  </p>
                ) : null}
                {composer.scheduledAt ? (
                  <p className="mt-2 text-sm text-slate-600">
                    Scheduled for <strong>{new Date(composer.scheduledAt).toLocaleString()}</strong>
                  </p>
                ) : null}
                {requiresConfirmAck ? (
                  <label className="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <Checkbox checked={confirmChecked} onCheckedChange={(checked) => setConfirmChecked(checked === true)} className="mt-0.5" />
                    <span className="text-sm text-slate-700">
                      I confirm sending due reminders to <strong>{deliverableRecipients.length}</strong> students
                      {estimatedCost > 0 ? <> (estimated cost <strong>৳{estimatedCost.toFixed(2)}</strong>)</> : null}.
                    </span>
                  </label>
                ) : null}
              </section>
              <RenderedPreview preview={preview} recipient={sampleRecipient} />
            </div>
          ) : null}
        </div>
        )
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)]">
          <div className="space-y-4">
            <RecipientPreview
              recipients={recipients}
              selected={[]}
              locked
              variant={focused.recipientVariant || 'default'}
              onSelectionChange={() => undefined}
            />
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

      {sendResult ? null : (
      <div className="sticky bottom-0 z-10 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 grid-cols-2 gap-1.5 text-xs sm:grid-cols-4 lg:grid-cols-7">
            <SummaryItem label="Method" value={focused?.contextLabel || METHOD_META[method].label} />
            <SummaryItem label="SMS Mode" value={selectedModeLabel} />
            <SummaryItem label="Sender" value={selectedSenderLabel} />
            <SummaryItem label="Recipients" value={(isSteppedDue ? deliverableRecipients.length : pickedRecipients.length).toLocaleString()} />
            <SummaryItem label="Total SMS" value={totalSms.toLocaleString()} />
            <SummaryItem label="Est. Cost" value={`৳${estimatedCost.toFixed(2)}`} tone="emerald" />
            <SummaryItem
              label="Balance After"
              value={availableBalance === undefined ? '-' : `৳${Math.max(0, availableBalance - estimatedCost).toFixed(2)}`}
              tone={availableBalance !== undefined && availableBalance - estimatedCost < 0 ? 'rose' : 'slate'}
            />
          </div>
          {isSteppedDue ? (
            <div className="flex flex-wrap items-center gap-2">
              {activeStep !== 'review' ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStep(activeStep === 'confirm' ? 'message' : 'review')}
                >
                  Back
                </Button>
              ) : null}
              {activeStep === 'review' ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Button
                        type="button"
                        disabled={!!reviewContinueDisabled}
                        onClick={() => setActiveStep('message')}
                      >
                        Continue
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {reviewContinueDisabled ? <TooltipContent>{reviewContinueDisabled}</TooltipContent> : null}
                </Tooltip>
              ) : null}
              {activeStep === 'message' ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Button
                        type="button"
                        disabled={!!messageContinueDisabled}
                        onClick={() => {
                          setConfirmChecked(false);
                          setActiveStep('confirm');
                        }}
                      >
                        Continue
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {messageContinueDisabled ? <TooltipContent>{messageContinueDisabled}</TooltipContent> : null}
                </Tooltip>
              ) : null}
              {activeStep === 'confirm' ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Button
                        type="button"
                        disabled={!!disabledReason || !!confirmBlockedReason || (isSteppedDue && deliverableRecipients.length === 0) || submitting}
                        onClick={() => void queueSms()}
                        className="h-11 gap-2"
                      >
                        <Send className="h-4 w-4" />
                        {queueButtonLabel || 'Queue SMS'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {(sendBlockedReason || confirmBlockedReason || disabledReason) ? (
                    <TooltipContent>{sendBlockedReason || confirmBlockedReason || disabledReason}</TooltipContent>
                  ) : null}
                </Tooltip>
              ) : null}
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button type="button" disabled={!!disabledReason || submitting} onClick={() => void queueSms()} className="h-11 gap-2">
                    <Send className="h-4 w-4" />
                    {queueButtonLabel || 'Queue SMS'}
                  </Button>
                </span>
              </TooltipTrigger>
              {disabledReason ? <TooltipContent>{disabledReason}</TooltipContent> : null}
            </Tooltip>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'slate' | 'emerald' | 'amber' | 'rose' }) {
  const toneClass = tone === 'emerald' ? 'text-emerald-700' : tone === 'rose' ? 'text-rose-700' : tone === 'amber' ? 'text-amber-700' : 'text-slate-950';
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-3 sm:py-2">
      <p className="truncate text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 sm:mt-1 truncate text-xs sm:text-sm font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
