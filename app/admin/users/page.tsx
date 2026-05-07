'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType, type FormEvent } from 'react';
import {
  getUsers,
  getUserById,
  getStaffRoleSummary,
  createUser,
  updateUser,
  deleteUser,
  type User,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '@/lib/api/users';
import { getBranches, type Branch } from '@/lib/api/branches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  Pencil,
  Ban,
  UserCheck,
  Trash2,
  Eye,
  Calendar,
  Crown,
  Calculator,
  Presentation,
  MessageCircle,
  Activity,
  Filter,
} from 'lucide-react';

const ALL_ROLES = ['SUPER_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTS', 'TEACHER', 'MODERATOR'] as const;

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  BRANCH_ADMIN: 'Branch Admin',
  ACCOUNTS: 'Accounts',
  TEACHER: 'Teacher',
  MODERATOR: 'Moderator',
  STUDENT: 'Student',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-violet-50 text-violet-700 border-violet-200',
  BRANCH_ADMIN: 'bg-sky-50 text-sky-700 border-sky-200',
  ACCOUNTS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  TEACHER: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  MODERATOR: 'bg-amber-50 text-amber-700 border-amber-200',
  STUDENT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const ROLE_CARD_STYLES: Record<string, { active: string; icon: ComponentType<{ className?: string }> }> = {
  ALL: { active: 'border-slate-800 bg-slate-900 text-white shadow-slate-200', icon: Users },
  SUPER_ADMIN: { active: 'border-violet-500 bg-violet-600 text-white shadow-violet-100', icon: Crown },
  BRANCH_ADMIN: { active: 'border-sky-500 bg-sky-600 text-white shadow-sky-100', icon: Building2 },
  ACCOUNTS: { active: 'border-emerald-500 bg-emerald-600 text-white shadow-emerald-100', icon: Calculator },
  TEACHER: { active: 'border-cyan-500 bg-cyan-600 text-white shadow-cyan-100', icon: Presentation },
  MODERATOR: { active: 'border-amber-500 bg-amber-500 text-white shadow-amber-100', icon: MessageCircle },
};

const BD_MOBILE = /^01[3-9]\d{8}$/;

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── User Form ────────────────────────────────────────────────────────────────

type UserFormProps = {
  user?: User | null;
  branches: Branch[];
  onSuccess: () => void;
  onCancel: () => void;
};

function UserForm({ user, branches, onSuccess, onCancel }: UserFormProps) {
  const { toast } = useToast();
  const isEdit = !!user;

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [mobile, setMobile] = useState(user?.mobile ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>(user?.role ?? 'TEACHER');
  const [branchId, setBranchId] = useState<string>(user?.branchId ?? '');
  const [status, setStatus] = useState<string>(user?.status ?? 'ACTIVE');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleNeedsBranch = ['BRANCH_ADMIN', 'TEACHER'].includes(role);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) { setError('Full name is required.'); return; }
    if (!BD_MOBILE.test(mobile)) { setError('Enter a valid BD mobile (01XXXXXXXXX).'); return; }
    if (roleNeedsBranch && !branchId) { setError('Branch is required for this role.'); return; }

    setSubmitting(true);
    try {
      if (isEdit) {
        const payload: UpdateUserPayload = { fullName, mobile, email: email || undefined, role, status, branchId: branchId || null };
        if (password) payload.password = password;
        const res = await updateUser(user!.id, payload);
        if (!res.success) throw new Error(res.message || 'Update failed');
        toast({ title: 'User updated', variant: 'success' });
      } else {
        const payload: CreateUserPayload = { fullName, mobile, email: email || undefined, role, branchId: branchId || undefined, status };
        if (password) payload.password = password;
        const res = await createUser(payload);
        if (!res.success) throw new Error(res.message || 'Create failed');
        if (res.data && 'oneTimePassword' in res.data && res.data.oneTimePassword) {
          toast({ title: 'User created', description: `One-time password: ${res.data.oneTimePassword}`, variant: 'success' });
        } else {
          toast({ title: 'User created', variant: 'success' });
        }
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    'h-11 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Full Name *</Label>
          <Input className={cn(inputCls, 'mt-1')} placeholder="e.g. Adnan Hussain" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>

        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Mobile *</Label>
          <Input className={cn(inputCls, 'mt-1')} placeholder="01XXXXXXXXX" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
        </div>

        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Email</Label>
          <Input className={cn(inputCls, 'mt-1')} type="email" placeholder="optional" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Role *</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className={cn(inputCls, 'mt-1')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_ROLES.map((r) => (
                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">
            Branch {roleNeedsBranch ? '*' : '(optional)'}
          </Label>
          <Select value={branchId || 'none'} onValueChange={(v) => setBranchId(v === 'none' ? '' : v)}>
            <SelectTrigger className={cn(inputCls, 'mt-1')}>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None / Unassigned</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className={cn(inputCls, 'mt-1')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-black uppercase tracking-wider text-slate-500">
            {isEdit ? 'New Password (leave blank to keep)' : 'Password (blank = auto-generate)'}
          </Label>
          <Input className={cn(inputCls, 'mt-1')} type="password" placeholder={isEdit ? 'Change password…' : 'Auto-generate OTP'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white" disabled={submitting}>
          {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
          {isEdit ? 'Save changes' : 'Create user'}
        </Button>
      </div>
    </form>
  );
}

// ─── User Detail Card ─────────────────────────────────────────────────────────

function UserDetailView({ user }: { user: User }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
          {getInitials(user.fullName)}
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900">{user.fullName}</h3>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge className={cn('rounded-full border text-[10px] font-black uppercase px-2 py-0.5', ROLE_COLORS[user.role] ?? 'bg-slate-100 text-slate-700')}>
              {ROLE_LABELS[user.role] ?? user.role}
            </Badge>
            <Badge variant={user.status === 'ACTIVE' ? 'default' : 'destructive'} className={cn('rounded-full text-[10px] font-black uppercase', user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : '')}>
              {user.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { label: 'Mobile', value: user.mobile, icon: Phone },
          { label: 'Email', value: user.email || '—', icon: Mail },
          { label: 'Branch', value: user.branch?.name ?? 'Unassigned', icon: Building2 },
          { label: 'Joined', value: formatDate(user.createdAt), icon: Calendar },
          { label: 'User ID', value: user.id.slice(0, 12) + '…', icon: ShieldCheck },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <Icon className="h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
              <p className="text-sm font-bold text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const { toast, toasts, removeToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; pages: number } | null>(null);
  const [roleSummary, setRoleSummary] = useState<{ byRole: Record<string, number>; total: number }>({ byRole: {}, total: 0 });

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [roleTab, setRoleTab] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('');

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [blockTarget, setBlockTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const lastDebouncedRef = useRef<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const next = query.trim();
      if (lastDebouncedRef.current !== null && lastDebouncedRef.current !== next) {
        setPage(1);
      }
      lastDebouncedRef.current = next;
      setDebouncedQuery(next);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    void getBranches().then((res) => {
      if (res.success && res.data) setBranches(res.data);
    });
  }, []);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await getStaffRoleSummary({
        branchId: branchFilter || undefined,
        status: statusFilter || undefined,
      });
      if (res.success && res.data) setRoleSummary(res.data);
    } catch {
      toast({ title: 'Failed to load role summary', variant: 'destructive' });
    } finally {
      setSummaryLoading(false);
    }
  }, [branchFilter, statusFilter, toast]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const usersRes = await getUsers({
        page,
        limit: PAGE_SIZE,
        search: debouncedQuery || undefined,
        role: roleTab === 'ALL' ? undefined : roleTab,
        branchId: branchFilter || undefined,
        status: statusFilter || undefined,
        staffOnly: true,
        minimal: true,
      });
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);
        setPagination(usersRes.pagination ?? null);
      }
    } catch {
      toast({ title: 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery, roleTab, branchFilter, statusFilter, toast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadUsers(), loadSummary()]);
  }, [loadUsers, loadSummary]);

  const countByRole = (r: string) => roleSummary.byRole[r] ?? 0;

  async function handleBlockToggle() {
    if (!blockTarget) return;
    setActionLoading(true);
    try {
      const newStatus = blockTarget.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
      const res = await updateUser(blockTarget.id, { status: newStatus });
      if (!res.success) throw new Error(res.message);
      toast({ title: newStatus === 'BLOCKED' ? 'User blocked' : 'User activated', variant: 'success' });
      setBlockTarget(null);
      await refreshAll();
    } catch (err) {
      toast({ title: 'Action failed', description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const res = await deleteUser(deleteTarget.id);
      if (!res.success) throw new Error(res.message);
      toast({ title: 'User deleted', variant: 'success' });
      setDeleteTarget(null);
      await refreshAll();
    } catch (err) {
      toast({ title: 'Delete failed', description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleViewDetails(user: User) {
    try {
      const res = await getUserById(user.id);
      setDetailUser(res.data ?? user);
    } catch {
      setDetailUser(user);
    }
  }

  function openCreate() { setEditingUser(null); setFormOpen(true); }
  function openEdit(u: User) { setEditingUser(u); setFormOpen(true); }

  const TABS = [
    { key: 'ALL', label: 'All Users', count: roleSummary.total },
    { key: 'SUPER_ADMIN', label: 'Super Admins', count: countByRole('SUPER_ADMIN') },
    { key: 'BRANCH_ADMIN', label: 'Branch Admins', count: countByRole('BRANCH_ADMIN') },
    { key: 'ACCOUNTS', label: 'Accounts', count: countByRole('ACCOUNTS') },
    { key: 'TEACHER', label: 'Teachers', count: countByRole('TEACHER') },
    { key: 'MODERATOR', label: 'Moderators', count: countByRole('MODERATOR') },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 px-1 pb-12">
      <Toaster toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-600">Access Control</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">User Management</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
                Manage admin staff, teachers, branch operators, accounts access, and moderator permissions.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => void refreshAll()} disabled={loading} className="h-10 gap-2 rounded-xl border-slate-200 bg-white font-bold">
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button onClick={openCreate} className="h-10 gap-2 rounded-xl bg-sky-700 text-white hover:bg-sky-800 hover:text-white focus-visible:text-white">
              <Plus className="h-4 w-4" />
              Add user
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-700" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Staff Users</span>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-950">{summaryLoading ? '…' : roleSummary.total}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-700" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Active Filter</span>
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-900">{statusFilter || 'ALL'}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-amber-700" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Current View</span>
            </div>
            <p className="mt-2 truncate text-2xl font-black text-amber-950">{roleTab === 'ALL' ? 'All Roles' : ROLE_LABELS[roleTab]}</p>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {TABS.map((tab) => {
          const meta = ROLE_CARD_STYLES[tab.key] ?? ROLE_CARD_STYLES.ALL;
          const Icon = meta.icon;
          const active = roleTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setRoleTab(tab.key);
                setPage(1);
              }}
              className={cn(
                'group rounded-xl border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                active
                  ? cn(meta.active, 'shadow-lg')
                  : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={cn('text-2xl font-black tabular-nums', active ? 'text-white' : 'text-slate-950')}>
                    {summaryLoading ? '…' : tab.count}
                  </p>
                  <p className={cn('mt-1 text-[10px] font-black uppercase tracking-wider', active ? 'text-white/80' : 'text-slate-400')}>
                    {tab.label}
                  </p>
                </div>
                <div className={cn('rounded-lg border p-2 transition-colors', active ? 'border-white/20 bg-white/15' : 'border-slate-100 bg-slate-50 text-slate-500 group-hover:bg-sky-50 group-hover:text-sky-700')}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search name, mobile, email…"
            className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-9 text-sm font-semibold focus:bg-white"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter || 'all'}
          onValueChange={(v) => {
            setStatusFilter(v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 w-38 rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={branchFilter || 'all'}
          onValueChange={(v) => {
            setBranchFilter(v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 w-48 rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="ml-auto rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">
          {pagination
            ? users.length > 0
              ? `Rows ${(pagination.page - 1) * pagination.limit + 1}–${(pagination.page - 1) * pagination.limit + users.length} of ${pagination.total}`
              : `0 of ${pagination.total} users`
            : `${users.length} users`}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-sky-500" />
            <p className="text-sm font-bold">Loading users…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users className="h-12 w-12 text-slate-200" />
            <p className="text-sm font-bold text-slate-400">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/90">
                <tr>
                  {['User', 'Role', 'Branch', 'Contact', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="group transition-colors hover:bg-sky-50/40">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white shadow-sm">
                          {getInitials(u.fullName)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 transition-colors group-hover:text-sky-800">{u.fullName}</p>
                          <p className="text-[10px] font-mono text-slate-400">{u.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn('rounded-full border text-[10px] font-black uppercase px-2.5 py-0.5 whitespace-nowrap', ROLE_COLORS[u.role] ?? 'bg-slate-100 text-slate-700')}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {u.branch ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <Building2 className="h-3.5 w-3.5 text-sky-500" />
                          {u.branch.name}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {u.mobile}
                        </div>
                        {u.email && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Mail className="h-3 w-3" />
                            {u.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border',
                        u.status === 'ACTIVE'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-rose-200 bg-rose-50 text-rose-700',
                      )}>
                        {u.status === 'ACTIVE' ? '● Active' : '○ Blocked'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(u.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewDetails(u)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-700"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEdit(u)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-700"
                          title="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setBlockTarget(u)}
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                            u.status === 'ACTIVE'
                              ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                              : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600',
                          )}
                          title={u.status === 'ACTIVE' ? 'Block user' : 'Activate user'}
                        >
                          {u.status === 'ACTIVE' ? <Ban className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-700"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.pages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <p className="text-sm font-black text-slate-600">
                Page {pagination.page} of {pagination.pages}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= pagination.pages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
          </>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) setFormOpen(false); }}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-slate-900">
              {editingUser ? `Edit — ${editingUser.fullName}` : 'Add new user'}
            </DialogTitle>
          </DialogHeader>
          <UserForm
            user={editingUser}
            branches={branches}
            onSuccess={async () => { setFormOpen(false); await refreshAll(); }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailUser} onOpenChange={(o) => { if (!o) setDetailUser(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-slate-900">User Details</DialogTitle>
          </DialogHeader>
          {detailUser && <UserDetailView user={detailUser} />}
        </DialogContent>
      </Dialog>

      {/* Block/Activate confirmation */}
      <AlertDialog open={!!blockTarget} onOpenChange={(o) => { if (!o) setBlockTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockTarget?.status === 'ACTIVE' ? 'Block this user?' : 'Activate this user?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockTarget?.status === 'ACTIVE'
                ? `${blockTarget?.fullName} will lose access to the admin panel immediately.`
                : `${blockTarget?.fullName} will regain access to the admin panel.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleBlockToggle(); }}
              disabled={actionLoading}
              className={blockTarget?.status === 'ACTIVE' ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}
            >
              {actionLoading ? 'Updating…' : blockTarget?.status === 'ACTIVE' ? 'Block' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.fullName}</strong> and all their data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleDelete(); }}
              disabled={actionLoading}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {actionLoading ? 'Deleting…' : 'Delete permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
