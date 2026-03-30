'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getUsers, getUserById, updateUser, type User } from '@/lib/api/users';
import { getBranches, type Branch } from '@/lib/api/branches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { TeacherForm } from '@/components/admin/teachers/TeacherForm';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import {
  GraduationCap,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Users,
  UserCheck,
  UserX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminTeachersPage() {
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'BLOCKED'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [actorRole, setActorRole] = useState<string | null>(null);
  const [actorBranchId, setActorBranchId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return;
      const u = JSON.parse(raw) as { role?: string; branchId?: string };
      setActorRole(u.role ?? null);
      setActorBranchId(u.branchId ?? null);
      if (u.role === 'BRANCH_ADMIN' && u.branchId) {
        setBranchFilter(u.branchId);
      }
    } catch {
      setActorRole(null);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bid = new URLSearchParams(window.location.search).get('branchId');
    if (bid && actorRole !== 'BRANCH_ADMIN') setBranchFilter(bid);
  }, [actorRole]);

  const loadBranches = useCallback(async () => {
    const res = await getBranches();
    if (res.success && res.data) setBranches(res.data);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params: Parameters<typeof getUsers>[0] = {
        role: 'TEACHER',
        limit: 500,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (branchFilter !== 'all') params.branchId = branchFilter;
      const res = await getUsers(params);
      if (res.success && res.data) setTeachers(res.data);
      else setTeachers([]);
    } catch {
      toast({ title: 'Error', description: 'Could not load teachers', variant: 'destructive' });
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, [branchFilter, statusFilter, toast]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = teachers.filter((t) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      t.fullName.toLowerCase().includes(q) ||
      t.mobile.includes(q) ||
      (t.email?.toLowerCase().includes(q) ?? false)
    );
  });

  const openCreate = () => {
    openModal({
      title: 'Add teacher',
      description: 'Creates a teacher login. Password optional — a one-time password can be generated.',
      className: 'sm:max-w-5xl',
      content: (
        <TeacherForm
          branches={branches}
          lockedBranchId={actorRole === 'BRANCH_ADMIN' ? actorBranchId : undefined}
          onSuccess={load}
        />
      ),
    });
  };

  const openEdit = async (id: string) => {
    try {
      const res = await getUserById(id);
      if (!res.success || !res.data) {
        toast({ title: 'Error', description: 'Failed to load teacher', variant: 'destructive' });
        return;
      }
      openModal({
        title: 'Edit teacher',
        description: 'Update profile, branch, or status.',
        className: 'sm:max-w-lg',
        content: (
          <TeacherForm
            branches={branches}
            teacher={res.data}
            lockedBranchId={actorRole === 'BRANCH_ADMIN' ? actorBranchId : undefined}
            onSuccess={load}
          />
        ),
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to load teacher', variant: 'destructive' });
    }
  };

  const setTeacherStatus = (id: string, status: 'ACTIVE' | 'BLOCKED', label: string) => {
    openModal({
      title: label,
      description: status === 'BLOCKED' ? 'They will not be able to sign in.' : 'Restore access to the teacher app.',
      className: 'sm:max-w-md',
      content: (
        <ConfirmationModal
          title="Confirm"
          description={status === 'BLOCKED' ? 'Block this teacher?' : 'Activate this teacher?'}
          variant={status === 'BLOCKED' ? 'danger' : 'info'}
          onConfirm={async () => {
            try {
              await updateUser(id, { status });
              await load();
              toast({ title: 'Updated', variant: 'success' });
            } catch (e: unknown) {
              toast({
                title: 'Error',
                description: e instanceof Error ? e.message : 'Update failed',
                variant: 'destructive',
              });
            }
          }}
        />
      ),
    });
  };

  const isBranchAdmin = actorRole === 'BRANCH_ADMIN';

  return (
    <div className="space-y-8 pb-12 text-slate-900">
      <Toaster toasts={toasts} removeToast={removeToast} />

      <div className="rounded-[28px] border border-slate-200 bg-linear-to-br from-indigo-50/70 via-white to-sky-50/40 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/90 px-3 py-1 text-xs font-bold text-indigo-800">
              <Users className="h-3.5 w-3.5" />
              Teachers
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Manage teachers</h1>
            <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
              Add teacher accounts, assign a branch, and control access. Assign courses under{' '}
              <Link href="/admin/courses" className="font-bold text-indigo-600 hover:underline">
                Courses
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              className="h-11 rounded-xl text-white bg-slate-900 font-bold hover:bg-indigo-600"
              onClick={openCreate}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add teacher
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl font-bold border-slate-200">
              <Link href="/teacher" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Teacher app
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="relative min-w-[200px] flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search name, phone, email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 rounded-xl border-slate-200 pl-10 font-medium"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="h-11 w-full rounded-xl sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
            </SelectContent>
          </Select>
          {!isBranchAdmin && (
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-11 w-full rounded-xl sm:w-[200px]">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shrink-0" onClick={load}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">Directory</h2>
          <Badge variant="secondary" className="font-bold">
            {loading ? '…' : filtered.length}
          </Badge>
        </div>
        {loading ? (
          <div className="p-16 text-center text-sm font-medium text-slate-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-sm font-medium text-slate-500">No teachers in this view.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold">Name</TableHead>
                  <TableHead className="font-bold">Mobile</TableHead>
                  <TableHead className="font-bold">Email</TableHead>
                  <TableHead className="font-bold">Branch</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-bold text-slate-900">{t.fullName}</TableCell>
                    <TableCell className="font-mono text-sm text-slate-600">{t.mobile}</TableCell>
                    <TableCell className="text-sm text-slate-600">{t.email || '—'}</TableCell>
                    <TableCell className="text-sm text-slate-600">{t.branch?.name || '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'font-bold',
                          t.status === 'ACTIVE'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-rose-200 bg-rose-50 text-rose-800'
                        )}
                      >
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg"
                          onClick={() => openEdit(t.id)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {t.status === 'ACTIVE' ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-rose-600"
                            title="Block"
                            onClick={() => setTeacherStatus(t.id, 'BLOCKED', 'Block teacher')}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-emerald-600"
                            title="Activate"
                            onClick={() => setTeacherStatus(t.id, 'ACTIVE', 'Activate teacher')}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
