'use client';

import { CalendarClock, Copy, RotateCcw, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { Branch } from '@/lib/api/branches';
import type { SmsSystemSetting, SmsTemplate } from '@/lib/api/sms';
import type { SmsSystemSettingsHook } from '../hooks/useSmsManagement';
import { EmptyState, Panel, RateCard, smsTypeLabels, systemTypes } from '../sms-shared';

// ─── Per-type left-border colour ─────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  OTP:                 'border-l-purple-400',
  PAYMENT_CONFIRMATION:'border-l-emerald-400',
  DUE_REMINDER:        'border-l-amber-400',
  BIRTHDAY:            'border-l-pink-400',
  RESULT:              'border-l-blue-400',
  ENROLLMENT_NOTICE:   'border-l-indigo-400',
};

// ─── Branch override badge ────────────────────────────────────────────────────
function BranchSourceBadge({
  branchId,
  type,
  getBranchSetting,
  getEffectiveBranchSetting,
}: {
  branchId: string;
  type: string;
  getBranchSetting: (id: string, t: string) => SmsSystemSetting | undefined;
  getEffectiveBranchSetting: (id: string, t: string) => SmsSystemSetting;
}) {
  const override = getBranchSetting(branchId, type);
  const effective = getEffectiveBranchSetting(branchId, type);
  if (!override) {
    return (
      <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-600" title="Inherits organization default">
        Default
      </Badge>
    );
  }
  if (effective.balanceSource === 'ORG') {
    return (
      <Badge variant="outline" className="border-blue-200 text-blue-800" title="Custom — central balance">
        Central
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-emerald-200 text-emerald-800" title="Custom — branch balance">
      Branch
    </Badge>
  );
}

// ─── Policy row (shared by org + branch sections) ────────────────────────────
function PolicyRow({
  type,
  setting,
  templates,
  onToggle,
  onBalanceChange,
  onMaskingChange,
  onTemplateChange,
}: {
  type: string;
  setting: SmsSystemSetting;
  templates: SmsTemplate[];
  onToggle: (checked: boolean) => void;
  onBalanceChange: (value: 'ORG' | 'BRANCH') => void;
  onMaskingChange: (value: string) => void;
  onTemplateChange: (value: string) => void;
}) {
  const colorBorder = TYPE_COLORS[type] || 'border-l-slate-300';
  const templateValue =
    setting.templateKey && templates.some((t) => t.key === setting.templateKey)
      ? setting.templateKey
      : 'default';

  return (
    <div
      className={`grid gap-3 rounded-md border border-slate-200 border-l-4 ${colorBorder} bg-white p-3 transition-opacity ${
        setting.isEnabled ? '' : 'opacity-60'
      } lg:grid-cols-[1.3fr_.8fr_.75fr_1fr] lg:items-center`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Switch checked={setting.isEnabled} onCheckedChange={onToggle} />
        <div className="min-w-0">
          <p className={`truncate font-semibold text-slate-950 ${setting.isEnabled ? '' : 'italic text-slate-400'}`}>
            {smsTypeLabels[type] || type}
          </p>
          <p className="text-xs text-slate-500">{setting.isEnabled ? 'Enabled' : 'Disabled'}</p>
        </div>
      </div>
      <Select value={setting.balanceSource} onValueChange={onBalanceChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ORG">Central Balance</SelectItem>
          <SelectItem value="BRANCH">Branch Balance</SelectItem>
        </SelectContent>
      </Select>
      <Select value={setting.isMasking ? 'masking' : 'non-masking'} onValueChange={onMaskingChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="masking">Masking</SelectItem>
          <SelectItem value="non-masking">Non-masking</SelectItem>
        </SelectContent>
      </Select>
      <Select value={templateValue} onValueChange={onTemplateChange}>
        <SelectTrigger><SelectValue placeholder="Template" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default message</SelectItem>
          {templates.map((t) => (
            <SelectItem key={t.key} value={t.key}>{t.key}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function SmsSystemTab({
  templates,
  branches,
  settingsState,
  settingsActions,
}: {
  templates: SmsTemplate[];
  branches: Branch[];
  settingsState: SmsSystemSettingsHook['state'];
  settingsActions: SmsSystemSettingsHook['actions'];
}) {
  const { policyBranchId, dueMonth, submitting, branchRateForm, branchRateSource, branchRatesLoading } = settingsState;
  const {
    setPolicyBranchId,
    setDueMonth,
    setBranchRateForm,
    getOrgSetting,
    getBranchSetting,
    getEffectiveBranchSetting,
    saveSetting,
    queueDueReminder,
    resetBranchToDefaultPolicy,
    copyOrgDefaultsToBranch,
    setAllTypesBranchBalance,
    saveBranchRates,
  } = settingsActions;

  return (
    <div className="space-y-4">
      {/* ── Default SMS Policy ── */}
      <Panel title="Default SMS Policy">
        <p className="mb-3 text-xs text-slate-500">
          Organization-wide defaults. Each branch inherits these unless you add an override below.
        </p>
        <div className="space-y-2">
          {systemTypes.map((type) => {
            const setting = getOrgSetting(type);
            return (
              <PolicyRow
                key={type}
                type={type}
                setting={setting}
                templates={templates}
                onToggle={(checked) => void saveSetting(type, { isEnabled: checked })}
                onBalanceChange={(value) => void saveSetting(type, { balanceSource: value })}
                onMaskingChange={(value) => void saveSetting(type, { isMasking: value === 'masking' })}
                onTemplateChange={(value) => void saveSetting(type, { templateKey: value === 'default' ? null : value })}
              />
            );
          })}
        </div>
      </Panel>

      {/* ── Branch SMS Settings ── */}
      <Panel
        title="Branch SMS Settings"
        action={
          <Select value={policyBranchId || 'none'} onValueChange={(v) => setPolicyBranchId(v === 'none' ? '' : v)}>
            <SelectTrigger className="h-9 w-[220px] max-w-[55vw] bg-white">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select branch</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        <p className="mb-3 text-xs text-slate-500">
          Pick a branch to configure overrides. Without overrides, branches inherit the default policy above.
        </p>

        {policyBranchId ? (
          <div className="space-y-4">
            {/* Branch rates */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">Branch SMS Rates</p>
                  <Badge
                    variant="outline"
                    className={branchRateSource === 'CUSTOM' ? 'border-emerald-200 text-emerald-800' : 'border-slate-300 text-slate-600'}
                  >
                    {branchRateSource === 'CUSTOM' ? 'Custom rates' : 'Inherited rates'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">Rates apply branch-wide to all SMS types.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <RateCard
                  label="Masking rate"
                  description="Branded mask — cost per segment."
                  value={branchRateForm.maskingRate}
                  disabled={branchRatesLoading}
                  onChange={(v) => setBranchRateForm((prev) => ({ ...prev, maskingRate: v }))}
                />
                <RateCard
                  label="Non-masking rate"
                  description="Generic number — cost per segment."
                  value={branchRateForm.nonMaskingRate}
                  disabled={branchRatesLoading}
                  onChange={(v) => setBranchRateForm((prev) => ({ ...prev, nonMaskingRate: v }))}
                />
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  disabled={submitting || branchRatesLoading}
                  onClick={() => void saveBranchRates(policyBranchId)}
                  className="gap-2"
                >
                  Save Rates
                </Button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
              <Button
                type="button" variant="outline" size="sm"
                disabled={submitting}
                onClick={() => void resetBranchToDefaultPolicy(policyBranchId)}
                className="gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
              </Button>
              <Button
                type="button" variant="outline" size="sm"
                disabled={submitting}
                onClick={() => void copyOrgDefaultsToBranch(policyBranchId)}
                className="gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" /> Copy org defaults
              </Button>
              <Button
                type="button" variant="outline" size="sm"
                disabled={submitting}
                onClick={() => void setAllTypesBranchBalance(policyBranchId)}
                className="gap-1.5"
              >
                <Wallet className="h-3.5 w-3.5" /> Use branch balance for all
              </Button>
            </div>

            {/* Per-type policy rows */}
            <div className="hidden grid-cols-[1.35fr_.85fr_.8fr_1fr] gap-3 px-3 text-xs font-semibold uppercase text-slate-400 lg:grid">
              <span>SMS Type</span><span>Balance</span><span>Mode</span><span>Template</span>
            </div>
            <div className="space-y-2">
              {systemTypes.map((type) => {
                const branchSetting = getBranchSetting(policyBranchId, type);
                const setting = branchSetting || getOrgSetting(type);
                return (
                  <PolicyRow
                    key={type}
                    type={type}
                    setting={setting}
                    templates={templates}
                    onToggle={(checked) => void saveSetting(type, { isEnabled: checked }, { scope: 'BRANCH', branchId: policyBranchId })}
                    onBalanceChange={(value) => void saveSetting(type, { balanceSource: value }, { scope: 'BRANCH', branchId: policyBranchId })}
                    onMaskingChange={(value) => void saveSetting(type, { isMasking: value === 'masking' }, { scope: 'BRANCH', branchId: policyBranchId })}
                    onTemplateChange={(value) => void saveSetting(type, { templateKey: value === 'default' ? null : value }, { scope: 'BRANCH', branchId: policyBranchId })}
                  />
                );
              })}
            </div>

            {/* Branch × type overview table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <th className="px-3 py-2">Branch</th>
                    {systemTypes.map((type) => (
                      <th key={type} className="px-3 py-2">{smsTypeLabels[type] || type}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch) => (
                    <tr key={branch.id} className="border-b border-slate-100 bg-white transition-colors hover:bg-slate-50 last:border-0">
                      <td className="px-3 py-2 font-semibold text-slate-900">{branch.name}</td>
                      {systemTypes.map((type) => (
                        <td key={type} className="px-3 py-2">
                          <BranchSourceBadge
                            branchId={branch.id}
                            type={type}
                            getBranchSetting={getBranchSetting}
                            getEffectiveBranchSetting={getEffectiveBranchSetting}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState>Select a branch to edit its SMS overrides.</EmptyState>
        )}
      </Panel>

      {/* ── Monthly Due Reminder ── */}
      <Panel title="Monthly Due Reminder">
        <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5">
          <CalendarClock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <div className="text-xs text-amber-800">
            <p className="font-semibold">Queue due reminders for a billing month</p>
            <p className="mt-0.5">
              SMS messages will be queued for all students with outstanding dues in the selected month.
              You can queue again later if reminders need to be resent.
              Timezone: <span className="font-semibold">BST (Asia/Dhaka)</span>.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label>Billing month</Label>
            <Input
              type="month"
              value={dueMonth}
              onChange={(e) => setDueMonth(e.target.value)}
              className="mt-1 bg-white"
            />
          </div>
          <Button type="button" disabled={submitting} onClick={() => void queueDueReminder()} className="gap-2">
            <CalendarClock className="h-4 w-4" /> Queue Due SMS
          </Button>
        </div>
      </Panel>
    </div>
  );
}
