'use client';

import { Save, Wifi, WifiOff, ShieldCheck, ShieldAlert, Tag, DollarSign, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SmsGatewayActionsHook } from '../hooks/useSmsManagement';
import { Panel, RateCard } from '../sms-shared';

// ─── Sub-section wrapper ──────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-500" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ─── Read-only env field ──────────────────────────────────────────────────────
function EnvField({
  label,
  configured,
  configuredText,
  missingText,
}: {
  label: string;
  configured: boolean;
  configuredText: string;
  missingText: string;
}) {
  return (
    <div>
      <Label className="text-slate-600">{label}</Label>
      <div className="relative mt-1">
        <Input
          value={configured ? configuredText : missingText}
          readOnly
          className={`pr-10 font-mono text-sm ${
            configured
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {configured ? (
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          )}
        </span>
      </div>
      {!configured && (
        <p className="mt-1 flex items-center gap-1 text-xs text-amber-700">
          <Info className="h-3 w-3" />
          Set this variable in your backend <code className="font-mono">.env</code> file.
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function SmsGatewayTab({
  gatewayState,
  gatewayActions,
}: {
  gatewayState: SmsGatewayActionsHook['state'];
  gatewayActions: SmsGatewayActionsHook['actions'];
}) {
  const { config, providerBalanceValue, providerBalanceError, submitting } = gatewayState;
  const { setConfig, handleSaveGateway } = gatewayActions;

  const providerLabel = config.provider?.trim() || 'Shiram';
  const isConnected = !providerBalanceError;
  const isNotConfigured = providerBalanceValue === 'Gateway not configured';
  const shiramReady = Boolean(config.hasApiEmail && config.hasApiKey);
  const maskingReady = Boolean(config.hasMask || config.senderId?.trim());

  function update(patch: Partial<typeof config>) {
    setConfig((prev) => ({ ...prev, ...patch }));
  }

  return (
    <Panel title={`${providerLabel} SMS Gateway`}>
      <div className="space-y-4">
        {/* ── Balance status hero ── */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 ${
            isConnected
              ? 'border-emerald-200 bg-emerald-50'
              : isNotConfigured
                ? 'border-slate-200 bg-slate-50'
                : 'border-amber-200 bg-amber-50'
          }`}
        >
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                <Wifi className="h-5 w-5 text-emerald-600" />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                <WifiOff className="h-5 w-5 text-slate-400" />
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remaining Balance (BDT)</p>
              <p
                className={`text-2xl font-bold ${
                  isConnected ? 'text-emerald-800' : isNotConfigured ? 'text-slate-400' : 'text-amber-800'
                }`}
              >
                {providerBalanceValue}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              isConnected
                ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                : isNotConfigured
                  ? 'border-slate-200 bg-white text-slate-500'
                  : 'border-amber-300 bg-amber-100 text-amber-700'
            }
          >
            {isConnected ? 'Connected' : isNotConfigured ? 'Not configured' : 'Gateway warning'}
          </Badge>
        </div>
        {providerBalanceError && !isNotConfigured && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {providerBalanceError}
          </p>
        )}

        {/* ── Provider identity (static / env-sourced) ── */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Provider</span>
          </div>
          <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800">
            {providerLabel} · Gateway from .env
          </span>
        </div>

        {/* ── Credentials (env-based, read-only for Shiram) ── */}
        <Section title="Credentials" icon={ShieldCheck}>
          <div className="grid gap-3 sm:grid-cols-2">
            <EnvField
              label="Account email"
              configured={Boolean(config.hasApiEmail)}
              configuredText="● Configured in .env"
              missingText="✕ Missing SHIRAM_SMS_EMAIL"
            />
            <EnvField
              label="API password"
              configured={Boolean(config.hasApiKey)}
              configuredText="● Configured in .env"
              missingText="✕ Missing SHIRAM_SMS_PASSWORD"
            />
          </div>
          <p
            className={`flex items-center gap-1.5 text-xs font-semibold ${
              shiramReady ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {shiramReady ? (
              <ShieldCheck className="h-3.5 w-3.5" />
            ) : (
              <ShieldAlert className="h-3.5 w-3.5" />
            )}
            {shiramReady
              ? 'All env credentials are configured and ready.'
              : 'One or more env credentials are missing. Check your backend .env file.'}
          </p>
        </Section>

        {/* ── Mask label configuration ── */}
        <Section title="Mask labels from .env" icon={Tag}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-slate-600">Masking mask</Label>
              <Input
                value={config.senderId || 'Missing SHIRAM_SMS_MASK'}
                readOnly
                className={`mt-1 ${maskingReady ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}
              />
              <p className="mt-1 text-xs text-slate-400">Sent as Shiram <code>mask</code>; defaults to Spondon.</p>
            </div>
            <div>
              <Label className="text-slate-600">Non-masking label</Label>
              <Input
                value={config.nonMaskingNumber || 'Non-Masking'}
                readOnly
                className="mt-1 border-emerald-200 bg-emerald-50 text-emerald-800"
              />
              <p className="mt-1 text-xs text-slate-400">Configured by <code>SHIRAM_SMS_NON_MASKING_LABEL</code>; defaults to Non-Masking.</p>
            </div>
          </div>
        </Section>

        {/* ── SMS rates ── */}
        <Section title="Default business rates from database" icon={DollarSign}>
          <div className="grid gap-3 sm:grid-cols-2">
            <RateCard
              label="Masking rate"
              description="Branded mask — cost per SMS segment."
              value={config.maskingRate ?? 0.6}
              onChange={(v) => update({ maskingRate: Number(v) })}
            />
            <RateCard
              label="Non-masking rate"
              description="Generic number — cost per SMS segment."
              value={config.nonMaskingRate ?? 0.35}
              onChange={(v) => update({ nonMaskingRate: Number(v) })}
            />
          </div>
        </Section>

        <div className="flex justify-end border-t border-slate-100 pt-2">
          <Button
            type="button"
            onClick={() => void handleSaveGateway()}
            disabled={submitting}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {submitting ? 'Saving...' : 'Save default rates'}
          </Button>
        </div>
      </div>
    </Panel>
  );
}
