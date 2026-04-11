'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getUsers, getUserById, updateUser, deleteUser, reorderTeachers, type User } from '@/lib/api/users';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getBranches, type Branch } from '@/lib/api/branches';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
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
import { TeacherDetailsView } from '@/components/admin/teachers/TeacherDetailsView';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import {
  GraduationCap,
  GripVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Users,
  UserCheck,
  Activity,
  Building2,
  Mail,
  Phone,
  Ban,
  Trash2,
  ChevronRight,
  Eye,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ---------- Sortable row used in drag-and-drop sort mode ----------
function SortableTeacherRow({ teacher }: { teacher: User }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: teacher.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: isDragging ? ('relative' as const) : undefined,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <TableRow ref={setNodeRef} style={style} className="bg-white hover:bg-indigo-50/30 transition-colors select-none">
      <TableCell className="py-4 px-4 w-12">
        <button
          className="cursor-grab active:cursor-grabbing p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      </TableCell>
      <TableCell className="py-4 px-4" colSpan={5}>
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-indigo-50 to-white text-indigo-600 font-black text-sm shadow-sm border border-indigo-100 overflow-hidden">
            {teacher.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveAttachmentUrl(teacher.profileImage, API_ORIGIN)} alt={teacher.fullName} className="h-full w-full object-cover" />
            ) : (
              teacher.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
            )}
          </div>
          <div>
            <p className="text-base font-black text-slate-900">{teacher.fullName}</p>
            {teacher.designation && <p className="text-xs text-slate-500 font-semibold">{teacher.designation}</p>}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
// ------------------------------------------------------------------

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
  const [sortMode, setSortMode] = useState(false);
  const [orderedTeachers, setOrderedTeachers] = useState<User[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);

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

  // Keep orderedTeachers in sync whenever the source list changes
  useEffect(() => {
    setOrderedTeachers(teachers);
  }, [teachers]);

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
      title: 'Add Teacher',
      description: 'Create a new teacher account and assign them to a branch.',
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

  const openView = async (id: string) => {
    try {
      const res = await getUserById(id);
      if (!res.success || !res.data) {
        toast({ title: 'Error', description: 'Failed to load teacher', variant: 'destructive' });
        return;
      }
      openModal({
        title: 'Teacher Profile',
      description: 'Full teacher profile.',
        className: 'sm:max-w-3xl',
        content: <TeacherDetailsView teacher={res.data} />,
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to load teacher', variant: 'destructive' });
    }
  };

  const openEdit = async (id: string) => {
    try {
      const res = await getUserById(id);
      if (!res.success || !res.data) {
        toast({ title: 'Error', description: 'Failed to load teacher', variant: 'destructive' });
        return;
      }
      openModal({
        title: 'Edit Teacher',
        description: 'Update profile information, branch assignment, or account status.',
        className: 'sm:max-w-5xl',
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
      description: status === 'BLOCKED' ? 'The teacher will no longer be able to sign in.' : 'The teacher will regain access to their portal.',
      className: 'sm:max-w-md',
      content: (
        <ConfirmationModal
          title="Confirm Status Change"
          description={status === 'BLOCKED' ? 'Are you sure you want to block this teacher?' : 'Are you sure you want to activate this teacher?'}
          variant={status === 'BLOCKED' ? 'danger' : 'info'}
          onConfirm={async () => {
            try {
              await updateUser(id, { status });
              await load();
              toast({ title: 'Success', description: `Teacher status updated to ${status}`, variant: 'success' });
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

  const handleDelete = (id: string, name: string) => {
    openModal({
      title: 'Delete Teacher',
      description: 'This action is permanent and cannot be undone.',
      className: 'sm:max-w-md',
      content: (
        <ConfirmationModal
          title="Delete Teacher Account"
          description={`Are you sure you want to permanently delete "${name}"? All their data will be removed.`}
          variant="danger"
          onConfirm={async () => {
            try {
              await deleteUser(id);
              await load();
              toast({ title: 'Deleted', description: `${name} has been removed.`, variant: 'success' });
            } catch (e: unknown) {
              toast({
                title: 'Error',
                description: e instanceof Error ? e.message : 'Delete failed',
                variant: 'destructive',
              });
            }
          }}
        />
      ),
    });
  };

  // ── DnD sort handlers ─────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedTeachers((items) => {
        const oldIndex = items.findIndex((t) => t.id === active.id);
        const newIndex = items.findIndex((t) => t.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    try {
      setSavingOrder(true);
      const items = orderedTeachers.map((t, i) => ({ id: t.id, displayOrder: i }));
      await reorderTeachers(items);
      await load();
      setSortMode(false);
      toast({ title: 'Order saved', description: 'Teacher display order updated.', variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save order.', variant: 'destructive' });
    } finally {
      setSavingOrder(false);
    }
  };
  // ──────────────────────────────────────────────────────────────────

  const isBranchAdmin = actorRole === 'BRANCH_ADMIN';

  // Stats calculation
  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter(t => t.status === 'ACTIVE').length;
  const blockedTeachers = teachers.filter(t => t.status === 'BLOCKED').length;
  const uniqueBranches = new Set(teachers.map(t => t.branchId).filter(Boolean)).size;

  return (
    <div className="space-y-10 pb-12 text-slate-900">
      <Toaster toasts={toasts} removeToast={removeToast} />

      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[40px] border border-slate-200 bg-white p-8 lg:p-10 shadow-xl shadow-slate-200/30">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-50/50" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-sky-50/50" />
        
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 shadow-sm border border-indigo-100/50">
              <Users className="h-3.5 w-3.5" />
              Teacher Team
            </div>
            <div>
               <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-slate-900">Teachers</h1>
              
            </div>
          </div>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {!sortMode && (
              <Button
                className="h-14 px-8 rounded-2xl text-white bg-slate-900 font-black tracking-tight hover:bg-indigo-600 transition-all hover:scale-[1.02] shadow-lg shadow-slate-200"
                onClick={openCreate}
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Teacher
              </Button>
            )}
            <Button
              variant="outline"
              className={cn(
                'h-14 px-6 rounded-2xl font-black tracking-tight border-2 transition-all',
                sortMode
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300',
              )}
              onClick={() => {
                if (sortMode) setOrderedTeachers(teachers);
                setSortMode((s) => !s);
              }}
            >
              <GripVertical className="mr-2 h-5 w-5" />
              {sortMode ? 'Cancel' : 'Sort Order'}
            </Button>
            {sortMode && (
              <Button
                className="h-14 px-8 rounded-2xl text-white bg-indigo-600 font-black tracking-tight hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
                onClick={handleSaveOrder}
                disabled={savingOrder}
              >
                {savingOrder ? 'Saving…' : 'Save Order'}
              </Button>
            )}
          </div>
        </div>
      </div>

    

      {sortMode && (
        <div className="rounded-[24px] border border-indigo-200 bg-indigo-50 px-6 py-4 flex items-center gap-3">
          <GripVertical className="h-5 w-5 text-indigo-500 shrink-0" />
          <p className="text-sm font-bold text-indigo-700">
            Drag rows to reorder teachers. Click <span className="font-black">Save Order</span> when done.
          </p>
        </div>
      )}

      {/* Filter Section */}
      {!sortMode && <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/30">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="relative min-w-[280px] flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name, phone, or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 pl-12 text-base font-bold text-slate-700 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
             <div className="flex items-center gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
                >
                  <SelectTrigger className="h-14 w-full rounded-2xl sm:w-[180px] border-slate-100 bg-slate-50/50 font-bold text-slate-700">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 p-2">
                    <SelectItem value="all" className="rounded-xl font-bold">Any status</SelectItem>
                    <SelectItem value="ACTIVE" className="rounded-xl font-bold">Active</SelectItem>
                    <SelectItem value="BLOCKED" className="rounded-xl font-bold">Blocked</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             {!isBranchAdmin && (
               <Select value={branchFilter} onValueChange={setBranchFilter}>
                 <SelectTrigger className="h-14 w-full rounded-2xl sm:w-[220px] border-slate-100 bg-slate-50/50 font-bold text-slate-700">
                   <SelectValue placeholder="Branch" />
                 </SelectTrigger>
                 <SelectContent className="rounded-2xl border-slate-100 p-2 max-h-[300px]">
                   <SelectItem value="all" className="rounded-xl font-bold">All branches</SelectItem>
                   {branches.map((b) => (
                     <SelectItem key={b.id} value={b.id} className="rounded-xl font-bold">
                       {b.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             )}

             <Button 
               variant="outline" 
               className="h-14 w-14 rounded-2xl shrink-0 border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all" 
               onClick={load}
             >
               <RefreshCw className={cn('h-5 w-5 text-slate-500', loading && 'animate-spin')} />
             </Button>
          </div>
        </div>
      </section>}

      {/* Teachers Table */}
      <section className="overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
        <div className="flex items-center justify-between border-b border-slate-50 px-8 py-7">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Teachers list</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
               Live list
            </p>
          </div>
          <div className="flex items-center gap-3">
             <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 font-black rounded-full px-4 py-1.5 border-0 text-[11px] tracking-tight">
               {loading ? 'Loading…' : `${filtered.length} teachers`}
             </Badge>
          </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
             <RefreshCw className="h-10 w-10 animate-spin mb-4 opacity-20" />
             <p className="text-sm font-black uppercase tracking-widest">Loading teachers</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
             <Users className="h-16 w-16 mb-4 opacity-10" />
             <p className="text-lg font-black text-slate-300">No teachers found.</p>
             <p className="text-sm font-medium mt-1">Change filters or search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-slate-50">
                  {sortMode && <TableHead className="h-14 px-4 w-12 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400" />}
                  <TableHead className="h-14 px-8 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                    {sortMode ? 'Teacher (drag to reorder)' : 'Teacher'}
                  </TableHead>
                  {!sortMode && <>
                    <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Teaching Info</TableHead>
                    <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Contact</TableHead>
                    <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Branch</TableHead>
                    <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Status</TableHead>
                    <TableHead className="h-14 px-8 text-right text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Actions</TableHead>
                  </>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortMode ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={orderedTeachers.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                      {orderedTeachers.map((t) => (
                        <SortableTeacherRow key={t.id} teacher={t} />
                      ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                <>
                {filtered.map((t) => (
                  <TableRow key={t.id} className="group transition-all hover:bg-slate-50/50">
                    <TableCell className="py-6 px-8">
                       <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-indigo-50 to-white text-indigo-600 font-black text-base shadow-sm border border-indigo-100 transition-transform group-hover:scale-110 group-hover:rotate-3 overflow-hidden">
                             {t.profileImage ? (
                               // eslint-disable-next-line @next/next/no-img-element
                               <img
                                 src={resolveAttachmentUrl(t.profileImage, API_ORIGIN)}
                                 alt={t.fullName}
                                 className="h-full w-full object-cover"
                               />
                             ) : (
                               t.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                             )}
                          </div>
                          <div className="cursor-pointer" onClick={() => openView(t.id)}>
                             <p className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{t.fullName}</p>
                             {t.createdAt && (
                               <p className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mt-0.5">
                                 <Clock className="h-3 w-3" />
                                 {timeAgo(t.createdAt)}
                               </p>
                             )}
                          </div>
                       </div>
                    </TableCell>
                    {/* Teaching Info */}
                    <TableCell className="py-6 px-6">
                       <div className="space-y-1">
                         {t.designation ? (
                           <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                             <GraduationCap className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                             {t.designation}
                           </div>
                         ) : null}
                         {t.institute ? (
                           <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                             <Building2 className="h-3 w-3 text-slate-300 shrink-0" />
                             {t.institute}
                           </div>
                         ) : null}
                         {t.experienceYears != null ? (
                           <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                             <Clock className="h-3 w-3 text-slate-300 shrink-0" />
                             {t.experienceYears} yrs exp
                           </div>
                         ) : null}
                         {!t.designation && !t.institute && t.experienceYears == null && (
                           <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Not set</span>
                         )}
                       </div>
                    </TableCell>
                    <TableCell className="py-6 px-6">
                       <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5 text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                             <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                <Phone className="h-3 w-3" />
                             </div>
                             {t.mobile}
                          </div>
                          {t.email && (
                             <div className="flex items-center gap-2.5 text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                   <Mail className="h-3 w-3" />
                                </div>
                                {t.email}
                             </div>
                          )}
                       </div>
                    </TableCell>
                    <TableCell className="py-6 px-6">
                       <div className="flex items-center gap-2.5 text-sm font-black text-slate-700">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                             <Building2 className="h-4 w-4" />
                          </div>
                          {t.branch?.name || <span className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Unassigned</span>}
                       </div>
                    </TableCell>
                    <TableCell className="py-6 px-6">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border transition-all",
                        t.status === 'ACTIVE'
                          ? 'border-emerald-100 bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100'
                          : 'border-rose-100 bg-rose-50 text-rose-700 group-hover:bg-rose-100'
                      )}>
                        <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", t.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500')} />
                        {t.status}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all border border-transparent hover:border-indigo-100"
                          onClick={() => openView(t.id)}
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all border border-transparent hover:border-indigo-100"
                          onClick={() => openEdit(t.id)}
                          title="Edit Profile"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        {t.status === 'ACTIVE' ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:shadow-md transition-all border border-transparent hover:border-rose-100"
                            title="Block Access"
                            onClick={() => setTeacherStatus(t.id, 'BLOCKED', 'Block Teacher Account')}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-md transition-all border border-transparent hover:border-emerald-100"
                            title="Activate Access"
                            onClick={() => setTeacherStatus(t.id, 'ACTIVE', 'Activate Teacher Account')}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:shadow-md transition-all border border-transparent hover:border-rose-100"
                          title="Delete Teacher"
                          onClick={() => handleDelete(t.id, t.fullName)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                </>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="bg-slate-50/50 border-t border-slate-50 px-8 py-5 flex items-center justify-between">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-3 w-3" />
              Showing {filtered.length} of {totalTeachers}
           </p>
           <div className="flex items-center gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Pages</span>
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold text-slate-500 hover:bg-white">
                 <ChevronRight className="h-3 w-3 rotate-180" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-black bg-white shadow-sm border border-slate-100 text-indigo-600">
                 1
              </Button>
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold text-slate-500 hover:bg-white">
                 <ChevronRight className="h-3 w-3" />
              </Button>
           </div>
        </div>
      </section>
    </div>
  );
}
