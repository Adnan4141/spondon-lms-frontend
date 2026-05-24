'use client';

import { useMemo, useState, type FormEvent } from 'react';
import {
  createLedgerEntry,
  updateLedgerEntry,
  type CreateLedgerEntryPayload,
  type LedgerEntry,
} from '@/lib/api/accounting';
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
import { validateLedgerEntryForm } from './ledgerEntryValidation';
import type { LedgerReferenceData, SourceTypeValue } from './types';
import { fmtCur, isMoneyAccount, parseAmount } from './utils';

type FlowType = CreateLedgerEntryPayload['flowType'];

type Props = LedgerReferenceData & {
  onSuccess: () => void | Promise<void>;
  onCancel: () => void;
  mode?: 'create' | 'edit';
  initialEntry?: LedgerEntry | null;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-semibold text-rose-600">{message}</p>;
}

export function LedgerEntryForm({
  accounts,
  branches,
  stockSources,
  channels,
  onSuccess,
  onCancel,
  mode = 'create',
  initialEntry,
}: Props) {
  const { toast } = useToast();
  const [entryDate, setEntryDate] = useState(
    initialEntry?.entryDate
      ? new Date(initialEntry.entryDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  );
  const initialSourceType = (initialEntry?.sourceType as SourceTypeValue) || 'NONE';
  const [flowType, setFlowType] = useState<FlowType>((initialEntry?.flowType as FlowType) || 'CREDIT');
  const [amount, setAmount] = useState(initialEntry?.amount != null ? String(initialEntry.amount) : '');
  const [accountId, setAccountId] = useState(initialEntry?.accountId || '');
  const [branchId, setBranchId] = useState(
    initialEntry?.branchId || (initialSourceType === 'BRANCH' ? initialEntry?.sourceId || '' : ''),
  );
  const [toAccountId, setToAccountId] = useState(initialEntry?.toAccountId || '');
  const [sourceType, setSourceType] = useState<SourceTypeValue>(initialSourceType);
  const [sourceId, setSourceId] = useState(
    initialEntry?.sourceType === 'OTHER' ? '' : initialEntry?.sourceId || '',
  );
  const [manualSourceLabel, setManualSourceLabel] = useState(
    initialEntry?.sourceType === 'OTHER' ? initialEntry?.sourceId || '' : '',
  );
  const [purpose, setPurpose] = useState(initialEntry?.purpose || '');
  const [description, setDescription] = useState(initialEntry?.description || '');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const moneyAccounts = useMemo(
    () => accounts.filter((account) => account.isActive && isMoneyAccount(account)),
    [accounts],
  );
  const numericAmount = parseAmount(amount);

  const sourceOptions =
    sourceType === 'BRANCH'
      ? branches.map((branch) => ({ value: branch.id, label: branch.name }))
      : sourceType === 'STOCK_SOURCE'
        ? stockSources.map((source) => ({ value: source.id, label: source.name }))
        : sourceType === 'DISTRIBUTION_CHANNEL'
          ? channels.map((channel) => ({ value: channel.id, label: channel.name }))
          : [];

  function clearFieldError(key: string) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const errors = validateLedgerEntryForm({
      entryDate,
      flowType,
      amount,
      accountId,
      toAccountId,
      sourceType,
      sourceId,
      manualSourceLabel,
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      const payload: CreateLedgerEntryPayload = {
        entryDate,
        flowType,
        amount: Number(numericAmount.toFixed(2)),
        accountId,
        branchId: branchId || undefined,
        toAccountId: flowType === 'TRANSFER' ? toAccountId : undefined,
        sourceType: sourceType === 'NONE' ? undefined : sourceType,
        sourceId:
          sourceType === 'OTHER'
            ? manualSourceLabel.trim() || undefined
            : sourceId || undefined,
        purpose: purpose.trim() || undefined,
        description: description.trim() || undefined,
      };
      const res =
        mode === 'edit' && initialEntry?.id
          ? await updateLedgerEntry(initialEntry.id, payload)
          : await createLedgerEntry(payload);
      if (!res.success) {
        throw new Error(res.message || (mode === 'edit' ? 'Update failed' : 'Create failed'));
      }
      toast({ title: mode === 'edit' ? 'Daily entry updated' : 'Daily entry saved', variant: 'success' });
      await onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = 'h-10 rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold';
  const errorInputCls = 'border-rose-300 bg-rose-50/40';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {submitError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {submitError}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
        Entries can be recorded for head office or a selected branch. Balance always follows credit minus debit.
        {sourceType === 'BRANCH' ? (
          <span className="mt-1 block text-xs text-slate-500">
            When source is Branch, the branch reference below sets the entry branch.
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Date *</Label>
          <AdminDatePicker
            className={cn(inputCls, 'mt-1', fieldErrors.entryDate && errorInputCls)}
            value={entryDate}
            onChange={(value) => {
              setEntryDate(value);
              clearFieldError('entryDate');
            }}
            placeholder="Select date"
            disabled={submitting}
          />
          <FieldError message={fieldErrors.entryDate} />
        </div>
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Type *</Label>
          <Select
            value={flowType}
            disabled={submitting}
            onValueChange={(v) => {
              setFlowType(v as FlowType);
              clearFieldError('flowType');
              clearFieldError('toAccountId');
            }}
          >
            <SelectTrigger className={cn(inputCls, 'mt-1', fieldErrors.flowType && errorInputCls)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FLOW_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={fieldErrors.flowType} />
        </div>
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Amount *</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            className={cn(inputCls, 'mt-1', fieldErrors.amount && errorInputCls)}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              clearFieldError('amount');
            }}
            placeholder="0.00"
            disabled={submitting}
          />
          <FieldError message={fieldErrors.amount} />
        </div>
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">
            {flowType === 'TRANSFER' ? 'From Account *' : 'Account *'}
          </Label>
          <Select
            value={accountId || 'none'}
            disabled={submitting}
            onValueChange={(v) => {
              setAccountId(v === 'none' ? '' : v);
              clearFieldError('accountId');
              clearFieldError('toAccountId');
            }}
          >
            <SelectTrigger className={cn(inputCls, 'mt-1', fieldErrors.accountId && errorInputCls)}>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select account</SelectItem>
              {moneyAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.code} - {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={fieldErrors.accountId} />
        </div>
        {flowType === 'TRANSFER' ? (
          <div>
            <Label className="text-xs font-black uppercase tracking-wider text-slate-500">To Account *</Label>
            <Select
              value={toAccountId || 'none'}
              disabled={submitting}
              onValueChange={(v) => {
                setToAccountId(v === 'none' ? '' : v);
                clearFieldError('toAccountId');
              }}
            >
              <SelectTrigger className={cn(inputCls, 'mt-1', fieldErrors.toAccountId && errorInputCls)}>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select destination</SelectItem>
                {moneyAccounts
                  .filter((account) => account.id !== accountId)
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.toAccountId} />
          </div>
        ) : null}
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Source</Label>
          <Select
            value={sourceType}
            disabled={submitting}
            onValueChange={(v) => {
              const nextType = v as SourceTypeValue;
              setSourceType(nextType);
              setSourceId(nextType === 'BRANCH' ? branchId : '');
              setManualSourceLabel('');
              if (nextType !== 'BRANCH') setBranchId('');
              clearFieldError('sourceId');
            }}
          >
            <SelectTrigger className={cn(inputCls, 'mt-1')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {sourceType === 'OTHER' ? (
          <div>
            <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Source Name</Label>
            <Input
              className={cn(inputCls, 'mt-1')}
              value={manualSourceLabel}
              onChange={(e) => setManualSourceLabel(e.target.value)}
              placeholder="Manual source label"
              disabled={submitting}
            />
          </div>
        ) : sourceType !== 'NONE' ? (
          <div>
            <Label className="text-xs font-black uppercase tracking-wider text-slate-500">
              {sourceType === 'BRANCH' ? 'Branch Source *' : 'Source Reference *'}
            </Label>
            <Select
              value={sourceId || 'none'}
              disabled={submitting}
              onValueChange={(v) => {
                const next = v === 'none' ? '' : v;
                setSourceId(next);
                if (sourceType === 'BRANCH') setBranchId(next);
                clearFieldError('sourceId');
              }}
            >
              <SelectTrigger className={cn(inputCls, 'mt-1', fieldErrors.sourceId && errorInputCls)}>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select source</SelectItem>
                {sourceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldErrors.sourceId} />
          </div>
        ) : null}
        <div className="md:col-span-2">
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Purpose</Label>
          <Input
            className={cn(inputCls, 'mt-1')}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Fee collection, salary, rent, book sale, etc."
            disabled={submitting}
          />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Note</Label>
          <Input
            className={cn(inputCls, 'mt-1')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details"
            disabled={submitting}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Selected Amount</p>
          <p className="mt-1 text-xl font-black text-slate-900">{fmtCur(numericAmount)}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-sky-600 text-white hover:bg-sky-700 hover:text-white"
          disabled={submitting}
        >
          {submitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
          {mode === 'edit' ? 'Update entry' : 'Save entry'}
        </Button>
      </div>
    </form>
  );
}
