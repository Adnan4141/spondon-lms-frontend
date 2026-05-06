'use client';

import { useState, type FormEvent } from 'react';
import {
  createAccount,
  updateAccount,
  type Account,
  type CreateAccountPayload,
} from '@/lib/api/accounting';
import type { Branch } from '@/lib/api/branches';
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
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';
import { ACCOUNT_CATEGORIES } from './constants';
import { accountCategory } from './utils';

export function AccountForm({
  account,
  branches,
  onSuccess,
  onCancel,
}: {
  account?: Account | null;
  branches: Branch[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const isEdit = !!account;
  const [code, setCode] = useState(account?.code ?? '');
  const [name, setName] = useState(account?.name ?? '');
  const initialCategory = account ? accountCategory(account) : 'Cash';
  const [type, setType] = useState(initialCategory === 'Cash / Bank' ? 'Cash' : initialCategory);
  const [branchId, setBranchId] = useState(account?.branchId ?? '');
  const [isActive, setIsActive] = useState(account?.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!code.trim() || !name.trim()) {
      setError('Code and account name are required.');
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit) {
        const res = await updateAccount(account.id, {
          name: name.trim(),
          branchId: branchId || null,
          isActive,
          type: type || undefined,
        });
        if (!res.success) throw new Error(res.message || 'Update failed');
        toast({ title: 'Account updated', variant: 'success' });
      } else {
        const payload: CreateAccountPayload = {
          code: code.trim(),
          name: name.trim(),
          branchId: branchId || undefined,
          type: type || undefined,
        };
        const res = await createAccount(payload);
        if (!res.success) throw new Error(res.message || 'Create failed');
        toast({ title: 'Account created', variant: 'success' });
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = 'h-10 rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
        Category controls how balances appear in daily reports. Staff will only see these simple operational labels.
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Account Code *</Label>
          <Input className={cn(inputCls, 'mt-1')} placeholder="e.g. CASH-HO" value={code} onChange={(e) => setCode(e.target.value)} disabled={isEdit} required />
        </div>
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Account Name *</Label>
          <Input className={cn(inputCls, 'mt-1')} placeholder="e.g. Main Cash" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Branch</Label>
          <Select value={branchId || 'all'} onValueChange={(v) => setBranchId(v === 'all' ? '' : v)}>
            <SelectTrigger className={cn(inputCls, 'mt-1')}><SelectValue placeholder="All / Head Office" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All / Head Office</SelectItem>
              {branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Category</Label>
          <Select value={type || 'Cash'} onValueChange={setType}>
            <SelectTrigger className={cn(inputCls, 'mt-1')}><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {ACCOUNT_CATEGORIES.map((accountType) => <SelectItem key={accountType} value={accountType}>{accountType}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {isEdit ? (
          <div>
            <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Status</Label>
            <Select value={isActive ? 'active' : 'inactive'} onValueChange={(v) => setIsActive(v === 'active')}>
              <SelectTrigger className={cn(inputCls, 'mt-1')}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700 hover:text-white" disabled={submitting}>
          {submitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isEdit ? 'Save changes' : 'Create account'}
        </Button>
      </div>
    </form>
  );
}
