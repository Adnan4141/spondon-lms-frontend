'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Branch } from '@/lib/api/branches';
import type { SmsBalance, SmsWalletLedger } from '@/lib/api/sms';
import type { SmsBalancesActionsHook } from '../hooks/useSmsManagement';
import { EmptyState, formatBdt, formatRemainingBdt, Panel } from '../sms-shared';

export function SmsBalancesTab({
  orgBalance,
  branches,
  branchBalances,
  walletLedger,
  smsTransactions,
  balanceState,
  balanceActions,
  providerBalanceValue,
  isBranchAdmin = false,
}: {
  orgBalance: SmsBalance | undefined;
  branches: Branch[];
  branchBalances: SmsBalance[];
  walletLedger: SmsWalletLedger[];
  smsTransactions: Array<{ id: string; quantity: number; status: string; totalAmount: string | number; createdAt: string }>;
  balanceState: SmsBalancesActionsHook['state'];
  balanceActions: SmsBalancesActionsHook['actions'];
  providerBalanceValue?: string;
  isBranchAdmin?: boolean;
}) {
  const { orgBalanceInput, orgDeductInput, transfer, purchase, pricingForm, smsPricing, submitting } = balanceState;
  const {
    setOrgBalanceInput,
    setOrgDeductInput,
    setTransfer,
    setPurchase,
    setPricingForm,
    handleBalanceUpdate,
    handleBalanceDeduct,
    handleTransfer,
    handlePurchaseSms,
    handleSavePricing,
  } = balanceActions;

  const centralDisplay = formatRemainingBdt(orgBalance?.balanceCount);
  const providerDisplay = providerBalanceValue?.trim() || 'Unavailable';
  const branchTotal = branchBalances.reduce((sum, balance) => sum + Number(balance.balanceCount || 0), 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
      <div className="space-y-4">
        {!isBranchAdmin && (
          <Panel title="Central Wallet Balance">
            <div className="space-y-3">
              <p className="text-3xl font-bold text-emerald-700">{centralDisplay}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Shiram Provider Balance</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{providerDisplay}</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Branch wallet total</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{formatRemainingBdt(branchTotal)}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Wallet balances are in BDT (৳). Shiram provider balance is read-only reference credit from the SMS gateway.
              </p>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Top-up amount (BDT)"
                  value={orgBalanceInput}
                  onChange={(event) => setOrgBalanceInput(event.target.value)}
                  className="bg-white"
                />
                <Button type="button" onClick={() => void handleBalanceUpdate()} disabled={submitting}>
                  Add balance
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Deduct amount (BDT)"
                  value={orgDeductInput}
                  onChange={(event) => setOrgDeductInput(event.target.value)}
                  className="bg-white"
                />
                <Button type="button" variant="outline" onClick={() => void handleBalanceDeduct()} disabled={submitting}>
                  Deduct
                </Button>
              </div>
              <p className="text-sm font-semibold text-slate-700">Sell Balance to Branch</p>
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
                  step="0.01"
                  min="0"
                  placeholder="Amount (BDT)"
                  value={transfer.count}
                  onChange={(event) => setTransfer((prev) => ({ ...prev, count: event.target.value }))}
                  className="bg-white"
                />
                <Button type="button" variant="outline" onClick={() => void handleTransfer()} disabled={submitting}>
                  Sell
                </Button>
              </div>
            </div>
          </Panel>
        )}
        {!isBranchAdmin && (
          <Panel title="Branch purchase pricing">
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Minimum top-up amount when branches buy credit via bKash.</p>
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
              <div>
                <Label className="text-xs">Minimum purchase (BDT)</Label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="e.g. 100"
                  value={pricingForm.minPurchase}
                  onChange={(event) => setPricingForm((prev) => ({ ...prev, minPurchase: event.target.value }))}
                  className="mt-1 bg-white"
                />
              </div>
              <Button type="button" variant="outline" onClick={() => void handleSavePricing()} disabled={submitting}>
                Save minimum
              </Button>
            </div>
          </Panel>
        )}
        {isBranchAdmin && (
          <Panel title="Purchase credit">
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Amount (BDT)</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder={`Min ${formatBdt(smsPricing.minPurchase)}`}
                  value={purchase.quantity}
                  onChange={(event) => setPurchase((prev) => ({ ...prev, quantity: event.target.value }))}
                  className="mt-1 bg-white"
                />
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold">You will pay</p>
                <p className="mt-1 text-2xl font-bold">{formatBdt(Number(purchase.quantity || 0))}</p>
                <p className="text-xs text-slate-500">Minimum {formatBdt(smsPricing.minPurchase)} · Paid via bKash</p>
              </div>
              <Button type="button" onClick={() => void handlePurchaseSms()} disabled={submitting}>
                Buy credit
              </Button>
            </div>
          </Panel>
        )}
      </div>
      <Panel title={isBranchAdmin ? 'Branch Wallet Balance' : 'Branch Wallets'}>
        <div className="grid gap-2 md:grid-cols-2">
          {branchBalances.map((balance) => (
            <div key={balance.id} className="rounded-md border border-slate-200 p-3">
              <p className="truncate font-semibold">{balance.branch?.name || 'Branch'}</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{formatRemainingBdt(balance.balanceCount)}</p>
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
                  <span>{formatBdt(tx.totalAmount)}</span>
                  <Badge variant="outline">{tx.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold">Wallet Ledger / Recent Transactions</p>
          <div className="mt-2 space-y-2">
            {walletLedger.map((row) => (
              <div key={row.id} className="grid gap-1 rounded-md bg-white px-3 py-2 text-sm sm:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{row.type.replace(/_/g, ' ')}</p>
                  <p className="truncate text-xs text-slate-500">{row.note || row.referenceType || new Date(row.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className={Number(row.amount) < 0 ? 'font-bold text-rose-600' : 'font-bold text-emerald-700'}>
                    {formatBdt(row.amount)}
                  </p>
                  <p className="text-xs text-slate-500">Balance {formatBdt(row.balanceAfter)}</p>
                </div>
              </div>
            ))}
            {walletLedger.length === 0 && <EmptyState>No wallet ledger entries yet.</EmptyState>}
          </div>
        </div>
      </Panel>
    </div>
  );
}
