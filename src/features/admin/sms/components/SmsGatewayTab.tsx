'use client';

import { Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { SmsGatewayActionsHook } from '../hooks/useSmsManagement';
import { Panel } from '../sms-shared';

export function SmsGatewayTab({
  gatewayState,
  gatewayActions,
}: {
  gatewayState: SmsGatewayActionsHook['state'];
  gatewayActions: SmsGatewayActionsHook['actions'];
}) {
  const { config, providerBalanceValue, providerBalanceError, submitting } = gatewayState;
  const { setConfig, handleSaveGateway } = gatewayActions;
  const gatewayNotConfigured = providerBalanceValue === 'Gateway not configured';
  const providerLabel = config.provider?.trim() || 'Shiram';

  return (
    <Panel title={`${providerLabel} SMS Gateway`}>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3 lg:col-span-2">
          <p className="text-xs font-semibold uppercase text-slate-500">Remaining balance (BDT)</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-2xl font-bold text-emerald-800">{providerBalanceValue}</span>
            <Badge variant="outline" className={providerBalanceError ? 'border-amber-200 text-amber-700' : 'border-emerald-200 text-emerald-700'}>
              {providerBalanceError ? (gatewayNotConfigured ? 'Not configured' : 'Gateway warning') : 'Connected'}
            </Badge>
          </div>
          {providerBalanceError ? <p className="mt-2 text-sm text-amber-700">{providerBalanceError}</p> : null}
          <p className="mt-2 text-xs text-slate-500">
         
            Rates below are for send configuration only.
          </p>
        </div>
        <div>
          <Label>Provider</Label>
          <Input
            value={config.provider || 'Shiram'}
            onChange={(event) => setConfig((prev) => ({ ...prev, provider: event.target.value }))}
            className="mt-1 bg-white"
            placeholder="Shiram"
          />
        </div>
        <div>
          <Label>API Key</Label>
          <Input
            type="password"
            autoComplete="off"
            value={config.apiKey || ''}
            onChange={(event) => setConfig((prev) => ({ ...prev, apiKey: event.target.value }))}
            className="mt-1 bg-white"
          />
        </div>
        <div>
          <Label>Masking Sender ID</Label>
          <Input
            value={config.senderId || ''}
            onChange={(event) => setConfig((prev) => ({ ...prev, senderId: event.target.value }))}
            className="mt-1 bg-white"
          />
        </div>
        <div>
          <Label>Non-masking Number</Label>
          <Input
            value={config.nonMaskingNumber || ''}
            onChange={(event) => setConfig((prev) => ({ ...prev, nonMaskingNumber: event.target.value }))}
            className="mt-1 bg-white"
          />
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <Label>Masking rate (BDT / segment)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={config.maskingRate ?? 0.5}
            onChange={(event) => setConfig((prev) => ({ ...prev, maskingRate: Number(event.target.value) }))}
            className="mt-1 bg-white"
          />
          <p className="mt-1 text-xs text-slate-500">Used when sending branded SMS — not shown on balance cards.</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <Label>Non-masking rate (BDT / segment)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={config.nonMaskingRate ?? 0.35}
            onChange={(event) => setConfig((prev) => ({ ...prev, nonMaskingRate: Number(event.target.value) }))}
            className="mt-1 bg-white"
          />
          <p className="mt-1 text-xs text-slate-500">Used for generic sender number SMS.</p>
        </div>
        <div className="flex items-center justify-between rounded-md border border-slate-200 p-3 lg:col-span-2">
          <Label>Active gateway</Label>
          <Switch checked={config.isActive ?? true} onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, isActive: checked }))} />
        </div>
        <Button type="button" onClick={() => void handleSaveGateway()} disabled={submitting} className="w-fit gap-2">
          <Save className="h-4 w-4" /> Save Gateway
        </Button>
      </div>
    </Panel>
  );
}
