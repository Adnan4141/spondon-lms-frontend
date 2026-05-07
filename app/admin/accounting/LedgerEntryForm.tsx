'use client';

import { useMemo, useState, type FormEvent } from 'react';
import {
  createLedgerEntry,
  updateLedgerEntry,
  type Account,
  type CreateLedgerEntryPayload,
  type LedgerEntry,
} from '@/lib/api/accounting';
import type { DistributionChannel, StockSource } from '@/lib/api/books';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AdminDatePicker } from '@/features/admin/shared/form/AdminField';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';
import { FLOW_TYPES, SOURCE_TYPES } from './constants';
import type { SourceTypeValue } from './types';
import { fmtCur, isMoneyAccount, parseAmount } from './utils';

type FlowType = CreateLedgerEntryPayload['flowType'];

export function LedgerEntryForm({
  accounts,
  stockSources,
  channels,
  onSuccess,
  onCancel,
  mode = 'create',
  initialEntry,
}: {
  accounts: Account[];
  stockSources: StockSource[];
  channels: DistributionChannel[];
  onSuccess: () => void;
  onCancel: () => void;
  mode?: 'create' | 'edit';
  initialEntry?: LedgerEntry | null;
}) {
  const { toast } = useToast();
  const [entryDate, setEntryDate] = useState(initialEntry?.entryDate ? new Date(initialEntry.entryDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [flowType, setFlowType] = useState<FlowType>((initialEntry?.flowType as FlowType) || 'CREDIT');
  const [amount, setAmount] = useState(initialEntry?.amount != null ? String(initialEntry.amount) : '');
  const [accountId, setAccountId] = useState(initialEntry?.accountId || '');
  const [toAccountId, setToAccountId] = useState('');
  const [sourceType, setSourceType] = useState<SourceTypeValue>((initialEntry?.sourceType as SourceTypeValue) || 'NONE');
  const [sourceId, setSourceId] = useState(initialEntry?.sourceType === 'OTHER' ? '' : initialEntry?.sourceId || '');
  const [manualSourceLabel, setManualSourceLabel] = useState(initialEntry?.sourceType === 'OTHER' ? initialEntry?.sourceId || '' : '');
  const [purpose, setPurpose] = useState(initialEntry?.purpose || '');
  const [description, setDescription] = useState(initialEntry?.description || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moneyAccounts = useMemo(() => accounts.filter((account) => account.isActive && isMoneyAccount(account)), [accounts]);
  const numericAmount = parseAmount(amount);

  const sourceOptions =
    sourceType === 'STOCK_SOURCE'
      ? stockSources.map((source) => ({ value: source.id, label: source.name }))
      : sourceType === 'DISTRIBUTION_CHANNEL'
        ? channels.map((channel) => ({ value: channel.id, label: channel.name }))
        : [];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!entryDate) {
      setError('Date is required.');
      return;
    }
    if (!flowType) {
      setError('Select an entry type.');
      return;
    }
    if (!accountId) {
      setError(flowType === 'TRANSFER' ? 'Select the account money is moving from.' : 'Select an account.');
      return;
    }
    if (numericAmount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    if (flowType === 'TRANSFER' && (!toAccountId || toAccountId === accountId)) {
      setError('Transfer needs a different destination account.');
      return;
    }
    if (sourceType !== 'NONE' && sourceType !== 'OTHER' && !sourceId) {
      setError('Select a source reference for the chosen source type.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateLedgerEntryPayload = {
        entryDate,
        flowType,
        amount: Number(numericAmount.toFixed(2)),
        accountId,
        toAccountId: flowType === 'TRANSFER' ? toAccountId : undefined,
        sourceType: sourceType === 'NONE' ? undefined : sourceType,
        sourceId:
          sourceType === 'OTHER'
            ? manualSourceLabel.trim() || undefined
            : sourceId || undefined,
        purpose: purpose.trim() || undefined,
        description: description.trim() || undefined,
      };
      const res = mode === 'edit' && initialEntry?.id
        ? await updateLedgerEntry(initialEntry.id, payload)
        : await createLedgerEntry(payload);
      if (!res.success) throw new Error(res.message || (mode === 'edit' ? 'Update failed' : 'Create failed'));
      toast({ title: mode === 'edit' ? 'Daily entry updated' : 'Daily entry saved', variant: 'success' });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = 'h-10 rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
        Entries are recorded only for head office. Balance always follows credit minus debit.
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Date *</Label>
          <AdminDatePicker className={cn(inputCls, 'mt-1')} value={entryDate} onChange={setEntryDate} placeholder="Select date" disabled={submitting} />
        </div>
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Type *</Label>
          <Select value={flowType} onValueChange={(v) => setFlowType(v as FlowType)}>
            <SelectTrigger className={cn(inputCls, 'mt-1')}><SelectValue /></SelectTrigger>
            <SelectContent>
              {FLOW_TYPES.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Amount *</Label>
          <Input type="number" min="0.01" step="0.01" className={cn(inputCls, 'mt-1')} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">
            {flowType === 'TRANSFER' ? 'From Account *' : 'Account *'}
          </Label>
          <Select value={accountId || 'none'} onValueChange={(v) => setAccountId(v === 'none' ? '' : v)}>
            <SelectTrigger className={cn(inputCls, 'mt-1')}><SelectValue placeholder="Select account" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select account</SelectItem>
              {moneyAccounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.code} - {account.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {flowType === 'TRANSFER' ? (
          <div>
            <Label className="text-xs font-black uppercase tracking-wider text-slate-500">To Account *</Label>
            <Select value={toAccountId || 'none'} onValueChange={(v) => setToAccountId(v === 'none' ? '' : v)}>
              <SelectTrigger className={cn(inputCls, 'mt-1')}><SelectValue placeholder="Select destination" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select destination</SelectItem>
                {moneyAccounts.filter((account) => account.id !== accountId).map((account) => <SelectItem key={account.id} value={account.id}>{account.code} - {account.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Source</Label>
          <Select value={sourceType} onValueChange={(v) => { setSourceType(v as SourceTypeValue); setSourceId(''); setManualSourceLabel(''); }}>
            <SelectTrigger className={cn(inputCls, 'mt-1')}><SelectValue /></SelectTrigger>
            <SelectContent>
              {SOURCE_TYPES.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {sourceType === 'OTHER' ? (
          <div>
            <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Source Name</Label>
            <Input className={cn(inputCls, 'mt-1')} value={manualSourceLabel} onChange={(e) => setManualSourceLabel(e.target.value)} placeholder="Manual source label" />
          </div>
        ) : sourceType !== 'NONE' ? (
          <div>
            <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Source Reference</Label>
            <Select value={sourceId || 'none'} onValueChange={(v) => setSourceId(v === 'none' ? '' : v)}>
              <SelectTrigger className={cn(inputCls, 'mt-1')}><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select source</SelectItem>
                {sourceOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="md:col-span-2">
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Purpose</Label>
          <Input className={cn(inputCls, 'mt-1')} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Fee collection, salary, rent, book sale, etc." />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Note</Label>
          <Input className={cn(inputCls, 'mt-1')} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Selected Amount</p>
          <p className="mt-1 text-xl font-black text-slate-900">{fmtCur(numericAmount)}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700 hover:text-white" disabled={submitting}>
          {submitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
          {mode === 'edit' ? 'Update entry' : 'Save entry'}
        </Button>
      </div>
    </form>
  );
}
