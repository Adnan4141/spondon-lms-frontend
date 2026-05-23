'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Branch } from '@/lib/api/branches';
import type { SmsBalance } from '@/lib/api/sms';
import type { SmsBalancesActionsHook } from '../hooks/useSmsManagement';
import { EmptyState, formatBdt, formatRemainingBdt, formatSmsCredits, ledgerBalanceToBdt, Panel } from '../sms-shared';

export function SmsBalancesTab({
  orgBalance,
  branches,
  branchBalances,
  smsTransactions,
  balanceState,
  balanceActions,
  providerBalanceValue,
  isBranchAdmin = false,
}: {
  orgBalance: SmsBalance | undefined;
  branches: Branch[];
  branchBalances: SmsBalance[];
  smsTransactions: Array<{ id: string; quantity: number; status: string; totalAmount: string | number; createdAt: string }>;
  balanceState: SmsBalancesActionsHook['state'];
  balanceActions: SmsBalancesActionsHook['actions'];
  providerBalanceValue?: string;
  isBranchAdmin?: boolean;
}) {
  const { orgBalanceInput, transfer, purchase, pricingForm, smsPricing, submitting } = balanceState;
  const {
    setOrgBalanceInput,
    setTransfer,
    setPurchase,
    setPricingForm,
    handleBalanceUpdate,
    handleTransfer,
    handlePurchaseSms,
    handleSavePricing,
  } = balanceActions;

  const centralBdt = ledgerBalanceToBdt(orgBalance?.balanceCount, smsPricing.pricePerSms);

  return (
    <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
      <div className="space-y-4">
        {!isBranchAdmin && (
          <Panel title="Central remaining credit">
            <div className="space-y-3">
              <p className="text-3xl font-bold text-emerald-700">{formatRemainingBdt(providerBalanceValue ?? centralBdt)}</p>
              {orgBalance?.balanceCount != null ? (
                <p className="text-xs font-medium text-slate-500">Internal units: {formatSmsCredits(orgBalance.balanceCount)}</p>
              ) : null}
              <p className="text-xs text-slate-500">Wallet balance from your SMS provider (BDT). Internal units are deducted per SMS segment when sending.</p>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  type="number"
                  placeholder="Set internal SMS units"
                  value={orgBalanceInput}
                  onChange={(event) => setOrgBalanceInput(event.target.value)}
                  className="bg-white"
                />
                <Button type="button" onClick={() => void handleBalanceUpdate()} disabled={submitting}>
                  Update units
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_130px_auto]">
                <Select value={transfer.branchId} onValueChange={(value) => setTransfer((prev) => ({ ...prev, branchId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Units"
                  value={transfer.count}
                  onChange={(event) => setTransfer((prev) => ({ ...prev, count: event.target.value }))}
                  className="bg-white"
                />
                <Button type="button" variant="outline" onClick={() => void handleTransfer()} disabled={submitting}>
                  Transfer
                </Button>
              </div>
            </div>
          </Panel>
        )}
        {!isBranchAdmin && (
          <Panel title="Branch purchase pricing">
            <div className="space-y-3">
              <p className="text-xs text-slate-500">BDT per SMS when branches buy credits via bKash (not shown on balance cards).</p>
              <Select value={pricingForm.branchId || 'none'} onValueChange={(value) => setPricingForm((prev) => ({ ...prev, branchId: value === 'none' ? '' : value }))}>
                <SelectTrigger>
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
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">BDT per SMS</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Rate per SMS"
                    value={pricingForm.pricePerSms}
                    onChange={(event) => setPricingForm((prev) => ({ ...prev, pricePerSms: event.target.value }))}
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs">Minimum purchase (units)</Label>
                  <Input
                    type="number"
                    placeholder="Minimum purchase"
                    value={pricingForm.minPurchase}
                    onChange={(event) => setPricingForm((prev) => ({ ...prev, minPurchase: event.target.value }))}
                    className="mt-1 bg-white"
                  />
                </div>
              </div>
              <Button type="button" variant="outline" onClick={() => void handleSavePricing()} disabled={submitting}>
                Save pricing
              </Button>
            </div>
          </Panel>
        )}
        <Panel title="Purchase SMS">
          <div className="space-y-3">
            {!isBranchAdmin && (
              <div className="grid gap-2 sm:grid-cols-2">
                <Select
                  value={purchase.scope}
                  onValueChange={(value) => setPurchase((prev) => ({ ...prev, scope: value, branchId: value === 'ORG' ? '' : prev.branchId }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRANCH">Branch Balance</SelectItem>
                    <SelectItem value="ORG">Central Balance</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={purchase.branchId || 'none'}
                  disabled={purchase.scope !== 'BRANCH'}
                  onValueChange={(value) => setPurchase((prev) => ({ ...prev, branchId: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Branch" />
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
              </div>
            )}
            <Input
              type="number"
              placeholder={`Quantity, min ${smsPricing.minPurchase}`}
              value={purchase.quantity}
              onChange={(event) => setPurchase((prev) => ({ ...prev, quantity: event.target.value }))}
              className="bg-white"
            />
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold">Estimated total</p>
              <p className="mt-1 text-2xl font-bold">{formatBdt(Number(purchase.quantity || 0) * smsPricing.pricePerSms)}</p>
              <p className="text-xs text-slate-500">
                {formatBdt(smsPricing.pricePerSms)} per SMS · Minimum {formatSmsCredits(smsPricing.minPurchase)}
              </p>
            </div>
            <Button type="button" onClick={() => void handlePurchaseSms()} disabled={submitting}>
              Buy Credits
            </Button>
          </div>
        </Panel>
      </div>
      <Panel title="Branch remaining credit">
        <div className="grid gap-2 md:grid-cols-2">
          {branchBalances.map((balance) => (
            <div key={balance.id} className="rounded-md border border-slate-200 p-3">
              <p className="truncate font-semibold">{balance.branch?.name || 'Branch'}</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {formatRemainingBdt(ledgerBalanceToBdt(balance.balanceCount, smsPricing.pricePerSms))}
              </p>
              <p className="text-xs font-medium text-slate-500">Internal units: {formatSmsCredits(balance.balanceCount)}</p>
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
                  <span>
                    {formatBdt(tx.totalAmount)} · {tx.quantity} units
                  </span>
                  <Badge variant="outline">{tx.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
