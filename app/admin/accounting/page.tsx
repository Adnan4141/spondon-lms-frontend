'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getAccounts,
  createAccount,
  updateAccount,
  getLedgerEntries,
  createLedgerEntry,
  getAccountingSummary,
  type Account,
  type LedgerEntry,
  type AccountingSummary,
  type CreateAccountPayload,
  type CreateLedgerEntryPayload,
} from '@/lib/api/accounting';
import { getBranches, type Branch } from '@/lib/api/branches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { AdminDatePicker } from '@/features/admin/shared/form/AdminField';
import { cn } from '@/lib/utils';
import {
  Wallet,
  RefreshCw,
  Plus,
  BookOpen,
  ListOrdered,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
} from 'lucide-react';

type TabKey = 'summary' | 'ledger' | 'accounts';

const TABS: { key: TabKey; label: string; icon: typeof Wallet }[] = [
  { key: 'summary', label: 'Account Summary', icon: BarChart3 },
  { key: 'ledger', label: 'Ledger Entries', icon: ListOrdered },
  { key: 'accounts', label: 'Chart of Accounts', icon: BookOpen },
];

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'INCOME', 'EXPENSE', 'EQUITY'];
const ENTRY_TYPES = ['INCOME', 'EXPENSE', 'TRANSFER', 'ADJUSTMENT'];

const TYPE_COLORS: Record<string, string> = {
  INCOME: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  EXPENSE: 'bg-rose-100 text-rose-700 border-rose-200',
  ASSET: 'bg-sky-100 text-sky-700 border-sky-200',
  LIABILITY: 'bg-amber-100 text-amber-700 border-amber-200',
  EQUITY: 'bg-purple-100 text-purple-700 border-purple-200',
  TRANSFER: 'bg-slate-100 text-slate-700 border-slate-200',
  ADJUSTMENT: 'bg-orange-100 text-orange-700 border-orange-200',
};

function fmtCur(n: number) {
  return '৳ ' + new Intl.NumberFormat('en-BD').format(Math.round(n));
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Account Form ─────────────────────────────────────────────────────────────

function AccountForm({ account, branches, onSuccess, onCancel }: {
  account?: Account | null; branches: Branch[]; onSuccess: () => void; onCancel: () => void;
}) {
  const { toast } = useToast();
  const isEdit = !!account;
  const [code, setCode] = useState(account?.code ?? '');
  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState(account?.type ?? 'INCOME');
  const [branchId, setBranchId] = useState(account?.branchId ?? '');
  const [isActive, setIsActive] = useState(account?.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!code.trim() || !name.trim() || !type) { setError('Code, name, and type are required.'); return; }
    setSubmitting(true);
    try {
      if (isEdit) {
        const res = await updateAccount(account!.id, { name, type, branchId: branchId || null, isActive });
        if (!res.success) throw new Error(res.message || 'Update failed');
        toast({ title: 'Account updated', variant: 'success' });
      } else {
        const payload: CreateAccountPayload = { code, name, type, branchId: branchId || undefined };
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
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Account Code *</Label>
          <Input className={cn(inputCls, 'mt-1')} placeholder="e.g. INC-001" value={code} onChange={(e) => setCode(e.target.value)} disabled={isEdit} required />
        </div>
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Type *</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className={cn(inputCls, 'mt-1')}><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Account Name *</Label>
          <Input className={cn(inputCls, 'mt-1')} placeholder="e.g. Course Fee Revenue" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Branch (optional)</Label>
          <Select value={branchId || 'all'} onValueChange={(v) => setBranchId(v === 'all' ? '' : v)}>
            <SelectTrigger className={cn(inputCls, 'mt-1')}><SelectValue placeholder="All / Head Office" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All / Head Office</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {isEdit && (
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
        )}
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700 hover:text-white" disabled={submitting}>
          {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
          {isEdit ? 'Save changes' : 'Create account'}
        </Button>
      </div>
    </form>
  );
}

// ─── Ledger Entry Form ────────────────────────────────────────────────────────

function LedgerEntryForm({ accounts, branches, onSuccess, onCancel }: {
  accounts: Account[]; branches: Branch[]; onSuccess: () => void; onCancel: () => void;
}) {
  const { toast } = useToast();
  const [accountId, setAccountId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [entryType, setEntryType] = useState('INCOME');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [refType, setRefType] = useState('');
  const [refId, setRefId] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!accountId) { setError('Account is required.'); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid positive amount.'); return; }
    setSubmitting(true);
    try {
      const payload: CreateLedgerEntryPayload = {
        accountId, branchId: branchId || undefined, entryType, amount: amt,
        description: description || undefined, refType: refType || undefined,
        refId: refId || undefined, entryDate,
      };
      const res = await createLedgerEntry(payload);
      if (!res.success) throw new Error((res as any).message || 'Create failed');
      toast({ title: 'Ledger entry created', variant: 'success' });
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
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Account *</Label>
          <Select value={accountId || 'none'} onValueChange={(v) => setAccountId(v === 'none' ? '' : v)}>
            <SelectTrigger className={cn(inputCls, 'mt-1')}><SelectValue placeholder="Select account…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select account…</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Entry Type *</Label>
          <Select value={entryType} onValueChange={setEntryType}>
            <SelectTrigger className={cn(inputCls, 'mt-1')}><SelectValue /></SelectTrigger>
            <SelectContent>
              {ENTRY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Amount (৳) *</Label>
          <Input type="number" min="0.01" step="0.01" className={cn(inputCls, 'mt-1')} placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Date *</Label>
          <AdminDatePicker
            className={cn(inputCls, 'mt-1')}
            value={entryDate}
            onChange={setEntryDate}
            placeholder="Select date"
            disabled={submitting}
          />
        </div>
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Branch</Label>
          <Select value={branchId || 'all'} onValueChange={(v) => setBranchId(v === 'all' ? '' : v)}>
            <SelectTrigger className={cn(inputCls, 'mt-1')}><SelectValue placeholder="Head Office" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Head Office</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Description</Label>
          <Input className={cn(inputCls, 'mt-1')} placeholder="e.g. Teacher salary — January 2026" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Ref Type (optional)</Label>
          <Input className={cn(inputCls, 'mt-1')} placeholder="e.g. Invoice, Payment" value={refType} onChange={(e) => setRefType(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Ref ID (optional)</Label>
          <Input className={cn(inputCls, 'mt-1')} placeholder="ID of referenced record" value={refId} onChange={(e) => setRefId(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700 hover:text-white" disabled={submitting}>
          {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
          Add entry


        </Button>
      </div>
    </form>
  );
}

// ─── Summary Tab ──────────────────────────────────────────────────────────────

function SummaryTab({ branches }: { branches: Branch[] }) {
  const { toast } = useToast();
  const [branchId, setBranchId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<AccountingSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAccountingSummary({ branchId: branchId || undefined, from: from || undefined, to: to || undefined });
      if (res.success) setSummary(res.data);
    } catch { toast({ title: 'Failed to load summary', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [branchId, from, to, toast]);

  useEffect(() => { void load(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Branch</p>
          <Select value={branchId || 'all'} onValueChange={(v) => setBranchId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-44 rounded-xl text-sm"><SelectValue placeholder="All / Head Office" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All / Head Office</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">From</p>
          <AdminDatePicker className="w-36" value={from} onChange={setFrom} placeholder="From date" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">To</p>
          <AdminDatePicker className="w-36" value={to} onChange={setTo} placeholder="To date" />
        </div>
        <Button onClick={load} disabled={loading} className="h-9 bg-sky-600 text-white hover:bg-sky-700 hover:text-white gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {summary && (
        <>
          {/* Top KPIs */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Total Income', value: fmtCur(summary.totalIncome), icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Total Expense', value: fmtCur(summary.totalExpense), icon: ArrowDownRight, color: 'text-rose-600', bg: 'bg-rose-50' },
              {
                label: 'Net Balance', value: fmtCur(summary.netBalance),
                icon: summary.netBalance >= 0 ? ArrowUpRight : ArrowDownRight,
                color: summary.netBalance >= 0 ? 'text-indigo-600' : 'text-rose-600',
                bg: 'bg-indigo-50',
              },
              { label: 'Total Accounts', value: String(summary.totalAccounts), icon: BookOpen, color: 'text-sky-600', bg: 'bg-sky-50' },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center mb-3', kpi.bg)}>
                  <kpi.icon className={cn('h-5 w-5', kpi.color)} />
                </div>
                <p className={cn('text-2xl font-black', kpi.color)}>{kpi.value}</p>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* By Type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summary.byType.map((t) => (
              <div key={t.type} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Badge className={cn('rounded-full border text-[10px] font-black uppercase mb-4', TYPE_COLORS[t.type] ?? 'bg-slate-100 text-slate-700')}>
                  {t.type}
                </Badge>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-slate-500">Income</span>
                    <span className="text-sm font-black text-emerald-600">{fmtCur(t.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-slate-500">Expense</span>
                    <span className="text-sm font-black text-rose-500">{fmtCur(t.totalExpense)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
                    <span className="text-xs font-black text-slate-700">Net</span>
                    <span className={cn('text-sm font-black', t.net >= 0 ? 'text-indigo-600' : 'text-rose-600')}>{fmtCur(t.net)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!summary && !loading && (
        <div className="py-20 text-center text-slate-400 text-sm font-bold">Click Refresh to load account summary.</div>
      )}
    </div>
  );
}

// ─── Ledger Tab ───────────────────────────────────────────────────────────────

function LedgerTab({ accounts, branches }: { accounts: Account[]; branches: Branch[] }) {
  const { toast } = useToast();
  const [accountId, setAccountId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [entryType, setEntryType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  const LIMIT = 50;

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await getLedgerEntries({
        accountId: accountId || undefined, branchId: branchId || undefined,
        from: from || undefined, to: to || undefined,
        entryType: entryType || undefined, page: pg, limit: LIMIT,
      });
      if (res.success) { setEntries(res.data); setTotal(res.total); setTotalPages(res.totalPages); setPage(pg); }
    } catch { toast({ title: 'Failed to load ledger', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [accountId, branchId, from, to, entryType, toast]);

  useEffect(() => { void load(1); }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Account</p>
          <Select value={accountId || 'all'} onValueChange={(v) => setAccountId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-52 rounded-xl text-sm"><SelectValue placeholder="All Accounts" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Entry Type</p>
          <Select value={entryType || 'all'} onValueChange={(v) => setEntryType(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-36 rounded-xl text-sm"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {ENTRY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Branch</p>
          <Select value={branchId || 'all'} onValueChange={(v) => setBranchId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-44 rounded-xl text-sm"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All / Head Office</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">From</p>
          <AdminDatePicker className="w-36" value={from} onChange={setFrom} placeholder="From date" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">To</p>
          <AdminDatePicker className="w-36" value={to} onChange={setTo} placeholder="To date" />
        </div>
        <Button onClick={() => load(1)} disabled={loading} className="h-9 bg-sky-600 text-white hover:bg-sky-700 hover:text-white gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ListOrdered className="h-4 w-4" />}
          Search
        </Button>
        <Button onClick={() => setFormOpen(true)} className="h-9 ml-auto bg-sky-600 text-white hover:bg-sky-700 hover:text-white gap-2">
          <Plus className="h-4 w-4" />
          New entry
        </Button>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
        <span>{total} entries found</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(page - 1)}
            disabled={page <= 1 || loading}
            className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span>Page {page} / {totalPages}</span>
          <button
            onClick={() => load(page + 1)}
            disabled={page >= totalPages || loading}
            className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center"><RefreshCw className="h-6 w-6 animate-spin text-sky-400 mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  {['Date', 'Account', 'Type', 'Description', 'Ref', 'Amount'].map((h) => (
                    <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-12 text-center text-slate-400 text-sm font-bold">No ledger entries found.</TableCell></TableRow>
                ) : entries.map((e) => (
                  <TableRow key={e.id} className="hover:bg-slate-50/60">
                    <TableCell className="font-mono text-xs text-slate-500 whitespace-nowrap">{fmtDate(e.entryDate)}</TableCell>
                    <TableCell>
                      {e.account
                        ? <div><p className="font-bold text-slate-900 text-sm">{e.account.name}</p><p className="text-[10px] font-mono text-slate-400">{e.account.code}</p></div>
                        : <span className="text-[10px] text-slate-300">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('rounded-full border text-[10px] font-black uppercase px-2', TYPE_COLORS[e.entryType] ?? 'bg-slate-100 text-slate-700')}>
                        {e.entryType === 'INCOME' ? '↑ ' : e.entryType === 'EXPENSE' ? '↓ ' : ''}{e.entryType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 max-w-xs truncate">{e.description || '—'}</TableCell>
                    <TableCell>
                      {e.refType ? (
                        <span className="text-[10px] font-bold text-slate-500">{e.refType}{e.refId ? ` #${e.refId.slice(0, 8)}` : ''}</span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className={cn('font-black text-base', e.entryType === 'INCOME' ? 'text-emerald-600' : e.entryType === 'EXPENSE' ? 'text-rose-500' : 'text-slate-700')}>
                      {fmtCur(Number(e.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) setFormOpen(false); }}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="font-black">New Ledger Entry</DialogTitle>
          </DialogHeader>
          <LedgerEntryForm
            accounts={accounts}
            branches={branches}
            onSuccess={async () => { setFormOpen(false); await load(1); }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Accounts Tab ─────────────────────────────────────────────────────────────

function AccountsTab({ branches, onAccountsChange }: { branches: Branch[]; onAccountsChange: (accounts: Account[]) => void }) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAccounts({ type: typeFilter || undefined });
      if (res.success) {
        setAccounts(res.data);
        onAccountsChange(res.data);
      }
    } catch { toast({ title: 'Failed to load accounts', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [typeFilter, onAccountsChange, toast]);

  useEffect(() => { void load(); }, [typeFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Account Type</p>
          <Select value={typeFilter || 'all'} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-40 rounded-xl text-sm"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={load} variant="outline" size="sm" className="gap-2 mt-5" disabled={loading}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
        <Button onClick={() => { setEditingAccount(null); setFormOpen(true); }} className="h-9 ml-auto bg-sky-600 text-white hover:bg-sky-700 hover:text-white gap-2">
          <Plus className="h-4 w-4" />
          Add account
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center"><RefreshCw className="h-6 w-6 animate-spin text-sky-400 mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  {['Code', 'Account Name', 'Type', 'Branch', 'Status', ''].map((h) => (
                    <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-12 text-center text-slate-400 text-sm font-bold">No accounts found. Create one to get started.</TableCell></TableRow>
                ) : accounts.map((acc) => (
                  <TableRow key={acc.id} className="hover:bg-slate-50/60 group">
                    <TableCell className="font-mono text-xs font-bold text-slate-600">{acc.code}</TableCell>
                    <TableCell className="font-bold text-slate-900">{acc.name}</TableCell>
                    <TableCell>
                      <Badge className={cn('rounded-full border text-[10px] font-black uppercase px-2', TYPE_COLORS[acc.type] ?? 'bg-slate-100 text-slate-700')}>
                        {acc.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {acc.branchId
                        ? <div className="flex items-center gap-1.5 text-xs text-slate-600"><Building2 className="h-3.5 w-3.5 text-slate-400" />Branch</div>
                        : <span className="text-[10px] text-slate-300 font-bold uppercase">Head Office</span>}
                    </TableCell>
                    <TableCell>
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase', acc.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400')}>
                        {acc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => { setEditingAccount(acc); setFormOpen(true); }}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) setFormOpen(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-black">{editingAccount ? `Edit — ${editingAccount.name}` : 'New Account'}</DialogTitle>
          </DialogHeader>
          <AccountForm
            account={editingAccount}
            branches={branches}
            onSuccess={async () => { setFormOpen(false); await load(); }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminAccountingPage() {
  const { toast, toasts, removeToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setMetaLoading(true);
      try {
        const [bRes, aRes] = await Promise.all([getBranches(), getAccounts()]);
        if (bRes.success && bRes.data) setBranches(bRes.data);
        if (aRes.success) setAccounts(aRes.data);
      } catch { toast({ title: 'Failed to load data', variant: 'destructive' }); }
      finally { setMetaLoading(false); }
    }
    void load();
  }, []);

  return (
    <div className="min-h-screen space-y-6 p-6 bg-slate-50/50">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-200">
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Accounting</h1>
          <p className="text-sm text-slate-500 font-medium">Chart of accounts, ledger entries, and financial summary</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                activeTab === tab.key
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {metaLoading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="h-8 w-8 animate-spin text-sky-400" />
        </div>
      ) : (
        <div>
          {activeTab === 'summary' && <SummaryTab branches={branches} />}
          {activeTab === 'ledger' && <LedgerTab accounts={accounts} branches={branches} />}
          {activeTab === 'accounts' && <AccountsTab branches={branches} onAccountsChange={setAccounts} />}
        </div>
      )}

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
