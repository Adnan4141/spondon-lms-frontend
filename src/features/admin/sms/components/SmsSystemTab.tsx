'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { Branch } from '@/lib/api/branches';
import type { SmsSystemSetting, SmsTemplate } from '@/lib/api/sms';
import type { SmsSystemSettingsHook } from '../hooks/useSmsManagement';
import { EmptyState, Panel, smsTypeLabels, systemTypes } from '../sms-shared';

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
      <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-600" title="Inherits organization default for this type">
        Default
      </Badge>
    );
  }
  if (effective.balanceSource === 'ORG') {
    return (
      <Badge variant="outline" className="border-blue-200 text-blue-800" title="Custom branch policy — central balance">
        Central
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-emerald-200 text-emerald-800" title="Custom branch policy — branch balance">
      Branch
    </Badge>
  );
}

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
  const { policyBranchId, dueMonth, submitting } = settingsState;
  const {
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
  } = settingsActions;

  return (
    <div className="space-y-4">
      <Panel title="Default SMS Policy">
        <p className="mb-3 text-xs text-slate-500">
          Organization-wide defaults. Each branch uses these unless you add a branch override below.
        </p>
        <div className="space-y-2">
          {systemTypes.map((type) => {
            const setting = getOrgSetting(type);
            const templateSelectValue =
              setting.templateKey && templates.some((template) => template.key === setting.templateKey)
                ? setting.templateKey
                : 'default';
            return (
              <div
                key={type}
                className="grid gap-3 rounded-md border border-slate-200 p-3 lg:grid-cols-[1.3fr_.8fr_.75fr_1fr] lg:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Switch
                    checked={setting.isEnabled}
                    onCheckedChange={(checked) => void saveSetting(type, { isEnabled: checked })}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{smsTypeLabels[type] || type}</p>
                    <p className="text-xs text-slate-500">{setting.isEnabled ? 'Enabled' : 'Disabled'} · default queueing</p>
                  </div>
                </div>
                <Select
                  value={setting.balanceSource}
                  onValueChange={(value) => void saveSetting(type, { balanceSource: value as 'ORG' | 'BRANCH' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORG">Central Balance</SelectItem>
                    <SelectItem value="BRANCH">Branch Balance</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={setting.isMasking ? 'masking' : 'non-masking'}
                  onValueChange={(value) => void saveSetting(type, { isMasking: value === 'masking' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masking">Masking</SelectItem>
                    <SelectItem value="non-masking">Non-masking</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={templateSelectValue}
                  onValueChange={(value) => void saveSetting(type, { templateKey: value === 'default' ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default message</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.key} value={template.key}>
                        {template.key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel
        title="Branch SMS Settings"
        action={
          <Select value={policyBranchId || 'none'} onValueChange={(value) => setPolicyBranchId(value === 'none' ? '' : value)}>
            <SelectTrigger className="h-9 w-[220px] max-w-[55vw] bg-white">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select branch</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        <p className="mb-3 text-xs text-slate-500">
          Pick a branch to edit overrides. Branches without overrides inherit the default SMS policy above. The table shows effective balance
          source per branch (Default = inherits org; Central / Branch = saved override).
        </p>
        {policyBranchId ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 rounded-md border border-slate-100 bg-slate-50/80 p-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => void resetBranchToDefaultPolicy(policyBranchId)}
              >
                Use default policy
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => void copyOrgDefaultsToBranch(policyBranchId)}
              >
                Copy default to this branch
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => void setAllTypesBranchBalance(policyBranchId)}
              >
                Set all SMS types to branch balance
              </Button>
            </div>
            <div className="space-y-2">
              {systemTypes.map((type) => {
                const branchSetting = getBranchSetting(policyBranchId, type);
                const setting = branchSetting || getOrgSetting(type);
                const templateSelectValue =
                  setting.templateKey && templates.some((template) => template.key === setting.templateKey)
                    ? setting.templateKey
                    : 'default';
                return (
                  <div
                    key={type}
                    className="grid gap-3 rounded-md border border-slate-200 bg-slate-50/60 p-3 lg:grid-cols-[1.35fr_.85fr_.8fr_1fr] lg:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Switch
                        checked={setting.isEnabled}
                        onCheckedChange={(checked) =>
                          void saveSetting(type, { isEnabled: checked }, { scope: 'BRANCH', branchId: policyBranchId })
                        }
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950">{smsTypeLabels[type] || type}</p>
                        <p className="text-xs text-slate-500">
                          {branchSetting ? 'Custom policy' : 'Using default policy'} ·{' '}
                          {setting.balanceSource === 'ORG' ? 'Uses central balance' : 'Uses branch balance'}
                        </p>
                      </div>
                    </div>
                    <Select
                      value={setting.balanceSource}
                      onValueChange={(value) =>
                        void saveSetting(type, { balanceSource: value as 'ORG' | 'BRANCH' }, { scope: 'BRANCH', branchId: policyBranchId })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ORG">Central Balance</SelectItem>
                        <SelectItem value="BRANCH">Branch Balance</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={setting.isMasking ? 'masking' : 'non-masking'}
                      onValueChange={(value) =>
                        void saveSetting(type, { isMasking: value === 'masking' }, { scope: 'BRANCH', branchId: policyBranchId })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masking">Masking</SelectItem>
                        <SelectItem value="non-masking">Non-masking</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={templateSelectValue}
                      onValueChange={(value) =>
                        void saveSetting(
                          type,
                          { templateKey: value === 'default' ? null : value },
                          { scope: 'BRANCH', branchId: policyBranchId },
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default message</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.key} value={template.key}>
                            {template.key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-white text-left text-xs uppercase text-slate-500">
                    <th className="px-3 py-2">Branch</th>
                    {systemTypes.map((type) => (
                      <th key={type} className="px-3 py-2">
                        {smsTypeLabels[type] || type}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch) => (
                    <tr key={branch.id} className="border-b border-slate-100 bg-white last:border-0">
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
          <EmptyState>Select a branch to edit branch SMS overrides.</EmptyState>
        )}
      </Panel>
      <Panel title="Monthly Due Reminder">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label>Billing month</Label>
            <Input type="month" value={dueMonth} onChange={(event) => setDueMonth(event.target.value)} className="mt-1 bg-white" />
          </div>
          <Button type="button" disabled={submitting} onClick={() => void queueDueReminder()}>
            Queue Due SMS
          </Button>
        </div>
      </Panel>
    </div>
  );
}
